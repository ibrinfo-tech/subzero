// API endpoints configuration for the Customers module
// This file is used by the module router to register API routes

export const customerEndpoints = {
  list: {
    method: 'GET',
    path: '',
    handler: 'list',
    requiresAuth: true,
  },
  create: {
    method: 'POST',
    path: '',
    handler: 'create',
    requiresAuth: true,
  },
  getById: {
    method: 'GET',
    path: '/:id',
    handler: 'getById',
    requiresAuth: true,
  },
  update: {
    method: 'PATCH',
    path: '/:id',
    handler: 'update',
    requiresAuth: true,
  },
  delete: {
    method: 'DELETE',
    path: '/:id',
    handler: 'delete',
    requiresAuth: true,
  },
  duplicate: {
    method: 'POST',
    path: '/:id/duplicate',
    handler: 'duplicate',
    requiresAuth: true,
  },
} as const;

