// API endpoint definitions for the Projects module.

export const projectEndpoints = {
  list: { method: 'GET', path: '/api/projects', handler: 'list' },
  create: { method: 'POST', path: '/api/projects', handler: 'create' },
  getById: { method: 'GET', path: '/api/projects/:id', handler: 'getById' },
  update: { method: 'PATCH', path: '/api/projects/:id', handler: 'update' },
  delete: { method: 'DELETE', path: '/api/projects/:id', handler: 'delete' },
  duplicate: { method: 'POST', path: '/api/projects/:id/duplicate', handler: 'duplicate' },
  export: { method: 'POST', path: '/api/projects/export', handler: 'export' },
  import: { method: 'POST', path: '/api/projects/import', handler: 'import' },
};

