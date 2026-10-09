"use client";

import Image from "next/image";
import { useActionState, useId, useState } from "react";

import {
  ActionForm,
  errorFor,
  FormMessage,
  SelectField,
  SubmitButton,
  TextAreaField,
  TextField,
} from "@/components/admin/form-controls";
import { IDLE, slugify, type FormState } from "@/lib/admin-form";
import { IMAGE_URL_HINT, isAllowedImageUrl, type ImageAsset } from "@/lib/images";
import { ONE_SIZE } from "@/lib/products";

export type ProductFormValues = {
  name: string;
  slug: string;
  sku: string;
  categoryId: number | null;
  gender: string;
  badge: string | null;
  status: string;
  priceCents: number;
  color: string;
  colorCount: number;
  description: string;
  details: string[];
  images: ImageAsset[];
};

type Option = { value: string; label: string };

export function ProductForm({
  mode,
  initial,
  categories,
  statuses,
  genders,
  badges,
  action,
}: {
  mode: "create" | "edit";
  initial: ProductFormValues;
  categories: { id: number; name: string }[];
  statuses: Option[];
  genders: Option[];
  badges: string[];
  action: (state: FormState, formData: FormData) => Promise<FormState>;
}) {
  const [state, formAction, pending] = useActionState(action, IDLE);
  const [name, setName] = useState(initial.name);
  const [slug, setSlug] = useState(initial.slug);
  const [slugEdited, setSlugEdited] = useState(mode === "edit");
  const error = (field: string) => errorFor(state, field);

  return (
    <ActionForm action={formAction} pending={pending} className="stack gap-10" aria-describedby="product-form-message" noValidate>
      <fieldset className="grid gap-6 md:grid-cols-2">
        <legend className="text-label mb-6">Product</legend>
        <TextField
          label="Name"
          name="name"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            if (!slugEdited) setSlug(slugify(event.target.value));
          }}
          error={error("name")}
          maxLength={120}
        />
        {mode === "create" ? (
          <TextField
            label="URL slug"
            name="slug"
            value={slug}
            onChange={(event) => {
              setSlug(event.target.value);
              setSlugEdited(true);
            }}
            hint={`/products/${slug || "…"}. Can't be changed after creating.`}
            error={error("slug")}
            maxLength={80}
          />
        ) : (
          <div className="stack gap-1">
            <span className="text-label">URL slug</span>
            <p className="field text-mute">{initial.slug}</p>
            <p className="text-meta">Fixed: links, bags and rails use it.</p>
          </div>
        )}
        <TextField label="SKU" name="sku" defaultValue={initial.sku} error={error("sku")} maxLength={40} className="uppercase" />
        <SelectField
          label="Category"
          name="categoryId"
          defaultValue={initial.categoryId ? String(initial.categoryId) : ""}
          options={[
            { value: "", label: "Choose…" },
            ...categories.map((category) => ({ value: String(category.id), label: category.name })),
          ]}
          error={error("categoryId")}
        />
        <TextField
          label="Price (USD)"
          name="price"
          inputMode="decimal"
          defaultValue={initial.priceCents ? centsToInput(initial.priceCents) : ""}
          hint="Charged at checkout from the next order on. Existing orders keep their price."
          error={error("priceCents")}
        />
        <SelectField label="Status" name="status" defaultValue={initial.status} options={statuses} error={error("status")} />
        <SelectField label="Shown in" name="gender" defaultValue={initial.gender} options={genders} error={error("gender")} />
        <SelectField
          label="Badge"
          name="badge"
          defaultValue={initial.badge ?? ""}
          options={[{ value: "", label: "None" }, ...badges.map((badge) => ({ value: badge, label: badge }))]}
          error={error("badge")}
        />
        <TextField label="Colour" name="color" defaultValue={initial.color} error={error("color")} maxLength={60} />
        <TextField
          label="Number of colours"
          name="colorCount"
          type="number"
          min={1}
          max={50}
          defaultValue={initial.colorCount}
          error={error("colorCount")}
        />
        <TextAreaField
          label="Description"
          name="description"
          defaultValue={initial.description}
          error={error("description")}
          className="md:col-span-2"
          maxLength={2000}
        />
        <TextAreaField
          label="Details"
          name="details"
          defaultValue={initial.details.join("\n")}
          hint="One per line, e.g. materials, fit, care."
          error={error("details")}
          optional
          className="md:col-span-2"
        />
      </fieldset>

      <ImagesEditor initial={initial.images} state={state} />

      {mode === "create" && <SizesEditor state={state} />}

      <div className="hairline-t flex flex-wrap items-center gap-4 pt-6">
        <SubmitButton pendingLabel={mode === "create" ? "Creating…" : "Saving…"}>
          {mode === "create" ? "Create product" : "Save changes"}
        </SubmitButton>
        <FormMessage state={state} id="product-form-message" />
      </div>
    </ActionForm>
  );
}

function centsToInput(cents: number) {
  return cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2);
}

type Row<T> = T & { key: number };

function useRows<T>(initial: T[], blank: T) {
  const [rows, setRows] = useState<Row<T>[]>(() => initial.map((row, key) => ({ ...row, key })));
  const [nextKey, setNextKey] = useState(initial.length);
  return {
    rows,
    add() {
      setRows((current) => [...current, { ...blank, key: nextKey }]);
      setNextKey((key) => key + 1);
    },
    update(key: number, patch: Partial<T>) {
      setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)));
    },
    remove(key: number) {
      setRows((current) => current.filter((row) => row.key !== key));
    },
    move(index: number, offset: -1 | 1) {
      setRows((current) => {
        const target = index + offset;
        if (target < 0 || target >= current.length) return current;
        const next = [...current];
        [next[index], next[target]] = [next[target], next[index]];
        return next;
      });
    },
  };
}

function ImagesEditor({ initial, state }: { initial: ImageAsset[]; state: FormState }) {
  const images = useRows(initial.length ? initial : [{ src: "", alt: "" }], { src: "", alt: "" });
  const listError = errorFor(state, "images");
  const headingId = useId();

  return (
    <fieldset className="stack gap-4" aria-describedby={listError ? `${headingId}-error` : undefined}>
      <legend className="text-label mb-2">Images</legend>
      <p className="text-meta -mt-2">The first image is used in listings. {IMAGE_URL_HINT}</p>
      {listError && (
        <p id={`${headingId}-error`} className="text-error text-sm">
          {listError}
        </p>
      )}
      <ol className="stack gap-4">
        {images.rows.map((image, index) => (
          <li key={image.key} className="hairline grid gap-4 p-4 sm:grid-cols-[5rem_1fr_auto]">
            <div className="bg-surface relative aspect-[3/4] w-20 overflow-hidden">
              {isAllowedImageUrl(image.src) && (
                <Image src={image.src} alt="" fill sizes="80px" className="object-cover" />
              )}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                label={`Image ${index + 1} URL`}
                name={`images.${index}.src`}
                type="url"
                value={image.src}
                onChange={(event) => images.update(image.key, { src: event.target.value })}
                error={errorFor(state, `images.${index}.src`)}
              />
              <TextField
                label="Alt text"
                name={`images.${index}.alt`}
                value={image.alt}
                onChange={(event) => images.update(image.key, { alt: event.target.value })}
                error={errorFor(state, `images.${index}.alt`)}
                maxLength={200}
              />
            </div>
            <RowControls
              label={`image ${index + 1}`}
              index={index}
              count={images.rows.length}
              onMove={(offset) => images.move(index, offset)}
              onRemove={images.rows.length > 1 ? () => images.remove(image.key) : undefined}
            />
          </li>
        ))}
      </ol>
      <div>
        <button type="button" className="btn btn-secondary btn-sm" onClick={images.add} disabled={images.rows.length >= 12}>
          Add image
        </button>
      </div>
    </fieldset>
  );
}

function SizesEditor({ state }: { state: FormState }) {
  const sizes = useRows([{ size: ONE_SIZE, quantity: "0" }], { size: "", quantity: "0" });
  const listError = errorFor(state, "sizes");

  return (
    <fieldset className="stack gap-4">
      <legend className="text-label mb-2">Sizes and opening stock</legend>
      <p className="text-meta -mt-2">
        Use a single “{ONE_SIZE}” row for pieces without sizes. Stock is managed per size after creating.
      </p>
      {listError && <p className="text-error text-sm">{listError}</p>}
      <ol className="stack gap-3">
        {sizes.rows.map((row, index) => (
          <li key={row.key} className="grid items-end gap-4 sm:grid-cols-[1fr_10rem_auto]">
            <TextField
              label={`Size ${index + 1}`}
              name={`sizes.${index}.size`}
              value={row.size}
              onChange={(event) => sizes.update(row.key, { size: event.target.value })}
              error={errorFor(state, `sizes.${index}.size`)}
              maxLength={20}
            />
            <TextField
              label="Opening stock"
              name={`sizes.${index}.quantity`}
              type="number"
              min={0}
              value={row.quantity}
              onChange={(event) => sizes.update(row.key, { quantity: event.target.value })}
              error={errorFor(state, `sizes.${index}.quantity`)}
            />
            <RowControls
              label={`size ${index + 1}`}
              index={index}
              count={sizes.rows.length}
              onMove={(offset) => sizes.move(index, offset)}
              onRemove={sizes.rows.length > 1 ? () => sizes.remove(row.key) : undefined}
            />
          </li>
        ))}
      </ol>
      <div>
        <button type="button" className="btn btn-secondary btn-sm" onClick={sizes.add} disabled={sizes.rows.length >= 30}>
          Add size
        </button>
      </div>
    </fieldset>
  );
}

export function RowControls({
  label,
  index,
  count,
  onMove,
  onRemove,
}: {
  label: string;
  index: number;
  count: number;
  onMove: (offset: -1 | 1) => void;
  onRemove?: () => void;
}) {
  return (
    <div className="flex items-center gap-3 self-center">
      <button type="button" className="link-mute text-label" onClick={() => onMove(-1)} disabled={index === 0} aria-label={`Move ${label} up`}>
        Up
      </button>
      <button
        type="button"
        className="link-mute text-label"
        onClick={() => onMove(1)}
        disabled={index === count - 1}
        aria-label={`Move ${label} down`}
      >
        Down
      </button>
      {onRemove && (
        <button type="button" className="link-mute text-label" onClick={onRemove} aria-label={`Remove ${label}`}>
          Remove
        </button>
      )}
    </div>
  );
}
