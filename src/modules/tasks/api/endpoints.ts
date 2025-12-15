// API endpoint definitions for the tasks module
export const taskEndpoints = {
  list: {
    method: 'GET',
    path: '/api/tasks',
    handler: 'list',
  },
  create: {
    method: 'POST',
    path: '/api/tasks',
    handler: 'create',
  },
  getById: {
    method: 'GET',
    path: '/api/tasks/:id',
    handler: 'getById',
  },
  update: {
    method: 'PATCH',
    path: '/api/tasks/:id',
    handler: 'update',
  },
  delete: {
    method: 'DELETE',
    path: '/api/tasks/:id',
    handler: 'delete',
  },
};


