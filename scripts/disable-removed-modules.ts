/**
 * Script to disable modules that have been removed from the project
 * Run this with: npx tsx scripts/disable-removed-modules.ts
 * 
 * This will set isActive = false for Students, Notes, Projects, and Tasks modules
 */

import { db } from '../src/core/lib/db';
import { modules } from '../src/core/lib/db/baseSchema';
import { eq, inArray } from 'drizzle-orm';

const modulesToDisable = ['students', 'notes', 'projects', 'tasks'];

async function disableModules() {
  try {
    console.log('Disabling removed modules...');
    
    // Get current state
    const currentModules = await db
      .select()
      .from(modules)
      .where(inArray(modules.code, modulesToDisable));
    
    console.log(`Found ${currentModules.length} modules to disable:`);
    currentModules.forEach(m => {
      console.log(`  - ${m.name} (${m.code}): isActive = ${m.isActive}`);
    });

    // Disable the modules
    const result = await db
      .update(modules)
      .set({ 
        isActive: false,
        updatedAt: new Date(),
      })
      .where(inArray(modules.code, modulesToDisable));

    console.log('\nModules disabled successfully!');
    console.log('The sidebar will no longer show these modules after refresh.');
    
    // Verify
    const updatedModules = await db
      .select()
      .from(modules)
      .where(inArray(modules.code, modulesToDisable));
    
    console.log('\nUpdated modules:');
    updatedModules.forEach(m => {
      console.log(`  - ${m.name} (${m.code}): isActive = ${m.isActive}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error disabling modules:', error);
    process.exit(1);
  }
}

disableModules();

