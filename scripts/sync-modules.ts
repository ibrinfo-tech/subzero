/**
 * Sync Modules Script
 * 
 * This script compares modules in the database with modules in the project folder structure
 * and removes/disables modules from the database that no longer exist in the project.
 * 
 * Core modules (Dashboard, Users, Roles, Profile, Settings) are always preserved.
 * Only dynamic modules (from src/modules/) are checked and removed if missing.
 * 
 * Run with: npx tsx scripts/sync-modules.ts
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
for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    const result = dotenv.config({ path: envPath, override: true });
    if (!result.error) {
      loaded = true;
      console.log(`✓ Loaded environment variables from ${path.basename(envPath)}`);
      break;
    }
  }
}

if (!loaded) {
  console.error('❌ No .env file found. Please create .env.local or .env');
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

// Core modules that should always be preserved (never removed)
const CORE_MODULES = [
  'DASHBOARD',
  'USERS',
  'ROLES',
  'PROFILE',
  'SETTINGS',
];

// Module discovery functions (from moduleLoader.ts)
const MODULES_DIR = path.join(process.cwd(), 'src', 'modules');

function discoverModules(): string[] {
  if (!fs.existsSync(MODULES_DIR)) {
    return [];
  }

  const entries = fs.readdirSync(MODULES_DIR, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('_'))
    .map((entry) => entry.name);
}

function loadModuleConfig(moduleId: string): { id: string; name: string } | null {
  const configPath = path.join(MODULES_DIR, moduleId, 'module.config.json');
  
  if (!fs.existsSync(configPath)) {
    return null;
  }

  try {
    const configContent = fs.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(configContent);
    
    if (!config.id || !config.name) {
      return null;
    }

    return {
      id: config.id.toUpperCase(),
      name: config.name,
    };
  } catch (error) {
    console.error(`Failed to load config for module ${moduleId}:`, error);
    return null;
  }
}

async function syncModules() {
  try {
    console.log('🔄 Syncing modules with database...\n');

    // Import database after env is loaded
    const { db } = await import('../src/core/lib/db');
    const { modules } = await import('../src/core/lib/db/baseSchema');
    const { eq, inArray, and, notInArray } = await import('drizzle-orm');

    // 1. Discover modules from file system
    console.log('📁 Scanning project modules folder...');
    const moduleFolders = discoverModules();
    console.log(`   Found ${moduleFolders.length} module folder(s): ${moduleFolders.join(', ')}`);

    // Load module configs to get their IDs
    const fileSystemModules: Map<string, string> = new Map(); // code -> name
    for (const folder of moduleFolders) {
      const config = loadModuleConfig(folder);
      if (config) {
        fileSystemModules.set(config.id, config.name);
        console.log(`   ✓ ${config.name} (${config.id}) - from folder: ${folder}`);
      } else {
        console.log(`   ⚠️  ${folder} - missing or invalid module.config.json`);
      }
    }

    // Add core modules to the list (they always exist)
    const allValidModuleCodes = new Set([
      ...CORE_MODULES,
      ...Array.from(fileSystemModules.keys()),
    ]);

    console.log(`\n📊 Valid module codes: ${Array.from(allValidModuleCodes).join(', ')}`);

    // 2. Get all modules from database
    console.log('\n💾 Fetching modules from database...');
    const allDbModules = await db.select().from(modules);
    console.log(`   Found ${allDbModules.length} module(s) in database`);

    // 3. Find modules in DB that don't exist in file system (excluding core modules)
    const modulesToRemove: typeof allDbModules = [];
    const modulesToDisable: typeof allDbModules = [];

    for (const dbModule of allDbModules) {
      const moduleCode = dbModule.code.toUpperCase();
      
      // Skip core modules - never remove or disable them
      if (CORE_MODULES.includes(moduleCode)) {
        continue;
      }

      // Check if module exists in file system
      if (!allValidModuleCodes.has(moduleCode)) {
        // Module doesn't exist in file system
        if (dbModule.isActive) {
          modulesToDisable.push(dbModule);
        } else {
          // Already disabled, but we can still remove it if you want
          // For now, we'll just disable active ones
          console.log(`   ℹ️  ${dbModule.name} (${dbModule.code}) is already disabled`);
        }
      }
    }

    // 4. Display summary
    console.log('\n📋 Summary:');
    console.log(`   Modules in database: ${allDbModules.length}`);
    console.log(`   Modules in project: ${allValidModuleCodes.size} (${CORE_MODULES.length} core + ${fileSystemModules.size} dynamic)`);
    console.log(`   Modules to disable: ${modulesToDisable.length}`);

    if (modulesToDisable.length > 0) {
      console.log('\n⚠️  Modules that will be disabled (not found in project):');
      modulesToDisable.forEach(m => {
        console.log(`   - ${m.name} (${m.code})`);
      });
    }

    // 5. Ask for confirmation (in a real scenario, you might want to add a prompt)
    if (modulesToDisable.length === 0) {
      console.log('\n✅ No modules need to be disabled. Database is in sync with project.');
      process.exit(0);
    }

    // 6. Disable modules
    console.log('\n🔧 Disabling modules...');
    const now = new Date();
    
    for (const module of modulesToDisable) {
      await db
        .update(modules)
        .set({
          isActive: false,
          updatedAt: now,
        })
        .where(eq(modules.id, module.id));
      
      console.log(`   ✓ Disabled: ${module.name} (${module.code})`);
    }

    // 7. Verify
    console.log('\n✅ Verification:');
    const updatedModules = await db
      .select()
      .from(modules)
      .where(inArray(modules.id, modulesToDisable.map(m => m.id)));
    
    const allDisabled = updatedModules.every(m => !m.isActive);
    if (allDisabled) {
      console.log('   ✓ All modules successfully disabled');
    } else {
      console.log('   ⚠️  Some modules may not have been disabled correctly');
    }

    console.log('\n✨ Sync complete!');
    console.log('\n💡 Note: Disabled modules are still in the database but won\'t appear in navigation.');
    console.log('   To completely remove them, you can manually delete them from the database.');
    console.log('   Or run this script again and it will skip already-disabled modules.');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error syncing modules:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
      console.error('   Stack:', error.stack);
    }
    process.exit(1);
  }
}

// Run the sync
syncModules();

