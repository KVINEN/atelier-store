import { Suspense } from "react";

import { ActionButton } from "@/components/admin/form-controls";
import { HeroForm, RailEditor } from "@/components/admin/storefront-forms";
import { AdminMain, AdminSkeleton, formatDateTime, PageHeader, Panel } from "@/components/admin/ui";
import { getHeroForEdit, getProductPickerOptions, getRailForEdit } from "@/db/admin/content";
import { adminMetadata, requireAdminPage } from "@/lib/admin";
import { MAX_RAIL_ITEMS, RAIL_KEYS, RAILS } from "@/lib/site-content";

import { resetHeroAction, resetRailAction, saveHeroAction, saveRailAction } from "./actions";

export const generateMetadata = () => adminMetadata({ title: "Storefront" });

export default function StorefrontPage() {
  return (
    <AdminMain>
      <Suspense fallback={<AdminSkeleton />}>
        <Storefront />
      </Suspense>
    </AdminMain>
  );
}

async function Storefront() {
  await requireAdminPage();
  const [hero, options, ...rails] = await Promise.all([
    getHeroForEdit(),
    getProductPickerOptions(),
    ...RAIL_KEYS.map((key) => getRailForEdit(key)),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Site"
        title="Storefront"
        description="Home page content. Changes go live as soon as you publish."
      />
      <div className="stack gap-8">
        <Panel
          title="Home hero"
          action={
            hero.isDefault ? (
              <span className="text-meta">Using the default</span>
            ) : (
              <ActionButton action={resetHeroAction} confirmLabel="Reset to default" pendingLabel="Resetting…">
                Reset
              </ActionButton>
            )
          }
        >
          {/* Keyed so resetting to the default reloads the fields. */}
          <HeroForm key={hero.isDefault ? "default" : "custom"} initial={hero.hero} action={saveHeroAction} />
          {hero.updatedAt && <p className="text-meta mt-4">Last published {formatDateTime(hero.updatedAt)}</p>}
        </Panel>

        <div className="grid gap-8 xl:grid-cols-2">
          {RAIL_KEYS.map((key, index) => {
            const rail = rails[index];
            return (
              <Panel
                key={key}
                title={RAILS[key].title}
                action={
                  rail.isDefault ? (
                    <span className="text-meta">Using the default</span>
                  ) : (
                    <ActionButton action={resetRailAction.bind(null, key)} confirmLabel="Reset to default" pendingLabel="Resetting…">
                      Reset
                    </ActionButton>
                  )
                }
              >
                <p className="text-meta mb-5">{RAILS[key].description} Only active products are shown.</p>
                <RailEditor
                  key={rail.isDefault ? "default" : "custom"}
                  title={RAILS[key].title}
                  initial={rail.entries}
                  options={options}
                  action={saveRailAction.bind(null, key)}
                  max={MAX_RAIL_ITEMS}
                />
                {rail.updatedAt && <p className="text-meta mt-4">Last published {formatDateTime(rail.updatedAt)}</p>}
              </Panel>
            );
          })}
        </div>
      </div>
    </>
  );
}
