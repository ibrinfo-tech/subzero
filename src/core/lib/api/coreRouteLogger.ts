/**
 * Core Route Activity Logger
 * 
 * Wraps core API route handlers with activity logging
 * This allows core routes to have activity logging without modifying existing code
 */

import { NextRequest, NextResponse } from 'next/server';
import { withActivityLogging } from './activityLogger';
import { getCoreRouteConfig, CoreRouteConfig } from '@/core/config/coreRoutes';

/**
 * Wrap a core route handler with activity logging
 * 
 * Usage in core route files:
 * 
 * export async function POST(request: NextRequest) {
 *   return withCoreRouteLogging(request, async (req) => {
 *     // Your existing handler code here
 *     return NextResponse.json({ success: true });
 *   });
 * }
 * 
 * For routes with params:
 * export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
 *   return withCoreRouteLogging(request, async (req) => {
 *     const { id } = await params;
 *     // Your existing handler code here
 *   });
 * }
 */
export async function withCoreRouteLogging(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>,
  routeParams?: Record<string, string>
): Promise<NextResponse> {
  // Check global environment variable first
  const globalLoggingEnabled = process.env.ACTIVITY_LOGS_ENABLE !== 'false';
  if (!globalLoggingEnabled) {
    // Global logging disabled - execute handler normally
    return handler(request);
  }

  const fullPath = new URL(request.url).pathname;
  const coreRouteConfig = getCoreRouteConfig(fullPath);
  
  // If explicitly disabled in config, skip logging
  if (coreRouteConfig && coreRouteConfig.activityLogs?.enabled === false) {
    return handler(request);
  }
  
  // If no config but global logging is enabled, automatically enable logging
  // Try to infer module from path (e.g., /api/auth/login -> auth, /api/roles -> roles)
  let effectiveConfig: CoreRouteConfig;
  let extractedParams = routeParams || {};
  
  if (coreRouteConfig) {
    effectiveConfig = coreRouteConfig;
  } else {
    // Auto-infer module from path
    const pathSegments = fullPath.split('/').filter(Boolean);
    if (pathSegments.length >= 2 && pathSegments[0] === 'api') {
      const inferredModule = pathSegments[1];
      
      // Extract route params from path (e.g., /api/users/123 -> { id: '123' })
      if (pathSegments.length >= 3) {
        extractedParams.id = pathSegments[2];
      }
      
      effectiveConfig = {
        moduleId: inferredModule,
        activityLogs: {
          enabled: true,
          excludeActions: ['read', 'list'], // Default exclusions
        },
      };
    } else {
      // Can't infer module - execute normally
      return handler(request);
    }
  }
  
  // Skip logging for logs module itself to avoid infinite loops
  if (effectiveConfig.moduleId === 'logs') {
    return handler(request);
  }
  
  // Wrap handler to match expected signature
  const wrappedHandler = async (req: NextRequest, params: { params: Record<string, string> }) => {
    return handler(req);
  };
  
  return withActivityLogging(
    request,
    effectiveConfig.moduleId,
    { activityLogs: effectiveConfig.activityLogs },
    wrappedHandler,
    extractedParams,
    fullPath
  );
}

