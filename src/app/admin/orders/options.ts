// Choices for order forms, shared by the server actions and the client forms.

export const CARRIERS = ["UPS", "USPS", "FedEx", "DHL", "Other"] as const;

/** Stripe refund reasons. */
export const REFUND_REASONS = ["requested_by_customer", "duplicate", "fraudulent"] as const;

export const REFUND_REASON_LABELS: Record<(typeof REFUND_REASONS)[number], string> = {
  requested_by_customer: "Requested by customer",
  duplicate: "Duplicate charge",
  fraudulent: "Fraudulent",
};
