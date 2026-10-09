"use client";

import { useActionState } from "react";

import { CARRIERS, REFUND_REASON_LABELS, REFUND_REASONS } from "@/app/admin/orders/options";
import {
  ConfirmButton,
  errorFor,
  FormMessage,
  SelectField,
  SubmitButton,
  TextAreaField,
  TextField,
} from "@/components/admin/form-controls";
import { formatCents, IDLE, type FormState } from "@/lib/admin-form";

type Action = (state: FormState, formData: FormData) => Promise<FormState>;

export function ShipForm({
  action,
  carrier,
  trackingNumber,
  isUpdate,
}: {
  action: Action;
  carrier: string | null;
  trackingNumber: string | null;
  isUpdate: boolean;
}) {
  const [state, formAction] = useActionState(action, IDLE);
  return (
    <form action={formAction} className="stack gap-4">
      <div className="grid gap-4 sm:grid-cols-[9rem_1fr]">
        <SelectField
          label="Carrier"
          name="carrier"
          defaultValue={carrier ?? "UPS"}
          options={CARRIERS.map((value) => ({ value, label: value }))}
          error={errorFor(state, "carrier")}
        />
        <TextField
          label="Tracking number"
          name="trackingNumber"
          defaultValue={trackingNumber ?? ""}
          maxLength={60}
          error={errorFor(state, "trackingNumber")}
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton size="sm" variant={isUpdate ? "secondary" : "primary"} pendingLabel="Saving…">
          {isUpdate ? "Update tracking" : "Mark as shipped"}
        </SubmitButton>
        <FormMessage state={state} />
      </div>
    </form>
  );
}

export function RefundForm({ action, remainingCents }: { action: Action; remainingCents: number }) {
  const [state, formAction] = useActionState(action, IDLE);
  const remaining = remainingCents % 100 === 0 ? String(remainingCents / 100) : (remainingCents / 100).toFixed(2);

  return (
    <form action={formAction} className="stack gap-4">
      <div className="grid gap-4 sm:grid-cols-[9rem_1fr]">
        <TextField
          label="Amount (USD)"
          name="amount"
          inputMode="decimal"
          defaultValue={remaining}
          hint={`Up to ${formatCents(remainingCents)}.`}
          error={errorFor(state, "amount")}
        />
        <SelectField
          label="Reason"
          name="reason"
          defaultValue="requested_by_customer"
          options={REFUND_REASONS.map((value) => ({ value, label: REFUND_REASON_LABELS[value] }))}
        />
      </div>
      <label className="text-sm inline-flex items-center gap-2">
        <input type="checkbox" name="restock" className="accent-ink size-4" />
        Return the order&rsquo;s items to stock
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <ConfirmButton confirmLabel="Confirm refund" pendingLabel="Refunding…">
          Refund
        </ConfirmButton>
        <FormMessage state={state} />
      </div>
      <p className="text-meta">Refunds go through Stripe and can&rsquo;t be undone.</p>
    </form>
  );
}

export function CancelForm({ action, remainingCents }: { action: Action; remainingCents: number }) {
  const [state, formAction] = useActionState(action, IDLE);
  return (
    <form action={formAction} className="stack gap-4">
      <p className="text-meta">
        {remainingCents > 0
          ? `Refunds the remaining ${formatCents(remainingCents)} through Stripe and marks the order cancelled.`
          : "Marks the order cancelled. It's already fully refunded."}
      </p>
      <label className="text-sm inline-flex items-center gap-2">
        <input type="checkbox" name="restock" defaultChecked className="accent-ink size-4" />
        Return the order&rsquo;s items to stock
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <ConfirmButton confirmLabel="Confirm cancellation" pendingLabel="Cancelling…">
          Cancel order
        </ConfirmButton>
        <FormMessage state={state} />
      </div>
    </form>
  );
}

export function NoteForm({ action, note }: { action: Action; note: string | null }) {
  const [state, formAction] = useActionState(action, IDLE);
  return (
    <form action={formAction} className="stack gap-3">
      <TextAreaField
        label="Internal note"
        name="note"
        defaultValue={note ?? ""}
        optional
        maxLength={2000}
        hint="Only visible to admins."
      />
      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton size="sm" variant="secondary">
          Save note
        </SubmitButton>
        <FormMessage state={state} />
      </div>
    </form>
  );
}
