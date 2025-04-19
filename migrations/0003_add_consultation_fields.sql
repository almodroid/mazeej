-- Create project_type enum if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_type') THEN
        CREATE TYPE "public"."project_type" AS ENUM('standard', 'consultation', 'mentoring');
    END IF;
END $$;

-- Add new columns to projects table
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "project_type" "project_type" DEFAULT 'standard';
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "hourly_rate" integer;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "estimated_hours" integer;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "consultation_date" timestamp;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "consultation_start_time" text;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "consultation_end_time" text;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "time_zone" text;

-- Update existing projects to have standard project type
UPDATE "projects" SET "project_type" = 'standard' WHERE "project_type" IS NULL; 