/**
 * Automatic Activity Logging Middleware
 * 
 * This middleware automatically logs API requests/responses for modules that have
 * activity logging enabled in their module.config.json or core routes config
 * 
 * Usage for modules: Add to module.config.json:
 * {
 *   "activityLogs": {
 *     "enabled": true,
 *     "excludeActions": ["read", "list"] // optional
 *   }
 * }
 * 
 * Usage for core routes: Configure in src/core/config/coreRoutes.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/core/middleware/auth';
import { getUserTenantId } from '@/core/lib/permissions';
import { createLog } from '@/modules/logs/services/logsService';
import { getCoreRouteConfig } from '@/core/config/coreRoutes';

interface LogContext {
  userId: string | null;
  tenantId: string | null;
  moduleId: string;
  method: string;
  path: string;
  action: string;
  resourceId?: string | null;
  resourceType?: string;
  statusCode: number;
  duration: number;
  error?: string;
  requestBody?: any;
  responseBody?: any;
}

/**
 * Determine the action from HTTP method and path
 * Supports custom actions like duplicate, import, export, assign, approve, reject, execute, manage
 */
function determineAction(method: string, path: string, routeParams: Record<string, string>): string {
  // Extract resource ID from params if available
  const resourceId = routeParams.id || routeParams.userId || routeParams.roleId || routeParams.tenantId;
  
  // Check for custom action patterns in the path
  const pathLower = path.toLowerCase();
  
  // Custom action patterns (check these first)
  if (pathLower.includes('/duplicate')) return 'duplicate';
  if (pathLower.includes('/import')) return 'import';
  if (pathLower.includes('/export')) return 'export';
  if (pathLower.includes('/assign')) return 'assign';
  if (pathLower.includes('/approve')) return 'approve';
  if (pathLower.includes('/reject')) return 'reject';
  if (pathLower.includes('/execute')) return 'execute';
  if (pathLower.includes('/manage')) return 'manage';
  
  // Auth-specific actions
  if (pathLower.includes('/login')) return 'login';
  if (pathLower.includes('/logout')) return 'logout';
  if (pathLower.includes('/register')) return 'register';
  if (pathLower.includes('/reset-password')) return 'reset_password';
  if (pathLower.includes('/change-password')) return 'change_password';
  if (pathLower.includes('/verify-email')) return 'verify_email';
  if (pathLower.includes('/forgot-password')) return 'forgot_password';
  
  // Map HTTP methods to standard actions
  switch (method) {
    case 'POST':
      return 'create';
    case 'GET':
      // If there's an ID in the path, it's a getById, otherwise it's a list
      return resourceId ? 'read' : 'list';
    case 'PATCH':
    case 'PUT':
      return 'update';
    case 'DELETE':
      return 'delete';
    default:
      return method.toLowerCase();
  }
}

/**
 * Extract resource type and ID from the request
 */
function extractResourceInfo(
  moduleId: string,
  path: string,
  routeParams: Record<string, string>,
  requestBody?: any
): { resourceType?: string; resourceId?: string } {
  const resourceId = routeParams.id || routeParams.userId || routeParams.roleId || routeParams.tenantId;
  
  // Determine resource type from module or path
  let resourceType = moduleId;
  
  // Try to get resource type from request body if available
  if (requestBody && typeof requestBody === 'object') {
    // Common patterns: resourceType, type, entityType
    resourceType = requestBody.resourceType || requestBody.type || requestBody.entityType || resourceType;
  }
  
  return {
    resourceType,
    resourceId,
  };
}

/**
 * Get request body safely (for logging context)
 */
async function getRequestBodySafely(request: NextRequest): Promise<any> {
  try {
    // Clone the request to avoid consuming the stream
    const clonedRequest = request.clone();
    const body = await clonedRequest.json();
    
    // Sanitize sensitive fields
    const sanitized = { ...body };
    if (sanitized.password) sanitized.password = '[REDACTED]';
    if (sanitized.passwordHash) sanitized.passwordHash = '[REDACTED]';
    if (sanitized.token) sanitized.token = '[REDACTED]';
    if (sanitized.secret) sanitized.secret = '[REDACTED]';
    
    return sanitized;
  } catch {
    return undefined;
  }
}

/**
 * Get response body safely (for logging context)
 */
async function getResponseBodySafely(response: NextResponse): Promise<any> {
  try {
    const clonedResponse = response.clone();
    const body = await clonedResponse.json();
    return body;
  } catch {
    return undefined;
  }
}

/**
 * Create activity log entry
 */
async function createActivityLog(context: LogContext): Promise<void> {
  try {
    const { userId, tenantId, moduleId, method, action, resourceId, statusCode, duration, error, resourceType } = context;
    
    // Determine log level based on status code and action
    let level: 'info' | 'warning' | 'error' | 'debug' | 'success' = 'info';
    if (statusCode >= 500) {
      level = 'error';
    } else if (statusCode >= 400) {
      // 4xx client errors: treat critical ones (409, 422, 429) as errors, others as warnings
      if (statusCode === 409 || statusCode === 422 || statusCode === 429) {
        level = 'error'; // Conflict, Unprocessable Entity, Too Many Requests
      } else {
        level = 'warning'; // Other client errors (400, 401, 403, 404, etc.)
      }
    } else if (statusCode >= 200 && statusCode < 300) {
      level = method === 'DELETE' ? 'warning' : 'success';
    }
    
    // Build message
    const actionVerb = action === 'create' ? 'created' : action === 'update' ? 'updated' : action === 'delete' ? 'deleted' : action === 'read' ? 'viewed' : action;
    const resourceText = resourceId ? `${resourceType || moduleId} (${resourceId})` : resourceType || moduleId;
    const message = `${method} ${action} - ${resourceText}${error ? ` - Error: ${error}` : ''}`;
    
    // Build context object
    const logContext: Record<string, any> = {
      method,
      path: context.path,
      statusCode,
      duration,
    };
    
    if (context.requestBody) {
      logContext.requestBody = context.requestBody;
    }
    
    if (context.responseBody && context.responseBody.error) {
      logContext.error = context.responseBody.error;
    }
    
    await createLog({
      tenantId,
      userId,
      module: moduleId,
      level,
      message,
      action,
      resourceType: resourceType || moduleId,
      resourceId: resourceId || undefined,
      context: logContext,
      statusCode,
      duration,
      errorStack: error,
    });
  } catch (logError) {
    // Don't throw - logging failures shouldn't break the API
    console.error('Failed to create activity log:', logError);
  }
}

/**
 * Activity logging middleware wrapper
 * Wraps API handler execution with automatic logging
 * 
 * Can be used for both module routes and core routes
 */
export async function withActivityLogging(
  request: NextRequest,
  moduleId: string | null,
  moduleConfig: any | null,
  handler: (request: NextRequest, params: { params: Record<string, string> }) => Promise<NextResponse>,
  routeParams: Record<string, string>,
  fullPath: string
): Promise<NextResponse> {
  // Check global environment variable first
  const globalLoggingEnabled = process.env.ACTIVITY_LOGS_ENABLE !== 'false';
  if (!globalLoggingEnabled) {
    // Global logging disabled - execute handler normally
    return handler(request, { params: routeParams });
  }

  // Check if activity logging is enabled
  // DEFAULT: Activity logging is ENABLED by default for all modules unless explicitly disabled
  let activityLogsConfig: any = null;
  let effectiveModuleId = moduleId;
  let isLoggingEnabled = true; // Default to enabled
  
  if (moduleConfig?.activityLogs) {
    // Module-based config - check if explicitly disabled
    activityLogsConfig = moduleConfig.activityLogs;
    // If enabled is explicitly set to false, disable logging
    if (activityLogsConfig.enabled === false) {
      isLoggingEnabled = false;
    }
  } else {
    // Check core routes config
    const coreRouteConfig = getCoreRouteConfig(fullPath);
    if (coreRouteConfig?.activityLogs) {
      activityLogsConfig = coreRouteConfig.activityLogs;
      effectiveModuleId = coreRouteConfig.moduleId;
      // If enabled is explicitly set to false, disable logging
      if (activityLogsConfig.enabled === false) {
        isLoggingEnabled = false;
      }
    } else {
      // No config found - use default config with logging enabled
      activityLogsConfig = {
        enabled: true,
        excludeActions: ['read', 'list'], // Default: exclude read/list to reduce noise
      };
    }
  }
  
  // If logging is explicitly disabled or no module ID, skip logging
  if (!isLoggingEnabled || !effectiveModuleId) {
    // Activity logging disabled - just execute handler normally
    return handler(request, { params: routeParams });
  }
  
  const startTime = Date.now();
  let userId: string | null = null;
  let tenantId: string | null = null;
  let requestBody: any;
  let response: NextResponse;
  let error: string | undefined;
  
  try {
    // Get user info (don't fail if auth fails - some endpoints might be public)
    try {
      userId = await verifyAuth(request);
      if (userId) {
        tenantId = await getUserTenantId(userId);
      }
    } catch (authError) {
      // Auth might fail for public endpoints - that's okay
      console.debug('Activity logger: Could not get user info:', authError);
    }
    
    // Get request body for context (optional)
    try {
      requestBody = await getRequestBodySafely(request);
    } catch {
      // Request body might not be JSON or might be consumed - that's okay
    }
    
    // Determine action
    const action = determineAction(request.method, fullPath, routeParams);
    
    // Check if this action should be excluded
    const excludeActions = activityLogsConfig.excludeActions || [];
    if (excludeActions.includes(action)) {
      // Action excluded - execute handler without logging
      return handler(request, { params: routeParams });
    }
    
    // Execute handler
    response = await handler(request, { params: routeParams });
    
    // Get response body for context (optional)
    let responseBody: any;
    try {
      responseBody = await getResponseBodySafely(response);
    } catch {
      // Response might not be JSON - that's okay
    }
    
    // For login endpoint, extract user ID from response if not already set
    // Login happens before authentication, so we need to get user from response
    if (action === 'login' && !userId && responseBody?.user?.id) {
      userId = responseBody.user.id;
      // Try to get tenant ID from response or user lookup
      if (responseBody.user.tenantId) {
        tenantId = responseBody.user.tenantId;
      } else if (userId) {
        try {
          tenantId = await getUserTenantId(userId);
        } catch {
          // If we can't get tenant ID, that's okay - log with null
        }
      }
    }
    
    const duration = Date.now() - startTime;
    const statusCode = response.status;
    
    // Extract resource info
    const { resourceType, resourceId } = extractResourceInfo(effectiveModuleId || moduleId || 'unknown', fullPath, routeParams, requestBody);
    
    // Create log entry asynchronously (don't await - fire and forget)
    createActivityLog({
      userId,
      tenantId,
      moduleId: effectiveModuleId!,
      method: request.method,
      path: fullPath,
      action,
      resourceId: resourceId || undefined,
      resourceType,
      statusCode,
      duration,
      requestBody,
      responseBody,
    }).catch((logError) => {
      console.error('Activity log creation failed:', logError);
    });
    
    return response;
  } catch (handlerError) {
    const duration = Date.now() - startTime;
    error = handlerError instanceof Error ? handlerError.message : 'Unknown error';
    
    // Log the error
    const action = determineAction(request.method, fullPath, routeParams);
    const { resourceType, resourceId } = extractResourceInfo(effectiveModuleId || moduleId || 'unknown', fullPath, routeParams, requestBody);
    
    createActivityLog({
      userId,
      tenantId,
      moduleId: effectiveModuleId!,
      method: request.method,
      path: fullPath,
      action,
      resourceId: resourceId || undefined,
      resourceType,
      statusCode: 500,
      duration,
      error,
      requestBody,
    }).catch((logError) => {
      console.error('Activity log creation failed:', logError);
    });
    
    // Re-throw the error
    throw handlerError;
  }
}

