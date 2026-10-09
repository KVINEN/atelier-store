import Link from "next/link";

import { formatDateTime } from "@/components/admin/ui";
import type { listMovements } from "@/db/admin/inventory";

type Movement = Awaited<ReturnType<typeof listMovements>>[number];

const reasonLabel: Record<Movement["reason"], string> = {
  sale: "Sale",
  restock: "Restock",
  correction: "Correction",
  return: "Return",
};

/** Stock audit trail, newest first. */
export function MovementList({ movements, showProduct }: { movements: Movement[]; showProduct: boolean }) {
  if (movements.length === 0) return <p className="text-meta">No stock changes yet.</p>;

  return (
    <ol className="hairline-t">
      {movements.map((movement) => (
        <li key={movement.id} className="hairline-b grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 py-3 text-sm">
          <span>
            {showProduct && (
              <>
                <Link href={`/admin/products/${movement.productId}`} className="link-quiet font-medium">
                  {movement.productName}
                </Link>
                {" · "}
              </>
            )}
            {movement.size}
          </span>
          <span className={`tabular-nums font-medium ${movement.delta < 0 ? "text-sale" : "text-success"}`}>
            {movement.delta > 0 ? `+${movement.delta}` : `−${Math.abs(movement.delta)}`}
            <span className="text-mute font-normal"> → {movement.quantityAfter}</span>
          </span>
          <span className="text-meta col-span-2">
            {reasonLabel[movement.reason]}
            {movement.orderId && (
              <>
                {" · "}
                <Link href={`/admin/orders/${movement.orderId}`} className="link">
                  order
                </Link>
              </>
            )}
            {movement.actor && ` · ${movement.actor}`}
            {movement.note && ` · ${movement.note}`}
            {" · "}
            {formatDateTime(movement.createdAt)}
          </span>
        </li>
      ))}
    </ol>
  );
}
