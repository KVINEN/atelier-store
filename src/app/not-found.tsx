import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex-1">
      <section className="container-content section stack items-start gap-5">
        <p className="text-eyebrow text-mute">Page not found</p>
        <h1 className="text-heading">We couldn&rsquo;t find that page</h1>
        <p className="text-ink-soft max-w-md">
          It may have moved, or the piece may no longer be available. Try searching, or
          continue browsing the collection.
        </p>
        <div className="cluster gap-3">
          <Link href="/" className="btn btn-primary">
            Home
          </Link>
          <Link href="/new-in" className="btn btn-secondary">
            New arrivals
          </Link>
          <Link href="/search" className="btn btn-secondary">
            Search
          </Link>
        </div>
      </section>
    </main>
  );
}
