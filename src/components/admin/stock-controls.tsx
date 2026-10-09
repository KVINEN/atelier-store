"use client";

import { useActionState, useState } from "react";

import {
  ConfirmButton,
  errorFor,
  FormMessage,
  SubmitButton,
  TextField,
} from "@/components/admin/form-controls";
import { IDLE, type FormState } from "@/lib/admin-form";

type Action = (state: FormState, formData: FormData) => Promise<FormState>;

const REASONS = [
  { value: "restock", label: "Restock (delivery received)" },
  { value: "correction", label: "Correction (damaged, lost, miscount)" },
  { value: "return", label: "Customer return" },
];

/**
 * "Adjust" toggles two small forms for one size: a relative change with a
 * reason, and a stock count that only applies if nothing changed meanwhile.
 */
export function StockAdjustPanel({
  productId,
  size,
  quantity,
  action,
  label,
}: {
  productId: number;
  size: string;
  quantity: number;
  action: Action;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const [adjustState, adjust] = useActionState(action, IDLE);
  const [countState, count] = useActionState(action, IDLE);
  const panelId = `stock-${productId}-${size.replace(/\W/g, "-")}`;
  const message = adjustState.status !== "idle" ? adjustState : countState;

  return (
    <div className="stack gap-3">
      <div className="flex items-center gap-4">
        <button
          type="button"
          className="link-quiet text-label"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "Close" : "Adjust"}
          <span className="sr-only"> stock for {label}</span>
        </button>
        {!open && <FormMessage state={message} />}
      </div>
      {open && (
        <div id={panelId} className="bg-surface grid gap-6 p-4 lg:grid-cols-2">
          <form action={adjust} className="stack gap-3">
            <input type="hidden" name="productId" value={productId} />
            <input type="hidden" name="size" value={size} />
            <input type="hidden" name="mode" value="adjust" />
            <p className="text-label">Change by</p>
            <div className="grid gap-3 sm:grid-cols-[7rem_1fr]">
              <TextField
                label="Units (+/−)"
                name="delta"
                type="number"
                placeholder="e.g. 5 or -2"
                error={errorFor(adjustState, "delta")}
              />
              <label className="stack gap-1">
                <span className="text-label">Reason</span>
                <select name="reason" className="field" defaultValue="restock">
                  {REASONS.map((reason) => (
                    <option key={reason.value} value={reason.value}>
                      {reason.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <TextField label="Note" name="note" optional maxLength={200} placeholder="Supplier, reference…" />
            <div className="flex flex-wrap items-center gap-3">
              <SubmitButton size="sm" variant="secondary" pendingLabel="Applying…">
                Apply change
              </SubmitButton>
              <FormMessage state={adjustState} />
            </div>
          </form>

          <form action={count} className="stack gap-3">
            <input type="hidden" name="productId" value={productId} />
            <input type="hidden" name="size" value={size} />
            <input type="hidden" name="mode" value="count" />
            <input type="hidden" name="expected" value={quantity} />
            <p className="text-label">Stock count</p>
            <TextField
              label="Counted on hand"
              name="count"
              type="number"
              min={0}
              defaultValue={quantity}
              hint={`Currently ${quantity}. Logged as a correction.`}
              error={errorFor(countState, "count")}
            />
            <div className="flex flex-wrap items-center gap-3">
              <SubmitButton size="sm" variant="secondary" pendingLabel="Saving…">
                Save count
              </SubmitButton>
              <FormMessage state={countState} />
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export function AddSizeForm({ action }: { action: Action }) {
  const [state, formAction] = useActionState(action, IDLE);

  return (
    <form action={formAction} className="grid items-end gap-4 sm:grid-cols-[1fr_10rem_auto]">
      <TextField label="New size" name="size" maxLength={20} error={errorFor(state, "size")} />
      <TextField label="Opening stock" name="quantity" type="number" min={0} defaultValue={0} error={errorFor(state, "quantity")} />
      <SubmitButton size="sm" variant="secondary" pendingLabel="Adding…">
        Add size
      </SubmitButton>
      <div className="sm:col-span-3">
        <FormMessage state={state} />
      </div>
    </form>
  );
}

export function SizeOrderButtons({
  size,
  isFirst,
  isLast,
  moveUp,
  moveDown,
}: {
  size: string;
  isFirst: boolean;
  isLast: boolean;
  moveUp: () => Promise<void>;
  moveDown: () => Promise<void>;
}) {
  return (
    <span className="inline-flex gap-3">
      <form action={moveUp}>
        <button type="submit" className="link-mute text-label" disabled={isFirst} aria-label={`Move ${size} up`}>
          Up
        </button>
      </form>
      <form action={moveDown}>
        <button type="submit" className="link-mute text-label" disabled={isLast} aria-label={`Move ${size} down`}>
          Down
        </button>
      </form>
    </span>
  );
}

export function RemoveSizeButton({ size, action }: { size: string; action: (state: FormState) => Promise<FormState> }) {
  const [state, formAction] = useActionState(action, IDLE);
  return (
    <form action={formAction} className="inline-flex flex-wrap items-center gap-3">
      <ConfirmButton confirmLabel={`Remove ${size}`} pendingLabel="Removing…">
        Remove
      </ConfirmButton>
      <FormMessage state={state} />
    </form>
  );
}
