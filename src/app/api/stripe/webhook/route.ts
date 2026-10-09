import { revalidateTag } from "next/cache";
import type Stripe from "stripe";

import { closePendingOrder, markOrderPaid, setOrderRefunded } from "@/db/queries/orders";
import type { OrderShipping } from "@/db/schema";
import { env } from "@/lib/env";
import { stripe } from "@/lib/stripe";

// Order fulfilment lives here, not on the return page: customers aren't
// guaranteed to come back after paying.
export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(await request.text(), signature, env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object;
      // Delayed payment methods complete unpaid; they're fulfilled on async_payment_succeeded.
      if (session.payment_status === "unpaid") break;
      const fulfilled = await markOrderPaid(session.id, {
        email: session.customer_details?.email ?? null,
        shipping: toShipping(session),
        amountTotalCents: session.amount_total ?? 0,
        paymentIntentId: idOf(session.payment_intent),
      });
      // Stock changed, so listings and product pages must show it.
      if (fulfilled) revalidateTag("catalog", { expire: 0 });
      break;
    }
    case "checkout.session.async_payment_failed":
      await closePendingOrder(event.data.object.id, "failed");
      break;
    case "checkout.session.expired":
      await closePendingOrder(event.data.object.id, "expired");
      break;
    // Refunds are started from the admin area but only recorded here. The charge
    // is re-read so the stored total is current whatever order events arrive in.
    case "charge.refunded":
    case "charge.refund.updated": {
      const chargeId = event.type === "charge.refunded" ? event.data.object.id : idOf(event.data.object.charge);
      if (!chargeId) break;
      const charge = await stripe().charges.retrieve(chargeId);
      const paymentIntentId = idOf(charge.payment_intent);
      if (paymentIntentId) await setOrderRefunded(paymentIntentId, charge.amount_refunded);
      break;
    }
  }

  return Response.json({ received: true });
}

function idOf(value: string | { id: string } | null | undefined) {
  return typeof value === "string" ? value : (value?.id ?? null);
}

function toShipping(session: Stripe.Checkout.Session): OrderShipping | null {
  const details = session.collected_information?.shipping_details;
  if (!details) return null;
  const { line1, line2, city, state, postal_code, country } = details.address;
  return {
    name: details.name,
    address: {
      line1: line1 ?? null,
      line2: line2 ?? null,
      city: city ?? null,
      state: state ?? null,
      postalCode: postal_code ?? null,
      country: country ?? null,
    },
  };
}
