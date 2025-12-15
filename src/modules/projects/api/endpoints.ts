// API endpoint definitions for the projects module
export const projectEndpoints = {
  list: {
    method: 'GET',
    path: '/api/projects',
    handler: 'list',
  },
  create: {
    method: 'POST',
    path: '/api/projects',
    handler: 'create',
  },
  getById: {
    method: 'GET',
    path: '/api/projects/:id',
    handler: 'getById',
  },
  update: {
    method: 'PATCH',
    path: '/api/projects/:id',
    handler: 'update',
  },
  delete: {
    method: 'DELETE',
    path: '/api/projects/:id',
    handler: 'delete',
  },
};


