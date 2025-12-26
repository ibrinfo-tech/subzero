import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { userHasPermission } from '@/core/lib/permissions';
import { db } from '@/core/lib/db';
import { systemSettings } from '@/core/lib/db/baseSchema';
import { eq } from 'drizzle-orm';

const SETTING_KEY = 'sidebar_menu_order';
const SETTING_CATEGORY = 'navigation';

interface MenuItem {
  id: string;
  label: string;
  path: string;
  icon?: string;
  order: number;
}

/**
 * GET /api/settings/sidebar-menu-order
 * Get current sidebar menu order (or default order from modules)
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth()(request);
    if (userId instanceof NextResponse) {
      return userId;
    }

    // Check permission
    const hasPermission = await userHasPermission(
      userId,
      'settings:sidebar-settings:read'
    );
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Check if custom order exists in system settings
    const customOrder = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.settingKey, SETTING_KEY))
      .limit(1);

    if (customOrder.length > 0) {
      try {
        const menuItems = JSON.parse(customOrder[0].settingValue) as MenuItem[];
        return NextResponse.json({
          success: true,
          menuItems,
        });
      } catch (error) {
        console.error('Failed to parse custom menu order:', error);
        // Fall through to default order
      }
    }

    // Get default order from modules
    const { modules } = await import('@/core/lib/db/baseSchema');
    const allModules = await db
      .select()
      .from(modules)
      .where(eq(modules.isActive, true))
      .orderBy(modules.sortOrder);

    const menuItems: MenuItem[] = allModules
      .filter(module => module.code.toLowerCase() !== 'profile')
      .map((module, index) => {
        const moduleCode = module.code.toLowerCase();
        let path = `/${moduleCode}`;
        
        // Map core modules to their correct paths
        if (moduleCode === 'dashboard') path = '/dashboard';
        else if (moduleCode === 'users') path = '/users';
        else if (moduleCode === 'roles') path = '/roles';
        else if (moduleCode === 'settings') path = '/settings/general';

        return {
          id: module.id,
          label: module.name,
          path,
          icon: module.icon || 'Box',
          order: module.sortOrder || index + 1,
        };
      });

    return NextResponse.json({
      success: true,
      menuItems,
    });
  } catch (error) {
    console.error('Get sidebar menu order error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/settings/sidebar-menu-order
 * Save custom sidebar menu order
 */
export async function PUT(request: NextRequest) {
  try {
    const userId = await requireAuth()(request);
    if (userId instanceof NextResponse) {
      return userId;
    }

    // Check permission
    const hasPermission = await userHasPermission(
      userId,
      'settings:sidebar-settings:write'
    );
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { menuItems } = body as { menuItems: MenuItem[] };

    if (!Array.isArray(menuItems)) {
      return NextResponse.json(
        { error: 'Invalid menu items format' },
        { status: 400 }
      );
    }

    // Check if setting already exists
    const existing = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.settingKey, SETTING_KEY))
      .limit(1);

    const settingValue = JSON.stringify(menuItems);

    if (existing.length > 0) {
      // Update existing setting
      await db
        .update(systemSettings)
        .set({
          settingValue,
          updatedAt: new Date(),
        })
        .where(eq(systemSettings.settingKey, SETTING_KEY));
    } else {
      // Create new setting
      await db.insert(systemSettings).values({
        settingKey: SETTING_KEY,
        settingValue,
        category: SETTING_CATEGORY,
        subcategory: 'sidebar',
        dataType: 'json',
        description: 'Custom order for sidebar navigation menu items',
        autoload: true,
        isSensitive: false,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Menu order saved successfully',
    });
  } catch (error) {
    console.error('Save sidebar menu order error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/settings/sidebar-menu-order
 * Reset sidebar menu order to default
 */
export async function DELETE(request: NextRequest) {
  try {
    const userId = await requireAuth()(request);
    if (userId instanceof NextResponse) {
      return userId;
    }

    // Check permission
    const hasPermission = await userHasPermission(
      userId,
      'settings:sidebar-settings:write'
    );
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Delete custom order setting
    await db
      .delete(systemSettings)
      .where(eq(systemSettings.settingKey, SETTING_KEY));

    return NextResponse.json({
      success: true,
      message: 'Menu order reset to default',
    });
  } catch (error) {
    console.error('Reset sidebar menu order error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

