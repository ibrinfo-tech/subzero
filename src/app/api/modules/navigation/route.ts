// API endpoint to get module navigation items

import { NextResponse } from 'next/server';
import { moduleRegistry } from '@/core/config/moduleRegistry';

export async function GET() {
  try {
    // Force re-initialization to ensure modules are loaded
    moduleRegistry.initialize(true);
    
    const allModules = moduleRegistry.getAllModules();
    const navigationItems = moduleRegistry.getNavigationItems();
    
    // Debug logging
    console.log('[Navigation API] All modules:', allModules.map(m => ({ id: m.id, name: m.config.name, enabled: m.config.enabled })));
    console.log('[Navigation API] Navigation items:', navigationItems);
    
    return NextResponse.json({
      success: true,
      navigation: navigationItems,
      debug: {
        totalModules: allModules.length,
        modules: allModules.map(m => ({
          id: m.id,
          name: m.config.name,
          enabled: m.config.enabled,
          hasNavigation: !!m.config.navigation,
          navigation: m.config.navigation,
        })),
      },
    });
  } catch (error) {
    console.error('Failed to get module navigation:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load navigation',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

