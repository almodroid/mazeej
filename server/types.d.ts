// Type definitions for Express session and authentication

import { User } from '../shared/schema';

declare global {
  namespace Express {
    interface Request {
      isAuthenticated(): boolean;
      user?: User;
      session: any;
      logout(callback: (err: Error) => void): void;
    }
  }
}

// This file is a module
export {};
