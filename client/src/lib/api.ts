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

// Initialize or get mock transactions from localStorage
const getMockTransactions = (userId?: string): Transaction[] => {
  const storageKey = userId ? `${MOCK_TRANSACTIONS_KEY}_${userId}` : MOCK_TRANSACTIONS_KEY;
  const storedTransactions = localStorage.getItem(storageKey);
  
  if (storedTransactions) {
    return JSON.parse(storedTransactions);
  }
  
  // Some sample transactions
  const defaultTransactions: Transaction[] = [
    {
      id: 1,
      amount: 750,
      date: "2023-06-15",
      status: "completed",
      projectTitle: "E-commerce Website Development",
      partyName: "Mohammed Ali"
    },
    {
      id: 2,
      amount: 500,
      date: "2023-06-01",
      status: "completed",
      projectTitle: "Mobile App UI Design",
      partyName: "Fatima Hassan"
    },
    {
      id: 3,
      amount: 1200,
      date: "2023-05-15",
      status: "completed",
      projectTitle: "CRM System Integration",
      partyName: "Khalid Ibrahim"
    },
  ];
  
  localStorage.setItem(storageKey, JSON.stringify(defaultTransactions));
  return defaultTransactions;
};

// Mock API handlers
export const mockApiHandlers = {
  // GET /api/users/settings
  getUserSettings: async (): Promise<Response> => {
    const settings = getMockSettings();
    return new Response(JSON.stringify(settings), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });
  },
  
  // PUT /api/users/settings
  updateUserSettings: async (data: Partial<UserSettings>): Promise<Response> => {
    const currentSettings = getMockSettings();
    
    // Deep merge notifications if provided
    const updatedSettings = {
      ...currentSettings,
      ...data,
      notifications: data.notifications 
        ? { ...currentSettings.notifications, ...data.notifications }
        : currentSettings.notifications
    };
    
    saveMockSettings(updatedSettings);
    
    return new Response(JSON.stringify(updatedSettings), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });
  },

  // GET /api/users/payment-methods
  getPaymentMethods: async (): Promise<Response> => {
    const methods = getMockPaymentMethods();
    return new Response(JSON.stringify(methods), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });
  },

  // POST /api/users/payment-methods
  addPaymentMethod: async (data: any): Promise<Response> => {
    const methods = getMockPaymentMethods();
    
    let name = '';
    if (data.type === 'bank_account') {
      name = `${data.bankName} - ${data.accountName}`;
    } else if (data.type === 'paypal') {
      name = `PayPal - ${data.email}`;
    } else {
      name = `Credit Card - ${data.last4 || '****'}`;
    }

    // If it's set as default, unset others
    if (data.isDefault) {
      methods.forEach(method => {
        method.isDefault = false;
      });
    }
    
    const newMethod: PaymentMethod = {
      id: methods.length > 0 ? Math.max(...methods.map(m => m.id)) + 1 : 1,
      type: data.type,
      name,
      isDefault: data.isDefault || methods.length === 0, // First method is default by default
      accountDetails: JSON.stringify(data)
    };
    
    methods.push(newMethod);
    saveMockPaymentMethods(methods);
    
    return new Response(JSON.stringify(newMethod), {
      headers: { 'Content-Type': 'application/json' },
      status: 201
    });
  },

  // DELETE /api/users/payment-methods/{id}
  deletePaymentMethod: async (id: number): Promise<Response> => {
    let methods = getMockPaymentMethods();
    const methodToDelete = methods.find(m => m.id === id);
    
    if (!methodToDelete) {
      return new Response(JSON.stringify({ error: 'Payment method not found' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 404
      });
    }
    
    methods = methods.filter(m => m.id !== id);
    
    // If we deleted the default method, set a new default
    if (methodToDelete.isDefault && methods.length > 0) {
      methods[0].isDefault = true;
    }
    
    saveMockPaymentMethods(methods);
    
    return new Response(null, { status: 204 });
  },

  // GET /api/users/transactions
  getTransactions: async (): Promise<Response> => {
    const transactions = getMockTransactions();
    return new Response(JSON.stringify(transactions), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });
  }
};

// Intercept fetch calls to mock endpoints
const originalFetch = window.fetch;
window.fetch = async function(input: RequestInfo | URL, init?: RequestInit) {
  const url = typeof input === 'string' 
    ? input 
    : input instanceof URL 
      ? input.toString() 
      : input.url;
  
  // Handle settings API
  if (url === '/api/users/settings') {
    if (init?.method === 'GET') {
      return mockApiHandlers.getUserSettings();
    } else if (init?.method === 'PUT' && init.body) {
      const data = JSON.parse(init.body.toString());
      return mockApiHandlers.updateUserSettings(data);
    }
  }
  
  // Handle payment methods API
  if (url === '/api/users/payment-methods') {
    if (init?.method === 'GET') {
      return mockApiHandlers.getPaymentMethods();
    } else if (init?.method === 'POST' && init.body) {
      const data = JSON.parse(init.body.toString());
      return mockApiHandlers.addPaymentMethod(data);
    }
  }
  
  // Handle payment method deletion
  if (url.startsWith('/api/users/payment-methods/') && init?.method === 'DELETE') {
    const id = parseInt(url.split('/').pop() || '0', 10);
    return mockApiHandlers.deletePaymentMethod(id);
  }
  
  // Handle transactions API
  if (url === '/api/users/transactions' && (!init || init.method === 'GET')) {
    return mockApiHandlers.getTransactions();
  }
  
  // For all other requests, use the original fetch
  return originalFetch(input, init);
};

export { apiRequest }; 