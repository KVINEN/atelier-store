"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

import { authClient } from "@/lib/auth-client";

export function AccountView() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <p className="text-meta" aria-busy="true">Loading your account…</p>;
  }

  if (!session) return <SignedOut />;

  const { user } = session;
  return (
    <div className="stack gap-10">
      <div className="hairline-t stack gap-1 pt-8">
        <p className="text-eyebrow text-mute">Signed in as</p>
        <p className="text-xl">{user.name}</p>
        <p className="text-ink-soft">{user.email}</p>
      </div>

      <ul className="grid gap-px sm:grid-cols-3">
        {[
          { label: "Bag", body: "Pieces you're ready to order.", href: "/bag" },
          { label: "Saved items", body: "Pieces you've kept for later.", href: "/wishlist" },
          { label: "Client services", body: "Orders, returns and advice.", href: "/contact" },
        ].map((card) => (
          <li key={card.href}>
            <Link href={card.href} className="hairline hover:border-ink stack h-full gap-2 p-5 transition-colors">
              <span className="text-label">{card.label}</span>
              <span className="text-meta">{card.body}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => authClient.signOut()}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

function SignedOut() {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const signUp = mode === "sign-up";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));

    setPending(true);
    setError(null);
    const { error } = signUp
      ? await authClient.signUp.email({ name: String(form.get("name")), email, password })
      : await authClient.signIn.email({ email, password });
    setPending(false);
    if (error) setError(error.message ?? "Something went wrong. Please try again.");
  }

  return (
    <div className="hairline-t grid gap-12 pt-8 md:grid-cols-2 md:gap-16">
      <form onSubmit={handleSubmit} className="stack gap-6" aria-describedby={error ? "account-error" : undefined}>
        <h2 className="text-label">{signUp ? "Create an account" : "Sign in"}</h2>

        {signUp ? (
          <label>
            <span className="text-label">Full name</span>
            <input name="name" required autoComplete="name" className="field" />
          </label>
        ) : null}
        <label>
          <span className="text-label">Email address</span>
          <input type="email" name="email" required autoComplete="email" className="field" />
        </label>
        <label>
          <span className="text-label">Password</span>
          <input
            type="password"
            name="password"
            required
            minLength={8}
            autoComplete={signUp ? "new-password" : "current-password"}
            className="field"
          />
          {signUp ? <span className="text-meta mt-2 block">At least 8 characters.</span> : null}
        </label>

        {error ? (
          <p id="account-error" role="alert" className="text-error text-sm">
            {error}
          </p>
        ) : null}

        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Please wait…" : signUp ? "Create account" : "Sign in"}
        </button>
      </form>

      <div className="stack items-start gap-4">
        <h2 className="text-label">{signUp ? "Already a client?" : "New to Atelier?"}</h2>
        <p className="text-ink-soft">
          {signUp
            ? "Sign in to see your account."
            : "Create an account to keep your details for faster ordering and hear about private events first."}
        </p>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            setMode(signUp ? "sign-in" : "sign-up");
            setError(null);
          }}
        >
          {signUp ? "Sign in instead" : "Create an account"}
        </button>
      </div>
    </div>
  );
}
