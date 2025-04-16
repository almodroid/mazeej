-- Add media_url and media_type columns to messages table
ALTER TABLE "messages" ADD COLUMN "media_url" TEXT;
ALTER TABLE "messages" ADD COLUMN "media_type" TEXT; 