import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { apiRequest } from "./queryClient"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function check_secrets(secretKeys: string[]): Promise<boolean> {
  try {
    const response = await apiRequest('POST', '/api/check-secrets', { secretKeys });
    const data = await response.json();
    return data.hasSecrets;
  } catch (error) {
    console.error('Error checking secrets:', error);
    return false;
  }
}
