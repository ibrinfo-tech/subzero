// Server-Sent Events endpoint for real-time log updates

import { NextRequest } from 'next/server';
import { verifyAuth } from '@/core/middleware/auth';
import { getUserTenantId } from '@/core/lib/permissions';
import { listLogs } from '@/modules/logs/services/logsService';

// Store active connections per user
const activeConnections = new Map<
  string,
  Array<{
    controller: ReadableStreamDefaultController;
    tenantId: string | null;
    pollInterval: NodeJS.Timeout;
    lastLogId: string | null;
  }>
>();

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const userId = await verifyAuth(request);
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const tenantId = await getUserTenantId(userId);

    // Get query parameters for filters
    const { searchParams } = new URL(request.url);
    const filters = {
      search: searchParams.get('search') || undefined,
      module: searchParams.get('module') || undefined,
      level: searchParams.get('level') || undefined,
      action: searchParams.get('action') || undefined,
      limit: 10, // Only get latest 10 logs per poll
    };

    // Create a readable stream for SSE
    const stream = new ReadableStream({
      start(controller) {
        // Send initial data
        sendInitialData(controller, userId, tenantId, filters).catch((error) => {
          console.error('Error sending initial data:', error);
        });

        // Set up polling to check for new logs every 2 seconds
        const pollInterval = setInterval(async () => {
          try {
            const result = await listLogs(tenantId, filters);
            const latestLogs = result.logs;

            // Get the latest log ID
            const latestLogId = latestLogs.length > 0 ? latestLogs[0].id : null;

            // Get stored connection info
            const connections = activeConnections.get(userId);
            const connection = connections?.find((conn) => conn.controller === controller);

            if (connection && latestLogId && latestLogId !== connection.lastLogId) {
              // New logs detected
              const newLogs = latestLogId !== connection.lastLogId
                ? latestLogs.filter((log) => log.id !== connection.lastLogId)
                : latestLogs;

              if (newLogs.length > 0) {
                const message = JSON.stringify({ type: 'new_logs', logs: newLogs });
                controller.enqueue(new TextEncoder().encode(`data: ${message}\n\n`));
                connection.lastLogId = latestLogId;
              }
            } else if (connection && !connection.lastLogId && latestLogId) {
              // First poll - store the latest log ID
              connection.lastLogId = latestLogId;
            }
          } catch (error) {
            console.error('Error polling logs:', error);
            const errorMessage = JSON.stringify({ type: 'error', message: 'Failed to fetch logs' });
            controller.enqueue(new TextEncoder().encode(`data: ${errorMessage}\n\n`));
          }
        }, 2000);

        // Store this connection
        if (!activeConnections.has(userId)) {
          activeConnections.set(userId, []);
        }
        activeConnections.get(userId)!.push({
          controller,
          tenantId,
          pollInterval,
          lastLogId: null,
        });

        // Cleanup on close
        request.signal.addEventListener('abort', () => {
          clearInterval(pollInterval);
          const connections = activeConnections.get(userId);
          if (connections) {
            const index = connections.findIndex((conn) => conn.controller === controller);
            if (index > -1) {
              connections.splice(index, 1);
            }
            if (connections.length === 0) {
              activeConnections.delete(userId);
            }
          }
        });
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Logs stream error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

async function sendInitialData(
  controller: ReadableStreamDefaultController,
  userId: string,
  tenantId: string | null,
  filters: any
) {
  try {
    const result = await listLogs(tenantId, { ...filters, limit: 10 });
    const message = JSON.stringify({ type: 'initial', logs: result.logs });
    controller.enqueue(new TextEncoder().encode(`data: ${message}\n\n`));
  } catch (error) {
    console.error('Error sending initial data:', error);
  }
}

/**
 * Broadcast log update to all active connections for a user
 * This can be called when a new log is created
 */
export async function broadcastLogUpdate(userId: string, tenantId: string | null) {
  const connections = activeConnections.get(userId);
  if (!connections || connections.length === 0) return;

  try {
    const result = await listLogs(tenantId, { limit: 1 });
    const latestLog = result.logs[0];

    if (latestLog) {
      const message = JSON.stringify({ type: 'new_log', log: latestLog });
      const data = new TextEncoder().encode(`data: ${message}\n\n`);

      // Send to all active connections for this user
      connections.forEach((conn) => {
        // Only send if tenant matches (security)
        if (conn.tenantId === tenantId) {
          try {
            conn.controller.enqueue(data);
            conn.lastLogId = latestLog.id;
          } catch (error) {
            console.error('Error sending to connection:', error);
            // Remove dead connection
            const index = connections.indexOf(conn);
            if (index > -1) {
              clearInterval(conn.pollInterval);
              connections.splice(index, 1);
            }
          }
        }
      });
    }

    // Clean up empty connection arrays
    if (connections.length === 0) {
      activeConnections.delete(userId);
    }
  } catch (error) {
    console.error('Error broadcasting log update:', error);
  }
}

