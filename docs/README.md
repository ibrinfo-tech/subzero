# SubZero 2.0 Documentation

Welcome to the SubZero 2.0 documentation! This is a modular, scalable framework built with Next.js, TypeScript, and PostgreSQL.

## 📚 Documentation Structure

### 🚀 Getting Started
- **[GETTING_STARTED.md](./GETTING_STARTED.md)** - Installation, setup, environment configuration, and database initialization

### 🏗️ Architecture
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture, project structure, core system overview, and scalability assessment

### 📦 Modules
- **[MODULES.md](./MODULES.md)** - Complete guide to creating, configuring, and developing modules

### 🔐 Authentication & Authorization
- **[AUTHENTICATION.md](./AUTHENTICATION.md)** - Authentication system, login, registration, tokens, and configuration

### 👥 RBAC (Role-Based Access Control)
- **[RBAC.md](./RBAC.md)** - Permissions, roles, user management, and permission-based UI

### 🏢 Multi-Tenancy
- **[MULTI_TENANCY.md](./MULTI_TENANCY.md)** - Multi-tenant architecture, conditional schema, and tenant management

### 💾 Database
- **[DATABASE.md](./DATABASE.md)** - Database setup, migrations, seeding, and schema management

### 🎨 UI Components
- **[UI_COMPONENTS.md](./UI_COMPONENTS.md)** - Available UI components, usage examples, and best practices

### 🐛 Troubleshooting
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Common issues, solutions, and debugging tips

---

## 🎯 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your database credentials
   ```

3. **Initialize database:**
   ```bash
   npm run db:init
   npm run db:generate
   npm run db:migrate
   npm run seed
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

For detailed instructions, see [GETTING_STARTED.md](./GETTING_STARTED.md).

---

## 🏗️ Key Features

- ✅ **Modular Architecture** - Self-contained modules with auto-discovery
- ✅ **Multi-Tenancy Support** - Conditional multi-tenant schema
- ✅ **RBAC System** - Role-based access control with permissions
- ✅ **Auto-Loading** - Routes, APIs, and navigation auto-registered
- ✅ **Type Safety** - Full TypeScript support
- ✅ **Database Migrations** - Drizzle ORM with automatic migrations
- ✅ **Permission-Based UI** - Dynamic UI based on user permissions

---

## 📖 Documentation Guide

### For New Developers

1. Start with **[GETTING_STARTED.md](./GETTING_STARTED.md)** to set up your environment
2. Read **[ARCHITECTURE.md](./ARCHITECTURE.md)** to understand the system structure
3. Follow **[MODULES.md](./MODULES.md)** to create your first module
4. Review **[RBAC.md](./RBAC.md)** for permission system details

### For Module Development

- **[MODULES.md](./MODULES.md)** - Complete module development guide
- **[UI_COMPONENTS.md](./UI_COMPONENTS.md)** - Available components and patterns

### For System Administration

- **[AUTHENTICATION.md](./AUTHENTICATION.md)** - Auth configuration
- **[RBAC.md](./RBAC.md)** - Role and permission management
- **[MULTI_TENANCY.md](./MULTI_TENANCY.md)** - Multi-tenant setup

### For Database Management

- **[DATABASE.md](./DATABASE.md)** - Migrations, seeding, and schema management

---

## 🔍 Quick Reference

### Common Commands

```bash
# Database
npm run db:init          # Initialize database
npm run db:generate     # Generate migrations
npm run db:migrate      # Apply migrations
npm run db:seed         # Seed database
npm run db:studio       # Open Drizzle Studio

# Development
npm run dev             # Start dev server
npm run build           # Build for production
npm run lint            # Run linter
```

### Default Credentials

After seeding:
- **Super Admin**: `admin@example.com` / `password123`
- **Tenant Admin**: `admin@acme.com` / `password123`

---

## 📁 Project Structure

```
src/
├── core/           # Core system (auth, permissions, routing)
├── modules/        # Feature modules (plug-and-play)
└── app/            # Next.js app router
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed structure.

---

## 🆘 Need Help?

- Check **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** for common issues
- Review the relevant documentation section
- Check inline code comments for implementation details

---

## 📝 Documentation Updates

This documentation is actively maintained. If you find issues or have suggestions, please update the relevant documentation file.

**Last Updated:** December 2024

