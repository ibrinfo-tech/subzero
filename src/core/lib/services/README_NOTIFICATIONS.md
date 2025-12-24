# Notification Service - Usage Guide

This is a **generic notification system** that any module can use to send in-app notifications to users.

## How to Use in Your Module

### Example: Creating a Notification

When your module needs to notify a user, import and use the `createNotification` function:

```typescript
// In your module service (e.g., src/modules/your-module/services/yourService.ts)

import { createNotification } from '@/core/lib/services/notificationService';

export async function assignResource(
  resourceId: string,
  assignedToUserId: string,
  assignedByUserId: string,
  tenantId: string
) {
  // 1. Do your business logic (assign resource, update database, etc.)
  const resource = await updateResourceAssignment(resourceId, assignedToUserId);
  
  // 2. Get the assigned by user's name (optional, for better notification message)
  const assignedByUser = await getUser(assignedByUserId);
  
  // 3. Create notification for the assigned user
  await createNotification({
    tenantId: tenantId,
    userId: assignedToUserId, // User who receives the notification
    title: 'New Assignment',
    message: `${assignedByUser.fullName} assigned you: "${resource.title}"`,
    type: 'info', // 'info' | 'success' | 'warning' | 'error'
    category: 'resource_assigned', // Your module-specific category
    actionUrl: `/your-module/${resourceId}`, // Link to the resource
    actionLabel: 'View Resource', // Button text
    resourceType: 'your_resource', // Your resource type
    resourceId: resourceId,
    priority: 'normal', // 'low' | 'normal' | 'high' | 'urgent'
    metadata: {
      // Any additional data you want to store
      resourceId: resourceId,
      assignedBy: assignedByUserId,
    },
  });
  
  return resource;
}
```

### Example: Bulk Notifications

If you need to notify multiple users at once:

```typescript
import { createBulkNotifications } from '@/core/lib/services/notificationService';

// Notify all team members about a project update
await createBulkNotifications(
  teamMembers.map((member) => ({
    tenantId: tenantId,
    userId: member.id,
    title: 'Project Updated',
    message: `Project "${project.name}" has been updated`,
    type: 'info',
    category: 'project_updated',
    actionUrl: `/projects/${project.id}`,
    actionLabel: 'View Project',
    resourceType: 'project',
    resourceId: project.id,
  }))
);
```

## Notification Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tenantId` | string | Yes | Tenant ID for multi-tenant isolation |
| `userId` | string | Yes | User ID who will receive the notification |
| `title` | string | Yes | Notification title (max 255 chars) |
| `message` | string | Yes | Notification message |
| `type` | 'info' \| 'success' \| 'warning' \| 'error' | No | Notification type (default: 'info') |
| `category` | string | No | Module-specific category (e.g., 'task_assigned') |
| `actionUrl` | string | No | URL to navigate when notification is clicked |
| `actionLabel` | string | No | Label for the action button |
| `resourceType` | string | No | Type of resource (e.g., 'task', 'project') |
| `resourceId` | string | No | ID of the related resource |
| `priority` | 'low' \| 'normal' \| 'high' \| 'urgent' | No | Priority level (default: 'normal') |
| `metadata` | object | No | Additional JSON data |

## Frontend Integration

The notification system is already integrated into the Topbar. Users will see:
- Bell icon with unread count badge
- Dropdown panel with notifications
- Real-time updates (polls every 30 seconds)
- Click to navigate to related resource
- Mark as read functionality

## Best Practices

1. **Use descriptive categories**: Use module-specific categories like `task_assigned`, `project_updated`, etc.
2. **Always provide actionUrl**: Makes notifications clickable and useful
3. **Keep messages concise**: Notifications should be brief and actionable
4. **Use appropriate types**: Use 'error' for critical issues, 'success' for completed actions
5. **Include context in metadata**: Store any additional data you might need later

## Security

- All notifications are automatically filtered by tenant and user
- Users can only see and manage their own notifications
- All API endpoints require authentication

