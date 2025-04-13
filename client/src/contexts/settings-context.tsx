import { createContext, useState, useContext, useEffect, ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useTranslation } from "react-i18next";

// Types
interface UserSettings {
  theme: "light" | "dark" | "system";
  timezone: string;
  notifications: {
    emailNotifications: boolean;
    projectUpdates: boolean;
    newMessages: boolean;
    marketingEmails: boolean;
  };
}

interface SettingsContextType {
  settings: UserSettings;
  isLoading: boolean;
  updateTheme: (theme: "light" | "dark" | "system") => Promise<void>;
  updateTimezone: (timezone: string) => Promise<void>;
  updateNotificationPreference: (key: keyof UserSettings["notifications"], value: boolean) => Promise<void>;
  saveSettings: (settings: Partial<UserSettings>) => Promise<void>;
}

const defaultSettings: UserSettings = {
  theme: "system",
  timezone: "UTC",
  notifications: {
    emailNotifications: true,
    projectUpdates: true,
    newMessages: true,
    marketingEmails: false
  }
};

// Create context
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user settings on mount and when user changes
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const response = await apiRequest("GET", "/api/users/settings");
        const data = await response.json();
        
        // Merge with default settings to ensure all fields exist
        setSettings({
          ...defaultSettings,
          ...data
        });
      } catch (error) {
        console.error("Failed to fetch user settings:", error);
        // Use default settings if fetch fails
        setSettings(defaultSettings);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [user]);

  // Apply theme when it changes
  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove previous classes
    root.classList.remove("light", "dark");
    
    // Apply the theme
    if (settings.theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(settings.theme);
    }
    
    // Save theme to localStorage for persistence
    localStorage.setItem("theme", settings.theme);
  }, [settings.theme]);

  // Handler to update theme
  const updateTheme = async (theme: "light" | "dark" | "system") => {
    try {
      await saveSettings({ theme });
    } catch (error) {
      console.error("Failed to update theme:", error);
      toast({
        title: t("common.error"),
        description: t("settings.updateFailed"),
        variant: "destructive",
      });
    }
  };

  // Handler to update timezone
  const updateTimezone = async (timezone: string) => {
    try {
      await saveSettings({ timezone });
    } catch (error) {
      console.error("Failed to update timezone:", error);
      toast({
        title: t("common.error"),
        description: t("settings.updateFailed"),
        variant: "destructive",
      });
    }
  };

  // Handler to update a notification preference
  const updateNotificationPreference = async (key: keyof UserSettings["notifications"], value: boolean) => {
    try {
      const newNotifications = {
        ...settings.notifications,
        [key]: value
      };
      
      await saveSettings({ 
        notifications: newNotifications 
      });
    } catch (error) {
      console.error(`Failed to update ${key}:`, error);
      toast({
        title: t("common.error"),
        description: t("settings.updateFailed"),
        variant: "destructive",
      });
    }
  };

  // Save settings to the server and update local state
  const saveSettings = async (newSettings: Partial<UserSettings>) => {
    if (!user) return;
    
    try {
      // Update local state immediately for responsiveness
      const updatedSettings = {
        ...settings,
        ...newSettings
      };
      setSettings(updatedSettings);
      
      // Save to the server
      await apiRequest("PUT", "/api/users/settings", newSettings);
      
      toast({
        title: t("settings.updateSuccess"),
        variant: "default",
      });
    } catch (error) {
      console.error("Failed to save settings:", error);
      
      // Revert to previous settings on error
      toast({
        title: t("common.error"),
        description: t("settings.updateFailed"),
        variant: "destructive",
      });
      
      throw error;
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        isLoading,
        updateTheme,
        updateTimezone,
        updateNotificationPreference,
        saveSettings
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
} 