CREATE TYPE "public"."product_badge" AS ENUM('New', 'Exclusive', 'Limited');--> statement-breakpoint
CREATE TABLE "categories" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "categories_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"href" text NOT NULL,
	"image_src" text NOT NULL,
	"image_alt" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "products_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"category_id" integer NOT NULL,
	"slug" text NOT NULL,
	"sku" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"details" text[] DEFAULT '{}'::text[] NOT NULL,
	"price_cents" integer NOT NULL,
	"color" text NOT NULL,
	"color_count" integer DEFAULT 1 NOT NULL,
	"badge" "product_badge",
	"images" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_slug_unique" UNIQUE("slug"),
	CONSTRAINT "products_sku_unique" UNIQUE("sku"),
	CONSTRAINT "products_price_cents_check" CHECK ("products"."price_cents" >= 0)
);
--> statement-breakpoint
CREATE TABLE "stock" (
	"product_id" integer NOT NULL,
	"size" text NOT NULL,
	"position" integer NOT NULL,
	"quantity" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "stock_product_id_size_pk" PRIMARY KEY("product_id","size"),
	CONSTRAINT "stock_quantity_check" CHECK ("stock"."quantity" >= 0)
);
--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock" ADD CONSTRAINT "stock_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "products_category_id_idx" ON "products" USING btree ("category_id");