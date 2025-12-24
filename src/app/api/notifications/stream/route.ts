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
    // Verify authentication (EventSource uses cookies, so this should work)
    const userId = await verifyAuth(request);
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const tenantId = await getUserTenantId(userId);
    if (!tenantId) {
      return new Response('Tenant not found', { status: 400 });
    }

    // Create a readable stream for SSE
    const stream = new ReadableStream({
      start(controller) {
        // Send initial unread count
        sendInitialData(controller, userId, tenantId).catch((error) => {
          console.error('Error sending initial data:', error);
        });

        // Set up polling to check for new notifications every 2 seconds
        // In production, you could use database triggers or a message queue for instant updates
        const pollInterval = setInterval(async () => {
          try {
            const count = await getUnreadCount(userId, tenantId);
            const message = JSON.stringify({ type: 'unread_count', count });
            controller.enqueue(new TextEncoder().encode(`data: ${message}\n\n`));
          } catch (error) {
            console.error('Error polling notifications:', error);
            // Send error to client
            const errorMessage = JSON.stringify({ type: 'error', message: 'Failed to fetch count' });
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
  tenantId: string
) {
  try {
    const count = await getUnreadCount(userId, tenantId);
    const message = JSON.stringify({ type: 'unread_count', count });
    controller.enqueue(new TextEncoder().encode(`data: ${message}\n\n`));
  } catch (error) {
    console.error('Error sending initial data:', error);
  }
}

/**
 * Broadcast notification update to all active connections for a user
 * This is called when a new notification is created
 */
export async function broadcastNotificationUpdate(userId: string, tenantId: string) {
  const connections = activeConnections.get(userId);
  if (!connections || connections.length === 0) return;

  try {
    const count = await getUnreadCount(userId, tenantId);
    const message = JSON.stringify({ type: 'unread_count', count });
    const data = new TextEncoder().encode(`data: ${message}\n\n`);

    // Send to all active connections for this user
    connections.forEach((conn) => {
      // Only send if tenant matches (security)
      if (conn.tenantId === tenantId) {
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

