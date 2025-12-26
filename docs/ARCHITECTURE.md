# Architecture Overview

Complete guide to SubZero 2.0 architecture, structure, and design patterns.

## System Overview

SubZero 2.0 is a **modular, scalable framework** built with:
- **Next.js 14** (App Router)
- **TypeScript** (Type safety throughout)
- **PostgreSQL** (Database)
- **Drizzle ORM** (Database queries)
- **Zustand** (State management)
- **Zod** (Validation)

### Architecture Rating: 7.5/10

**Current State:** Well-structured for MVP to mid-scale applications  
**Target:** Enterprise/SaaS multi-tenant scenarios

---

## Project Structure

```
project-root/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Authentication routes
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (dashboard)/              # Protected dashboard routes
│   │   │   ├── dashboard/
│   │   │   ├── [...slug]/            # Universal dynamic module routes
│   │   │   └── layout.tsx            # Dashboard layout
│   │   └── api/                      # API routes
│   │       ├── auth/                 # Core auth endpoints
│   │       └── [...path]/            # Universal dynamic API routes
│   │
│   ├── core/                         # Core system (shared infrastructure)
│   │   ├── components/
│   │   │   ├── ui/                   # ShadCN UI components
│   │   │   ├── layout/                # Layout components (Sidebar, Topbar)
│   │   │   └── common/               # Common components (DataTable, PermissionGate)
│   │   ├── hooks/                    # Shared React hooks
│   │   ├── lib/
│   │   │   ├── db/                   # Database (Drizzle client, schemas)
│   │   │   ├── moduleLoader.ts       # Module auto-discovery
│   │   │   ├── permissions.ts        # Permission utilities
│   │   │   └── services/             # Core services (not module-specific)
│   │   ├── middleware/               # Middleware functions
│   │   ├── store/                    # Core stores (auth, global)
│   │   ├── config/                   # Configuration (module registry)
│   │   └── types/                    # Shared TypeScript types
│   │
│   └── modules/                      # Feature modules (plug-and-play)
│       ├── notes/                    # Example module
│       │   ├── module.config.json    # Module manifest
│       │   ├── api/handlers/         # API handlers
│       │   ├── components/          # React components
│       │   ├── routes/              # Page components
│       │   ├── services/            # Business logic
│       │   ├── store/               # Zustand store
│       │   ├── schemas/             # Database & validation schemas
│       │   └── types/               # Module types
│       └── _template/               # Template for new modules
│
├── drizzle/                         # Database migrations
├── .env.local                       # Environment variables
└── package.json
```

---

## Core System (`src/core`)

The core layer provides **shared infrastructure** used by all modules.

### What Core Does

- ✅ **Application backbone**: Auth, permissions, routing, stores, UI shell
- ✅ **Never module-specific**: No business logic for single modules
- ✅ **Stable contracts**: Provides hooks, services, types, patterns

### Core Components

#### `components/ui`
ShadCN-based UI primitives (Button, Input, Dialog, Table, etc.)  
**Used by:** All modules for consistent design

#### `components/layout`
Layout shell (Sidebar, Topbar, DashboardLayout, Footer)  
**How it works:** Reads module registry to build navigation

#### `components/common`
Shared functional components:
- `DataTable` - Reusable data tables
- `PermissionGate` - Conditional rendering based on permissions
- `ProtectedPage` - Page-level permission protection
- `EmptyState` - Empty state displays
- `LoadingSpinner` - Loading indicators

#### `hooks`
Shared React hooks:
- `useAuth` - Current user, role, auth state
- `usePermissions` - Permission checks
- `useApi` - Standardized HTTP calls
- `useToast` - Toast notifications
- `useModuleRoutes` - Dynamic route helpers

**Rule:** When a hook exists here, **use it**. Don't create custom replacements in modules.

#### `lib/db`
Database layer:
- Drizzle client connection
- Base schemas (users, roles, permissions, tenants)
- Migrations

**Modules:** Reference core tables when needed, but keep their own schemas in `src/modules/[module]/schemas`

#### `lib/moduleLoader.ts`
Auto-discovers modules from `src/modules`, reads `module.config.json`, registers them.

**Effect:**
- Dashboard routes auto-wired
- API endpoints auto-registered
- Navigation generated from configs

#### `lib/permissions.ts`
Core permission utilities for API and UI:
- Check if user has `module:action` permissions
- Integrates with `PermissionGate`, `ProtectedPage`, backend guards

#### `lib/services`
Core business services **not tied to a single module**:
- `rolesService` - Role management
- `rolePermissionsService` - Permission management
- `usersService` - User management

**Rule:** Module-specific behavior stays in `src/modules/[module]/services`

#### `middleware`
Reusable middlewares:
- `auth` - Authentication
- `permissions` - Permission checks
- `validation` - Request validation
- `rateLimit` - Rate limiting
- `logger` - Logging

**How modules use it:** Reference middleware keys in config (e.g., `"middleware": ["auth", "permission:notes.read"]`)

#### `store`
Global and factory stores:
- `storeRegistry` - Auto store loader
- `authStore` - Authentication state
- `globalStore` - Global application state

**Pattern:** Provides standard pattern for module stores via `createModuleStore`

#### `config`
Global app configuration:
- `moduleRegistry.ts` - Central source of truth for enabled modules
- `app.config.ts` - Application configuration

---

## Module System

### Module Structure

Each module is **self-contained** with:

```
src/modules/[module-name]/
├── module.config.json          # Module manifest (REQUIRED)
├── api/
│   └── handlers/              # API route handlers
├── components/                 # React components
├── routes/                     # Page components
├── services/                   # Business logic
├── store/                      # Zustand store
├── schemas/                    # Database & validation schemas
└── types/                      # TypeScript types
```

### Auto-Discovery

The framework automatically:
1. **Discovers** modules from `src/modules/` folder
2. **Loads** `module.config.json` from each module
3. **Registers** routes, API endpoints, navigation
4. **Wires** everything together without manual code changes

### Module Configuration

`module.config.json` is the **single source of truth**:

```json
{
  "id": "notes",
  "name": "Notes",
  "version": "1.0.0",
  "enabled": true,
  "routes": [...],
  "api": {...},
  "navigation": {...},
  "permissions": {...}
}
```

See [MODULES.md](./MODULES.md) for complete module development guide.

---

## How Core and Modules Work Together

1. **Core discovers modules** using `moduleLoader` + `moduleRegistry` + `module.config.json`
2. **Core exposes contracts** (types, hooks, services, middleware) that modules must follow
3. **Modules provide:**
   - Their own schemas, API handlers, stores, components, routes
   - A `module.config.json` that declares routes, APIs, navigation, permissions
4. **Core handles:**
   - Auth, role and permission evaluation
   - Routing and API dispatching to the right module
   - Shared UI and UX patterns

**Rule:** Treat `src/core` as **read-only infrastructure**. Plug into it using defined patterns.

---

## Strengths

### ✅ Modular Architecture
- Clear separation: `core/` vs `modules/`
- Self-contained modules
- Easy to add/remove modules
- Consistent folder structure

### ✅ Auto-Discovery System
- Zero-configuration module registration
- Automatic route and API endpoint discovery
- Dynamic routing without manual wiring

### ✅ Configuration-Driven
- `module.config.json` as single source of truth
- JSON-based configuration (easy to modify)
- Feature flags (`enabled` property)

### ✅ Type Safety
- TypeScript throughout
- Zod validation schemas
- Type inference from schemas

### ✅ Developer Experience
- Clear documentation
- Template module (`_template`)
- Step-by-step guides
- Consistent patterns

---

## Areas for Improvement

### ⚠️ Configuration Limitations
- No runtime config updates (requires restart)
- No environment-specific configs
- No per-tenant configuration
- No config validation

**Impact:** Medium scalability, low flexibility

### ⚠️ Module Dependencies
- No dependency management
- No load order control
- No dependency validation
- No version constraints

**Impact:** Medium scalability, low flexibility

### ⚠️ Database Schema Management
- No schema versioning per module
- No migration isolation
- No rollback per module

**Impact:** High scalability concern

### ⚠️ Performance at Scale
- No caching strategy
- No lazy loading of modules
- No code splitting per module

**Impact:** Important for enterprise

---

## Scalability Scorecard

| Aspect | Current | Target | Gap |
|--------|---------|--------|-----|
| Module Isolation | ✅ 9/10 | 10/10 | Low |
| Configuration | ⚠️ 6/10 | 10/10 | Medium |
| Dependencies | ❌ 3/10 | 10/10 | High |
| Multi-Tenancy | ✅ 8/10 | 10/10 | Low |
| Performance | ⚠️ 5/10 | 10/10 | Medium |
| Testing | ❌ 2/10 | 10/10 | High |
| Extensibility | ⚠️ 6/10 | 10/10 | Medium |
| Developer Experience | ✅ 8/10 | 10/10 | Low |

**Overall Scalability:** 5.4/10 → Needs improvement for enterprise

---

## Recommendations by Priority

### Priority 1: Critical for Enterprise/SaaS

1. **Multi-Tenancy Support** ✅ (Already implemented)
2. **Module Dependencies** - Dependency declaration, load order, version constraints
3. **Configuration System** - Environment-specific configs, runtime updates, validation

### Priority 2: Important for Scale

4. **Database Migrations** - Per-module migrations, versioning, rollback
5. **Performance Optimization** - Module lazy loading, caching, query optimization
6. **Testing Framework** - Module testing utilities, integration tests, mocks

### Priority 3: Nice to Have

7. **Module Marketplace** - npm package support, installation CLI, updates
8. **Extension Points** - Hooks/events system, plugin architecture, lifecycle management

---

## File Naming Conventions

- **Components**: PascalCase (e.g., `NoteForm.tsx`)
- **Services**: camelCase with "Service" suffix (e.g., `notesService.ts`)
- **Stores**: camelCase with "Store" suffix (e.g., `notesStore.ts`)
- **Schemas**: camelCase with "Schema" suffix (e.g., `notesSchema.ts`)
- **Handlers**: camelCase (e.g., `list.ts`, `create.ts`)

---

## Best Practices

1. **Keep modules self-contained** - All module code in module folder
2. **Use TypeScript** - Leverage type safety throughout
3. **Follow naming conventions** - Consistent patterns
4. **Validate inputs** - Always use Zod schemas
5. **Handle errors** - Consistent error handling
6. **Test modules** - Test each module independently

---

## Next Steps

- **Create a module:** See [MODULES.md](./MODULES.md)
- **Understand RBAC:** See [RBAC.md](./RBAC.md)
- **Configure multi-tenancy:** See [MULTI_TENANCY.md](./MULTI_TENANCY.md)

---

**Current State:** Excellent for MVP/Mid-scale  
**Verdict:** Scalable and flexible for single-tenant applications up to ~50 modules. For enterprise/SaaS multi-tenant scenarios, consider Priority 1 enhancements.

