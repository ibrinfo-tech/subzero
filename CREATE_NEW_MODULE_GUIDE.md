# Complete Guide: Creating a New Module (Activity Example)

This guide walks you through creating a new module from scratch, using "activity" as an example. Follow these steps in order.

## Overview

A module consists of:
- **Database schema** (Drizzle ORM)
- **Module configuration** (`module.config.json`)
- **Types** (TypeScript interfaces)
- **Validation schemas** (Zod)
- **Services** (Business logic)
- **Store** (Zustand state management)
- **API handlers** (Next.js route handlers)
- **Components** (React UI)
- **Routes** (Page components)

---

## Step 1: Create Module Folder Structure

Create the following folder structure in `src/modules/activity/`:

```
src/modules/activity/
├── api/
│   └── handlers/
├── components/
├── routes/
├── schemas/
├── services/
├── store/
└── types/
```

**Command:**
```bash
mkdir -p src/modules/activity/{api/handlers,components,routes,schemas,services,store,types}
```

---

## Step 2: Create Database Schema

**File:** `src/modules/activity/schemas/activitySchema.ts`

```typescript
import { pgTable, serial, varchar, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { users } from '@/core/lib/db/baseSchema';

// Activities table schema
export const activities = pgTable('activities', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 50 }).notNull(), // e.g., 'task', 'event', 'reminder'
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Activity = typeof activities.$inferSelect;
export type NewActivity = typeof activities.$inferInsert;
```

**Important:** 
- The schema file must be named `*Schema.ts` (e.g., `activitySchema.ts`) for Drizzle to auto-discover it
- It's already configured in `drizzle.config.ts` to scan `./src/modules/**/schemas/*Schema.ts`

---

## Step 3: Create Validation Schema

**File:** `src/modules/activity/schemas/activityValidation.ts`

```typescript
import { z } from 'zod';

// Schema for creating an activity
export const createActivitySchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  description: z.string().optional(),
  type: z.enum(['task', 'event', 'reminder'], {
    errorMap: () => ({ message: 'Type must be task, event, or reminder' }),
  }),
});

// Schema for updating an activity
export const updateActivitySchema = createActivitySchema.partial();

// TypeScript types inferred from schemas
export type CreateActivityInput = z.infer<typeof createActivitySchema>;
export type UpdateActivityInput = z.infer<typeof updateActivitySchema>;
```

---

## Step 4: Create Type Definitions

**File:** `src/modules/activity/types/index.ts`

```typescript
import type { Activity, NewActivity } from '../schemas/activitySchema';
import type { CreateActivityInput, UpdateActivityInput } from '../schemas/activityValidation';

// Re-export schema types
export type { Activity, NewActivity };

// Re-export validation types
export type { CreateActivityInput, UpdateActivityInput };

// Extended activity type with user info (if needed)
export interface ActivityWithUser extends Activity {
  user?: {
    id: number;
    name: string | null;
    email: string;
  };
}
```

---

## Step 5: Create Service Layer

**File:** `src/modules/activity/services/activityService.ts`

```typescript
import { db } from '@/core/lib/db';
import { activities } from '../schemas/activitySchema';
import { eq, desc } from 'drizzle-orm';
import type { NewActivity, Activity } from '../types';

/**
 * Get all activities for a specific user
 */
export async function getActivitiesByUserId(userId: number): Promise<Activity[]> {
  const result = await db
    .select()
    .from(activities)
    .where(eq(activities.userId, userId))
    .orderBy(desc(activities.createdAt));
  
  return result;
}

/**
 * Get a single activity by ID (with user ownership check)
 */
export async function getActivityById(id: number, userId: number): Promise<Activity | null> {
  const result = await db
    .select()
    .from(activities)
    .where(eq(activities.id, id))
    .limit(1);
  
  if (result.length === 0) {
    return null;
  }
  
  // Check ownership
  if (result[0].userId !== userId) {
    return null;
  }
  
  return result[0];
}

/**
 * Create a new activity
 */
export async function createActivity(data: NewActivity): Promise<Activity> {
  const result = await db
    .insert(activities)
    .values(data)
    .returning();
  
  return result[0];
}

/**
 * Update an activity
 */
export async function updateActivity(
  id: number, 
  userId: number, 
  data: Partial<NewActivity>
): Promise<Activity | null> {
  // First verify ownership
  const existing = await getActivityById(id, userId);
  if (!existing) {
    return null;
  }
  
  const result = await db
    .update(activities)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(activities.id, id))
    .returning();
  
  return result[0];
}

/**
 * Delete an activity
 */
export async function deleteActivity(id: number, userId: number): Promise<boolean> {
  // First verify ownership
  const existing = await getActivityById(id, userId);
  if (!existing) {
    return false;
  }
  
  await db
    .delete(activities)
    .where(eq(activities.id, id));
  
  return true;
}
```

---

## Step 6: Create Zustand Store

**File:** `src/modules/activity/store/activityStore.ts`

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Activity } from '../types';

interface ActivityState {
  activities: Activity[];
  isLoading: boolean;
  error: string | null;
  setActivities: (activities: Activity[]) => void;
  addActivity: (activity: Activity) => void;
  updateActivity: (id: number, activity: Partial<Activity>) => void;
  removeActivity: (id: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearActivities: () => void;
}

export const useActivityStore = create<ActivityState>()(
  persist(
    (set) => ({
      activities: [],
      isLoading: false,
      error: null,
      setActivities: (activities) => set({ activities }),
      addActivity: (activity) => set((state) => ({ activities: [activity, ...state.activities] })),
      updateActivity: (id, updatedActivity) =>
        set((state) => ({
          activities: state.activities.map((activity) =>
            activity.id === id ? { ...activity, ...updatedActivity } : activity
          ),
        })),
      removeActivity: (id) =>
        set((state) => ({
          activities: state.activities.filter((activity) => activity.id !== id),
        })),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      clearActivities: () => set({ activities: [], error: null }),
    }),
    {
      name: 'activity-storage',
    }
  )
);
```

**Optional:** Create `store/store.config.json` if you need custom store configuration.

---

## Step 7: Create API Handlers

Create handler files in `src/modules/activity/api/handlers/`. Each handler exports named functions matching HTTP methods.

### List Handler

**File:** `src/modules/activity/api/handlers/list.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { getActivitiesByUserId } from '../../services/activityService';

/**
 * GET /api/activities
 * Get all activities for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authMiddleware = requireAuth();
    const authResult = await authMiddleware(request);
    
    if (authResult instanceof NextResponse) {
      return authResult; // Unauthorized response
    }
    
    const userId = authResult;
    
    // Get activities for user
    const activities = await getActivitiesByUserId(userId);
    
    return NextResponse.json(
      {
        success: true,
        data: activities,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('List activities error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Create Handler

**File:** `src/modules/activity/api/handlers/create.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { validateRequest } from '@/core/middleware/validation';
import { createActivitySchema } from '../../schemas/activityValidation';
import { createActivity } from '../../services/activityService';

/**
 * POST /api/activities
 * Create a new activity
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authMiddleware = requireAuth();
    const authResult = await authMiddleware(request);
    
    if (authResult instanceof NextResponse) {
      return authResult; // Unauthorized response
    }
    
    const userId = authResult;
    
    // Parse and validate request body
    const body = await request.json();
    const validation = validateRequest(createActivitySchema, body);
    
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }
    
    const { title, description, type } = validation.data;
    
    // Create activity
    const activity = await createActivity({
      title,
      description: description || null,
      type,
      userId,
    });
    
    return NextResponse.json(
      {
        success: true,
        data: activity,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create activity error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Get By ID Handler

**File:** `src/modules/activity/api/handlers/getById.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { getActivityById } from '../../services/activityService';

/**
 * GET /api/activities/:id
 * Get a single activity by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const authMiddleware = requireAuth();
    const authResult = await authMiddleware(request);
    
    if (authResult instanceof NextResponse) {
      return authResult; // Unauthorized response
    }
    
    const userId = authResult;
    const { id } = await params;
    const activityId = parseInt(id, 10);
    
    if (isNaN(activityId)) {
      return NextResponse.json(
        { error: 'Invalid activity ID' },
        { status: 400 }
      );
    }
    
    const activity = await getActivityById(activityId, userId);
    
    if (!activity) {
      return NextResponse.json(
        { error: 'Activity not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      {
        success: true,
        data: activity,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get activity error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Update Handler

**File:** `src/modules/activity/api/handlers/update.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { validateRequest } from '@/core/middleware/validation';
import { updateActivitySchema } from '../../schemas/activityValidation';
import { updateActivity } from '../../services/activityService';

/**
 * PATCH /api/activities/:id
 * Update an activity
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const authMiddleware = requireAuth();
    const authResult = await authMiddleware(request);
    
    if (authResult instanceof NextResponse) {
      return authResult; // Unauthorized response
    }
    
    const userId = authResult;
    const { id } = await params;
    const activityId = parseInt(id, 10);
    
    if (isNaN(activityId)) {
      return NextResponse.json(
        { error: 'Invalid activity ID' },
        { status: 400 }
      );
    }
    
    // Parse and validate request body
    const body = await request.json();
    const validation = validateRequest(updateActivitySchema, body);
    
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }
    
    const updatedActivity = await updateActivity(activityId, userId, validation.data);
    
    if (!updatedActivity) {
      return NextResponse.json(
        { error: 'Activity not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      {
        success: true,
        data: updatedActivity,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update activity error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Delete Handler

**File:** `src/modules/activity/api/handlers/delete.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { deleteActivity } from '../../services/activityService';

/**
 * DELETE /api/activities/:id
 * Delete an activity
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const authMiddleware = requireAuth();
    const authResult = await authMiddleware(request);
    
    if (authResult instanceof NextResponse) {
      return authResult; // Unauthorized response
    }
    
    const userId = authResult;
    const { id } = await params;
    const activityId = parseInt(id, 10);
    
    if (isNaN(activityId)) {
      return NextResponse.json(
        { error: 'Invalid activity ID' },
        { status: 400 }
      );
    }
    
    const deleted = await deleteActivity(activityId, userId);
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Activity not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      {
        success: true,
        message: 'Activity deleted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete activity error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**Note:** For routes with parameters (like `/:id`), Next.js passes them via the `params` prop. However, in our dynamic routing system, the handler receives the request directly. The route params are extracted by the API router, but handlers need to parse them from the URL if needed. For simplicity, you can use the pattern above or extract from `request.url`.

---

## Step 8: Create Module Configuration

**File:** `src/modules/activity/module.config.json`

```json
{
  "id": "activity",
  "name": "Activities",
  "version": "1.0.0",
  "description": "Activity tracking and management module",
  "enabled": true,
  "routes": [
    {
      "path": "/activities",
      "component": "index",
      "title": "My Activities"
    },
    {
      "path": "/activities/new",
      "component": "new",
      "title": "Create Activity"
    }
  ],
  "api": {
    "basePath": "/api/activities",
    "endpoints": [
      {
        "method": "GET",
        "path": "",
        "handler": "list",
        "requiresAuth": true
      },
      {
        "method": "POST",
        "path": "",
        "handler": "create",
        "requiresAuth": true
      },
      {
        "method": "GET",
        "path": "/:id",
        "handler": "getById",
        "requiresAuth": true
      },
      {
        "method": "PATCH",
        "path": "/:id",
        "handler": "update",
        "requiresAuth": true
      },
      {
        "method": "DELETE",
        "path": "/:id",
        "handler": "delete",
        "requiresAuth": true
      }
    ]
  },
  "navigation": {
    "label": "Activities",
    "icon": "Activity",
    "path": "/activities",
    "order": 3
  },
  "permissions": {
    "create": "activity:create",
    "read": "activity:read",
    "update": "activity:update",
    "delete": "activity:delete"
  }
}
```

**Key Points:**
- `id`: Unique module identifier (must match folder name)
- `routes`: Array of page routes (component files in `routes/` folder)
- `api.basePath`: Base path for all API endpoints
- `api.endpoints`: Array of API endpoint definitions
  - `method`: HTTP method (GET, POST, PATCH, DELETE, etc.)
  - `path`: Endpoint path relative to `basePath` (use `:id` for params)
  - `handler`: Handler file name (without `.ts` extension)
  - `requiresAuth`: Whether authentication is required
- `navigation`: Sidebar menu configuration
  - `icon`: Lucide React icon name (PascalCase)
  - `order`: Display order (lower numbers appear first)

---

## Step 9: Create React Components

### Activity List Component

**File:** `src/modules/activity/components/ActivityList.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useActivityStore } from '../store/activityStore';
import { useAuthStore } from '@/core/store/authStore';
import { ActivityCard } from './ActivityCard';
import { LoadingSpinner } from '@/core/components/common/LoadingSpinner';
import { EmptyState } from '@/core/components/common/EmptyState';
import { Button } from '@/core/components/ui/button';
import { Plus } from 'lucide-react';
import type { Activity } from '../types';

interface ActivityListProps {
  onCreateClick?: () => void;
  onEditClick?: (activity: Activity) => void;
}

export function ActivityList({ onCreateClick, onEditClick }: ActivityListProps) {
  const { activities, isLoading, error, setActivities, removeActivity, setLoading, setError } = useActivityStore();
  const { token } = useAuthStore();

  const fetchActivities = async () => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/activities', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch activities');
      }

      setActivities(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [token]);

  const handleDelete = async (id: number) => {
    if (!token || !confirm('Are you sure you want to delete this activity?')) {
      return;
    }

    try {
      const response = await fetch(`/api/activities/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete activity');
      }

      removeActivity(id);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete activity');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <p className="text-sm text-red-800">{error}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchActivities}
          className="mt-2"
        >
          Retry
        </Button>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div>
        {onCreateClick && (
          <div className="mb-4 flex justify-end">
            <Button onClick={onCreateClick}>
              <Plus className="h-4 w-4 mr-2" />
              Create Activity
            </Button>
          </div>
        )}
        <EmptyState
          title="No activities yet"
          description="Get started by creating your first activity"
          action={onCreateClick ? { label: 'Create Activity', onClick: onCreateClick } : undefined}
        />
      </div>
    );
  }

  return (
    <div>
      {onCreateClick && (
        <div className="mb-4 flex justify-end">
          <Button onClick={onCreateClick}>
            <Plus className="h-4 w-4 mr-2" />
            Create Activity
          </Button>
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {activities.map((activity) => (
          <ActivityCard
            key={activity.id}
            activity={activity}
            onEdit={onEditClick}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}
```

### Activity Card Component

**File:** `src/modules/activity/components/ActivityCard.tsx`

```typescript
'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import type { Activity } from '../types';
import { Trash2, Edit } from 'lucide-react';

interface ActivityCardProps {
  activity: Activity;
  onEdit?: (activity: Activity) => void;
  onDelete?: (id: number) => void;
}

export function ActivityCard({ activity, onEdit, onDelete }: ActivityCardProps) {
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{activity.title}</CardTitle>
            <p className="text-xs text-gray-500 mt-1">
              {activity.type} • {formatDate(activity.createdAt)}
            </p>
          </div>
          <div className="flex gap-2">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(activity)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(activity.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {activity.description && (
          <p className="text-sm text-gray-600">{activity.description}</p>
        )}
      </CardContent>
    </Card>
  );
}
```

### Activity Form Component

**File:** `src/modules/activity/components/ActivityForm.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createActivitySchema, type CreateActivityInput } from '../schemas/activityValidation';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Textarea } from '@/core/components/ui/textarea';
import { Select } from '@/core/components/ui/select';

interface ActivityFormProps {
  onSubmit: (data: CreateActivityInput) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  initialData?: Partial<CreateActivityInput>;
}

export function ActivityForm({
  onSubmit,
  onCancel,
  isLoading = false,
  initialData,
}: ActivityFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateActivityInput>({
    resolver: zodResolver(createActivitySchema),
    defaultValues: initialData,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFormSubmit = async (data: CreateActivityInput) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Title *
        </label>
        <Input
          id="title"
          {...register('title')}
          placeholder="Enter activity title"
        />
        {errors.title && (
          <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
          Type *
        </label>
        <select
          id="type"
          {...register('type')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="">Select type</option>
          <option value="task">Task</option>
          <option value="event">Event</option>
          <option value="reminder">Reminder</option>
        </select>
        {errors.type && (
          <p className="text-sm text-red-600 mt-1">{errors.type.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="Enter activity description (optional)"
          rows={4}
        />
        {errors.description && (
          <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
        )}
      </div>

      <div className="flex gap-2 justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting || isLoading}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting || isLoading}>
          {isSubmitting || isLoading ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </form>
  );
}
```

---

## Step 10: Create Route Components

### Main List Page

**File:** `src/modules/activity/routes/index.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ActivityList } from '../components/ActivityList';
import { ActivityForm } from '../components/ActivityForm';
import { Card, CardHeader, CardTitle, CardContent } from '@/core/components/ui/card';
import { useAuthStore } from '@/core/store/authStore';
import { useActivityStore } from '../store/activityStore';
import { createActivitySchema, type CreateActivityInput } from '../schemas/activityValidation';
import type { Activity } from '../types';

export default function ActivitiesPage() {
  const router = useRouter();
  const { token } = useAuthStore();
  const { addActivity, setLoading } = useActivityStore();
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (data: CreateActivityInput) => {
    if (!token) {
      alert('You must be logged in to create activities');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create activity');
      }

      addActivity(result.data);
      setShowForm(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to create activity');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (activity: Activity) => {
    // Navigate to edit page or show edit form
    router.push(`/activities/${activity.id}`);
  };

  if (showForm) {
    return (
      <div className="container mx-auto py-6 px-4 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Create New Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityForm
              onSubmit={handleCreate}
              onCancel={() => setShowForm(false)}
              isLoading={isSubmitting}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Activities</h1>
        <p className="text-gray-600 mt-2">Manage your activities</p>
      </div>
      <ActivityList
        onCreateClick={() => setShowForm(true)}
        onEditClick={handleEdit}
      />
    </div>
  );
}
```

### Create Page

**File:** `src/modules/activity/routes/new.tsx`

```typescript
'use client';

import { useRouter } from 'next/navigation';
import { ActivityForm } from '../components/ActivityForm';
import { Card, CardHeader, CardTitle, CardContent } from '@/core/components/ui/card';
import { useAuthStore } from '@/core/store/authStore';
import { useActivityStore } from '../store/activityStore';
import { createActivitySchema, type CreateActivityInput } from '../schemas/activityValidation';

export default function NewActivityPage() {
  const router = useRouter();
  const { token } = useAuthStore();
  const { addActivity } = useActivityStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (data: CreateActivityInput) => {
    if (!token) {
      alert('You must be logged in to create activities');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create activity');
      }

      addActivity(result.data);
      router.push('/activities');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to create activity');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-6 px-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Create New Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityForm
            onSubmit={handleCreate}
            onCancel={() => router.push('/activities')}
            isLoading={isSubmitting}
          />
        </CardContent>
      </Card>
    </div>
  );
}
```

**Note:** Add `import { useState } from 'react';` at the top if using useState.

---

## Step 11: Create Module Index File

**File:** `src/modules/activity/index.ts`

```typescript
// Module exports
export * from './types';
export * from './schemas/activitySchema';
export * from './schemas/activityValidation';
export * from './store/activityStore';
export * from './services/activityService';
export * from './components/ActivityCard';
export * from './components/ActivityForm';
export * from './components/ActivityList';
```

---

## Step 12: Generate and Run Database Migration

After creating the schema, generate and apply the migration:

```bash
# Generate migration
npx drizzle-kit generate --config=drizzle.config.ts

# Apply migration to database
npx drizzle-kit push
```

**Important:** The schema file must be named `*Schema.ts` and placed in the `schemas/` folder for Drizzle to auto-discover it (already configured in `drizzle.config.ts`).

---

## Step 13: Verify Module Registration

The module will be automatically discovered and registered when:
1. The `module.config.json` file exists
2. The module folder is in `src/modules/`
3. The folder name doesn't start with `_` (underscore)

**To verify:**
- Check the browser console for `[ModuleRegistry] Loaded X module(s)` message
- Check the sidebar - your module should appear automatically
- Visit `/activities` - the route should work
- Test API endpoints at `/api/activities`

---

## Summary Checklist

- [ ] Created folder structure
- [ ] Created database schema (`activitySchema.ts`)
- [ ] Created validation schema (`activityValidation.ts`)
- [ ] Created types (`types/index.ts`)
- [ ] Created service layer (`services/activityService.ts`)
- [ ] Created Zustand store (`store/activityStore.ts`)
- [ ] Created API handlers (`api/handlers/*.ts`)
- [ ] Created React components (`components/*.tsx`)
- [ ] Created route components (`routes/*.tsx`)
- [ ] Created module config (`module.config.json`)
- [ ] Created module index (`index.ts`)
- [ ] Generated and applied database migration
- [ ] Verified module appears in sidebar
- [ ] Tested routes and API endpoints

---

## Key Concepts Explained

### Auto-Discovery System

The framework automatically:
1. **Scans** `src/modules/` folder for module directories
2. **Loads** `module.config.json` from each module
3. **Registers** routes, API endpoints, and navigation items
4. **Dynamically routes** requests to appropriate handlers

### Module Configuration

The `module.config.json` is the **single source of truth** for:
- What routes the module exposes
- What API endpoints it provides
- How it appears in navigation
- What permissions it requires

### Dynamic Routing

- **Frontend routes:** Handled by `src/app/(dashboard)/[...slug]/page.tsx`
  - Matches route path from config
  - Dynamically imports component from `routes/` folder
  
- **API routes:** Handled by `src/app/api/[...path]/route.ts`
  - Matches endpoint path from config
  - Dynamically imports handler from `api/handlers/` folder

### Database Schema Discovery

Drizzle automatically discovers schemas matching the pattern:
- `./src/modules/**/schemas/*Schema.ts`

This is configured in `drizzle.config.ts`, so you just need to:
1. Create schema file with `*Schema.ts` naming
2. Run `drizzle-kit generate` to create migration
3. Run `drizzle-kit push` to apply to database

---

## Troubleshooting

### Module not appearing in sidebar
- Check `module.config.json` has `navigation` section
- Verify folder name matches module `id` in config
- Check browser console for errors

### Routes not working
- Verify route component exists in `routes/` folder
- Check component name matches `component` field in config
- Ensure component has default export

### API endpoints returning 404
- Check handler file exists in `api/handlers/`
- Verify handler exports function matching HTTP method (GET, POST, etc.)
- Check `basePath` and `path` in config are correct

### Database errors
- Ensure migration was generated and applied
- Check schema file naming (`*Schema.ts`)
- Verify database connection string in `.env.local`

---

That's it! You now have a complete understanding of how to create modules in this framework. The system handles all the wiring automatically - you just need to create the files following this structure.

