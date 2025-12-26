// API endpoint definitions for the Tasks module.

export const taskEndpoints = {
  list: { method: 'GET', path: '/api/tasks', handler: 'list' },
  create: { method: 'POST', path: '/api/tasks', handler: 'create' },
  getById: { method: 'GET', path: '/api/tasks/:id', handler: 'getById' },
  update: { method: 'PATCH', path: '/api/tasks/:id', handler: 'update' },
  delete: { method: 'DELETE', path: '/api/tasks/:id', handler: 'delete' },
  duplicate: { method: 'POST', path: '/api/tasks/:id/duplicate', handler: 'duplicate' },
  export: { method: 'POST', path: '/api/tasks/export', handler: 'export' },
  import: { method: 'POST', path: '/api/tasks/import', handler: 'import' },
};

