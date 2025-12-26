import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { getUserTenantId } from '@/core/lib/permissions';
import { getAllLogsForExport } from '../../services/logsService';

/**
 * Convert logs to CSV format
 */
function convertLogsToCSV(logs: any[]): string {
  const headers = [
    'ID',
    'Timestamp',
    'Module',
    'Level',
    'Message',
    'Action',
    'User Email',
    'User Name',
    'IP Address',
    'Status Code',
    'Duration (ms)',
    'Resource Type',
    'Resource ID',
  ];

  const rows = logs.map((log) => {
    return [
      log.id,
      log.createdAt ? new Date(log.createdAt).toISOString() : '',
      log.module || '',
      log.level || '',
      (log.message || '').replace(/"/g, '""'), // Escape quotes
      log.action || '',
      log.user?.email || '',
      log.user?.fullName || '',
      log.ipAddress || '',
      log.statusCode || '',
      log.duration || '',
      log.resourceType || '',
      log.resourceId || '',
    ].map((field) => `"${field}"`); // Wrap in quotes
  });

  return [headers.map((h) => `"${h}"`).join(','), ...rows.map((row) => row.join(','))].join('\n');
}

export async function GET(request: NextRequest) {
  try {
    const authMiddleware = requireAuth();
    const authResult = await authMiddleware(request);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const userId = authResult;
    const tenantId = await getUserTenantId(userId);

    const { searchParams } = new URL(request.url);
    const filters = {
      search: searchParams.get('search') || undefined,
      module: searchParams.get('module') || undefined,
      level: searchParams.get('level') || undefined,
      action: searchParams.get('action') || undefined,
      userId: searchParams.get('userId') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
    };

    const logs = await getAllLogsForExport(tenantId, filters);
    const csv = convertLogsToCSV(logs);

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `logs-export-${timestamp}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Logs export error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

