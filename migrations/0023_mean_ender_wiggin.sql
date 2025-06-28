CREATE TYPE "public"."exercise_status" AS ENUM('in_progress', 'submitted', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "ai_exercise_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"api_key" text,
	"api_provider" text DEFAULT 'openai' NOT NULL,
	"model_name" text DEFAULT 'gpt-4' NOT NULL,
	"max_tokens" integer DEFAULT 2000 NOT NULL,
	"temperature" numeric DEFAULT '0.7' NOT NULL,
	"system_prompt" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "exercise_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"name_ar" text,
	"description" text,
	"description_ar" text,
	"icon" text,
	"color" text DEFAULT '#3B82F6',
	"is_active" boolean DEFAULT true,
	"order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "exercise_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"freelancer_id" integer NOT NULL,
	"skill_id" integer NOT NULL,
	"exercises_completed" integer DEFAULT 0 NOT NULL,
	"total_score" integer DEFAULT 0 NOT NULL,
	"average_score" integer DEFAULT 0 NOT NULL,
	"current_level" "difficulty_level" DEFAULT 'beginner' NOT NULL,
	"last_exercise_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "exercise_submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"exercise_id" integer NOT NULL,
	"freelancer_id" integer NOT NULL,
	"status" "exercise_status" DEFAULT 'in_progress',
	"submission_text" text,
	"submission_files" json,
	"ai_feedback" text,
	"ai_score" integer,
	"admin_feedback" text,
	"admin_score" integer,
	"started_at" timestamp DEFAULT now(),
	"submitted_at" timestamp,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "exercises" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"title_ar" text,
	"description" text NOT NULL,
	"description_ar" text,
	"category_id" integer NOT NULL,
	"skill_id" integer NOT NULL,
	"difficulty" "difficulty_level" DEFAULT 'beginner' NOT NULL,
	"estimated_hours" integer DEFAULT 2 NOT NULL,
	"budget" integer DEFAULT 50 NOT NULL,
	"requirements" json NOT NULL,
	"requirements_ar" json,
	"deliverables" json NOT NULL,
	"deliverables_ar" json,
	"ai_generated" boolean DEFAULT false,
	"ai_prompt" text,
	"is_active" boolean DEFAULT true,
	"order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "exercise_progress" ADD CONSTRAINT "exercise_progress_freelancer_id_users_id_fk" FOREIGN KEY ("freelancer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_progress" ADD CONSTRAINT "exercise_progress_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_submissions" ADD CONSTRAINT "exercise_submissions_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_submissions" ADD CONSTRAINT "exercise_submissions_freelancer_id_users_id_fk" FOREIGN KEY ("freelancer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_category_id_exercise_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."exercise_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE no action ON UPDATE no action;