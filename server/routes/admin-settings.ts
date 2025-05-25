import { Router } from "express";
import { db } from "../db";
import { siteSettings, settings } from "@shared/schema";
import { eq } from "drizzle-orm";
import { json } from "express";
import { isAuthenticated, isAdmin } from "./auth";

const router = Router();

// Use JSON middleware
router.use(json());

// Get all site settings
router.get("/", isAuthenticated, isAdmin, async (req, res) => {
  try {
    // Get the first record (we only have one record for site settings)
    const siteSettingsData = await db.select().from(siteSettings).limit(1);
    
    // Also get individual settings from the settings table
    const individualSettings = await db.select().from(settings);
    
    // Convert individual settings to a map for easy access
    const settingsMap: Record<string, string> = {};
    individualSettings.forEach(setting => {
      if (setting.key && setting.value !== null) {
        settingsMap[setting.key] = setting.value;
      }
    });
    
    console.log('Individual settings:', settingsMap);
    
    if (siteSettingsData.length === 0) {
      // If no settings exist yet, return empty defaults
      return res.json({
        generalSettings: {
          platformName: "Mazeej Platform",
          platformFee: 5
        },
        seoSettings: {},
        analyticsSettings: {},
        searchConsoleSettings: {},
        socialMediaLinks: [],
        facebookPixel: "",
        snapchatPixel: "",
        tiktokPixel: "",
        pexelsApiKey: ""
      });
    }
    
    // Parse JSON fields with safety checks
    try {
      console.log('Raw settings from DB:', siteSettingsData[0]);
      
      // Helper function to safely get JSON data
      const safelyGetJSON = (data: any, defaultValue: any) => {
        if (!data) return defaultValue;
        
        // If it's already an object, use it directly
        if (typeof data === 'object') {
          return data;
        }
        
        // If it's a string, try to parse it
        if (typeof data === 'string') {
          try {
            return JSON.parse(data);
          } catch (err) {
            console.error('Error parsing JSON:', err);
            return defaultValue;
          }
        }
        
        console.log('Warning: Unexpected data type:', typeof data);
        return defaultValue;
      };
      
      // Get the JSON fields from site_settings
      const parsedGeneralSettings = safelyGetJSON(siteSettingsData[0].generalSettings, { 
        platformName: "Mazeej Platform", 
        platformFee: 5 
      });
      
      // Override with individual settings if they exist
      if (settingsMap['platformName']) {
        parsedGeneralSettings.platformName = settingsMap['platformName'];
      }
      
      if (settingsMap['platformFee']) {
        // Convert to number if it's a string
        parsedGeneralSettings.platformFee = Number(settingsMap['platformFee']) || parsedGeneralSettings.platformFee;
      }
      
      const result = {
        ...siteSettingsData[0],
        generalSettings: parsedGeneralSettings,
        seoSettings: safelyGetJSON(siteSettingsData[0].seoSettings, {}),
        analyticsSettings: safelyGetJSON(siteSettingsData[0].analyticsSettings, {}),
        searchConsoleSettings: safelyGetJSON(siteSettingsData[0].searchConsoleSettings, {}),
        socialMediaLinks: safelyGetJSON(siteSettingsData[0].socialMediaLinks, [])
      };
      
      console.log('Processed settings:', result);
      
      return res.json(result);
    } catch (error) {
      console.error("Error fetching settings:", error);
      return res.status(500).json({ error: "Failed to fetch settings" });
    }
  } catch (error) {
    console.error("Error fetching settings:", error);
    return res.status(500).json({ error: "Failed to fetch settings" });
  }
});

// Save site settings
router.post("/", isAuthenticated, isAdmin, async (req, res) => {
  try {
    console.log('Received settings payload:', JSON.stringify(req.body, null, 2));
    
    // Handle case where body might be wrapped in a 'body' property (from apiRequest)
    const data = req.body.body ? JSON.parse(req.body.body) : req.body;
    
    console.log('Parsed data:', JSON.stringify(data, null, 2));
    
    const {
      generalSettings,
      seoSettings,
      analyticsSettings,
      searchConsoleSettings,
      socialMediaLinks,
      facebookPixel,
      snapchatPixel,
      tiktokPixel,
      pexelsApiKey
    } = data;
    
    // Make sure we have valid objects for all settings
    const validGeneralSettings = generalSettings || { platformName: "Mazeej Platform", platformFee: 5 };
    const validSeoSettings = seoSettings || {};
    const validAnalyticsSettings = analyticsSettings || {};
    const validSearchConsoleSettings = searchConsoleSettings || {};
    const validSocialMediaLinks = socialMediaLinks || [];

    // Check if we already have settings
    const existingSettings = await db.select({ id: siteSettings.id }).from(siteSettings).limit(1);
    
    if (existingSettings.length === 0) {
      // Insert new settings if none exist
      await db.insert(siteSettings).values({
        generalSettings: JSON.stringify(validGeneralSettings),
        seoSettings: JSON.stringify(validSeoSettings),
        analyticsSettings: JSON.stringify(validAnalyticsSettings),
        searchConsoleSettings: JSON.stringify(validSearchConsoleSettings),
        socialMediaLinks: JSON.stringify(validSocialMediaLinks),
        facebookPixel: facebookPixel || "",
        snapchatPixel: snapchatPixel || "",
        tiktokPixel: tiktokPixel || "",
        pexelsApiKey: pexelsApiKey || "",
        updatedBy: req.user?.username || "admin", // Assuming req.user is set by auth middleware
        updatedAt: new Date()
      });
      
      // Also save individual settings to the settings table
      // Platform name
      await db.insert(settings).values({
        key: "platformName",
        value: validGeneralSettings.platformName,
        updatedAt: new Date()
      }).onConflictDoUpdate({
        target: settings.key,
        set: { value: validGeneralSettings.platformName, updatedAt: new Date() }
      });
      
      // Platform fee
      await db.insert(settings).values({
        key: "platformFee",
        value: validGeneralSettings.platformFee.toString(),
        updatedAt: new Date()
      }).onConflictDoUpdate({
        target: settings.key,
        set: { value: validGeneralSettings.platformFee.toString(), updatedAt: new Date() }
      });
    } else {
      // Update existing settings
      await db.update(siteSettings)
        .set({
          generalSettings: JSON.stringify(validGeneralSettings),
          seoSettings: JSON.stringify(validSeoSettings),
          analyticsSettings: JSON.stringify(validAnalyticsSettings),
          searchConsoleSettings: JSON.stringify(validSearchConsoleSettings),
          socialMediaLinks: JSON.stringify(validSocialMediaLinks),
          facebookPixel: facebookPixel || "",
          snapchatPixel: snapchatPixel || "",
          tiktokPixel: tiktokPixel || "",
          pexelsApiKey: pexelsApiKey || "",
          updatedBy: req.user?.username || "admin",
          updatedAt: new Date()
        })
        .where(eq(siteSettings.id, existingSettings[0].id));
        
      // Also update individual settings in the settings table
      // Platform name
      await db.insert(settings).values({
        key: "platformName",
        value: validGeneralSettings.platformName,
        updatedAt: new Date()
      }).onConflictDoUpdate({
        target: settings.key,
        set: { value: validGeneralSettings.platformName, updatedAt: new Date() }
      });
      
      // Platform fee
      await db.insert(settings).values({
        key: "platformFee",
        value: validGeneralSettings.platformFee.toString(),
        updatedAt: new Date()
      }).onConflictDoUpdate({
        target: settings.key,
        set: { value: validGeneralSettings.platformFee.toString(), updatedAt: new Date() }
      });
    }
    
    console.log('Settings saved successfully');
    return res.json({ success: true, message: "Settings saved successfully" });
  } catch (error) {
    console.error("Error saving settings:", error);
    return res.status(500).json({ error: "Failed to save settings" });
  }
});

export default router;
