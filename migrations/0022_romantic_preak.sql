CREATE TABLE "testimonials" (
	"id" serial PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"content_ar" text,
	"author_name" text NOT NULL,
	"author_name_ar" text,
	"author_title" text NOT NULL,
	"author_title_ar" text,
	"author_avatar" text,
	"rating" integer DEFAULT 5 NOT NULL,
	"is_active" boolean DEFAULT true,
	"order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
