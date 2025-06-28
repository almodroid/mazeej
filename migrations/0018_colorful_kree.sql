ALTER TABLE "users" ADD COLUMN "is_online" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_seen" timestamp DEFAULT now();