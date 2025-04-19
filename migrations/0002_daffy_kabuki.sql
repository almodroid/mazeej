CREATE TYPE "public"."payout_account_type" AS ENUM('bank_account', 'paypal');--> statement-breakpoint
CREATE TABLE "payout_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" "payout_account_type" NOT NULL,
	"name" text NOT NULL,
	"account_details" json NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "translations" jsonb;--> statement-breakpoint
ALTER TABLE "skills" ADD COLUMN "translations" jsonb;--> statement-breakpoint
ALTER TABLE "payout_accounts" ADD CONSTRAINT "payout_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;