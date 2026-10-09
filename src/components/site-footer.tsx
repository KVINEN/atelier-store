import Link from "next/link";

import { NewsletterForm } from "@/components/newsletter-form";
import { footerColumns } from "@/lib/catalog";

export function SiteFooter() {
  return (
    <footer className="bg-surface mt-auto">
      <div className="container-page section grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
        <div className="stack gap-5">
          <h2 className="text-heading">Letters from the atelier</h2>
          <p className="text-ink-soft max-w-md">
            New collections, private events and stories from our workshops,
            a few times a season.
          </p>
          <NewsletterForm />
        </div>

        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
          {footerColumns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="text-eyebrow text-mute">{column.title}</h2>
              <ul className="stack mt-4 gap-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="link-quiet text-sm">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>

      <div className="hairline-t">
        <div className="container-page flex flex-col items-start justify-between gap-4 py-6 sm:flex-row sm:items-center">
          <Link href="/" className="text-sm font-medium tracking-[0.32em] uppercase">
            Atelier
          </Link>
          <ul className="cluster text-meta gap-x-6 gap-y-2">
            <li>
              <Link href="/privacy" className="link-mute">Privacy</Link>
            </li>
            <li>
              <Link href="/terms" className="link-mute">Terms</Link>
            </li>
            <li>
              <Link href="/accessibility" className="link-mute">Accessibility</Link>
            </li>
            <li>United States · USD</li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
