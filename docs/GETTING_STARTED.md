# Getting Started

Complete guide to setting up and running SubZero 2.0.

## Prerequisites

- **Node.js** 18+ installed
- **PostgreSQL** database running
- **npm** or **yarn** package manager

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Create `.env.local` file in the project root:

```bash
cp .env.example .env.local
```

**Required Environment Variables:**

```env
# Database Connection (REQUIRED)
DATABASE_URL=postgresql://username:password@localhost:5432/database_name

# Multi-Tenancy (REQUIRED - Choose one)
MULTI_TENANT_ENABLED=true   # For multi-tenant mode
# MULTI_TENANT_ENABLED=false  # For single-tenant mode

# Authentication (REQUIRED)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
# Generate with: openssl rand -base64 32

# JWT Expiration (Optional)
JWT_ACCESS_TOKEN_EXPIRES_IN=15m
JWT_REFRESH_TOKEN_EXPIRES_IN=7d

# Application URL (Optional)
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

**Complete Environment Example:**

See `.env.example` for all available configuration options including:
- External auth providers (Google, GitHub, Azure AD)
- Email configuration (SMTP)
- Feature flags
- Logging and monitoring
- Rate limiting
- File storage (AWS S3)

### 3. Database Setup

#### Step 1: Initialize Database

```bash
npm run db:init
```

This creates the database if it doesn't exist.

#### Step 2: Generate Migrations

```bash
npm run db:generate
```

**Important:** Make sure `MULTI_TENANT_ENABLED` is set correctly in `.env.local` before running this command, as it determines which schema is generated.

#### Step 3: Apply Migrations

```bash
npm run db:migrate
```

This creates all tables in your database.

#### Step 4: Seed Initial Data

```bash
npm run seed
```

This creates:
- Default tenant (if multi-tenant mode)
- Demo users (Super Admin, Tenant Admin, Manager, Viewer)
- Roles and permissions
- Module data

**Default Credentials:**
- **Super Admin**: `admin@example.com` / `password123`
- **Tenant Admin**: `admin@acme.com` / `password123`
- **Manager**: `manager@acme.com` / `password123`
- **Viewer**: `viewer@techstart.com` / `password123`

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Multi-Tenancy Configuration

### Choosing Your Mode

**Multi-Tenant Mode** (`MULTI_TENANT_ENABLED=true`):
- ✅ Supports multiple organizations/companies
- ✅ Data isolation per tenant
- ✅ Users can belong to multiple tenants
- ✅ Tenant-specific roles and permissions
- ✅ Best for B2B SaaS applications

**Single-Tenant Mode** (`MULTI_TENANT_ENABLED=false`):
- ✅ Simpler database schema
- ✅ Faster queries (no tenant filtering)
- ✅ Easier to manage
- ✅ Best for internal tools or single-company apps

### Setting Multi-Tenancy Mode

1. **Set in `.env.local`:**
   ```env
   MULTI_TENANT_ENABLED=true   # or false
   ```

2. **Generate migrations:**
   ```bash
   npm run db:generate
   ```

3. **Apply migrations:**
   ```bash
   npm run db:migrate
   ```

**⚠️ Warning:** Changing `MULTI_TENANT_ENABLED` after initial setup requires dropping and recreating the database. See [MULTI_TENANCY.md](./MULTI_TENANCY.md) for details.

---

## Database Commands Reference

| Command | Purpose |
|---------|---------|
| `npm run db:init` | Create database if it doesn't exist |
| `npm run db:generate` | Generate migration files from schema |
| `npm run db:migrate` | Apply migrations to database |
| `npm run db:drop` | Drop all tables (⚠️ DESTRUCTIVE) |
| `npm run db:seed` | Seed database with initial data |
| `npm run db:studio` | Open Drizzle Studio (database GUI) |
| `npm run db:reset` | Drop + migrate + seed (⚠️ DESTRUCTIVE) |

---

## Verification Checklist

After setup, verify everything is working:

### Database Verification

```bash
# Connect to database
psql -U username -d database_name

# List tables
\dt

# For multi-tenant mode, verify:
# - tenants table exists
# - users table has tenant_id column

# For single-tenant mode, verify:
# - tenants table does NOT exist
# - users table has NO tenant_id column
```

### Application Verification

- [ ] Development server starts without errors
- [ ] Can access login page at `/login`
- [ ] Can log in with default credentials
- [ ] Redirects to dashboard after login
- [ ] Sidebar navigation appears
- [ ] API endpoints respond correctly

---

## Troubleshooting

### Database Connection Error

**Error:** `DATABASE_URL environment variable is not set`

**Solution:**
1. Check `.env.local` exists in project root
2. Verify `DATABASE_URL` is set correctly
3. Restart development server after adding env variables

### Migration Errors

**Error:** `relation already exists`

**Solution:**
```bash
npm run db:drop
npm run db:generate
npm run db:migrate
```

### Environment Variable Not Read

**Solution:**
1. Ensure `.env.local` exists in project root
2. Restart development server
3. Check variable format (no spaces around `=`)

### Seed Script Fails

**Solution:**
1. Ensure migrations were applied: `npm run db:migrate`
2. Check database connection
3. Verify tables exist: `\dt` in psql
4. Check seed script output for specific errors

### Login Not Working

**Solution:**
1. Verify database has seeded users
2. Check API response in Network tab
3. Verify password hashing matches
4. Check browser console for errors

---

## Next Steps

1. **Read Architecture:** [ARCHITECTURE.md](./ARCHITECTURE.md)
2. **Create Your First Module:** [MODULES.md](./MODULES.md)
3. **Understand RBAC:** [RBAC.md](./RBAC.md)
4. **Configure Multi-Tenancy:** [MULTI_TENANCY.md](./MULTI_TENANCY.md)

---

## Additional Resources

- **Database Setup:** See [DATABASE.md](./DATABASE.md) for detailed database management
- **Environment Variables:** See `.env.example` for all available options
- **Multi-Tenancy:** See [MULTI_TENANCY.md](./MULTI_TENANCY.md) for complete guide

---

**Ready to build?** Start by creating your first module! See [MODULES.md](./MODULES.md).

