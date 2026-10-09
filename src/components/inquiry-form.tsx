"use client";

import { useState, type FormEvent } from "react";

export type InquiryField = {
  name: string;
  label: string;
  type?: "text" | "email" | "tel" | "date" | "textarea" | "select";
  options?: string[];
  required?: boolean;
  autoComplete?: string;
};

// Front-end only for now, like the newsletter form: nothing is sent until a
// client-services backend exists, so the confirmation says what happens next.
export function InquiryForm({
  fields,
  submitLabel,
  successMessage,
}: {
  fields: InquiryField[];
  submitLabel: string;
  successMessage: string;
}) {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="bg-surface stack items-start gap-4 p-6">
        <p role="status">{successMessage}</p>
        <button type="button" className="link text-meta text-ink" onClick={() => setSubmitted(false)}>
          Send another request
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="stack gap-6">
      {fields.map((field) => (
        <label key={field.name}>
          <span className="text-label">
            {field.label}
            {field.required ? null : <span className="text-mute"> (optional)</span>}
          </span>
          {field.type === "textarea" ? (
            <textarea name={field.name} required={field.required} rows={4} className="field resize-y" />
          ) : field.type === "select" ? (
            <select name={field.name} required={field.required} defaultValue="" className="field">
              <option value="" disabled>
                Select
              </option>
              {field.options?.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          ) : (
            <input
              type={field.type ?? "text"}
              name={field.name}
              required={field.required}
              autoComplete={field.autoComplete}
              className="field"
            />
          )}
        </label>
      ))}
      <div>
        <button type="submit" className="btn btn-primary">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
