CREATE TABLE "site_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"seo_settings" jsonb,
	"analytics_settings" jsonb,
	"search_console_settings" jsonb,
	"social_media_links" jsonb,
	"facebook_pixel" text,
	"snapchat_pixel" text,
	"tiktok_pixel" text,
	"pexels_api_key" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" text
);
--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "key" text NOT NULL;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "value" text;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "settings" DROP COLUMN "facebook_pixel";--> statement-breakpoint
ALTER TABLE "settings" DROP COLUMN "snapchat_pixel";--> statement-breakpoint
ALTER TABLE "settings" DROP COLUMN "tiktok_pixel";--> statement-breakpoint
ALTER TABLE "settings" DROP COLUMN "pexels_api_key";--> statement-breakpoint
ALTER TABLE "settings" DROP COLUMN "platform_name";--> statement-breakpoint
ALTER TABLE "settings" DROP COLUMN "platform_fee";--> statement-breakpoint
ALTER TABLE "settings" DROP COLUMN "seo_meta";--> statement-breakpoint
ALTER TABLE "settings" DROP COLUMN "google_analytics";--> statement-breakpoint
ALTER TABLE "settings" DROP COLUMN "social_media_links";--> statement-breakpoint
ALTER TABLE "settings" ADD CONSTRAINT "settings_key_unique" UNIQUE("key");