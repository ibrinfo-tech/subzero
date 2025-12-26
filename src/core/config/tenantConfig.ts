/**
 * Tenant Configuration
 * Controls whether multi-tenancy is enabled in the application
 * 
 * Set MULTI_TENANT_ENABLED=true in .env.local to enable multi-tenancy
 * Set MULTI_TENANT_ENABLED=false (or omit) to disable multi-tenancy
 * 
 * When disabled:
 * - tenants table will NOT be created
 * - tenantId columns will NOT be created in any tables
 * - All tenant-related logic will be skipped
 */

// Load environment variable at module load time (for schema generation)
export const MULTI_TENANT_ENABLED = process.env.MULTI_TENANT_ENABLED === 'true';

/**
 * Check if multi-tenancy is enabled
 * Use this function at runtime to check the configuration
 */
export function isMultiTenantEnabled(): boolean {
  return MULTI_TENANT_ENABLED;
}

