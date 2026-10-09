import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { ProductCard } from "@/components/product-card";
import { SearchIcon } from "@/components/icons";
import { searchProducts } from "@/db/queries/catalog";

export const metadata: Metadata = {
  title: "Search",
  description: "Search the Atelier collection.",
};

const suggestions = [
  { label: "New In", href: "/new-in" },
  { label: "Women", href: "/women" },
  { label: "Men", href: "/men" },
  { label: "Gifts", href: "/gifts" },
];

export default function SearchPage({ searchParams }: PageProps<"/search">) {
  return (
    <main className="flex-1">
      <section aria-labelledby="search-title" className="container-page section">
        <h1 id="search-title" className="text-heading mb-8">
          Search
        </h1>
        <Suspense fallback={<SearchForm />}>
          <SearchResults searchParams={searchParams} />
        </Suspense>
      </section>
    </main>
  );
}

function SearchForm({ query = "" }: { query?: string }) {
  return (
    <form action="/search" role="search" className="mb-10 flex items-end gap-3">
      <label className="flex-1">
        <span className="sr-only">Search the collection</span>
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Dresses, silk, sneakers…"
          autoComplete="off"
          className="field"
        />
      </label>
      <button type="submit" className="btn-icon" aria-label="Search">
        <SearchIcon />
      </button>
    </form>
  );
}

async function SearchResults({
  searchParams,
}: Pick<PageProps<"/search">, "searchParams">) {
  const { q } = await searchParams;
  const query = (Array.isArray(q) ? q[0] : q)?.trim() ?? "";
  const products = query ? await searchProducts(query) : [];

  return (
    <>
      {/* Keyed so the input resets to the new query after navigation. */}
      <SearchForm key={query} query={query} />

      {query && products.length > 0 ? (
        <>
          <p className="text-meta mb-6" role="status">
            {products.length} {products.length === 1 ? "result" : "results"} for
            &ldquo;{query}&rdquo;
          </p>
          <div className="grid-products bleed md:mx-0">
            {products.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        </>
      ) : (
        <div className="hairline-t stack items-start gap-5 pt-8">
          <p className="text-ink-soft" role={query ? "status" : undefined}>
            {query
              ? `Nothing matched “${query}”. Try another word, or browse the collection.`
              : "Search by piece, material or colour, or browse the collection."}
          </p>
          <ul className="cluster gap-3">
            {suggestions.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="btn btn-secondary btn-sm">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
