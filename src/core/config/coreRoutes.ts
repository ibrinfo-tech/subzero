/**
 * Core Routes Configuration
 * Maps core API routes to module IDs for activity logging
 * 
 * This allows activity logging to work for core routes (like /api/users)
 * without modifying the existing route handlers.
 */

export interface CoreRouteConfig {
  moduleId: string;
  activityLogs?: {
    enabled?: boolean;
    excludeActions?: string[];
  };
}

/**
 * Core routes mapping
 * Maps API path patterns to module configurations
 * Activity logging is enabled by default unless ACTIVITY_LOGS_ENABLE=false
 */
export const coreRoutes: Record<string, CoreRouteConfig> = {
  // User Management
  '/api/users': {
    moduleId: 'users',
    activityLogs: {
      enabled: true,
      excludeActions: ['read', 'list'],
    },
  },
  // Role Management
  '/api/roles': {
    moduleId: 'roles',
    activityLogs: {
      enabled: true,
      excludeActions: ['read', 'list'],
    },
  },
  // Tenant Management
  '/api/tenants': {
    moduleId: 'tenants',
    activityLogs: {
      enabled: true,
      excludeActions: ['read', 'list'],
    },
  },
  // Settings
  '/api/settings': {
    moduleId: 'settings',
    activityLogs: {
      enabled: true,
      excludeActions: ['read'],
    },
  },
  // Auth routes
  '/api/auth/login': {
    moduleId: 'auth',
    activityLogs: {
      enabled: true,
      excludeActions: [],
    },
  },
  '/api/auth/logout': {
    moduleId: 'auth',
    activityLogs: {
      enabled: true,
      excludeActions: [],
    },
  },
  '/api/auth/register': {
    moduleId: 'auth',
    activityLogs: {
      enabled: true,
      excludeActions: [],
    },
  },
  '/api/auth/profile': {
    moduleId: 'auth',
    activityLogs: {
      enabled: true,
      excludeActions: ['read'],
    },
  },
  '/api/auth/change-password': {
    moduleId: 'auth',
    activityLogs: {
      enabled: true,
      excludeActions: [],
    },
  },
  '/api/auth/forgot-password': {
    moduleId: 'auth',
    activityLogs: {
      enabled: true,
      excludeActions: [],
    },
  },
  '/api/auth/reset-password': {
    moduleId: 'auth',
    activityLogs: {
      enabled: true,
      excludeActions: [],
    },
  },
  '/api/auth/verify-email': {
    moduleId: 'auth',
    activityLogs: {
      enabled: true,
      excludeActions: [],
    },
  },
  // Notifications
  '/api/notifications': {
    moduleId: 'notifications',
    activityLogs: {
      enabled: true,
      excludeActions: ['read', 'list'],
    },
  },
  '/api/notifications/mark-all-read': {
    moduleId: 'notifications',
    activityLogs: {
      enabled: true,
      excludeActions: [],
    },
  },
  // Modules
  '/api/modules': {
    moduleId: 'modules',
    activityLogs: {
      enabled: true,
      excludeActions: ['read', 'list'],
    },
  },
  '/api/modules/labels': {
    moduleId: 'modules',
    activityLogs: {
      enabled: true,
      excludeActions: ['read', 'list'],
    },
  },
  '/api/modules/navigation': {
    moduleId: 'modules',
    activityLogs: {
      enabled: true,
      excludeActions: ['read'],
    },
  },
  '/api/modules/routes': {
    moduleId: 'modules',
    activityLogs: {
      enabled: true,
      excludeActions: ['read'],
    },
  },
};

/**
 * Check if a path matches a core route pattern
 * Handles dynamic routes like /api/users/:id
 */
export function matchesCoreRoute(path: string): boolean {
  // Check exact matches
  if (coreRoutes[path]) {
    return true;
  }
  
  // Check pattern matches
  for (const pattern of Object.keys(coreRoutes)) {
    // Convert pattern to regex (handle :id, :userId, etc.)
    const regexPattern = pattern.replace(/:[^/]+/g, '[^/]+');
    const regex = new RegExp(`^${regexPattern}(/.*)?$`);
    if (regex.test(path)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Get core route config for a given path
 */
export function getCoreRouteConfig(path: string): CoreRouteConfig | null {
  // Check exact match first
  if (coreRoutes[path]) {
    return coreRoutes[path];
  }
  
  // Check pattern matches (e.g., /api/users/:id)
  for (const [pattern, config] of Object.entries(coreRoutes)) {
    if (path.startsWith(pattern)) {
      return config;
    }
  }
  
  return null;
}

/**
 * Check if activity logging is enabled for a core route
 */
export function isActivityLoggingEnabled(path: string): boolean {
  const config = getCoreRouteConfig(path);
  return config?.activityLogs?.enabled === true;
}

