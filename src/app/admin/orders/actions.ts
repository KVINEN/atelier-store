"use server";

import { refresh, updateTag } from "next/cache";
import Stripe from "stripe";
import { z } from "zod";

import {
  getOrder,
  markCancelled,
  markDelivered,
  markShipped,
  restockOrder,
  setAdminNote,
  setPaymentIntent,
} from "@/db/admin/orders";
import { setOrderRefunded } from "@/db/queries/orders";
import { requireAdmin } from "@/lib/admin";
import { failure, formatCents, invalid, parseMoneyToCents, success, type FormState } from "@/lib/admin-form";
import { stripe } from "@/lib/stripe";

import { CARRIERS, REFUND_REASONS } from "./options";

type Order = NonNullable<Awaited<ReturnType<typeof getOrder>>>;

/** Orders paid before payment intents were recorded get theirs from the Checkout Session. */
async function paymentIntentFor(order: Order) {
  if (order.stripePaymentIntentId) return order.stripePaymentIntentId;
  const session = await stripe().checkout.sessions.retrieve(order.stripeSessionId);
  const id = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
  if (id) await setPaymentIntent(order.id, id);
  return id ?? null;
}

/**
 * Re-reads the refunded total from Stripe, the source of truth. The
 * charge.refunded webhook does the same; this just shows it straight away.
 */
async function syncRefunded(paymentIntentId: string) {
  const intent = await stripe().paymentIntents.retrieve(paymentIntentId, { expand: ["latest_charge"] });
  const charge = intent.latest_charge;
  if (charge && typeof charge !== "string") await setOrderRefunded(paymentIntentId, charge.amount_refunded);
}

/** Issues a Stripe refund. Returns an error message, or null on success. */
async function refund(order: Order, amountCents: number, reason: Stripe.RefundCreateParams.Reason) {
  const paymentIntentId = await paymentIntentFor(order);
  if (!paymentIntentId) return "This order has no Stripe payment to refund.";

  try {
    await stripe().refunds.create(
      { payment_intent: paymentIntentId, amount: amountCents, reason, metadata: { order_id: order.id } },
      // Same order, same refunded-so-far and same amount → same refund, so a
      // double-submit can't refund twice.
      { idempotencyKey: `refund:${order.id}:${order.refundedCents}:${amountCents}` },
    );
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) return `Stripe declined the refund: ${error.message}`;
    throw error;
  }
  await syncRefunded(paymentIntentId);
  return null;
}

async function loadPaid(orderId: string) {
  const order = await getOrder(orderId);
  if (!order) return { error: failure("This order no longer exists.") };
  if (order.status !== "paid") return { error: failure("Only paid orders can be changed.") };
  return { order };
}

const shipSchema = z.object({
  carrier: z.enum(CARRIERS, { error: "Choose a carrier." }),
  trackingNumber: z
    .string()
    .trim()
    .min(1, "Required.")
    .max(60)
    .regex(/^[A-Za-z0-9 -]+$/, "Letters, numbers, spaces and hyphens."),
});

export async function shipOrderAction(orderId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = shipSchema.safeParse({ carrier: formData.get("carrier"), trackingNumber: formData.get("trackingNumber") });
  if (!parsed.success) return invalid(parsed.error);

  const ok = await markShipped(orderId, parsed.data.carrier, parsed.data.trackingNumber);
  if (!ok) return failure("Only paid orders that haven't been delivered or cancelled can be shipped.");
  refresh();
  return success("Marked as shipped.");
}

export async function deliverOrderAction(orderId: string): Promise<FormState> {
  await requireAdmin();
  if (!(await markDelivered(orderId))) return failure("Only shipped orders can be marked delivered.");
  refresh();
  return success("Marked as delivered.");
}

const reasonSchema = z.enum(REFUND_REASONS);

export async function refundOrderAction(orderId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const { order, error } = await loadPaid(orderId);
  if (error) return error;

  const remaining = order.amountTotalCents - order.refundedCents;
  const amount = parseMoneyToCents(String(formData.get("amount") ?? ""));
  if (!Number.isFinite(amount) || amount <= 0) {
    return failure("Please check the highlighted fields.", { amount: "Enter an amount such as 120 or 120.50." });
  }
  if (amount > remaining) {
    return failure("Please check the highlighted fields.", {
      amount: `At most ${formatCents(remaining)} can still be refunded.`,
    });
  }
  const reason = reasonSchema.safeParse(formData.get("reason"));
  if (!reason.success) return failure("Choose a reason.");

  const message = await refund(order, amount, reason.data);
  if (message) return failure(message);

  if (formData.get("restock") === "on" && (await restockOrder(orderId, admin.id))) {
    updateTag("catalog");
  }
  refresh();
  return success(`Refunded ${formatCents(amount)}.`);
}

/** Cancels an unshipped paid order: refunds what's left, then marks it cancelled. */
export async function cancelOrderAction(orderId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const { order, error } = await loadPaid(orderId);
  if (error) return error;
  if (order.fulfillmentStatus !== "unfulfilled") {
    return failure("Only orders that haven't shipped can be cancelled. Use a refund instead.");
  }

  const remaining = order.amountTotalCents - order.refundedCents;
  if (remaining > 0) {
    const message = await refund(order, remaining, "requested_by_customer");
    if (message) return failure(message);
  }
  await markCancelled(orderId);
  if (formData.get("restock") === "on" && (await restockOrder(orderId, admin.id))) {
    updateTag("catalog");
  }
  refresh();
  return success(remaining > 0 ? `Cancelled and refunded ${formatCents(remaining)}.` : "Cancelled.");
}

export async function restockOrderAction(orderId: string): Promise<FormState> {
  const admin = await requireAdmin();
  if (!(await restockOrder(orderId, admin.id))) return failure("This order's items are already back in stock.");
  updateTag("catalog");
  refresh();
  return success("Items returned to stock.");
}

export async function saveNoteAction(orderId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const note = String(formData.get("note") ?? "").trim().slice(0, 2000);
  await setAdminNote(orderId, note || null);
  refresh();
  return success("Note saved.");
}
