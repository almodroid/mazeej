CREATE TYPE "public"."project_type" AS ENUM('standard', 'consultation', 'mentoring');--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "project_type" "project_type" DEFAULT 'standard';--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "hourly_rate" integer;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "estimated_hours" integer;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "consultation_date" timestamp;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "consultation_start_time" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "consultation_end_time" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "time_zone" text;