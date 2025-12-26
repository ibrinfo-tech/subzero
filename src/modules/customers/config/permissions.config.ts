// Permission definitions for the Customers module

export const CUSTOMER_PERMISSIONS = [
  'customers:read',
  'customers:create',
  'customers:update',
  'customers:delete',
  'customers:assign',
  'customers:import',
  'customers:export',
  'customers:duplicate',
  'customers:manage_labels',
  'customers:*', // Wildcard permission for full access
] as const;

export type CustomerPermission = (typeof CUSTOMER_PERMISSIONS)[number];

