/**
 * API Configuration for Advanced CRUD Module
 * 
 * This configuration is used by the backend service.
 * Update this file when the backend URL or credentials change.
 */

export const API_CONFIG = {
  // Backend API base URL
  baseUrl: 'https://linkedin-automation-supabase.ibrcloud.com/rest/v1',
  
  // API endpoint path
  endpoint: '/tasks',
  
  // API authentication
  apiKey: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1MTQ1MDc2MCwiZXhwIjo0OTA3MTI0MzYwLCJyb2xlIjoiYW5vbiJ9.saGgJBxx1p1HYzebdPyKm42WQnku-MI1hJYeZdk5yY0',
  
  // Full API URL
  get fullUrl() {
    return `${this.baseUrl}${this.endpoint}`;
  },
  
  // Headers for API requests
  get headers() {
    return {
      'apikey': this.apiKey,
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    };
  },
} as const;

