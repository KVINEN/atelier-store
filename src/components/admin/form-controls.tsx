"use client";

// Form pieces for admin server actions (used with useActionState).

import {
  createContext,
  useActionState,
  useContext,
  useState,
  useTransition,
  type ComponentProps,
  type ReactNode,
} from "react";
import { useFormStatus } from "react-dom";

import { IDLE, type FormState } from "@/lib/admin-form";

const PendingContext = createContext<boolean | null>(null);

function usePending() {
  const fromContext = useContext(PendingContext);
  const { pending } = useFormStatus();
  return fromContext ?? pending;
}

/**
 * For long forms: submits through a transition instead of `<form action>`, so
 * React doesn't reset the fields afterwards and a validation error keeps what
 * the admin typed. Pass `pending` from useActionState.
 */
export function ActionForm({
  action,
  pending,
  children,
  ...props
}: {
  action: (formData: FormData) => void;
  pending: boolean;
  children: ReactNode;
} & Omit<ComponentProps<"form">, "action" | "onSubmit">) {
  const [, startTransition] = useTransition();
  return (
    <PendingContext value={pending}>
      <form
        {...props}
        // Before hydration this posts the server action natively (never a GET
        // that would put the fields in the URL). Once hydrated, onSubmit takes
        // over, and preventDefault stops React running it through the action.
        action={action}
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget, (event.nativeEvent as SubmitEvent).submitter);
          startTransition(() => action(formData));
        }}
      >
        {children}
      </form>
    </PendingContext>
  );
}

export function SubmitButton({
  children,
  pendingLabel = "Saving…",
  variant = "primary",
  size,
  ...props
}: {
  children: ReactNode;
  pendingLabel?: string;
  variant?: "primary" | "secondary";
  size?: "sm";
} & Omit<ComponentProps<"button">, "type" | "children">) {
  const pending = usePending();
  return (
    <button
      type="submit"
      disabled={pending || props.disabled}
      aria-disabled={pending || undefined}
      className={`btn ${variant === "primary" ? "btn-primary" : "btn-secondary"} ${size === "sm" ? "btn-sm" : ""}`}
      {...props}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}

/** Two-step destructive button: the first click asks, the second submits. No browser dialogs. */
export function ConfirmButton({
  children,
  confirmLabel,
  pendingLabel = "Working…",
}: {
  children: ReactNode;
  confirmLabel: string;
  pendingLabel?: string;
}) {
  const [armed, setArmed] = useState(false);
  const pending = usePending();

  if (!armed) {
    return (
      <button type="button" className="btn btn-secondary btn-sm" onClick={() => setArmed(true)}>
        {children}
      </button>
    );
  }
  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="submit"
        className="btn btn-sm border-error bg-error text-paper hover:bg-ink hover:border-ink"
        disabled={pending}
      >
        {pending ? pendingLabel : confirmLabel}
      </button>
      <button type="button" className="link-mute text-label" onClick={() => setArmed(false)} disabled={pending}>
        Cancel
      </button>
    </span>
  );
}

export function FormMessage({ state, id }: { state: FormState; id?: string }) {
  if (state.status === "idle") return null;
  return state.status === "error" ? (
    <p id={id} role="alert" className="text-error text-sm">
      {state.message}
    </p>
  ) : (
    <p id={id} role="status" className="text-success text-sm">
      {state.message}
    </p>
  );
}

export function errorFor(state: FormState, name: string) {
  return state.status === "error" ? state.fieldErrors?.[name] : undefined;
}

type FieldShellProps = {
  label: string;
  name: string;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
  className?: string;
  children: (props: { id: string; "aria-invalid"?: true; "aria-describedby"?: string }) => ReactNode;
};

function FieldShell({ label, name, hint, error, optional, className = "", children }: FieldShellProps) {
  const id = `field-${name.replace(/\W/g, "-")}`;
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  return (
    <div className={`stack gap-1 ${className}`}>
      <label htmlFor={id} className="text-label">
        {label}
        {optional && <span className="text-mute normal-case tracking-normal"> (optional)</span>}
      </label>
      {children({ id, "aria-invalid": error ? true : undefined, "aria-describedby": describedBy })}
      {hint && (
        <p id={`${id}-hint`} className="text-meta">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-error text-sm">
          {error}
        </p>
      )}
    </div>
  );
}

type FieldBase = { label: string; name: string; hint?: ReactNode; error?: string; optional?: boolean; className?: string };

export function TextField({
  label,
  name,
  hint,
  error,
  optional,
  className,
  ...input
}: FieldBase & Omit<ComponentProps<"input">, "name" | "id">) {
  return (
    <FieldShell label={label} name={name} hint={hint} error={error} optional={optional} className={className}>
      {(aria) => <input name={name} className="field" required={!optional} {...aria} {...input} />}
    </FieldShell>
  );
}

export function TextAreaField({
  label,
  name,
  hint,
  error,
  optional,
  className,
  ...textarea
}: FieldBase & Omit<ComponentProps<"textarea">, "name" | "id">) {
  return (
    <FieldShell label={label} name={name} hint={hint} error={error} optional={optional} className={className}>
      {(aria) => (
        <textarea name={name} className="field min-h-28 resize-y" required={!optional} {...aria} {...textarea} />
      )}
    </FieldShell>
  );
}

export function SelectField({
  label,
  name,
  hint,
  error,
  optional,
  className,
  options,
  ...select
}: FieldBase & { options: { value: string; label: string }[] } & Omit<ComponentProps<"select">, "name" | "id">) {
  return (
    <FieldShell label={label} name={name} hint={hint} error={error} optional={optional} className={className}>
      {(aria) => (
        <select name={name} className="field" {...aria} {...select}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </FieldShell>
  );
}

/**
 * A single-button form for one action (publish, archive, delete…), showing its
 * result inline. With `confirmLabel`, the first click asks for confirmation.
 */
export function ActionButton({
  action,
  children,
  fields = {},
  confirmLabel,
  pendingLabel,
  variant = "secondary",
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  children: ReactNode;
  fields?: Record<string, string>;
  confirmLabel?: string;
  pendingLabel?: string;
  variant?: "primary" | "secondary";
}) {
  const [state, formAction] = useActionState(action, IDLE);
  return (
    <form action={formAction} className="inline-flex flex-wrap items-center gap-3">
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      {confirmLabel ? (
        <ConfirmButton confirmLabel={confirmLabel} pendingLabel={pendingLabel}>
          {children}
        </ConfirmButton>
      ) : (
        <SubmitButton size="sm" variant={variant} pendingLabel={pendingLabel ?? "Working…"}>
          {children}
        </SubmitButton>
      )}
      <FormMessage state={state} />
    </form>
  );
}
