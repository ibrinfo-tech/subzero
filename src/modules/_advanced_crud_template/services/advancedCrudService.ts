/**
 * Advanced CRUD Service
 * 
 * This service handles all backend API calls for the Advanced CRUD module.
 * View developers should NOT modify this file - they should use the hooks/utilities
 * provided in the main route component.
 * 
 * This service fetches data from the external backend API.
 */

import { API_CONFIG } from '../config/api.config';
import type { AdvancedCrudRecord, CreateAdvancedCrudInput, UpdateAdvancedCrudInput } from '../types';

export interface FetchOptions {
  search?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

export interface FetchResponse {
  data: AdvancedCrudRecord[];
  success: boolean;
  error?: string;
}

/**
 * Fetch all records from the backend API
 */
export async function fetchRecords(options: FetchOptions = {}): Promise<FetchResponse> {
  try {
    const params = new URLSearchParams();
    
    // Add select parameter to get all fields
    params.set('select', '*');
    
    // Add search filter if provided
    if (options.search) {
      params.set('name', `ilike.%${options.search}%`);
    }
    
    // Add status filter if provided
    if (options.status && options.status !== 'all') {
      params.set('status', `eq.${options.status}`);
    }
    
    // Add pagination if provided
    if (options.limit) {
      params.set('limit', options.limit.toString());
    }
    if (options.offset) {
      params.set('offset', options.offset.toString());
    }
    
    const url = `${API_CONFIG.fullUrl}?${params.toString()}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: API_CONFIG.headers,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    // Map the API response to our internal format
    const records: AdvancedCrudRecord[] = Array.isArray(data) ? data.map(mapApiRecordToRecord) : [];
    
    return {
      data: records,
      success: true,
    };
  } catch (error) {
    console.error('Error fetching records:', error);
    return {
      data: [],
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch records',
    };
  }
}

/**
 * Fetch a single record by ID
 */
export async function fetchRecordById(id: string): Promise<FetchResponse> {
  try {
    const params = new URLSearchParams();
    params.set('select', '*');
    params.set('id', `eq.${id}`);
    
    const url = `${API_CONFIG.fullUrl}?${params.toString()}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: API_CONFIG.headers,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    const records: AdvancedCrudRecord[] = Array.isArray(data) ? data.map(mapApiRecordToRecord) : [];
    
    return {
      data: records.length > 0 ? [records[0]] : [],
      success: true,
    };
  } catch (error) {
    console.error('Error fetching record:', error);
    return {
      data: [],
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch record',
    };
  }
}

/**
 * Create a new record
 */
export async function createRecord(input: CreateAdvancedCrudInput): Promise<FetchResponse> {
  try {
    // Map our input to API format
    const apiData = mapInputToApiFormat(input);
    
    const response = await fetch(API_CONFIG.fullUrl, {
      method: 'POST',
      headers: API_CONFIG.headers,
      body: JSON.stringify(apiData),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    const records: AdvancedCrudRecord[] = Array.isArray(data) ? data.map(mapApiRecordToRecord) : [];
    
    return {
      data: records,
      success: true,
    };
  } catch (error) {
    console.error('Error creating record:', error);
    return {
      data: [],
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create record',
    };
  }
}

/**
 * Update an existing record
 */
export async function updateRecord(id: string, input: UpdateAdvancedCrudInput): Promise<FetchResponse> {
  try {
    // Map our input to API format
    const apiData = mapInputToApiFormat(input);
    
    const params = new URLSearchParams();
    params.set('id', `eq.${id}`);
    
    const url = `${API_CONFIG.fullUrl}?${params.toString()}`;
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers: API_CONFIG.headers,
      body: JSON.stringify(apiData),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    const records: AdvancedCrudRecord[] = Array.isArray(data) ? data.map(mapApiRecordToRecord) : [];
    
    return {
      data: records,
      success: true,
    };
  } catch (error) {
    console.error('Error updating record:', error);
    return {
      data: [],
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update record',
    };
  }
}

/**
 * Delete a record
 */
export async function deleteRecord(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const params = new URLSearchParams();
    params.set('id', `eq.${id}`);
    
    const url = `${API_CONFIG.fullUrl}?${params.toString()}`;
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: API_CONFIG.headers,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }
    
    return {
      success: true,
    };
  } catch (error) {
    console.error('Error deleting record:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete record',
    };
  }
}

/**
 * Map API response to our internal record format
 * Adjust this based on your actual API response structure
 */
function mapApiRecordToRecord(apiRecord: any): AdvancedCrudRecord {
  return {
    id: apiRecord.id || apiRecord.task_id || String(apiRecord.id),
    tenantId: apiRecord.tenant_id || apiRecord.tenantId || '',
    name: apiRecord.name || apiRecord.title || apiRecord.task_name || '',
    description: apiRecord.description || null,
    status: apiRecord.status || 'active',
    createdAt: apiRecord.created_at || apiRecord.createdAt || new Date().toISOString(),
    updatedAt: apiRecord.updated_at || apiRecord.updatedAt || new Date().toISOString(),
  };
}

/**
 * Map our input format to API format
 * Adjust this based on your actual API requirements
 */
function mapInputToApiFormat(input: CreateAdvancedCrudInput | UpdateAdvancedCrudInput): any {
  return {
    name: input.name,
    description: input.description,
    status: input.status || 'active',
  };
}

