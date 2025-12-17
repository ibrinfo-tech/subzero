// API endpoint definitions for the students module
export const studentEndpoints = {
  list: {
    method: 'GET',
    path: '/api/students',
    handler: 'list',
  },
  create: {
    method: 'POST',
    path: '/api/students',
    handler: 'create',
  },
  getById: {
    method: 'GET',
    path: '/api/students/:id',
    handler: 'getById',
  },
  update: {
    method: 'PATCH',
    path: '/api/students/:id',
    handler: 'update',
  },
  delete: {
    method: 'DELETE',
    path: '/api/students/:id',
    handler: 'delete',
  },
  duplicate: {
    method: 'POST',
    path: '/api/students/:id/duplicate',
    handler: 'duplicate',
  },
};


