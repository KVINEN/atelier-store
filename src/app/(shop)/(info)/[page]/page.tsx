import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Disclosure } from "@/components/disclosure";
import { InquiryForm } from "@/components/inquiry-form";
import { infoPages, sizeGuide, stores, type InfoPage } from "@/lib/pages";

function getInfoPage(page: string): InfoPage | undefined {
  return Object.hasOwn(infoPages, page) ? infoPages[page] : undefined;
}

export function generateStaticParams() {
  return Object.keys(infoPages).map((page) => ({ page }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[page]">): Promise<Metadata> {
  const { page } = await params;
  const content = getInfoPage(page);
  if (!content) return {};
  return { title: content.title, description: content.intro };
}

export default function InfoRoute({ params }: PageProps<"/[page]">) {
  return (
    <main className="flex-1">
      <Suspense fallback={<div className="container-content section" aria-busy="true" />}>
        <InfoView params={params} />
      </Suspense>
    </main>
  );
}

async function InfoView({ params }: Pick<PageProps<"/[page]">, "params">) {
  const { page } = await params;
  const content = getInfoPage(page);
  if (!content) notFound();

  return (
    <article aria-labelledby="info-title" className="container-content section">
      <header className="stack mb-10 max-w-2xl gap-4 md:mb-14">
        <p className="text-eyebrow text-mute">{content.eyebrow}</p>
        <h1 id="info-title" className="text-heading">
          {content.title}
        </h1>
        <p className="text-ink-soft text-lg">{content.intro}</p>
      </header>

      <div className={content.form ? "grid gap-12 md:grid-cols-2 md:gap-16" : "max-w-2xl"}>
        {content.form ? <InquiryForm {...content.form} /> : null}
        <InfoBody content={content} />
      </div>

      {content.extra === "stores" ? <StoreList /> : null}
      {content.extra === "size-guide" ? <SizeGuide /> : null}

      {content.links?.length ? (
        <ul className="cluster mt-12 gap-3">
          {content.links.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="btn btn-secondary btn-sm">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}

function InfoBody({ content }: { content: InfoPage }) {
  if (!content.sections && !content.faq) return null;
  return (
    <div className="stack gap-10">
      {content.sections?.map((section) => (
        <section key={section.heading} className="hairline-t stack gap-3 pt-6">
          <h2 className="text-label">{section.heading}</h2>
          {section.body.map((paragraph) => (
            <p key={paragraph} className="text-ink-soft">
              {paragraph}
            </p>
          ))}
        </section>
      ))}
      {content.faq ? (
        <div className="hairline-b">
          {content.faq.map((item) => (
            <Disclosure key={item.question} title={item.question}>
              <p className="text-ink-soft">{item.answer}</p>
            </Disclosure>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function StoreList() {
  return (
    <ul className="grid gap-px sm:grid-cols-2 lg:grid-cols-3">
      {stores.map((store) => (
        <li key={store.name} className="hairline stack gap-3 p-6">
          <p className="text-eyebrow text-mute">{store.city}</p>
          <h2 className="text-xl">{store.name}</h2>
          <address className="text-ink-soft not-italic">
            {store.address.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </address>
          <p className="text-meta">{store.hours}</p>
          <a href={`tel:${store.phone.replace(/[^+\d]/g, "")}`} className="link text-sm">
            {store.phone}
          </a>
        </li>
      ))}
    </ul>
  );
}

function SizeGuide() {
  return (
    <div className="stack gap-12">
      {Object.values(sizeGuide).map((table) => (
        <div key={table.caption} className="bleed overflow-x-auto px-(--gutter) md:mx-0 md:px-0">
          <table className="w-full min-w-xl text-left text-sm">
            <caption className="text-label mb-4 text-left">{table.caption}</caption>
            <thead>
              <tr className="hairline-b">
                {table.head.map((cell) => (
                  <th key={cell} scope="col" className="text-meta py-3 pr-4 font-normal">
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row) => (
                <tr key={row[0]} className="hairline-b">
                  {row.map((cell, index) =>
                    index === 0 ? (
                      <th key={index} scope="row" className="py-3 pr-4 font-medium">
                        {cell}
                      </th>
                    ) : (
                      <td key={index} className="py-3 pr-4 tabular-nums">
                        {cell}
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
