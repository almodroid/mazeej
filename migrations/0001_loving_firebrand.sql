CREATE TYPE "public"."payment_status" AS ENUM('completed', 'pending', 'failed');--> statement-breakpoint
CREATE TYPE "public"."payment_type" AS ENUM('deposit', 'withdrawal', 'project_payment');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('fee', 'payment', 'refund');--> statement-breakpoint
CREATE TYPE "public"."withdrawal_request_status" AS ENUM('pending', 'approved', 'rejected', 'completed');--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'pending' BEFORE 'open';--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"payment_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"amount" numeric NOT NULL,
	"type" "transaction_type" NOT NULL,
	"status" "payment_status" NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "withdrawal_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"amount" numeric NOT NULL,
	"payment_method" text NOT NULL,
	"account_details" json NOT NULL,
	"status" "withdrawal_request_status" DEFAULT 'pending',
	"notes" text,
	"admin_id" integer,
	"payment_id" integer,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"processed_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "project_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "amount" SET DATA TYPE numeric;--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "status" SET DATA TYPE payment_status;--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "supervised_by" integer;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "is_flagged" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "supervisor_notes" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "media_url" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "media_type" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "user_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "type" "payment_type" NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_blocked" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_supervised_by_users_id_fk" FOREIGN KEY ("supervised_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "client_id";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "freelancer_id";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "transaction_id";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "payment_method";