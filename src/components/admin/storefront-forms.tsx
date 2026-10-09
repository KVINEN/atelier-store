"use client";

import Image from "next/image";
import { useActionState, useState } from "react";

import { ActionForm, errorFor, FormMessage, SubmitButton, TextAreaField, TextField } from "@/components/admin/form-controls";
import { RowControls } from "@/components/admin/product-form";
import { StatusBadge } from "@/components/admin/ui";
import { IDLE, type FormState } from "@/lib/admin-form";
import { IMAGE_URL_HINT, isAllowedImageUrl, type ImageAsset } from "@/lib/images";
import type { HeroContent } from "@/lib/site-content";

type Action = (state: FormState, formData: FormData) => Promise<FormState>;

export function HeroForm({ initial, action }: { initial: HeroContent; action: Action }) {
  const [state, formAction, pending] = useActionState(action, IDLE);
  const [images, setImages] = useState(initial.images);
  const ctas = [initial.ctas[0], initial.ctas[1] ?? { label: "", href: "" }];

  return (
    <ActionForm action={formAction} pending={pending} className="stack gap-8" noValidate>
      <div className="grid gap-6 md:grid-cols-2">
        <TextField label="Eyebrow" name="eyebrow" defaultValue={initial.eyebrow} optional maxLength={60} error={errorFor(state, "eyebrow")} />
        <TextField label="Headline" name="title" defaultValue={initial.title} maxLength={80} error={errorFor(state, "title")} />
        <TextAreaField
          label="Body"
          name="body"
          defaultValue={initial.body}
          optional
          maxLength={240}
          className="md:col-span-2"
          error={errorFor(state, "body")}
        />
      </div>

      <fieldset className="stack gap-4">
        <legend className="text-label mb-2">Images</legend>
        <p className="text-meta -mt-2">Left and right halves on desktop; only the first shows on mobile. {IMAGE_URL_HINT}</p>
        <div className="grid gap-6 lg:grid-cols-2">
          {images.map((image, index) => (
            <div key={index} className="hairline grid gap-4 p-4 sm:grid-cols-[6rem_1fr]">
              <div className="bg-surface relative aspect-[3/4] w-24 overflow-hidden">
                {isAllowedImageUrl(image.src) && <Image src={image.src} alt="" fill sizes="96px" className="object-cover" />}
              </div>
              <div className="stack gap-4">
                <TextField
                  label={index === 0 ? "Left image URL" : "Right image URL"}
                  name={`images.${index}.src`}
                  type="url"
                  value={image.src}
                  onChange={(event) =>
                    setImages((current) => current.map((row, i) => (i === index ? { ...row, src: event.target.value } : row)))
                  }
                  error={errorFor(state, `images.${index}.src`)}
                />
                <TextField
                  label="Alt text"
                  name={`images.${index}.alt`}
                  defaultValue={image.alt}
                  maxLength={200}
                  error={errorFor(state, `images.${index}.alt`)}
                />
              </div>
            </div>
          ))}
        </div>
      </fieldset>

      <fieldset className="stack gap-4">
        <legend className="text-label mb-2">Buttons</legend>
        {errorFor(state, "ctas") && <p className="text-error text-sm">{errorFor(state, "ctas")}</p>}
        {ctas.map((cta, index) => (
          <div key={index} className="grid gap-4 sm:grid-cols-2">
            <TextField
              label={`Button ${index + 1} label`}
              name={`ctas.${index}.label`}
              defaultValue={cta.label}
              optional={index > 0}
              maxLength={40}
              error={errorFor(state, `ctas.${index}.label`)}
            />
            <TextField
              label="Links to"
              name={`ctas.${index}.href`}
              defaultValue={cta.href}
              optional={index > 0}
              placeholder="/women"
              error={errorFor(state, `ctas.${index}.href`)}
            />
          </div>
        ))}
      </fieldset>

      <div className="hairline-t flex flex-wrap items-center gap-4 pt-6">
        <SubmitButton pendingLabel="Publishing…">Publish hero</SubmitButton>
        <FormMessage state={state} />
      </div>
    </ActionForm>
  );
}

export type RailItem = { slug: string; name: string | null; status: string | null; image: ImageAsset | null };
type ProductOption = { slug: string; name: string; status: string };

export function RailEditor({
  title,
  initial,
  options,
  action,
  max,
}: {
  title: string;
  initial: RailItem[];
  options: ProductOption[];
  action: Action;
  max: number;
}) {
  const [state, formAction, pending] = useActionState(action, IDLE);
  const [items, setItems] = useState(initial);
  const [adding, setAdding] = useState("");
  const included = new Set(items.map((item) => item.slug));
  const available = options.filter((option) => !included.has(option.slug));

  function move(index: number, offset: -1 | 1) {
    setItems((current) => {
      const target = index + offset;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  return (
    <ActionForm action={formAction} pending={pending} className="stack gap-5">
      {items.map((item) => (
        <input key={item.slug} type="hidden" name="slugs" value={item.slug} />
      ))}
      {items.length === 0 ? (
        <p className="text-meta">No pieces selected; the rail will be empty.</p>
      ) : (
        <ol className="hairline-t">
          {items.map((item, index) => (
            <li key={item.slug} className="hairline-b grid grid-cols-[2.5rem_1fr_auto] items-center gap-4 py-3">
              <div className="bg-surface relative aspect-[3/4] w-10 overflow-hidden">
                {item.image && <Image src={item.image.src} alt="" fill sizes="40px" className="object-cover" />}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {index + 1}. {item.name ?? item.slug}
                </p>
                {item.status !== "active" && (
                  <StatusBadge tone="warning">
                    {item.status === null ? "Product deleted, not shown" : `${item.status === "draft" ? "Draft" : "Archived"}, not shown`}
                  </StatusBadge>
                )}
              </div>
              <RowControls
                label={item.name ?? item.slug}
                index={index}
                count={items.length}
                onMove={(offset) => move(index, offset)}
                onRemove={() => setItems((current) => current.filter((row) => row.slug !== item.slug))}
              />
            </li>
          ))}
        </ol>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <label className="stack min-w-64 flex-1 gap-1">
          <span className="text-label">Add a piece to {title}</span>
          <select className="field" value={adding} onChange={(event) => setAdding(event.target.value)}>
            <option value="">Choose a product…</option>
            {available.map((option) => (
              <option key={option.slug} value={option.slug}>
                {option.name}
                {option.status !== "active" ? ` (${option.status})` : ""}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          disabled={!adding || items.length >= max}
          onClick={() => {
            const option = options.find((row) => row.slug === adding);
            if (!option) return;
            setItems((current) => [...current, { slug: option.slug, name: option.name, status: option.status, image: null }]);
            setAdding("");
          }}
        >
          Add
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton size="sm" pendingLabel="Publishing…">
          Publish {title}
        </SubmitButton>
        <FormMessage state={state} />
      </div>
    </ActionForm>
  );
}
