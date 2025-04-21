import { pgTable, text, serial, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

// Settings table for storing application-wide settings
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Site settings table for storing structured settings
export const siteSettings = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  
  // General settings
  generalSettings: jsonb("general_settings"),
  
  // SEO & Meta settings
  seoSettings: jsonb("seo_settings"),
  
  // Analytics settings
  analyticsSettings: jsonb("analytics_settings"),
  
  // Search Console settings
  searchConsoleSettings: jsonb("search_console_settings"),
  
  // Social Media Links
  socialMediaLinks: jsonb("social_media_links"),
  
  // Pixel & API settings
  facebookPixel: text("facebook_pixel"),
  snapchatPixel: text("snapchat_pixel"),
  tiktokPixel: text("tiktok_pixel"),
  pexelsApiKey: text("pexels_api_key"),
  
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  updatedBy: text("updated_by"),
});

// Insert schema for settings
export const insertSettingSchema = createInsertSchema(settings).omit({ 
  id: true, 
  updatedAt: true 
});

// Insert schema for site settings
export const insertSiteSettingsSchema = createInsertSchema(siteSettings).omit({ 
  id: true, 
  updatedAt: true 
});

// Types
export type Setting = typeof settings.$inferSelect;
export type InsertSetting = typeof settings.$inferInsert;

export type SiteSetting = typeof siteSettings.$inferSelect;
export type InsertSiteSetting = typeof siteSettings.$inferInsert;
