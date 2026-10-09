import Link from "next/link";
import { Fragment } from "react";

import { ProductCard } from "@/components/product-card";
import type { Product } from "@/lib/products";

// Listing page body: breadcrumb, title with piece count, product grid.
// The last breadcrumb is the current page.
export function ProductListing({
  id,
  eyebrow,
  title,
  breadcrumbs,
  products,
}: {
  id: string;
  eyebrow?: string;
  title: string;
  breadcrumbs: { label: string; href?: string }[];
  products: Product[];
}) {
  return (
    <>
      <nav aria-label="Breadcrumb" className="container-page py-4">
        <ol className="cluster text-meta gap-2">
          {breadcrumbs.map((crumb, index) => (
            <Fragment key={crumb.label}>
              {index > 0 ? <li aria-hidden="true">/</li> : null}
              {crumb.href ? (
                <li>
                  <Link href={crumb.href} className="link-mute">
                    {crumb.label}
                  </Link>
                </li>
              ) : (
                <li aria-current="page" className="text-ink">
                  {crumb.label}
                </li>
              )}
            </Fragment>
          ))}
        </ol>
      </nav>

      <section
        aria-labelledby={id}
        className="container-page pt-6 pb-(--section-space) md:pt-10"
      >
        <header className="mb-8 flex items-end justify-between gap-6 md:mb-10">
          <div className="stack gap-3">
            {eyebrow ? <p className="text-eyebrow text-mute">{eyebrow}</p> : null}
            <h1 id={id} className="text-heading">
              {title}
            </h1>
          </div>
          <p className="text-meta shrink-0">
            {products.length} {products.length === 1 ? "piece" : "pieces"}
          </p>
        </header>

        {products.length > 0 ? (
          <div className="grid-products bleed md:mx-0">
            {products.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        ) : (
          <div className="hairline-t stack items-start gap-5 pt-8">
            <p className="text-ink-soft">New pieces are on their way. Check back soon.</p>
            <Link href="/" className="btn btn-secondary">
              Continue shopping
            </Link>
          </div>
        )}
      </section>
    </>
  );
}
