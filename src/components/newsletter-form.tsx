"use client";

import { useState, type FormEvent } from "react";

// Front-end only for now: nothing is stored until a newsletter backend exists.
export function NewsletterForm() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <p role="status" className="text-base">
        Thank you. You&rsquo;ll hear from us soon.
      </p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 sm:flex-row sm:items-end"
    >
      <label className="flex-1">
        <span className="text-label">Email address</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="name@example.com"
          className="field"
        />
      </label>
      <button type="submit" className="btn btn-primary">
        Subscribe
      </button>
    </form>
  );
}
