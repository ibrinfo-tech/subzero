/**
 * Core logging service
 * This is a utility that modules can use to create log entries
 */

import { createLog } from '@/modules/logs/services/logsService';
import { getUserTenantId } from '@/core/lib/permissions';

export interface CreateLogParams {
  userId: string | null;
  module: string;
  level: 'info' | 'warning' | 'error' | 'debug' | 'success';
  message: string;
  context?: Record<string, any>;
  resourceType?: string;
  resourceId?: string;
  action?: string;
  ipAddress?: string;
  userAgent?: string;
  duration?: number;
  statusCode?: number;
  errorStack?: string;
}

/**
 * Create a log entry
 * This is the main function that modules should use to log events
 */
export async function logEvent(params: CreateLogParams) {
  try {
    const tenantId = params.userId ? await getUserTenantId(params.userId) : null;
    
    return await createLog({
      tenantId,
      userId: params.userId,
      module: params.module,
      level: params.level,
      message: params.message,
      context: params.context,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      action: params.action,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      duration: params.duration,
      statusCode: params.statusCode,
      errorStack: params.errorStack,
    });
  } catch (error) {
    // Don't throw errors from logging - it shouldn't break the main flow
    console.error('Failed to create log entry:', error);
    return null;
  }
}

/**
 * Helper functions for common log types
 */
export const logger = {
  info: (params: Omit<CreateLogParams, 'level'>) => logEvent({ ...params, level: 'info' }),
  success: (params: Omit<CreateLogParams, 'level'>) => logEvent({ ...params, level: 'success' }),
  warning: (params: Omit<CreateLogParams, 'level'>) => logEvent({ ...params, level: 'warning' }),
  error: (params: Omit<CreateLogParams, 'level'>) => logEvent({ ...params, level: 'error' }),
  debug: (params: Omit<CreateLogParams, 'level'>) => logEvent({ ...params, level: 'debug' }),
};

