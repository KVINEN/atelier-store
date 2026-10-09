"use client";

import { loadStripe, type Appearance } from "@stripe/stripe-js";
import {
  CheckoutElementsProvider,
  ContactDetailsElement,
  PaymentElement,
  ShippingAddressElement,
  useCheckoutElements,
} from "@stripe/react-stripe-js/checkout";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";

import { createCheckoutSession, type CheckoutSessionResult } from "@/app/(shop)/checkout/actions";
import { OrderSummary } from "@/components/order-summary";
import { formatPrice } from "@/lib/products";
import { useBag, useShopReady } from "@/lib/shop-store";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

// Mirrors the tokens in globals.css and the `field` utility: square corners,
// ink on paper, underline-only inputs and small uppercase labels.
const appearance: Appearance = {
  theme: "flat",
  variables: {
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif",
    fontSizeBase: "15px",
    colorPrimary: "#111111",
    colorText: "#111111",
    colorTextSecondary: "#6f6f6f",
    colorTextPlaceholder: "#a3a3a3",
    colorBackground: "#ffffff",
    colorDanger: "#b3261e",
    borderRadius: "0px",
    spacingUnit: "4px",
    focusBoxShadow: "none",
  },
  rules: {
    ".Input": {
      border: "none",
      borderBottom: "1px solid #c4c4c4",
      boxShadow: "none",
      padding: "12px 0",
    },
    ".Input:hover": { borderBottomColor: "#111111" },
    ".Input:focus": { borderBottomColor: "#111111", boxShadow: "none" },
    ".Input--invalid": { borderBottomColor: "#b3261e", boxShadow: "none" },
    ".Label": {
      fontSize: "12px",
      fontWeight: "500",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      marginBottom: "8px",
    },
    ".Tab": { border: "1px solid #e3e3e3", boxShadow: "none" },
    ".Tab:hover": { borderColor: "#111111" },
    ".Tab--selected, .Tab--selected:hover, .Tab--selected:focus": {
      borderColor: "#111111",
      boxShadow: "none",
    },
    ".AccordionItem": { border: "1px solid #e3e3e3", boxShadow: "none" },
  },
};

const fonts = [{ cssSrc: "https://fonts.googleapis.com/css2?family=Geist:wght@400;500&display=swap" }];

export function CheckoutView() {
  const ready = useShopReady();
  const { lines } = useBag();
  const [result, setResult] = useState<CheckoutSessionResult | null>(null);
  const started = useRef(false);

  // One Checkout Session per visit, priced on the server from the database.
  useEffect(() => {
    if (!ready || lines.length === 0 || started.current || !stripePromise) return;
    started.current = true;
    createCheckoutSession(
      lines.map(({ slug, size, quantity }) => ({ slug, size, quantity })),
    ).then(setResult, () =>
      setResult({ type: "error", message: "We couldn't start checkout. Please try again." }),
    );
  }, [ready, lines]);

  if (!ready) return <CheckoutMessage busy>Loading your bag…</CheckoutMessage>;

  if (lines.length === 0 && result?.type !== "success") {
    return (
      <CheckoutMessage action={{ label: "Shop new arrivals", href: "/new-in" }}>
        Your bag is empty.
      </CheckoutMessage>
    );
  }

  if (!stripePromise) {
    return (
      <CheckoutMessage action={{ label: "Contact a client advisor", href: "/contact" }}>
        Online payment isn&rsquo;t available right now. A client advisor can take your order by phone or email.
      </CheckoutMessage>
    );
  }

  if (!result) return <CheckoutMessage busy>Preparing secure checkout…</CheckoutMessage>;

  if (result.type === "error") {
    return (
      <CheckoutMessage action={{ label: "Return to bag", href: "/bag" }} alert>
        {result.message}
      </CheckoutMessage>
    );
  }

  return (
    <CheckoutElementsProvider
      stripe={stripePromise}
      options={{ clientSecret: result.clientSecret, elementsOptions: { appearance, fonts } }}
    >
      <CheckoutForm />
    </CheckoutElementsProvider>
  );
}

function CheckoutForm() {
  const state = useCheckoutElements();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (state.type === "error") {
    return (
      <CheckoutMessage action={{ label: "Return to bag", href: "/bag" }} alert>
        {state.error.message}
      </CheckoutMessage>
    );
  }

  const checkout = state.type === "success" ? state.checkout : null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!checkout) return;
    setPending(true);
    setError(null);
    // On success Stripe redirects to the session's return URL.
    const confirmation = await checkout.confirm();
    if (confirmation.type === "error") setError(confirmation.error.message);
    setPending(false);
  }

  const total = checkout ? checkout.total.total.minorUnitsAmount / 100 : 0;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
      <form onSubmit={handleSubmit} className="stack gap-10" aria-describedby={error ? "checkout-error" : undefined}>
        <CheckoutSection title="Contact">
          <ContactDetailsElement />
        </CheckoutSection>
        <CheckoutSection title="Shipping address">
          <ShippingAddressElement />
        </CheckoutSection>
        <CheckoutSection title="Payment">
          <PaymentElement />
        </CheckoutSection>

        <div className="stack gap-4">
          {error ? (
            <p id="checkout-error" role="alert" className="text-error text-sm">
              {error}
            </p>
          ) : null}
          <button type="submit" className="btn btn-primary btn-block" disabled={!checkout || pending}>
            {pending ? "Processing…" : checkout ? `Pay ${formatPrice(total)}` : "Loading…"}
          </button>
          <p className="text-meta">
            Payments are processed securely by Stripe. Your card details never reach our servers.
          </p>
        </div>
      </form>

      {checkout ? (
        <OrderSummary
          items={checkout.lineItems.map((item) => ({
            key: item.id,
            name: item.name,
            detail: item.description ?? undefined,
            quantity: item.quantity,
            amount: item.total.minorUnitsAmount / 100,
          }))}
          subtotal={checkout.total.subtotal.minorUnitsAmount / 100}
          count={checkout.lineItems.reduce((sum, item) => sum + item.quantity, 0)}
          total={total}
        >
          <Link href="/bag" className="link-mute text-meta link">
            Edit bag
          </Link>
        </OrderSummary>
      ) : (
        <div className="bg-surface h-64" aria-hidden="true" />
      )}
    </div>
  );
}

function CheckoutSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="hairline-t stack gap-5 pt-6">
      <h2 className="text-label">{title}</h2>
      {children}
    </section>
  );
}

function CheckoutMessage({
  children,
  action,
  busy,
  alert,
}: {
  children: ReactNode;
  action?: { label: string; href: string };
  busy?: boolean;
  alert?: boolean;
}) {
  return (
    <div className="hairline-t stack items-start gap-5 pt-8" aria-busy={busy || undefined}>
      <p className={busy ? "text-meta" : "text-ink-soft"} role={alert ? "alert" : undefined}>
        {children}
      </p>
      {action ? (
        <Link href={action.href} className="btn btn-secondary">
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
