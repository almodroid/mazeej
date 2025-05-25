import { create } from 'zustand';
import { apiRequest } from '@/lib/queryClient';

interface GlobalSettings {
  platformFee: number;
  platformName: string;
  isLoading: boolean;
  error: string | null;
  fetchSettings: () => Promise<void>;
}

export const useGlobalSettings = create<GlobalSettings>((set) => ({
  platformFee: 5, // Default value
  platformName: "Mazeej Platform", // Default value
  isLoading: false,
  error: null,
  fetchSettings: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await apiRequest('GET', '/api/admin/settings');
      const data = await response.json();
      
      // Extract the relevant settings
      const { generalSettings } = data;
      
      set({
        platformFee: generalSettings?.platformFee || 5,
        platformName: generalSettings?.platformName || "Mazeej Platform",
        isLoading: false
      });
    } catch (error) {
      console.error('Error fetching global settings:', error);
      set({ 
        error: 'Failed to load settings', 
        isLoading: false 
      });
    }
  }
})); 