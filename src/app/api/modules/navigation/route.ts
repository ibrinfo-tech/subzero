// API endpoint to get module navigation items

import { NextResponse } from 'next/server';
import { moduleRegistry } from '@/core/config/moduleRegistry';

export async function GET() {
  try {
    const navigationItems = moduleRegistry.getNavigationItems();
    
    return NextResponse.json({
      success: true,
      navigation: navigationItems,
    });
  } catch (error) {
    console.error('Failed to get module navigation:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load navigation',
      },
      { status: 500 }
    );
  }
}

