import { db } from '@/core/lib/db';
import { systemLogs, users } from '@/core/lib/db/baseSchema';
import { eq, and, or, like, gte, lte, desc, sql, count } from 'drizzle-orm';
import type { LogRecord, LogListFilters, LogStats, LogListResponse } from '../types';

/**
 * List logs with filters and pagination
 */
export async function listLogs(
  tenantId: string | null,
  filters: LogListFilters = {}
): Promise<LogListResponse> {
  const {
    search,
    module,
    level,
    action,
    userId,
    startDate,
    endDate,
    page = 1,
    limit = 50,
  } = filters;

  const offset = (page - 1) * limit;

  // Build where conditions
  const conditions = [];

  if (tenantId) {
    conditions.push(eq(systemLogs.tenantId, tenantId));
  } else {
    conditions.push(sql`${systemLogs.tenantId} IS NULL`);
  }

  if (module) {
    conditions.push(eq(systemLogs.module, module));
  }

  if (level) {
    conditions.push(eq(systemLogs.level, level));
  }

  if (action) {
    conditions.push(eq(systemLogs.action, action));
  }

  if (userId) {
    conditions.push(eq(systemLogs.userId, userId));
  }

  if (startDate) {
    conditions.push(gte(systemLogs.createdAt, new Date(startDate)));
  }

  if (endDate) {
    conditions.push(lte(systemLogs.createdAt, new Date(endDate)));
  }

  if (search) {
    conditions.push(
      or(
        like(systemLogs.message, `%${search}%`),
        like(systemLogs.module, `%${search}%`),
        like(systemLogs.action, `%${search}%`)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Get total count
  const totalResult = await db
    .select({ count: count() })
    .from(systemLogs)
    .where(whereClause);

  const total = totalResult[0]?.count ?? 0;

  // Get logs with user information
  const logs = await db
    .select({
      log: systemLogs,
      user: {
        id: users.id,
        email: users.email,
        fullName: users.fullName,
      },
    })
    .from(systemLogs)
    .leftJoin(users, eq(systemLogs.userId, users.id))
    .where(whereClause)
    .orderBy(desc(systemLogs.createdAt))
    .limit(limit)
    .offset(offset);

  const logRecords: LogRecord[] = logs.map((row) => ({
    ...row.log,
    user: row.user?.id
      ? {
          id: row.user.id,
          email: row.user.email,
          fullName: row.user.fullName,
        }
      : undefined,
  }));

  return {
    logs: logRecords,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Get log statistics
 */
export async function getLogStats(
  tenantId: string | null,
  days: number = 7
): Promise<LogStats> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const tenantCondition = tenantId
    ? eq(systemLogs.tenantId, tenantId)
    : sql`${systemLogs.tenantId} IS NULL`;

  // Total count
  const totalResult = await db
    .select({ count: count() })
    .from(systemLogs)
    .where(and(tenantCondition, gte(systemLogs.createdAt, startDate)));

  const total = totalResult[0]?.count ?? 0;

  // Count by level
  const levelCounts = await db
    .select({
      level: systemLogs.level,
      count: count(),
    })
    .from(systemLogs)
    .where(and(tenantCondition, gte(systemLogs.createdAt, startDate)))
    .groupBy(systemLogs.level);

  const byLevel = {
    info: 0,
    warning: 0,
    error: 0,
    debug: 0,
    success: 0,
  };

  levelCounts.forEach((row) => {
    const level = row.level as keyof typeof byLevel;
    if (level in byLevel) {
      byLevel[level] = Number(row.count);
    }
  });

  // Count by module
  const moduleCounts = await db
    .select({
      module: systemLogs.module,
      count: count(),
    })
    .from(systemLogs)
    .where(and(tenantCondition, gte(systemLogs.createdAt, startDate)))
    .groupBy(systemLogs.module);

  const byModule: Record<string, number> = {};
  moduleCounts.forEach((row) => {
    byModule[row.module] = Number(row.count);
  });

  // Errors in last 24 hours
  const last24h = new Date();
  last24h.setHours(last24h.getHours() - 24);

  const errors24hResult = await db
    .select({ count: count() })
    .from(systemLogs)
    .where(
      and(
        tenantCondition,
        eq(systemLogs.level, 'error'),
        gte(systemLogs.createdAt, last24h)
      )
    );

  const errorsLast24h = errors24hResult[0]?.count ?? 0;

  // Errors in last 7 days
  const last7d = new Date();
  last7d.setDate(last7d.getDate() - 7);

  const errors7dResult = await db
    .select({ count: count() })
    .from(systemLogs)
    .where(
      and(
        tenantCondition,
        eq(systemLogs.level, 'error'),
        gte(systemLogs.createdAt, last7d)
      )
    );

  const errorsLast7d = errors7dResult[0]?.count ?? 0;

  // Average response time
  const avgDurationResult = await db
    .select({
      avg: sql<number>`AVG(${systemLogs.duration})`,
    })
    .from(systemLogs)
    .where(
      and(
        tenantCondition,
        gte(systemLogs.createdAt, startDate),
        sql`${systemLogs.duration} IS NOT NULL`
      )
    );

  const avgResponseTime =
    avgDurationResult[0]?.avg !== null
      ? Math.round(Number(avgDurationResult[0]?.avg))
      : null;

  return {
    total,
    byLevel,
    byModule,
    errorsLast24h,
    errorsLast7d,
    avgResponseTime,
  };
}

/**
 * Get all logs for CSV export (no pagination)
 */
export async function getAllLogsForExport(
  tenantId: string | null,
  filters: Omit<LogListFilters, 'page' | 'limit'> = {}
): Promise<LogRecord[]> {
  const { search, module, level, action, userId, startDate, endDate } = filters;

  const conditions = [];

  if (tenantId) {
    conditions.push(eq(systemLogs.tenantId, tenantId));
  } else {
    conditions.push(sql`${systemLogs.tenantId} IS NULL`);
  }

  if (module) {
    conditions.push(eq(systemLogs.module, module));
  }

  if (level) {
    conditions.push(eq(systemLogs.level, level));
  }

  if (action) {
    conditions.push(eq(systemLogs.action, action));
  }

  if (userId) {
    conditions.push(eq(systemLogs.userId, userId));
  }

  if (startDate) {
    conditions.push(gte(systemLogs.createdAt, new Date(startDate)));
  }

  if (endDate) {
    conditions.push(lte(systemLogs.createdAt, new Date(endDate)));
  }

  if (search) {
    conditions.push(
      or(
        like(systemLogs.message, `%${search}%`),
        like(systemLogs.module, `%${search}%`),
        like(systemLogs.action, `%${search}%`)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const logs = await db
    .select({
      log: systemLogs,
      user: {
        id: users.id,
        email: users.email,
        fullName: users.fullName,
      },
    })
    .from(systemLogs)
    .leftJoin(users, eq(systemLogs.userId, users.id))
    .where(whereClause)
    .orderBy(desc(systemLogs.createdAt))
    .limit(10000); // Limit to prevent memory issues

  return logs.map((row) => ({
    ...row.log,
    user: row.user?.id
      ? {
          id: row.user.id,
          email: row.user.email,
          fullName: row.user.fullName,
        }
      : undefined,
  }));
}

/**
 * Create a log entry
 * This is a utility function that modules can use to log events
 */
export async function createLog(params: {
  tenantId: string | null;
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
}) {
  const [log] = await db
    .insert(systemLogs)
    .values({
      tenantId: params.tenantId,
      userId: params.userId,
      module: params.module,
      level: params.level,
      message: params.message,
      context: params.context || {},
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      action: params.action,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      duration: params.duration,
      statusCode: params.statusCode,
      errorStack: params.errorStack,
    })
    .returning();

  return log;
}

