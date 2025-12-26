# Module Development Guide

Complete guide to creating, configuring, and developing modules in SubZero 2.0.

## Overview

Modules are **self-contained features** that can be added or removed without affecting other parts of the system. Each module includes its own API, components, routes, services, store, and schemas.

### Key Features

- ✅ **Auto-Discovery** - Modules are automatically discovered and registered
- ✅ **Zero Configuration** - Routes, APIs, and navigation auto-wired
- ✅ **Self-Contained** - All module code in one folder
- ✅ **Type-Safe** - Full TypeScript support

---

## Quick Start

### Option 1: Copy Template

```bash
cp -r src/modules/_template src/modules/your-module-name
```

### Option 2: Create from Scratch

Follow the step-by-step guide below.

---

## Step-by-Step Module Creation

### Step 1: Create Folder Structure

Create these folders in `src/modules/[moduleName]/`:

```
src/modules/[moduleName]/
├── api/handlers/      # API route handlers
├── components/         # React UI components
├── routes/            # Page components
├── schemas/           # Database and validation schemas
├── services/          # Business logic
├── store/            # Zustand state management
└── types/            # TypeScript type definitions
```

### Step 2: Create Database Schema

**File:** `src/modules/[moduleName]/schemas/[moduleName]Schema.ts`

```typescript
import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';

export const notesTable = pgTable('notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content'),
  userId: uuid('user_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Note = typeof notesTable.$inferSelect;
export type NewNote = typeof notesTable.$inferInsert;
```

**Important:** File must be named `*Schema.ts` for auto-discovery.

### Step 3: Create Validation Schema

**File:** `src/modules/[moduleName]/schemas/[moduleName]Validation.ts`

```typescript
import { z } from 'zod';

export const createNoteSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string().optional(),
});

export const updateNoteSchema = createNoteSchema.partial();

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
```

### Step 4: Create Type Definitions

**File:** `src/modules/[moduleName]/types/index.ts`

```typescript
export type { Note, NewNote } from '../schemas/notesSchema';
export type { CreateNoteInput, UpdateNoteInput } from '../schemas/notesValidation';
```

### Step 5: Create Service Layer

**File:** `src/modules/[moduleName]/services/[moduleName]Service.ts`

```typescript
import { db } from '@/core/lib/db';
import { notesTable } from '../schemas/notesSchema';
import { eq } from 'drizzle-orm';
import type { CreateNoteInput, UpdateNoteInput } from '../types';

export async function getNotesByUserId(userId: string) {
  return await db
    .select()
    .from(notesTable)
    .where(eq(notesTable.userId, userId));
}

export async function createNote(userId: string, data: CreateNoteInput) {
  const [note] = await db
    .insert(notesTable)
    .values({ ...data, userId })
    .returning();
  return note;
}

export async function updateNote(id: string, data: UpdateNoteInput) {
  const [note] = await db
    .update(notesTable)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(notesTable.id, id))
    .returning();
  return note;
}

export async function deleteNote(id: string) {
  await db.delete(notesTable).where(eq(notesTable.id, id));
}
```

### Step 6: Create Zustand Store

**File:** `src/modules/[moduleName]/store/[moduleName]Store.ts`

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Note } from '../types';

interface NotesState {
  notes: Note[];
  loading: boolean;
  error: string | null;
  setNotes: (notes: Note[]) => void;
  addNote: (note: Note) => void;
  updateNote: (id: string, note: Partial<Note>) => void;
  removeNote: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useNotesStore = create<NotesState>()(
  persist(
    (set) => ({
      notes: [],
      loading: false,
      error: null,
      setNotes: (notes) => set({ notes }),
      addNote: (note) => set((state) => ({ notes: [...state.notes, note] })),
      updateNote: (id, updates) =>
        set((state) => ({
          notes: state.notes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
        })),
      removeNote: (id) =>
        set((state) => ({ notes: state.notes.filter((n) => n.id !== id) })),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
    }),
    { name: 'notes-storage' }
  )
);
```

### Step 7: Create API Handlers

**File:** `src/modules/[moduleName]/api/handlers/list.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { getNotesByUserId } from '../../services/notesService';

export async function GET(request: NextRequest) {
  try {
    const authMiddleware = requireAuth();
    const authResult = await authMiddleware(request);
    
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    const userId = authResult;
    const notes = await getNotesByUserId(userId);
    
    return NextResponse.json({ success: true, data: notes });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**File:** `src/modules/[moduleName]/api/handlers/create.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { createNote } from '../../services/notesService';
import { createNoteSchema } from '../../schemas/notesValidation';

export async function POST(request: NextRequest) {
  try {
    const authMiddleware = requireAuth();
    const authResult = await authMiddleware(request);
    
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    const userId = authResult;
    const body = await request.json();
    const data = createNoteSchema.parse(body);
    
    const note = await createNote(userId, data);
    
    return NextResponse.json({ success: true, data: note }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**Create similar handlers for:**
- `getById.ts` - GET single item
- `update.ts` - PATCH update item
- `delete.ts` - DELETE item

**Requirements:**
- Export named function matching HTTP method (GET, POST, PATCH, DELETE)
- Use authentication middleware
- Use validation middleware for POST/PATCH
- Return proper HTTP responses

### Step 8: Create Module Configuration

**File:** `src/modules/[moduleName]/module.config.json`

```json
{
  "id": "notes",
  "name": "Notes",
  "version": "1.0.0",
  "description": "Note-taking module",
  "enabled": true,
  "routes": [
    {
      "path": "/notes",
      "component": "index",
      "title": "My Notes"
    },
    {
      "path": "/notes/new",
      "component": "new",
      "title": "Create Note"
    }
  ],
  "api": {
    "basePath": "/api/notes",
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
    "label": "Notes",
    "icon": "FileText",
    "path": "/notes",
    "order": 2
  },
  "permissions": {
    "create": "notes:create",
    "read": "notes:read",
    "update": "notes:update",
    "delete": "notes:delete"
  }
}
```

**Important:** Module `id` must match folder name.

### Step 9: Create React Components

**File:** `src/modules/[moduleName]/components/NoteList.tsx`

```typescript
'use client';

import { useEffect } from 'react';
import { useNotesStore } from '../store/notesStore';
import { Button } from '@/core/components/ui/button';

export function NoteList() {
  const { notes, loading, setNotes, setLoading } = useNotesStore();

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notes');
      const data = await res.json();
      setNotes(data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {notes.map((note) => (
        <div key={note.id}>{note.title}</div>
      ))}
    </div>
  );
}
```

### Step 10: Create Route Components

**File:** `src/modules/[moduleName]/routes/index.tsx`

```typescript
'use client';

import { NoteList } from '../components/NoteList';

export default function NotesPage() {
  return (
    <div>
      <h1>My Notes</h1>
      <NoteList />
    </div>
  );
}
```

**Important:** Route components must have **default export**.

### Step 11: Generate Database Migration

```bash
npm run db:generate
npm run db:migrate
```

### Step 12: Verify Module Registration

- ✅ Check browser console for module loaded message
- ✅ Sidebar navigation appears automatically
- ✅ Routes work at configured paths
- ✅ API endpoints respond correctly

---

## Module Configuration Explained

`module.config.json` is the **manifest file** that tells the framework everything about your module.

### Basic Module Info

```json
{
  "id": "notes",           // Must match folder name
  "name": "Notes",         // Display name
  "version": "1.0.0",      // Module version
  "description": "...",    // Module description
  "enabled": true          // false = hidden from UI
}
```

### Routes Configuration

```json
"routes": [
  {
    "path": "/notes",           // URL path
    "component": "index",        // File name (without .tsx)
    "title": "My Notes"         // Page title
  }
]
```

**File mapping:** `component: "index"` → `routes/index.tsx`

### API Endpoints Configuration

```json
"api": {
  "basePath": "/api/notes",
  "endpoints": [
    {
      "method": "GET",
      "path": "",                // Relative to basePath
      "handler": "list",         // File name (without .ts)
      "requiresAuth": true
    }
  ]
}
```

**File mapping:** `handler: "list"` → `api/handlers/list.ts` (exports `GET` function)

**Route parameters:** `path: "/:id"` accepts dynamic ID

### Navigation Configuration

```json
"navigation": {
  "label": "Notes",              // Sidebar text
  "icon": "FileText",            // Lucide React icon name
  "path": "/notes",              // Link destination
  "order": 2                     // Display order (lower = first)
}
```

**Icons:** Use PascalCase names from [Lucide Icons](https://lucide.dev/icons/)

### Permissions Configuration

```json
"permissions": {
  "create": "notes:create",
  "read": "notes:read",
  "update": "notes:update",
  "delete": "notes:delete"
}
```

Follows pattern: `[module]:[action]`

---

## Auto-Discovery System

The framework automatically:

1. **Scans** `src/modules/` for module directories
2. **Loads** `module.config.json` from each module
3. **Registers** routes, API endpoints, and navigation
4. **Dynamically routes** requests to handlers

**Without `module.config.json`, your module won't be recognized!**

---

## Key Requirements

- ✅ **Schema naming:** Must be `*Schema.ts` in `schemas/` folder
- ✅ **Config file:** Must be `module.config.json` in module root
- ✅ **Module ID:** Must match folder name
- ✅ **Route components:** Must have default export
- ✅ **API handlers:** Must export named function matching HTTP method

---

## Best Practices

1. **Keep modules self-contained** - All code in module folder
2. **Use TypeScript** - Leverage type safety
3. **Follow naming conventions** - Consistent patterns
4. **Validate inputs** - Always use Zod schemas
5. **Handle errors** - Consistent error handling
6. **Test modules** - Test independently

---

## Troubleshooting

### Module Not in Sidebar
- Check `module.config.json` has `navigation` section
- Verify folder name matches module `id`
- Check `enabled` is `true`

### Routes Not Working
- Verify component exists in `routes/` folder
- Check component name matches config
- Ensure default export exists

### API Endpoints 404
- Check handler file exists in `api/handlers/`
- Verify handler exports correct HTTP method function
- Check `basePath` and `path` in config

### Database Errors
- Ensure migration was generated and applied
- Check schema file naming (`*Schema.ts`)
- Verify database connection string

---

## Disabling a Module

Set `"enabled": false` in `module.config.json`:
- ❌ Module hidden from UI
- ❌ Routes return 404
- ❌ API endpoints return 404
- ✅ Module code remains (can be re-enabled)

---

## Module Seed File (Optional)

**File:** `src/modules/[moduleName]/seeds/seed.ts`

```typescript
import { notesTable } from '../schemas/notesSchema';
import { users } from '@/core/lib/db/baseSchema';
import { eq } from 'drizzle-orm';

export default async function seedNotes(db: any) {
  const demoUsers = await db
    .select()
    .from(users)
    .where(eq(users.email, 'user@example.com'))
    .limit(1);

  if (demoUsers.length === 0) return;

  const existing = await db.select().from(notesTable).limit(1);
  if (existing.length > 0) return;

  await db.insert(notesTable).values({
    title: 'Demo Note',
    content: 'This is a demo note',
    userId: demoUsers[0].id,
  });
}
```

Run: `npm run seed`

---

## Next Steps

- **Understand RBAC:** See [RBAC.md](./RBAC.md) for permissions
- **UI Components:** See [UI_COMPONENTS.md](./UI_COMPONENTS.md) for available components
- **Database:** See [DATABASE.md](./DATABASE.md) for migrations and seeding

---

**Ready to build?** Start with the template module or follow the steps above!

