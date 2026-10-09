import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ProductListing } from "@/components/product-listing";
import { getCategories, getCategoryWithProducts } from "@/db/queries/catalog";

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/categories/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const result = await getCategoryWithProducts(slug);
  if (!result) return {};

  const { category } = result;
  return {
    title: category.name,
    description: `Shop ${category.name.toLowerCase()} at Atelier. Complimentary express shipping and returns.`,
    openGraph: { images: [category.image.src] },
  };
}

export default function CategoryPage({ params }: PageProps<"/categories/[slug]">) {
  return (
    <main className="flex-1">
      <Suspense fallback={<CategorySkeleton />}>
        <CategoryView params={params} />
      </Suspense>
    </main>
  );
}

async function CategoryView({ params }: Pick<PageProps<"/categories/[slug]">, "params">) {
  const { slug } = await params;
  const result = await getCategoryWithProducts(slug);
  if (!result) notFound();

  const { category, products } = result;

  return (
    <ProductListing
      id="category-title"
      eyebrow="Collection"
      title={category.name}
      breadcrumbs={[{ label: "Home", href: "/" }, { label: category.name }]}
      products={products}
    />
  );
}

// Mirrors the listing layout so the page doesn't shift when content streams in.
function CategorySkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading collection">
      <div className="container-page py-4">
        <div className="bg-surface h-4 w-32" />
      </div>
      <div className="container-page pt-6 md:pt-10">
        <div className="stack mb-8 gap-3 md:mb-10">
          <div className="bg-surface h-3 w-20" />
          <div className="bg-surface h-8 w-48" />
        </div>
        <div className="grid-products bleed md:mx-0">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="media-product" />
          ))}
        </div>
      </div>
    </div>
  );
}
