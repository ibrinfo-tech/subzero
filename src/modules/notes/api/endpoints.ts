// API endpoint definitions for notes module
export const notesEndpoints = {
  list: {
    method: 'GET',
    path: '/api/notes',
    handler: 'list',
  },
  create: {
    method: 'POST',
    path: '/api/notes',
    handler: 'create',
  },
  getById: {
    method: 'GET',
    path: '/api/notes/:id',
    handler: 'getById',
  },
  update: {
    method: 'PATCH',
    path: '/api/notes/:id',
    handler: 'update',
  },
  delete: {
    method: 'DELETE',
    path: '/api/notes/:id',
    handler: 'delete',
  },
};
