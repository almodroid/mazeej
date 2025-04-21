CREATE TABLE "settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"facebook_pixel" text,
	"snapchat_pixel" text,
	"tiktok_pixel" text,
	"pexels_api_key" text,
	"platform_name" text,
	"platform_fee" numeric,
	"seo_meta" jsonb,
	"google_analytics" jsonb,
	"social_media_links" jsonb
);
