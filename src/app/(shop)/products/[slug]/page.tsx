import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Disclosure } from "@/components/disclosure";
import { ProductCard } from "@/components/product-card";
import { ProductGallery } from "@/components/product-gallery";
import { ProductPurchase } from "@/components/product-purchase";
import { ProductRail } from "@/components/product-rail";
import { SectionHeader } from "@/components/section-header";
import {
  getProduct,
  getProductSlugs,
  getRelatedProducts,
} from "@/db/queries/catalog";
import { formatPrice, isOneSize, toSnapshot } from "@/lib/products";

export async function generateStaticParams() {
  const slugs = await getProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return {};

  return {
    title: product.name,
    description: product.description,
    openGraph: { images: [product.images[0].src] },
  };
}

export default function ProductPage({ params }: PageProps<"/products/[slug]">) {
  return (
    <main className="flex-1">
      <Suspense fallback={<ProductSkeleton />}>
        <ProductView params={params} />
      </Suspense>
    </main>
  );
}

async function ProductView({ params }: Pick<PageProps<"/products/[slug]">, "params">) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const { category } = product;
  const related = await getRelatedProducts(product.slug, category.slug);

  return (
    <>
      <nav aria-label="Breadcrumb" className="container-page py-4">
        <ol className="cluster text-meta gap-2">
          <li>
            <Link href="/" className="link-mute">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href={category.href} className="link-mute">
              {category.name}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-ink">
            {product.name}
          </li>
        </ol>
      </nav>

      <div className="container-page lg:grid lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start lg:gap-12 xl:grid-cols-[minmax(0,1fr)_28rem] xl:gap-20">
        <div className="bleed lg:mx-0">
          <ProductGallery images={product.images} />
        </div>

        <div className="stack gap-8 pt-8 pb-4 lg:sticky lg:top-[calc(var(--header-height)+2rem)] lg:pt-0">
          <header className="stack gap-3">
            <div className="flex items-center justify-between gap-4">
              <Link href={category.href} className="text-eyebrow text-mute link-quiet">
                {category.name}
              </Link>
              {product.badge ? (
                <span className="text-eyebrow hairline px-2 py-1">{product.badge}</span>
              ) : null}
            </div>
            <h1 className="text-xl md:text-2xl">{product.name}</h1>
            <p className="text-price text-base">{formatPrice(product.price)}</p>
          </header>

          <ProductPurchase
            item={toSnapshot(product)}
            color={product.color}
            colors={product.colors}
            variants={product.variants}
            oneSize={isOneSize(product)}
          />

          <ul className="text-meta stack gap-1.5">
            <li>Complimentary express shipping and returns</li>
            <li>Free returns within 30 days</li>
            <li>Signature gift packaging included</li>
          </ul>

          <div className="hairline-b">
            <Disclosure title="Description" open>
              <p className="text-ink-soft">{product.description}</p>
              <p className="text-meta mt-3">Style {product.sku}</p>
            </Disclosure>
            <Disclosure title="Details & care">
              <ul className="text-ink-soft stack gap-1.5">
                {product.details.map((detail) => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>
            </Disclosure>
            <Disclosure title="Shipping & returns">
              <p className="text-ink-soft">
                Orders ship within 1–2 business days by express courier, at no
                charge. Unworn pieces can be returned within 30 days for a full
                refund.
              </p>
            </Disclosure>
          </div>
        </div>
      </div>

      <section aria-labelledby="related-title" className="container-page section">
        <SectionHeader id="related-title" eyebrow="Discover" title="You may also like" />
        <ProductRail label="You may also like">
          {related.map((item) => (
            <ProductCard
              key={item.slug}
              product={item}
              sizes="(min-width: 80rem) 25vw, (min-width: 48rem) 33vw, 70vw"
            />
          ))}
        </ProductRail>
      </section>
    </>
  );
}

// Mirrors the product layout so the page doesn't shift when content streams in.
function ProductSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading product">
      <div className="container-page py-4">
        <div className="bg-surface h-4 w-48" />
      </div>
      <div className="container-page lg:grid lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start lg:gap-12 xl:grid-cols-[minmax(0,1fr)_28rem] xl:gap-20">
        <div className="bleed lg:mx-0 lg:grid lg:grid-cols-2 lg:gap-(--grid-gap)">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`media-product ${i > 0 ? "hidden lg:block" : ""}`} />
          ))}
        </div>
        <div className="stack gap-4 pt-8 lg:pt-0">
          <div className="bg-surface h-3 w-24" />
          <div className="bg-surface h-8 w-3/4" />
          <div className="bg-surface h-5 w-20" />
          <div className="bg-surface mt-6 h-12 w-full" />
          <div className="bg-surface h-12 w-full" />
        </div>
      </div>
    </div>
  );
}
