import type { ReactNode } from "react";

export function Disclosure({
  title,
  open,
  children,
}: {
  title: string;
  open?: boolean;
  children: ReactNode;
}) {
  return (
    <details open={open} className="group hairline-t">
      <summary className="text-label flex cursor-pointer list-none items-center justify-between py-4 [&::-webkit-details-marker]:hidden">
        {title}
        <span aria-hidden="true" className="relative size-3">
          <span className="bg-ink absolute top-1/2 left-0 h-px w-3" />
          <span className="bg-ink absolute top-0 left-1/2 h-3 w-px transition-transform group-open:scale-y-0" />
        </span>
      </summary>
      <div className="pb-5 text-sm">{children}</div>
    </details>
  );
}
