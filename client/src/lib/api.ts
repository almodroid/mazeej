import { apiRequest } from "./queryClient";

// Type definitions for mock API
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

interface PaymentMethod {
  id: number;
  type: "credit_card" | "paypal" | "bank_account";
  last4?: string;
  expiryDate?: string;
  isDefault: boolean;
  name: string;
  accountDetails?: string;
}

interface Transaction {
  id: number;
  amount: number;
  date: string;
  status: "completed" | "pending" | "failed";
  projectTitle: string;
  partyName: string;
}

// Mock database keys
const MOCK_SETTINGS_KEY = 'mock_user_settings';
const MOCK_PAYMENT_METHODS_KEY = 'mock_payment_methods';
const MOCK_TRANSACTIONS_KEY = 'mock_transactions';

// Initialize or get mock settings from localStorage
const getMockSettings = (userId?: string): UserSettings => {
  const storageKey = userId ? `${MOCK_SETTINGS_KEY}_${userId}` : MOCK_SETTINGS_KEY;
  const storedSettings = localStorage.getItem(storageKey);
  
  if (storedSettings) {
    return JSON.parse(storedSettings);
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
  
  localStorage.setItem(storageKey, JSON.stringify(defaultSettings));
  return defaultSettings;
};

// Save mock settings to localStorage
const saveMockSettings = (settings: UserSettings, userId?: string): void => {
  const storageKey = userId ? `${MOCK_SETTINGS_KEY}_${userId}` : MOCK_SETTINGS_KEY;
  localStorage.setItem(storageKey, JSON.stringify(settings));
};

// Initialize or get mock payment methods from localStorage
const getMockPaymentMethods = (userId?: string): PaymentMethod[] => {
  const storageKey = userId ? `${MOCK_PAYMENT_METHODS_KEY}_${userId}` : MOCK_PAYMENT_METHODS_KEY;
  const storedMethods = localStorage.getItem(storageKey);
  
  if (storedMethods) {
    return JSON.parse(storedMethods);
  }
  
  // Default/sample data only for freelancers
  const defaultMethods: PaymentMethod[] = [];
  
  localStorage.setItem(storageKey, JSON.stringify(defaultMethods));
  return defaultMethods;
};

// Save mock payment methods to localStorage
const saveMockPaymentMethods = (methods: PaymentMethod[], userId?: string): void => {
  const storageKey = userId ? `${MOCK_PAYMENT_METHODS_KEY}_${userId}` : MOCK_PAYMENT_METHODS_KEY;
  localStorage.setItem(storageKey, JSON.stringify(methods));
};

// Get transactions from the API
const getTransactions = async (): Promise<Transaction[]> => {
  const response = await apiRequest('GET', '/api/transactions');
  
  if (!response.ok) {
    throw new Error('Failed to fetch transactions');
  }
  
  return response.json();
};

export { apiRequest };

// Project and Review API functions
export const projectApi = {
  // Update project status
  updateProjectStatus: async (projectId: number, status: string) => {
    const response = await apiRequest(
      'PATCH', 
      `/api/projects/${projectId}/status`,
      { status }
    );
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || 'Failed to update project status');
    }
    
    return response.json();
  },
  
  // Get project details
  getProject: async (projectId: number) => {
    const response = await apiRequest('GET', `/api/projects/${projectId}`);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || 'Failed to get project details');
    }
    
    return response.json();
  }
};

export const reviewApi = {
  // Submit a review
  submitReview: async (reviewData: {
    projectId: number;
    revieweeId: number;
    rating: number;
    comment: string;
  }) => {
    console.log("API: Submitting review data:", reviewData);
    
    try {
      const response = await apiRequest('POST', '/api/reviews', reviewData);
      console.log("API: Review submission response status:", response.status);
      
      if (!response.ok) {
        let errorMessage = "Failed to submit review";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          console.error("API: Review submission error details:", errorData);
        } catch (parseError) {
          console.error("API: Could not parse error response", parseError);
        }
        throw new Error(errorMessage);
      }
      
      try {
        const result = await response.json();
        console.log("API: Review submission success data:", result);
        return result;
      } catch (parseError) {
        console.error("API: Error parsing success response", parseError);
        return { success: true }; // Return minimal success object if parsing fails
      }
    } catch (error) {
      console.error("API: Review submission request error:", error);
      throw error;
    }
  },
  
  // Get reviews for a project
  getProjectReviews: async (projectId: number) => {
    const response = await apiRequest('GET', `/api/projects/${projectId}/reviews`);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || 'Failed to get project reviews');
    }
    
    return response.json();
  },
  
  // Get reviews given by the current user
  getReviewsGiven: async () => {
    const response = await apiRequest('GET', `/api/users/reviews/given`);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || 'Failed to get reviews given');
    }
    
    return response.json();
  },
  
  // Get reviews received by the current user
  getReviewsReceived: async () => {
    const response = await apiRequest('GET', `/api/users/reviews/received`);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || 'Failed to get reviews received');
    }
    
    return response.json();
  }
};

export const planApi = {
  getPlans: async () => {
    const response = await apiRequest('GET', '/api/plans');
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || 'Failed to fetch plans');
    }
    
    return response.json();
  },
  
  subscribeToPlan: async (planId: number) => {
    const response = await apiRequest('POST', '/api/plans/subscribe', { planId });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || 'Failed to create subscription');
    }
    
    return response.json();
  },
  
  checkPaymentStatus: async (reference: string) => {
    const response = await apiRequest('GET', `/api/plans/payment-status?reference=${reference}`);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || 'Failed to check payment status');
    }
    
    return response.json();
  },
  
  getCurrentPlan: async () => {
    const response = await apiRequest('GET', '/api/plans/user-current-plan');
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || 'Failed to fetch current plan');
    }
    
    return response.json();
  },
  
  assignFreePlan: async (planId: number) => {
    const response = await apiRequest('POST', '/api/plans/assign-free', { planId });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || 'Failed to assign free plan');
    }
    
    return response.json();
  }
};