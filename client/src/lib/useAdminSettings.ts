import { useState, useEffect } from 'react';
import { apiRequest } from './queryClient';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

// Types for our settings
export interface GeneralSettings {
  platformName: string;
  platformFee: number;
}
export interface SeoMetaSettings {
  title: string;
  description: string;
  keywords: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  twitterCard: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
}

export interface GoogleAnalyticsSettings {
  trackingId: string;
  enableTracking: boolean;
  anonymizeIp: boolean;
}

export interface SearchConsoleSettings {
  verificationToken: string;
  sitemapUrl: string;
}

export interface SocialMediaLink {
  id: string;
  platform: string;
  url: string;
}

export interface AdminSettings {
  generalSettings: GeneralSettings;
  seoSettings: SeoMetaSettings;
  analyticsSettings: GoogleAnalyticsSettings;
  searchConsoleSettings: SearchConsoleSettings;
  socialMediaLinks: SocialMediaLink[];
  facebookPixel: string;
  snapchatPixel: string;
  tiktokPixel: string;
  pexelsApiKey: string;
}

export const useAdminSettings = () => {
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();

  // Fetch settings from API
  const fetchSettings = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiRequest('GET', '/api/admin/settings');
      const data = await response.json();
      setSettings(data);
      
      // Also store pixel/API values in localStorage for runtime use
      if (data.facebookPixel) localStorage.setItem('facebookPixel', data.facebookPixel);
      if (data.snapchatPixel) localStorage.setItem('snapchatPixel', data.snapchatPixel);
      if (data.tiktokPixel) localStorage.setItem('tiktokPixel', data.tiktokPixel);
      if (data.pexelsApiKey) localStorage.setItem('pexelsApiKey', data.pexelsApiKey);
      
    } catch (err) {
      console.error('Error fetching admin settings:', err);
      setError('Failed to load settings');
      toast({
        title: t('common.error'),
        description: t('admin.settingsLoadError', { defaultValue: 'Failed to load settings' }),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Save settings to API
  const saveSettings = async (newSettings: AdminSettings) => {
    try {
      // Save to localStorage for immediate use
      localStorage.setItem('facebookPixel', newSettings.facebookPixel || '');
      localStorage.setItem('snapchatPixel', newSettings.snapchatPixel || '');
      localStorage.setItem('tiktokPixel', newSettings.tiktokPixel || '');
      localStorage.setItem('pexelsApiKey', newSettings.pexelsApiKey || '');
      
      // Save to backend
      await apiRequest('POST', '/api/admin/settings', { 
        body: JSON.stringify(newSettings)
      });
      
      // Update local state
      setSettings(newSettings);
      
      toast({
        title: t('common.success'),
        description: t('admin.settingsSaved', { defaultValue: 'Settings saved successfully' }),
        variant: 'default',
      });
      
      return true;
    } catch (err) {
      console.error('Error saving admin settings:', err);
      toast({
        title: t('common.error'),
        description: t('admin.settingsSaveError', { defaultValue: 'Failed to save settings' }),
        variant: 'destructive',
      });
      return false;
    }
  };

  // Load settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    isLoading,
    error,
    fetchSettings,
    saveSettings,
  };
};
