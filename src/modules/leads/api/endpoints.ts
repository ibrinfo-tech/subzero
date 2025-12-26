// API endpoints configuration for the Leads module
// This file defines the route handlers for each endpoint

export const LEAD_ENDPOINTS = {
  list: {
    method: 'GET',
    path: '',
    handler: 'list',
  },
  create: {
    method: 'POST',
    path: '',
    handler: 'create',
  },
  getById: {
    method: 'GET',
    path: '/:id',
    handler: 'getById',
  },
  update: {
    method: 'PATCH',
    path: '/:id',
    handler: 'update',
  },
  delete: {
    method: 'DELETE',
    path: '/:id',
    handler: 'delete',
  },
  duplicate: {
    method: 'POST',
    path: '/:id/duplicate',
    handler: 'duplicate',
  },
  import: {
    method: 'POST',
    path: '/import',
    handler: 'import',
  },
  export: {
    method: 'GET',
    path: '/export',
    handler: 'export',
  },
} as const;



