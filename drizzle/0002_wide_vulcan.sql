CREATE TYPE "public"."order_status" AS ENUM('pending', 'paid', 'failed', 'expired');--> statement-breakpoint
CREATE TABLE "orders" (
	"id" text PRIMARY KEY NOT NULL,
	"stripe_session_id" text NOT NULL,
	"user_id" text,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"email" text,
	"items" jsonb NOT NULL,
	"amount_total_cents" integer NOT NULL,
	"currency" text NOT NULL,
	"shipping" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"paid_at" timestamp with time zone,
	CONSTRAINT "orders_stripe_session_id_unique" UNIQUE("stripe_session_id"),
	CONSTRAINT "orders_amount_total_cents_check" CHECK ("orders"."amount_total_cents" >= 0)
);
--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "orders_user_id_idx" ON "orders" USING btree ("user_id");