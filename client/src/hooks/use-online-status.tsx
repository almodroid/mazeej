import { useEffect, useState } from 'react';
import { useAuth } from './use-auth';
import { apiRequest } from '@/lib/api';

export function useOnlineStatus() {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(false);

  // Update online status when user changes
  useEffect(() => {
    if (!user) {
      setIsOnline(false);
      return;
    }

    // Set user as online when they log in
    const setOnline = async () => {
      try {
        await apiRequest('POST', '/api/users/online-status', { isOnline: true });
        setIsOnline(true);
      } catch (error) {
        console.error('Failed to set online status:', error);
      }
    };

    setOnline();

    // Set user as offline when they leave the page
    const handleBeforeUnload = async () => {
      try {
        await apiRequest('POST', '/api/users/online-status', { isOnline: false });
      } catch (error) {
        console.error('Failed to set offline status:', error);
      }
    };

    // Set user as offline when they become inactive
    const handleVisibilityChange = async () => {
      if (document.hidden) {
        try {
          await apiRequest('POST', '/api/users/online-status', { isOnline: false });
          setIsOnline(false);
        } catch (error) {
          console.error('Failed to set offline status:', error);
        }
      } else {
        try {
          await apiRequest('POST', '/api/users/online-status', { isOnline: true });
          setIsOnline(true);
        } catch (error) {
          console.error('Failed to set online status:', error);
        }
      }
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // Set offline when component unmounts
      if (user) {
        apiRequest('POST', '/api/users/online-status', { isOnline: false }).catch(console.error);
      }
    };
  }, [user]);

  return { isOnline };
}

export function useUserOnlineStatus(userId: number) {
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const fetchOnlineStatus = async () => {
      try {
        const response = await apiRequest('GET', `/api/users/${userId}/online-status`);
        if (response.ok) {
          const data = await response.json();
          setIsOnline(data.isOnline);
          setLastSeen(data.lastSeen ? new Date(data.lastSeen) : null);
        }
      } catch (error) {
        console.error('Failed to fetch online status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOnlineStatus();

    // Poll for online status updates every 30 seconds
    const interval = setInterval(fetchOnlineStatus, 30000);

    return () => clearInterval(interval);
  }, [userId]);

  return { isOnline, lastSeen, isLoading };
} 