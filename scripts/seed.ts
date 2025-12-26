/**
 * Database Seed Script - Conditional Multi-Tenancy Support
 * 
 * This seed script supports both multi-tenant and single-tenant modes
 * based on the MULTI_TENANT_ENABLED environment variable.
 * 
 * Multi-Tenant Mode (MULTI_TENANT_ENABLED=true):
 * - Creates tenants table and default tenant
 * - Adds tenantId to users, roles, and user_roles
 * - Supports multiple organizations
 * 
 * Single-Tenant Mode (MULTI_TENANT_ENABLED=false):
 * - No tenants table
 * - No tenantId columns
 * - Simpler schema for single organization
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables FIRST before importing db
const envPaths = [
  path.resolve(process.cwd(), '.env.local'),
  path.resolve(process.cwd(), '.env'),
];

let loaded = false;
let lastError: Error | null = null;

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    const result = dotenv.config({ path: envPath, override: true });
    if (!result.error) {
      loaded = true;
      console.log(`✓ Loaded environment variables from ${path.basename(envPath)}`);
      if (process.env.DATABASE_URL) {
        const dbUrl = process.env.DATABASE_URL;
        const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ':****@');
        console.log(`✓ DATABASE_URL found: ${maskedUrl.substring(0, 50)}...`);
      }
      if (process.env.MULTI_TENANT_ENABLED !== undefined) {
        console.log(`✓ MULTI_TENANT_ENABLED: ${process.env.MULTI_TENANT_ENABLED}`);
      }
      break;
    } else {
      lastError = result.error;
    }
  }
}

if (!process.env.DATABASE_URL) {
  console.error('\n❌ DATABASE_URL not found in environment variables\n');
  console.error('   Tried loading from:');
  envPaths.forEach((p) => {
    const exists = fs.existsSync(p) ? '✓ exists' : '✗ not found';
    console.error(`   - ${path.basename(p)} ${exists}`);
  });
  if (lastError) {
    console.error(`\n   Error: ${lastError.message}`);
  }
  console.error('\n   📝 Setup Instructions:');
  console.error('   1. Ensure .env or .env.local exists in project root');
  console.error('   2. Add DATABASE_URL to the file:');
  console.error('      DATABASE_URL=postgresql://user:password@host:port/database');
  console.error('   3. Run the seed command again:');
  console.error('      npm run seed\n');
  process.exit(1);
}

import { eq } from 'drizzle-orm';

/**
 * Main seed function with conditional multi-tenancy support
 */
async function seed() {
  const { db } = await import('../src/core/lib/db');
  const {
    roles,
    permissions,
    modules,
    rolePermissions,
    tenants,
    users,
    userRoles,
    authProviders,
    MULTI_TENANT_ENABLED,
  } = await import('../src/core/lib/db/baseSchema');
  const { moduleFields, roleModuleAccess } = await import('../src/core/lib/db/permissionSchema');
  const { hashPassword } = await import('../src/core/lib/utils');

  console.log('🌱 Starting database seed...\n');
  console.log(`🔧 Multi-Tenancy Mode: ${MULTI_TENANT_ENABLED ? 'ENABLED ✅' : 'DISABLED ❌'}\n`);

  try {
    // ============================================================================
    // 1. TENANTS (Only if multi-tenancy is enabled)
    // ============================================================================
    let seededTenants: any[] = [];

    if (MULTI_TENANT_ENABLED) {
      console.log('🏢 Seeding tenants...');

      if (!tenants) {
        throw new Error('MULTI_TENANT_ENABLED=true but tenants table is null. Check baseSchema.ts');
      }

      const tenantData = [
        {
          name: 'Default Organization',
          slug: 'default',
          status: 'active' as const,
          plan: 'free' as const,
          maxUsers: 100,
          settings: { theme: 'light', timezone: 'UTC' },
          metadata: {},
        },
      ];

      const existingTenants = await db.select().from(tenants);
      const existingSlugs = new Set(existingTenants.map((t) => t.slug));
      const tenantsToInsert = tenantData.filter((t) => !existingSlugs.has(t.slug));

      if (tenantsToInsert.length > 0) {
        const newTenants = await db.insert(tenants).values(tenantsToInsert).returning();
        seededTenants = [...existingTenants, ...newTenants];
        console.log(`✅ Created ${newTenants.length} tenant(s)`);
      } else {
        seededTenants = existingTenants;
        console.log(`ℹ️  Tenants already exist (${existingTenants.length} total)`);
      }
      console.log('');
    } else {
      console.log('⏭️  Skipping tenant seeding (multi-tenancy disabled)\n');
    }

    // ============================================================================
    // 2. MODULES
    // ============================================================================
    console.log('📦 Seeding modules...');

    const coreModuleData = [
      {
        name: 'Dashboard',
        code: 'DASHBOARD',
        description: 'Main dashboard and overview',
        icon: 'LayoutDashboard',
        sortOrder: 1,
        isActive: true,
      },
      {
        name: 'Profile',
        code: 'PROFILE',
        description: 'User profile management',
        icon: 'User',
        sortOrder: 2,
        isActive: true,
      },
      {
        name: 'User Management',
        code: 'USERS',
        description: 'Manage users',
        icon: 'Users',
        sortOrder: 3,
        isActive: true,
      },
      {
        name: 'Role Management',
        code: 'ROLES',
        description: 'Manage roles and permissions',
        icon: 'Shield',
        sortOrder: 4,
        isActive: true,
      },
      {
        name: 'Settings',
        code: 'SETTINGS',
        description: 'System settings',
        icon: 'Settings',
        sortOrder: 5,
        isActive: true,
      },
    ];

    // Discover dynamic modules
    const { discoverModules, loadModuleConfig } = await import('../src/core/lib/moduleLoader');
    const discoveredModuleIds = discoverModules();
    console.log(`   Found ${discoveredModuleIds.length} dynamic module(s)`);

    const dynamicModuleData = [];
    let maxSortOrder = Math.max(...coreModuleData.map(m => m.sortOrder), 0);

    for (const moduleId of discoveredModuleIds) {
      const config = loadModuleConfig(moduleId);
      if (config && config.enabled !== false) {
        maxSortOrder++;
        dynamicModuleData.push({
          name: config.name,
          code: config.id.toUpperCase(),
          description: config.description || null,
          icon: config.navigation?.icon || 'Box',
          sortOrder: config.navigation?.order || maxSortOrder,
          isActive: true,
        });
      }
    }

    const moduleData = [...coreModuleData, ...dynamicModuleData];
    const existingModules = await db.select().from(modules);
    const existingModuleCodes = new Set(existingModules.map((m) => m.code));
    const modulesToInsert = moduleData.filter((m) => !existingModuleCodes.has(m.code));

    let seededModules: any[] = existingModules;

    if (modulesToInsert.length > 0) {
      const newModules = await db.insert(modules).values(modulesToInsert).returning();
      seededModules = [...existingModules, ...newModules];
      console.log(`✅ Created ${newModules.length} module(s)`);
    } else {
      console.log(`ℹ️  Modules already exist (${existingModules.length} total)`);
    }
    console.log('');

    // ============================================================================
    // 3. MODULE FIELDS
    // ============================================================================
    console.log('🧩 Seeding module fields...');
    const moduleByCode = new Map(seededModules.map((m) => [m.code, m]));

    type ModuleFieldSeed = {
      name: string;
      code: string;
      label: string;
      fieldType: string;
      description?: string | null;
      sortOrder: number;
    };

    const moduleFieldDefinitions: Record<string, ModuleFieldSeed[]> = {
      USERS: [
        { name: 'Full Name', code: 'full_name', label: 'Full Name', fieldType: 'text', description: 'User full name', sortOrder: 1 },
        { name: 'Email', code: 'email', label: 'Email', fieldType: 'email', description: 'Primary email', sortOrder: 2 },
        { name: 'Status', code: 'status', label: 'Status', fieldType: 'text', description: 'Account status', sortOrder: 3 },
      ],
      ROLES: [
        { name: 'Role Name', code: 'name', label: 'Role Name', fieldType: 'text', description: 'Display name', sortOrder: 1 },
        { name: 'Role Code', code: 'code', label: 'Role Code', fieldType: 'text', description: 'Unique identifier', sortOrder: 2 },
        { name: 'Priority', code: 'priority', label: 'Priority', fieldType: 'number', description: 'Role precedence', sortOrder: 3 },
      ],
    };

    for (const [moduleCode, fields] of Object.entries(moduleFieldDefinitions)) {
      const moduleRecord = moduleByCode.get(moduleCode);
      if (!moduleRecord) continue;

      const existingFields = await db
        .select()
        .from(moduleFields)
        .where(eq(moduleFields.moduleId, moduleRecord.id));

      const existingFieldCodes = new Set(existingFields.map((f) => f.code));
      const fieldsToInsert = fields
        .filter((f) => !existingFieldCodes.has(f.code))
        .map((f) => ({
          ...f,
          moduleId: moduleRecord.id,
        }));

      if (fieldsToInsert.length > 0) {
        await db.insert(moduleFields).values(fieldsToInsert);
        console.log(`✅ Added ${fieldsToInsert.length} field(s) to ${moduleRecord.name}`);
      }
    }
    console.log('');

    // ============================================================================
    // 4. PERMISSIONS
    // ============================================================================
    console.log('🔐 Seeding permissions...');

    const corePermissions = [
      // User Management
      { code: 'users:create', name: 'Create User', module: 'users', action: 'create', resource: 'user', isDangerous: false, requiresMfa: false },
      { code: 'users:read', name: 'View Users', module: 'users', action: 'read', resource: 'user', isDangerous: false, requiresMfa: false },
      { code: 'users:update', name: 'Edit User', module: 'users', action: 'update', resource: 'user', isDangerous: false, requiresMfa: false },
      { code: 'users:delete', name: 'Delete User', module: 'users', action: 'delete', resource: 'user', isDangerous: true, requiresMfa: true },
      { code: 'users:*', name: 'All User Permissions', module: 'users', action: 'manage', resource: 'user', isDangerous: true, requiresMfa: false },

      // Role Management
      { code: 'roles:create', name: 'Create Role', module: 'roles', action: 'create', resource: 'role', isDangerous: false, requiresMfa: false },
      { code: 'roles:read', name: 'View Roles', module: 'roles', action: 'read', resource: 'role', isDangerous: false, requiresMfa: false },
      { code: 'roles:update', name: 'Edit Role', module: 'roles', action: 'update', resource: 'role', isDangerous: false, requiresMfa: false },
      { code: 'roles:delete', name: 'Delete Role', module: 'roles', action: 'delete', resource: 'role', isDangerous: true, requiresMfa: false },
      { code: 'roles:assign', name: 'Assign Roles', module: 'roles', action: 'execute', resource: 'user_role', isDangerous: false, requiresMfa: false },
      { code: 'roles:*', name: 'All Role Permissions', module: 'roles', action: 'manage', resource: 'role', isDangerous: true, requiresMfa: false },

      // Dashboard
      { code: 'dashboard:read', name: 'View Dashboard', module: 'dashboard', action: 'read', resource: 'dashboard', isDangerous: false, requiresMfa: false },

      // Profile
      { code: 'profile:read', name: 'View Profile', module: 'profile', action: 'read', resource: 'profile', isDangerous: false, requiresMfa: false },
      { code: 'profile:update', name: 'Update Profile', module: 'profile', action: 'update', resource: 'profile', isDangerous: false, requiresMfa: false },

      // Settings
      { code: 'settings:read', name: 'View Settings', module: 'settings', action: 'read', resource: 'settings', isDangerous: false, requiresMfa: false },
      { code: 'settings:update', name: 'Update Settings', module: 'settings', action: 'update', resource: 'settings', isDangerous: false, requiresMfa: false },
      { code: 'settings:*', name: 'All Settings Permissions', module: 'settings', action: 'manage', resource: 'settings', isDangerous: false, requiresMfa: false },
      
      // Settings Submenus
      { code: 'settings:general:read', name: 'View General Settings', module: 'settings', action: 'read', resource: 'settings:general', isDangerous: false, requiresMfa: false },
      { code: 'settings:general:update', name: 'Update General Settings', module: 'settings', action: 'update', resource: 'settings:general', isDangerous: false, requiresMfa: false },
      { code: 'settings:registration:read', name: 'View Registration Settings', module: 'settings', action: 'read', resource: 'settings:registration', isDangerous: false, requiresMfa: false },
      { code: 'settings:registration:update', name: 'Update Registration Settings', module: 'settings', action: 'update', resource: 'settings:registration', isDangerous: false, requiresMfa: false },
      { code: 'settings:notification-methods:read', name: 'View Notification Methods', module: 'settings', action: 'read', resource: 'settings:notification-methods', isDangerous: false, requiresMfa: false },
      { code: 'settings:notification-methods:update', name: 'Update Notification Methods', module: 'settings', action: 'update', resource: 'settings:notification-methods', isDangerous: false, requiresMfa: false },
      { code: 'settings:smtp-settings:read', name: 'View SMTP Settings', module: 'settings', action: 'read', resource: 'settings:smtp-settings', isDangerous: false, requiresMfa: false },
      { code: 'settings:smtp-settings:update', name: 'Update SMTP Settings', module: 'settings', action: 'update', resource: 'settings:smtp-settings', isDangerous: false, requiresMfa: false },
      { code: 'settings:custom-fields:read', name: 'View Custom Fields', module: 'settings', action: 'read', resource: 'settings:custom-fields', isDangerous: false, requiresMfa: false },
      { code: 'settings:custom-fields:update', name: 'Update Custom Fields', module: 'settings', action: 'update', resource: 'settings:custom-fields', isDangerous: false, requiresMfa: false },
      { code: 'settings:sidebar-settings:read', name: 'View Sidebar Settings', module: 'settings', action: 'read', resource: 'settings:sidebar-settings', isDangerous: false, requiresMfa: false },
      { code: 'settings:sidebar-settings:write', name: 'Update Sidebar Settings', module: 'settings', action: 'update', resource: 'settings:sidebar-settings', isDangerous: false, requiresMfa: false },

      // System
      { code: 'system:*', name: 'System Administrator', module: 'system', action: 'manage', resource: null, isDangerous: true, requiresMfa: true },
      { code: 'admin:*', name: 'Super Admin (All)', module: 'admin', action: 'manage', resource: null, isDangerous: true, requiresMfa: true },
    ];

    // Generate permissions for dynamic modules
    const dynamicPermissions = [];
    for (const moduleId of discoveredModuleIds) {
      const config = loadModuleConfig(moduleId);
      if (config && config.enabled !== false && config.permissions) {
        const moduleName = config.id.toLowerCase();

        if (typeof config.permissions === 'object') {
          for (const [action, code] of Object.entries(config.permissions)) {
            dynamicPermissions.push({
              code: code as string,
              name: `${action.charAt(0).toUpperCase() + action.slice(1)} ${config.name}`,
              module: moduleName,
              action: action,
              resource: moduleName,
              isDangerous: action === 'delete',
              requiresMfa: false,
            });
          }
        }

        dynamicPermissions.push({
          code: `${moduleName}:*`,
          name: `All ${config.name} Permissions`,
          module: moduleName,
          action: 'manage',
          resource: moduleName,
          isDangerous: true,
          requiresMfa: false,
        });
      }
    }

    const permissionData = [...corePermissions, ...dynamicPermissions];
    const existingPermissions = await db.select().from(permissions);
    const existingPermissionCodes = new Set(existingPermissions.map((p) => p.code));
    
    // Filter out duplicates both from existing DB and within permissionData itself
    const seenCodes = new Set<string>();
    const uniquePermissions = permissionData.filter((p) => {
      if (existingPermissionCodes.has(p.code) || seenCodes.has(p.code)) {
        return false;
      }
      seenCodes.add(p.code);
      return true;
    });
    
    const permissionsToInsert = uniquePermissions;

    let seededPermissions: any[] = existingPermissions;

    if (permissionsToInsert.length > 0) {
      try {
        const newPermissions = await db.insert(permissions).values(permissionsToInsert).returning();
        seededPermissions = [...existingPermissions, ...newPermissions];
        console.log(`✅ Created ${newPermissions.length} permission(s)`);
      } catch (error: any) {
        // Handle case where permissions were added between query and insert
        if (error?.code === '23505' && error?.constraint_name === 'permissions_code_unique') {
          console.log(`⚠️  Some permissions already exist, skipping duplicates...`);
          // Re-fetch to get all permissions including any that were added
          seededPermissions = await db.select().from(permissions);
          console.log(`ℹ️  Total permissions: ${seededPermissions.length}`);
        } else {
          throw error;
        }
      }
    } else {
      console.log(`ℹ️  Permissions already exist (${existingPermissions.length} total)`);
    }
    console.log('');

    // ============================================================================
    // 5. ROLES
    // ============================================================================
    console.log('👥 Seeding roles...');

    const baseRoleData = [
      {
        name: 'Super Admin',
        code: 'SUPER_ADMIN',
        description: 'Full system access',
        isSystem: true,
        isDefault: false,
        priority: 100,
        status: 'active' as const,
        color: '#dc2626',
        metadata: {},
      },
      {
        name: 'Admin',
        code: 'ADMIN',
        description: 'Administrative access',
        isSystem: true,
        isDefault: false,
        priority: 80,
        status: 'active' as const,
        color: '#ea580c',
        metadata: {},
      },
      {
        name: 'Manager',
        code: 'MANAGER',
        description: 'Team management',
        isSystem: true,
        isDefault: false,
        priority: 60,
        status: 'active' as const,
        color: '#ca8a04',
        metadata: {},
      },
      {
        name: 'User',
        code: 'USER',
        description: 'Standard user',
        isSystem: true,
        isDefault: true,
        priority: 30,
        status: 'active' as const,
        color: '#8b5cf6',
        metadata: {},
      },
      {
        name: 'Viewer',
        code: 'VIEWER',
        description: 'Read-only access',
        isSystem: true,
        isDefault: false,
        priority: 20,
        status: 'active' as const,
        color: '#2563eb',
        metadata: {},
      },
    ];

    // Add tenantId: null only if multi-tenancy is enabled
    const roleData = baseRoleData.map(role => {
      if (MULTI_TENANT_ENABLED) {
        return { ...role, tenantId: null };
      }
      return role;
    });

    const existingRoles = await db.select().from(roles);
    const existingRoleCodes = new Set(existingRoles.map((r) => r.code));
    const rolesToInsert = roleData.filter((r) => !existingRoleCodes.has(r.code));

    let seededRoles: any[] = existingRoles;

    if (rolesToInsert.length > 0) {
      const newRoles = await db.insert(roles).values(rolesToInsert).returning();
      seededRoles = [...existingRoles, ...newRoles];
      console.log(`✅ Created ${newRoles.length} role(s)`);
    } else {
      console.log(`ℹ️  Roles already exist (${existingRoles.length} total)`);
    }
    console.log('');

    // ============================================================================
    // 6. ROLE PERMISSIONS
    // ============================================================================
    console.log('🔗 Assigning permissions to roles...');

    const superAdminRole = seededRoles.find((r) => r.code === 'SUPER_ADMIN');
    const adminRole = seededRoles.find((r) => r.code === 'ADMIN');
    const userRole = seededRoles.find((r) => r.code === 'USER');

    if (!superAdminRole || !adminRole || !userRole) {
      throw new Error('Required roles not found');
    }

    const existingRolePermissions = await db.select().from(rolePermissions);
    const existingRolePermissionKeys = new Set(
      existingRolePermissions.map((rp) => `${rp.roleId}-${rp.permissionId}`)
    );

    const insertRolePermissions = async (
      role: typeof superAdminRole,
      permissionCodes: string[]
    ) => {
      const permissionsToAssign = seededPermissions.filter((p) => permissionCodes.includes(p.code));
      const toInsert = permissionsToAssign
        .map((perm) => ({
          roleId: role.id,
          permissionId: perm.id,
          conditions: null,
        }))
        .filter((rp) => !existingRolePermissionKeys.has(`${rp.roleId}-${rp.permissionId}`));

      if (toInsert.length > 0) {
        await db.insert(rolePermissions).values(toInsert);
        return toInsert.length;
      }
      return 0;
    };

    // Super Admin gets ALL permissions
    let superAdminCount = 0;
    {
      const toInsert = seededPermissions
        .map((perm) => ({
          roleId: superAdminRole.id,
          permissionId: perm.id,
          conditions: null,
        }))
        .filter((rp) => !existingRolePermissionKeys.has(`${rp.roleId}-${rp.permissionId}`));

      if (toInsert.length > 0) {
        await db.insert(rolePermissions).values(toInsert);
        superAdminCount = toInsert.length;
      }
    }

    const adminCount = await insertRolePermissions(adminRole, [
      'users:*',
      'roles:*',
      'settings:*',
    ]);

    const userCount = await insertRolePermissions(userRole, [
      'dashboard:read',
      'profile:read',
      'profile:update',
    ]);

    console.log(`✅ Assigned ${superAdminCount} permissions to Super Admin`);
    console.log(`✅ Assigned ${adminCount} permissions to Admin`);
    console.log(`✅ Assigned ${userCount} permissions to User`);
    console.log('');

    // ============================================================================
    // 7. ROLE MODULE ACCESS
    // ============================================================================
    console.log('🔐 Setting up role-module access...');

    const allModulesForAccess = await db.select().from(modules).where(eq(modules.isActive, true));
    const existingModuleAccess = await db.select().from(roleModuleAccess);
    const existingAccessKeys = new Set(
      existingModuleAccess.map(ma => `${ma.roleId}-${ma.moduleId}`)
    );

    const moduleAccessToInsert: Array<{
      roleId: string;
      moduleId: string;
      hasAccess: boolean;
      dataAccess: 'none' | 'own' | 'team' | 'all';
    }> = [];

    for (const role of seededRoles) {
      for (const module of allModulesForAccess) {
        const key = `${role.id}-${module.id}`;
        if (existingAccessKeys.has(key)) continue;

        let hasAccess = false;
        let dataAccess: 'none' | 'own' | 'team' | 'all' = 'none';

        if (role.code === 'SUPER_ADMIN') {
          hasAccess = true;
          dataAccess = 'all';
        }

        moduleAccessToInsert.push({
          roleId: role.id,
          moduleId: module.id,
          hasAccess,
          dataAccess,
        });
      }
    }

    if (moduleAccessToInsert.length > 0) {
      await db.insert(roleModuleAccess).values(moduleAccessToInsert);
      console.log(`✅ Created ${moduleAccessToInsert.length} role-module access entries`);
    } else {
      console.log(`ℹ️  Role-module access entries already exist`);
    }
    console.log('');

    // ============================================================================
    // 8. SUPER ADMIN USER
    // ============================================================================
    console.log('👤 Seeding Super Admin user...');

    const existingUsers = await db.select().from(users).limit(1);

    if (existingUsers.length === 0) {
      const superAdminEmail = process.env.SEED_SUPERADMIN_EMAIL || 'superadmin@example.com';
      const superAdminPassword = process.env.SEED_SUPERADMIN_PASSWORD || 'SuperAdmin123!';

      console.log(`   Creating Super Admin: ${superAdminEmail}`);

      const passwordHash = await hashPassword(superAdminPassword);

      // Build user data conditionally
      const userData: any = {
        email: superAdminEmail,
        passwordHash,
        fullName: 'Super Administrator',
        status: 'active' as const,
        isEmailVerified: true,
        timezone: 'UTC',
        locale: 'en',
        metadata: {},
      };

      // Add tenantId only if multi-tenancy is enabled
      if (MULTI_TENANT_ENABLED && seededTenants.length > 0) {
        const defaultTenant = seededTenants.find((t) => t.slug === 'default') || seededTenants[0];
        userData.tenantId = defaultTenant.id;
      }

      const [superAdminUser] = await db.insert(users).values(userData).returning();

      // Create auth provider
      await db.insert(authProviders).values({
        userId: superAdminUser.id,
        provider: 'password',
      });

      // Assign role
      const userRoleData: any = {
        userId: superAdminUser.id,
        roleId: superAdminRole.id,
        grantedBy: superAdminUser.id,
        isActive: true,
        metadata: {},
      };

      // Add tenantId only if multi-tenancy is enabled
      if (MULTI_TENANT_ENABLED && seededTenants.length > 0) {
        const defaultTenant = seededTenants.find((t) => t.slug === 'default') || seededTenants[0];
        userRoleData.tenantId = defaultTenant.id;
      }

      await db.insert(userRoles).values(userRoleData);

      console.log('   ✅ Super Admin user created');
      console.log('   📧 Email:', superAdminEmail);
      console.log('   🔑 Password:', process.env.SEED_SUPERADMIN_PASSWORD ? '(from env)' : superAdminPassword);
    } else {
      console.log('ℹ️  Users already exist - skipping');
    }
    console.log('');

    // ============================================================================
    // 7. MODULE SEEDS (Run each module's seed file)
    // ============================================================================
    console.log('🌱 Running module seeds...');
    const { loadAllModuleSeeds } = await import('../src/core/lib/seedLoader');
    const moduleSeeds = await loadAllModuleSeeds();

    if (moduleSeeds.length > 0) {
      for (const { moduleId, seed } of moduleSeeds) {
        console.log(`   Running seed for module: ${moduleId}...`);
        try {
          await seed(db);
          console.log(`   ✅ Module ${moduleId} seeded successfully`);
        } catch (error) {
          console.error(`   ❌ Failed to seed module ${moduleId}:`, error);
        }
      }
      console.log('');
    } else {
      console.log('ℹ️  No module seeds found\n');
    }

    // ============================================================================
    // SUMMARY
    // ============================================================================
    console.log('✨ Seed completed successfully!\n');
    console.log('📊 Summary:');
    if (MULTI_TENANT_ENABLED) {
      console.log(`   - Multi-Tenancy: ENABLED ✅`);
      console.log(`   - Tenants: ${seededTenants.length}`);
    } else {
      console.log(`   - Multi-Tenancy: DISABLED ❌`);
      console.log(`   - Single-tenant mode active`);
    }
    console.log(`   - Modules: ${seededModules.length}`);
    console.log(`   - Permissions: ${seededPermissions.length}`);
    console.log(`   - Roles: ${seededRoles.length}\n`);

    console.log('✅ System ready!');
    if (MULTI_TENANT_ENABLED) {
      console.log('   - New users will be assigned to default tenant');
    }
    console.log('   - New users get "USER" role by default\n');

  } catch (error) {
    console.error('\n❌ Seed failed:', error);
    throw error;
  }
}

// Run seed
seed()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });