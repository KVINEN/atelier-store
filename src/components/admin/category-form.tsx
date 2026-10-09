"use client";

import Image from "next/image";
import { useActionState, useState } from "react";

import { ActionForm, errorFor, FormMessage, SubmitButton, TextField } from "@/components/admin/form-controls";
import { IDLE, slugify, type FormState } from "@/lib/admin-form";
import { IMAGE_URL_HINT, isAllowedImageUrl } from "@/lib/images";

export function CategoryForm({
  mode,
  initial,
  action,
}: {
  mode: "create" | "edit";
  initial: { name: string; slug: string; imageSrc: string; imageAlt: string };
  action: (state: FormState, formData: FormData) => Promise<FormState>;
}) {
  const [state, formAction, pending] = useActionState(action, IDLE);
  const [name, setName] = useState(initial.name);
  const [slug, setSlug] = useState(initial.slug);
  const [slugEdited, setSlugEdited] = useState(mode === "edit");
  const [imageSrc, setImageSrc] = useState(initial.imageSrc);

  return (
    <ActionForm action={formAction} pending={pending} className="stack max-w-3xl gap-6" noValidate>
      <div className="grid gap-6 md:grid-cols-2">
        <TextField
          label="Name"
          name="name"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            if (!slugEdited) setSlug(slugify(event.target.value));
          }}
          error={errorFor(state, "name")}
          maxLength={60}
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
            hint={`/categories/${slug || "…"}. Can't be changed after creating.`}
            error={errorFor(state, "slug")}
            maxLength={60}
          />
        ) : (
          <div className="stack gap-1">
            <span className="text-label">URL</span>
            <p className="field text-mute">/categories/{initial.slug}</p>
          </div>
        )}
      </div>
      <div className="grid gap-6 sm:grid-cols-[8rem_1fr]">
        <div className="bg-surface relative aspect-[3/4] w-32 overflow-hidden">
          {isAllowedImageUrl(imageSrc) && <Image src={imageSrc} alt="" fill sizes="128px" className="object-cover" />}
        </div>
        <div className="stack gap-6">
          <TextField
            label="Image URL"
            name="imageSrc"
            type="url"
            value={imageSrc}
            onChange={(event) => setImageSrc(event.target.value)}
            hint={IMAGE_URL_HINT}
            error={errorFor(state, "imageSrc")}
          />
          <TextField label="Image alt text" name="imageAlt" defaultValue={initial.imageAlt} error={errorFor(state, "imageAlt")} maxLength={200} />
        </div>
      </div>
      <div className="hairline-t flex flex-wrap items-center gap-4 pt-6">
        <SubmitButton pendingLabel="Saving…">{mode === "create" ? "Create category" : "Save changes"}</SubmitButton>
        <FormMessage state={state} />
      </div>
    </ActionForm>
  );
}
