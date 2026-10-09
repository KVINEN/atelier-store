import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense, type ReactNode } from "react";

import { ClearBag } from "@/components/clear-bag";
import { OrderSummary } from "@/components/order-summary";
import { getOrderBySession } from "@/db/queries/orders";
import { ONE_SIZE } from "@/lib/products";
import { stripe } from "@/lib/stripe";

export const metadata: Metadata = { title: "Order confirmation" };

// Shows the outcome only. The order itself is fulfilled by the Stripe webhook.
export default function CheckoutCompletePage({ searchParams }: PageProps<"/checkout/complete">) {
  return (
    <main className="flex-1">
      <section aria-labelledby="complete-title" className="container-content section">
        <Suspense fallback={<p className="text-meta" aria-busy="true">Confirming your order…</p>}>
          <CheckoutOutcome searchParams={searchParams} />
        </Suspense>
      </section>
    </main>
  );
}

async function CheckoutOutcome({ searchParams }: Pick<PageProps<"/checkout/complete">, "searchParams">) {
  await connection();
  const { session_id } = await searchParams;
  const sessionId = typeof session_id === "string" && session_id.startsWith("cs_") ? session_id : null;
  const session = sessionId
    ? await stripe().checkout.sessions.retrieve(sessionId).catch(() => null)
    : null;

  if (!session || session.status === "expired") {
    return (
      <Outcome eyebrow="Checkout" title="We couldn't find that order">
        <p className="text-ink-soft">
          If you completed a payment, a confirmation is on its way by email. Otherwise, your bag
          is still waiting for you.
        </p>
        <Actions primary={{ label: "View bag", href: "/bag" }} />
      </Outcome>
    );
  }

  if (session.status === "open") {
    return (
      <Outcome eyebrow="Checkout" title="Your payment wasn't completed">
        <p className="text-ink-soft">
          Nothing has been charged. Your bag is saved, so you can try again or use another payment
          method.
        </p>
        <Actions primary={{ label: "Return to checkout", href: "/checkout" }} />
      </Outcome>
    );
  }

  const order = await getOrderBySession(session.id);
  const email = session.customer_details?.email;
  const shipping = session.collected_information?.shipping_details;
  const processing = session.payment_status === "unpaid";

  return (
    <Outcome eyebrow="Order confirmed" title="Thank you for your order">
      <ClearBag />
      <p className="text-ink-soft max-w-xl">
        {processing
          ? "Your payment is processing. We'll email you as soon as it's confirmed and your order is on its way."
          : `A confirmation${email ? ` has been sent to ${email}` : " is on its way by email"}. Your order ships within 1–2 business days.`}
      </p>

      <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
        <dl className="stack h-fit gap-6">
          {order ? (
            <Detail label="Order number">{order.id.slice(0, 8).toUpperCase()}</Detail>
          ) : null}
          {shipping ? (
            <Detail label="Shipping to">
              <address className="not-italic">
                {[
                  shipping.name,
                  shipping.address.line1,
                  shipping.address.line2,
                  [shipping.address.city, shipping.address.state, shipping.address.postal_code]
                    .filter(Boolean)
                    .join(", "),
                ]
                  .filter(Boolean)
                  .map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
              </address>
            </Detail>
          ) : null}
          <Detail label="Delivery">Complimentary express shipping, 1–2 business days</Detail>
        </dl>

        {order ? (
          <OrderSummary
            items={order.items.map((item) => ({
              key: `${item.slug}:${item.size}`,
              name: item.name,
              detail: item.size === ONE_SIZE ? undefined : `Size ${item.size}`,
              quantity: item.quantity,
              amount: (item.unitPriceCents * item.quantity) / 100,
            }))}
            subtotal={(session.amount_subtotal ?? 0) / 100}
            count={order.items.reduce((sum, item) => sum + item.quantity, 0)}
            total={(session.amount_total ?? 0) / 100}
          />
        ) : null}
      </div>

      <Actions
        primary={{ label: "Continue shopping", href: "/new-in" }}
        secondary={{ label: "Contact us", href: "/contact" }}
      />
    </Outcome>
  );
}

function Outcome({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return (
    <div className="stack gap-5">
      <p className="text-eyebrow text-mute">{eyebrow}</p>
      <h1 id="complete-title" className="text-heading">
        {title}
      </h1>
      {children}
    </div>
  );
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="hairline-t stack gap-2 pt-5">
      <dt className="text-label">{label}</dt>
      <dd className="text-ink-soft">{children}</dd>
    </div>
  );
}

function Actions({
  primary,
  secondary,
}: {
  primary: { label: string; href: string };
  secondary?: { label: string; href: string };
}) {
  return (
    <div className="cluster mt-4 gap-3">
      <Link href={primary.href} className="btn btn-primary">
        {primary.label}
      </Link>
      {secondary ? (
        <Link href={secondary.href} className="btn btn-secondary">
          {secondary.label}
        </Link>
      ) : null}
    </div>
  );
}
