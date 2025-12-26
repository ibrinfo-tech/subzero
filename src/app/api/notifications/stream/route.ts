// Server-Sent Events endpoint for real-time notification updates

import { NextRequest } from 'next/server';
import { verifyAuth, getAuthToken } from '@/core/middleware/auth';
import { getUnreadCount } from '@/core/lib/services/notificationService';
import { getUserTenantId } from '@/core/lib/permissions';

// Store active connections per user
// Format: Map<userId, Array<{ controller, tenantId, pollInterval }>>
const activeConnections = new Map<
  string,
  Array<{
    controller: ReadableStreamDefaultController;
    tenantId: string;
    pollInterval: NodeJS.Timeout;
  }>
>();

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    // EventSource doesn't support custom headers, so verifyAuth will check:
    // 1. Query parameter (token passed from client)
    // 2. Cookies (set during login)
    const userId = await verifyAuth(request);
    if (!userId) {
      // Send error via SSE format before closing
      const errorMessage = JSON.stringify({ type: 'error', message: 'Unauthorized' });
      return new Response(`data: ${errorMessage}\n\n`, {
        status: 401,
        headers: {
          'Content-Type': 'text/event-stream',
        },
      });
    }

    const tenantId = await getUserTenantId(userId);
    
    // tenantId is optional - only required in multi-tenant mode
    const { MULTI_TENANT_ENABLED } = await import('@/core/lib/db/baseSchema');
    if (MULTI_TENANT_ENABLED && !tenantId) {
      const errorMessage = JSON.stringify({ type: 'error', message: 'Tenant not found' });
      return new Response(`data: ${errorMessage}\n\n`, {
        status: 400,
        headers: {
          'Content-Type': 'text/event-stream',
        },
      });
    }

    // Create a readable stream for SSE
    const stream = new ReadableStream({
      start(controller) {
        // Send initial unread count
        sendInitialData(controller, userId, tenantId || undefined).catch((error) => {
          console.error('Error sending initial data:', error);
        });

        // Set up polling to check for new notifications every 2 seconds
        // In production, you could use database triggers or a message queue for instant updates
        const pollInterval = setInterval(async () => {
          try {
            const count = await getUnreadCount(userId, tenantId || undefined);
            const message = JSON.stringify({ type: 'unread_count', count });
            controller.enqueue(new TextEncoder().encode(`data: ${message}\n\n`));
          } catch (error) {
            console.error('Error polling notifications:', error);
            // Only send error if controller is still active
            try {
              const errorMessage = JSON.stringify({ 
                type: 'error', 
                message: error instanceof Error ? error.message : 'Failed to fetch count' 
              });
              controller.enqueue(new TextEncoder().encode(`data: ${errorMessage}\n\n`));
            } catch (enqueueError) {
              // Controller might be closed, stop polling
              clearInterval(pollInterval);
            }
          }
        }, 2000);

        // Store this connection
        if (!activeConnections.has(userId)) {
          activeConnections.set(userId, []);
        }
        activeConnections.get(userId)!.push({
          controller,
          tenantId: tenantId || '', // Store empty string in single-tenant mode
          pollInterval,
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
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable nginx buffering
      },
    });
  } catch (error) {
    console.error('Error setting up notification stream:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

async function sendInitialData(
  controller: ReadableStreamDefaultController,
  userId: string,
  tenantId?: string | null
) {
  try {
    const count = await getUnreadCount(userId, tenantId || undefined);
    const message = JSON.stringify({ type: 'unread_count', count });
    controller.enqueue(new TextEncoder().encode(`data: ${message}\n\n`));
  } catch (error) {
    console.error('Error sending initial data:', error);
    // Send error message to client
    try {
      const errorMessage = JSON.stringify({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Failed to fetch initial count' 
      });
      controller.enqueue(new TextEncoder().encode(`data: ${errorMessage}\n\n`));
    } catch (enqueueError) {
      // Controller might be closed
      console.error('Error sending error message:', enqueueError);
    }
  }
}

/**
 * Broadcast notification update to all active connections for a user
 * This is called when a new notification is created
 */
export async function broadcastNotificationUpdate(userId: string, tenantId?: string | null) {
  const connections = activeConnections.get(userId);
  if (!connections || connections.length === 0) return;

  try {
    const count = await getUnreadCount(userId, tenantId || undefined);
    const message = JSON.stringify({ type: 'unread_count', count });
    const data = new TextEncoder().encode(`data: ${message}\n\n`);

    // Send to all active connections for this user
    connections.forEach((conn) => {
      // Only send if tenant matches (security) - in single-tenant mode, both will be empty string/null
      const connTenantId = conn.tenantId || null;
      const updateTenantId = tenantId || null;
      if (connTenantId === updateTenantId) {
        try {
          conn.controller.enqueue(data);
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

    // Clean up empty connection arrays
    if (connections.length === 0) {
      activeConnections.delete(userId);
    }
  } catch (error) {
    console.error('Error broadcasting notification update:', error);
  }
}

