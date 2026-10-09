import Image from "next/image";
import Link from "next/link";

import { ArrowRightIcon } from "@/components/icons";
import { ProductCard } from "@/components/product-card";
import { ProductRail } from "@/components/product-rail";
import { SectionHeader } from "@/components/section-header";
import { getCategories, getProductsBySlugs } from "@/db/queries/catalog";
import {
  campaign,
  editorials,
  GIFT_EDIT,
  hero,
  NEW_ARRIVALS,
  services,
} from "@/lib/catalog";

export default function Home() {
  return (
    <main className="flex-1">
      <Hero />
      <CategoryGrid />
      <NewArrivals />
      <Editorials />
      <GiftEdit />
      <Campaign />
      <Services />
    </main>
  );
}

function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative">
      <div className="grid md:grid-cols-2">
        {hero.images.map((image, index) => (
          <div
            key={image.src}
            className={index === 0 ? "media-hero" : "media-hero hidden md:block"}
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes="(min-width: 48rem) 50vw, 100vw"
              loading="eager"
              fetchPriority="high"
            />
          </div>
        ))}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-t from-black/55 to-transparent" />

      <div className="container-page text-paper absolute inset-x-0 bottom-0 flex flex-col items-center gap-5 pb-12 text-center md:pb-16">
        <p className="text-eyebrow">{hero.eyebrow}</p>
        <h1 id="hero-title" className="text-display">
          {hero.title}
        </h1>
        <p className="max-w-md text-base">{hero.body}</p>
        <div className="mt-2 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          {hero.ctas.map((cta) => (
            <Link key={cta.href} href={cta.href} className="btn btn-inverse">
              {cta.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

async function CategoryGrid() {
  const categories = await getCategories();

  return (
    <section aria-labelledby="categories-title" className="container-page section">
      <div className="mb-8 md:mb-10">
        <h2 id="categories-title" className="text-heading">
          Shop by category
        </h2>
      </div>
      <ul className="grid grid-cols-2 gap-x-(--grid-gap) gap-y-8 md:grid-cols-3 xl:grid-cols-6">
        {categories.map((category) => (
          <li key={category.slug}>
            <Link href={category.href} className="group block">
              <div className="media-product">
                <Image
                  src={category.image.src}
                  alt=""
                  fill
                  sizes="(min-width: 80rem) 16vw, (min-width: 48rem) 33vw, 50vw"
                  className="transition-transform duration-700 group-hover:scale-[1.03]"
                />
              </div>
              <span className="text-label mt-3 inline-flex items-center gap-2">
                {category.name}
                <ArrowRightIcon
                  width={14}
                  height={14}
                  className="-translate-x-1 opacity-0 transition duration-300 group-hover:translate-x-0 group-hover:opacity-100"
                />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

async function NewArrivals() {
  const newArrivals = await getProductsBySlugs(NEW_ARRIVALS);

  return (
    <section aria-labelledby="new-arrivals-title" className="container-page section pt-0">
      <SectionHeader
        id="new-arrivals-title"
        eyebrow="Just landed"
        title="New arrivals"
        link={{ label: "View all", href: "/new-in" }}
      />
      <div className="grid-products bleed md:mx-0">
        {newArrivals.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>
    </section>
  );
}

function Editorials() {
  return (
    <section aria-label="Stories" className="section pt-0">
      <div className="stack gap-(--grid-gap)">
        {editorials.map((story, index) => (
          <article key={story.title} className="grid-split items-center">
            <div
              className={`relative aspect-portrait overflow-hidden bg-surface ${
                index % 2 === 1 ? "md:order-2" : ""
              }`}
            >
              <Image
                src={story.image.src}
                alt={story.image.alt}
                fill
                sizes="(min-width: 48rem) 50vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="container-prose stack items-start gap-5 px-(--gutter) py-12 md:py-0 lg:px-16">
              <p className="text-eyebrow text-mute">{story.eyebrow}</p>
              <h2 className="font-display text-3xl font-light tracking-tight">
                {story.title}
              </h2>
              <p className="text-ink-soft max-w-sm">{story.body}</p>
              <Link href={story.cta.href} className="btn btn-secondary mt-3">
                {story.cta.label}
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

async function GiftEdit() {
  const giftEdit = await getProductsBySlugs(GIFT_EDIT);

  return (
    <section aria-labelledby="gift-edit-title" className="container-page section pt-0">
      <SectionHeader
        id="gift-edit-title"
        eyebrow="Curated"
        title="The gift edit"
        link={{ label: "Shop gifts", href: "/gifts" }}
      />
      <ProductRail label="The gift edit">
        {giftEdit.map((product) => (
          <ProductCard
            key={product.slug}
            product={product}
            sizes="(min-width: 80rem) 25vw, (min-width: 48rem) 33vw, 70vw"
          />
        ))}
      </ProductRail>
    </section>
  );
}

function Campaign() {
  return (
    <section
      aria-labelledby="campaign-title"
      className="relative flex min-h-[75svh] items-end overflow-hidden bg-surface"
    >
      <Image
        src={campaign.image.src}
        alt={campaign.image.alt}
        fill
        sizes="100vw"
        className="object-cover"
      />
      <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent" />
      <div className="container-page text-paper relative stack items-start gap-4 pb-12 md:pb-16">
        <p className="text-eyebrow">{campaign.eyebrow}</p>
        <h2 id="campaign-title" className="font-display text-3xl font-light tracking-tight">
          {campaign.title}
        </h2>
        <p className="max-w-md">{campaign.body}</p>
        <Link href={campaign.cta.href} className="btn btn-inverse mt-2">
          {campaign.cta.label}
        </Link>
      </div>
    </section>
  );
}

function Services() {
  return (
    <section aria-label="Services" className="container-page section">
      <ul className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
        {services.map((service) => (
          <li key={service.title} className="hairline-t stack gap-2 pt-5">
            <h3 className="text-label">{service.title}</h3>
            <p className="text-meta max-w-xs">{service.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
