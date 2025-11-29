import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables FIRST before importing db
// This is critical because db/index.ts reads DATABASE_URL on import
const envPaths = [
  path.resolve(process.cwd(), '.env.local'),
  path.resolve(process.cwd(), '.env'),
];

let loaded = false;
let lastError: Error | null = null;

// Try loading from .env.local first, then .env
for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    const result = dotenv.config({ path: envPath, override: true });
    if (!result.error) {
      loaded = true;
      console.log(`✓ Loaded environment variables from ${path.basename(envPath)}`);
      // Verify DATABASE_URL was actually loaded
      if (process.env.DATABASE_URL) {
        const dbUrl = process.env.DATABASE_URL;
        // Mask password in output for security
        const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ':****@');
        console.log(`✓ DATABASE_URL found: ${maskedUrl.substring(0, 50)}...`);
      }
      break;
    } else {
      lastError = result.error;
    }
  }
}

// Verify DATABASE_URL is loaded
if (!process.env.DATABASE_URL) {
  console.error('\n❌ DATABASE_URL not found in environment variables\n');
  console.error('   Tried loading from:');
  envPaths.forEach((p) => {
    const exists = fs.existsSync(p) ? '✓ exists' : '✗ not found';
    console.error(`   - ${path.basename(p)} ${exists}`);
    if (fs.existsSync(p)) {
      // Show first few lines of the file for debugging
      try {
        const content = fs.readFileSync(p, 'utf8');
        const lines = content.split('\n').slice(0, 3);
        console.error(`     Content preview: ${lines.join(' ').substring(0, 80)}...`);
      } catch (e) {
        // Ignore read errors
      }
    }
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

// Double-check DATABASE_URL is set before importing db
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL still not set after loading environment variables');
  process.exit(1);
}

// Import utilities that don't depend on db
import { hashPassword } from '../src/core/lib/utils';
import { discoverModules, loadModuleConfig } from '../src/core/lib/moduleLoader';
import { eq, and, isNull } from 'drizzle-orm';

/**
 * Comprehensive seed file for all database tables
 * Run with: npm run seed
 */
async function seed() {
  // Dynamically import db AFTER environment variables are loaded
  const { db } = await import('../src/core/lib/db');
  const {
    users,
    roles,
    permissions,
    modules,
    permissionActions,
    rolePermissions,
    tenants,
    tenantUsers,
    authProviders,
  } = await import('../src/core/lib/db/baseSchema');
  console.log('🌱 Starting database seed...\n');

  try {
    // ============================================================================
    // 1. PERMISSION ACTIONS (Must be first - referenced by permissions)
    // ============================================================================
    console.log('📝 Seeding permission actions...');
    const actions = await db
      .insert(permissionActions)
      .values([
        { name: 'Create', code: 'create', description: 'Ability to create new resources' },
        { name: 'Read', code: 'read', description: 'Ability to view/read resources' },
        { name: 'Update', code: 'update', description: 'Ability to modify existing resources' },
        { name: 'Delete', code: 'delete', description: 'Ability to remove resources' },
        { name: 'Execute', code: 'execute', description: 'Ability to execute actions/operations' },
        { name: 'Approve', code: 'approve', description: 'Ability to approve requests' },
        { name: 'Export', code: 'export', description: 'Ability to export data' },
        { name: 'Import', code: 'import', description: 'Ability to import data' },
      ])
      .returning();
    console.log(`✅ Created ${actions.length} permission actions\n`);

    // ============================================================================
    // 2. MODULES
    // ============================================================================
    console.log('📦 Seeding modules...');
    
    // First, seed default/core modules
    const defaultModules = [
      {
        name: 'User Management',
        code: 'USERS',
        description: 'Manage users, roles, and permissions',
        sortOrder: 1,
        isActive: true,
      },
      {
        name: 'Billing',
        code: 'BILLING',
        description: 'Handle invoices, payments, and subscriptions',
        sortOrder: 2,
        isActive: true,
      },
      {
        name: 'Projects',
        code: 'PROJECTS',
        description: 'Create and manage projects',
        sortOrder: 3,
        isActive: true,
      },
      {
        name: 'Reports',
        code: 'REPORTS',
        description: 'View and generate reports',
        sortOrder: 4,
        isActive: true,
      },
      {
        name: 'Settings',
        code: 'SETTINGS',
        description: 'System and tenant settings',
        sortOrder: 5,
        isActive: true,
      },
    ];

    // Get existing modules from database
    const existingModules = await db.select().from(modules);
    const existingModuleCodes = new Set(existingModules.map((m) => m.code));

    // Filter out modules that already exist
    const modulesToInsert = defaultModules.filter(
      (m) => !existingModuleCodes.has(m.code)
    );

    let seededModules = [...existingModules];

    if (modulesToInsert.length > 0) {
      const newModules = await db.insert(modules).values(modulesToInsert).returning();
      seededModules = [...seededModules, ...newModules];
      console.log(`✅ Created ${newModules.length} default modules`);
    } else {
      console.log(`ℹ️  All default modules already exist`);
    }

    // Now discover and seed project modules from src/modules directory
    console.log('\n🔍 Discovering project modules...');
    const projectModuleIds = discoverModules();
    console.log(`   Found ${projectModuleIds.length} module(s) in project: ${projectModuleIds.join(', ')}`);

    if (projectModuleIds.length > 0) {
      let createdCount = 0;
      let skippedCount = 0;
      const maxSortOrder = Math.max(...seededModules.map((m) => m.sortOrder || 0), 5);

      for (let i = 0; i < projectModuleIds.length; i++) {
        const moduleId = projectModuleIds[i];
        const config = loadModuleConfig(moduleId);

        if (!config) {
          console.log(`   ⚠️  Skipping ${moduleId}: Could not load module.config.json`);
          skippedCount++;
          continue;
        }

        // Check if module already exists in database
        const moduleCode = config.id.toUpperCase();
        const moduleExists = existingModuleCodes.has(moduleCode);

        if (moduleExists) {
          console.log(`   ℹ️  Module ${moduleCode} already exists in database`);
          skippedCount++;
          // Add to seededModules if not already there
          const existingModule = seededModules.find((m) => m.code === moduleCode);
          if (!existingModule) {
            const dbModule = existingModules.find((m) => m.code === moduleCode);
            if (dbModule) {
              seededModules.push(dbModule);
            }
          }
          continue;
        }

        // Get navigation order if available, otherwise use calculated sort order
        const sortOrder = config.navigation?.order || maxSortOrder + i + 1;
        const icon = config.navigation?.icon || null;

        // Create module entry
        try {
          const newModule = await db
            .insert(modules)
            .values({
              name: config.name,
              code: moduleCode,
              description: config.description || null,
              icon: icon,
              sortOrder: sortOrder,
              isActive: config.enabled !== false, // Default to true if not specified
            })
            .returning();

          seededModules.push(newModule[0]);
          existingModuleCodes.add(moduleCode); // Update set to avoid duplicates
          createdCount++;
          console.log(`   ✅ Created module: ${config.name} (${moduleCode})`);
    } catch (error) {
          console.error(`   ❌ Failed to create module ${moduleCode}:`, error);
          skippedCount++;
        }
      }

      console.log(`\n✅ Project modules: ${createdCount} created, ${skippedCount} skipped`);
    } else {
      console.log(`ℹ️  No project modules found in src/modules directory`);
    }

    console.log(`\n📊 Total modules in database: ${seededModules.length}\n`);

    // ============================================================================
    // 3. PERMISSIONS
    // ============================================================================
    console.log('🔐 Seeding permissions...');
    const userModule = seededModules.find((m) => m.code === 'USERS')!;
    const billingModule = seededModules.find((m) => m.code === 'BILLING')!;
    const projectsModule = seededModules.find((m) => m.code === 'PROJECTS')!;

    const createAction = actions.find((a) => a.code === 'create')!;
    const readAction = actions.find((a) => a.code === 'read')!;
    const updateAction = actions.find((a) => a.code === 'update')!;
    const deleteAction = actions.find((a) => a.code === 'delete')!;
    const exportAction = actions.find((a) => a.code === 'export')!;

    const seededPermissions = await db
      .insert(permissions)
      .values([
        // User Management Permissions
        {
          moduleId: userModule.id,
          actionId: createAction.id,
          name: 'Create User',
          code: 'USER_CREATE',
          description: 'Create new users',
          resource: 'user',
          isActive: true,
        },
        {
          moduleId: userModule.id,
          actionId: readAction.id,
          name: 'View User',
          code: 'USER_READ',
          description: 'View user details',
          resource: 'user',
          isActive: true,
        },
        {
          moduleId: userModule.id,
          actionId: updateAction.id,
          name: 'Edit User',
          code: 'USER_UPDATE',
          description: 'Modify user information',
          resource: 'user',
          isActive: true,
        },
        {
          moduleId: userModule.id,
          actionId: deleteAction.id,
          name: 'Delete User',
          code: 'USER_DELETE',
          description: 'Remove users from system',
          resource: 'user',
          isActive: true,
        },
        {
          moduleId: userModule.id,
          actionId: createAction.id,
          name: 'Create Role',
          code: 'ROLE_CREATE',
          description: 'Create new roles',
          resource: 'role',
          isActive: true,
        },
        {
          moduleId: userModule.id,
          actionId: readAction.id,
          name: 'View Role',
          code: 'ROLE_READ',
          description: 'View role details',
          resource: 'role',
          isActive: true,
        },
        {
          moduleId: userModule.id,
          actionId: updateAction.id,
          name: 'Edit Role',
          code: 'ROLE_UPDATE',
          description: 'Modify role information',
          resource: 'role',
          isActive: true,
        },
        {
          moduleId: userModule.id,
          actionId: deleteAction.id,
          name: 'Delete Role',
          code: 'ROLE_DELETE',
          description: 'Remove roles',
          resource: 'role',
          isActive: true,
        },
        // Billing Permissions
        {
          moduleId: billingModule.id,
          actionId: readAction.id,
          name: 'View Billing',
          code: 'BILLING_READ',
          description: 'View billing information',
          resource: 'invoice',
          isActive: true,
        },
        {
          moduleId: billingModule.id,
          actionId: createAction.id,
          name: 'Create Invoice',
          code: 'INVOICE_CREATE',
          description: 'Create new invoices',
          resource: 'invoice',
          isActive: true,
        },
        {
          moduleId: billingModule.id,
          actionId: updateAction.id,
          name: 'Update Invoice',
          code: 'INVOICE_UPDATE',
          description: 'Modify invoices',
          resource: 'invoice',
          isActive: true,
        },
        {
          moduleId: billingModule.id,
          actionId: exportAction.id,
          name: 'Export Billing',
          code: 'BILLING_EXPORT',
          description: 'Export billing data',
          resource: 'invoice',
          isActive: true,
        },
        // Project Permissions
        {
          moduleId: projectsModule.id,
          actionId: createAction.id,
          name: 'Create Project',
          code: 'PROJECT_CREATE',
          description: 'Create new projects',
          resource: 'project',
          isActive: true,
        },
        {
          moduleId: projectsModule.id,
          actionId: readAction.id,
          name: 'View Project',
          code: 'PROJECT_READ',
          description: 'View project details',
          resource: 'project',
          isActive: true,
        },
        {
          moduleId: projectsModule.id,
          actionId: updateAction.id,
          name: 'Edit Project',
          code: 'PROJECT_UPDATE',
          description: 'Modify project information',
          resource: 'project',
          isActive: true,
        },
        {
          moduleId: projectsModule.id,
          actionId: deleteAction.id,
          name: 'Delete Project',
          code: 'PROJECT_DELETE',
          description: 'Remove projects',
          resource: 'project',
          isActive: true,
        },
      ])
      .returning();
    console.log(`✅ Created ${seededPermissions.length} permissions\n`);

    // ============================================================================
    // 4. ROLES
    // ============================================================================
    console.log('👥 Seeding roles...');
    const seededRoles = await db
      .insert(roles)
      .values([
        {
          name: 'Super Admin',
          code: 'SUPER_ADMIN',
          description: 'Full system access with all permissions',
          isSystem: true,
          priority: 100,
          status: 'active',
        },
        {
          name: 'Admin',
          code: 'ADMIN',
          description: 'Administrative access with most permissions',
          isSystem: true,
          priority: 90,
          status: 'active',
        },
        {
          name: 'Manager',
          code: 'MANAGER',
          description: 'Management level access',
          isSystem: true,
          priority: 50,
          status: 'active',
        },
        {
          name: 'Editor',
          code: 'EDITOR',
          description: 'Can create and edit content',
          isSystem: true,
          priority: 30,
          status: 'active',
        },
        {
          name: 'Viewer',
          code: 'VIEWER',
          description: 'Read-only access',
          isSystem: true,
          priority: 10,
          status: 'active',
        },
        {
          name: 'User',
          code: 'USER',
          description: 'Default role for new user registrations',
          isSystem: true,
          priority: 5,
          status: 'active',
        },
      ])
      .returning();
    console.log(`✅ Created ${seededRoles.length} roles\n`);

    // ============================================================================
    // 5. ROLE PERMISSIONS
    // ============================================================================
    console.log('🔗 Assigning permissions to roles...');
    const superAdminRole = seededRoles.find((r) => r.code === 'SUPER_ADMIN')!;
    const adminRole = seededRoles.find((r) => r.code === 'ADMIN')!;
    const viewerRole = seededRoles.find((r) => r.code === 'VIEWER')!;
    const userRole = seededRoles.find((r) => r.code === 'USER')!;

    // Super Admin gets all permissions
    const superAdminPermissions = await db
      .insert(rolePermissions)
      .values(
        seededPermissions.map((p) => ({
          roleId: superAdminRole.id,
          permissionId: p.id,
        }))
      )
      .returning();

    // Admin gets most permissions (excluding delete)
    const adminPermissions = await db
      .insert(rolePermissions)
      .values(
        seededPermissions
          .filter((p) => !p.code.includes('DELETE'))
          .map((p) => ({
            roleId: adminRole.id,
            permissionId: p.id,
          }))
      )
      .returning();

    // Viewer gets only read permissions
    const viewerPermissions = await db
      .insert(rolePermissions)
      .values(
        seededPermissions
          .filter((p) => p.code.includes('_READ') || p.code.includes('READ'))
          .map((p) => ({
            roleId: viewerRole.id,
            permissionId: p.id,
          }))
      )
      .returning();

    // User role gets basic read permissions (for their own profile and basic viewing)
    const userPermissions = await db
      .insert(rolePermissions)
      .values(
        seededPermissions
          .filter((p) => 
            p.code === 'USER_READ' || // Can view their own profile
            p.code === 'PROJECT_READ' || // Can view projects
            p.code === 'BILLING_READ' // Can view their own billing
          )
          .map((p) => ({
            roleId: userRole.id,
            permissionId: p.id,
          }))
      )
      .returning();

    console.log(`✅ Assigned ${superAdminPermissions.length} permissions to Super Admin`);
    console.log(`✅ Assigned ${adminPermissions.length} permissions to Admin`);
    console.log(`✅ Assigned ${viewerPermissions.length} permissions to Viewer`);
    console.log(`✅ Assigned ${userPermissions.length} permissions to User\n`);

    // ============================================================================
    // 6. TENANTS
    // ============================================================================
    console.log('🏢 Seeding tenants...');
    const seededTenants = await db
      .insert(tenants)
      .values([
        {
          name: 'Acme Corporation',
          subdomain: 'acme',
          status: 'active',
          settings: { theme: 'light', timezone: 'UTC' },
        },
        {
          name: 'TechStart Inc',
          subdomain: 'techstart',
          status: 'active',
          settings: { theme: 'dark', timezone: 'America/New_York' },
        },
      ])
      .returning();
    console.log(`✅ Created ${seededTenants.length} tenants\n`);

    // ============================================================================
    // 7. USERS
    // ============================================================================
    console.log('👤 Seeding users...');
    const defaultPassword = await hashPassword('password123');
    const superAdminRoleId = superAdminRole.id;
    const adminRoleId = adminRole.id;
    const viewerRoleId = viewerRole.id;

    const seededUsers = await db
      .insert(users)
      .values([
        {
          email: 'admin@example.com',
          passwordHash: defaultPassword,
          fullName: 'Super Admin',
          isEmailVerified: true,
          status: 'active',
          roleId: superAdminRoleId,
          roleAssignedAt: new Date(),
        },
        {
          email: 'manager@example.com',
          passwordHash: defaultPassword,
          fullName: 'Manager User',
          isEmailVerified: true,
          status: 'active',
          roleId: adminRoleId,
          roleAssignedAt: new Date(),
        },
        {
          email: 'viewer@example.com',
          passwordHash: defaultPassword,
          fullName: 'Viewer User',
          isEmailVerified: true,
          status: 'active',
          roleId: viewerRoleId,
          roleAssignedAt: new Date(),
        },
        {
          email: 'john@gmail.com',
          passwordHash: defaultPassword,
          fullName: 'john doe',
          isEmailVerified: false,
          status: 'active',
          roleId: adminRoleId,
          roleAssignedAt: new Date(),
        },
      ])
      .returning();
    console.log(`✅ Created ${seededUsers.length} users\n`);

    // ============================================================================
    // 8. AUTH PROVIDERS
    // ============================================================================
    console.log('🔑 Seeding auth providers...');
    const authProvidersData = seededUsers.map((user) => ({
      userId: user.id,
      provider: 'password',
    }));
    const seededAuthProviders = await db.insert(authProviders).values(authProvidersData).returning();
    console.log(`✅ Created ${seededAuthProviders.length} auth providers\n`);

    // ============================================================================
    // 9. TENANT USERS
    // ============================================================================
    console.log('🔗 Linking users to tenants...');
    const acmeTenant = seededTenants.find((t) => t.subdomain === 'acme')!;
    const techStartTenant = seededTenants.find((t) => t.subdomain === 'techstart')!;

    const adminUser = seededUsers.find((u) => u.email === 'admin@example.com')!;
    const managerUser = seededUsers.find((u) => u.email === 'manager@example.com')!;
    const viewerUser = seededUsers.find((u) => u.email === 'viewer@example.com')!;
    const johnUser = seededUsers.find((u) => u.email === 'john@gmail.com')!;

    // Update users with tenant_id
    await db.update(users).set({ tenantId: acmeTenant.id }).where(eq(users.id, adminUser.id));
    await db.update(users).set({ tenantId: acmeTenant.id }).where(eq(users.id, managerUser.id));
    await db.update(users).set({ tenantId: techStartTenant.id }).where(eq(users.id, viewerUser.id));
    await db.update(users).set({ tenantId: techStartTenant.id }).where(eq(users.id, johnUser.id));

    const tenantUsersData = [
      {
        tenantId: acmeTenant.id,
        userId: adminUser.id,
        roleId: superAdminRoleId,
        isPrimary: true,
      },
      {
        tenantId: acmeTenant.id,
        userId: managerUser.id,
        roleId: adminRoleId,
        isPrimary: false,
      },
      {
        tenantId: techStartTenant.id,
        userId: viewerUser.id,
        roleId: viewerRoleId,
        isPrimary: true,
      },
      {
        tenantId: techStartTenant.id,
        userId: johnUser.id,
        roleId: adminRoleId,
        isPrimary: false,
      },
    ];

    const seededTenantUsers = await db.insert(tenantUsers).values(tenantUsersData).returning();
    console.log(`✅ Created ${seededTenantUsers.length} tenant-user relationships\n`);

    // ============================================================================
    // SUMMARY
    // ============================================================================
    console.log('✨ Seed completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   - ${actions.length} permission actions`);
    console.log(`   - ${seededModules.length} modules`);
    console.log(`   - ${seededPermissions.length} permissions`);
    console.log(`   - ${seededRoles.length} roles`);
    console.log(`   - ${seededUsers.length} users`);
    console.log(`   - ${seededTenants.length} tenants`);
    console.log(`   - ${seededAuthProviders.length} auth providers`);
    console.log(`   - ${seededTenantUsers.length} tenant-user relationships\n`);
    console.log('🔑 Default login credentials:');
    console.log('   - admin@example.com / password123 (Super Admin)');
    console.log('   - manager@example.com / password123 (Admin)');
    console.log('   - viewer@example.com / password123 (Viewer)');
    console.log('   - john@gmail.com / password123 (Admin)\n');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  }
}

// Run seed
seed()
  .then(() => {
    console.log('✅ Seed script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seed script failed:', error);
    process.exit(1);
  });
