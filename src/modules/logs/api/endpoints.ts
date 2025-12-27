// API endpoint definitions for the logs module

export const logsEndpoints = {
  list: { method: 'GET', path: '/api/logs', handler: 'list' },
  stats: { method: 'GET', path: '/api/logs/stats', handler: 'stats' },
  export: { method: 'GET', path: '/api/logs/export', handler: 'export' },
  stream: { method: 'GET', path: '/api/logs/stream', handler: 'stream' },
};

