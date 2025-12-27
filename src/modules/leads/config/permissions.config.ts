// Permission definitions for the Leads module

export const LEAD_PERMISSIONS = [
  'leads:read',
  'leads:create',
  'leads:update',
  'leads:delete',
  'leads:assign',
  'leads:import',
  'leads:export',
  'leads:duplicate',
  'leads:manage_labels',
  'leads:*', // Wildcard permission for full access
] as const;

export type LeadPermission = (typeof LEAD_PERMISSIONS)[number];



