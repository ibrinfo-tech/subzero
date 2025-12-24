import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { userHasPermission } from '@/core/lib/permissions';
import {
  getStoredRegistrationSettings,
  saveRegistrationSettings,
} from '@/core/lib/services/systemSettingsService';

/**
 * GET /api/settings/registration
 * Returns the stored registration configuration
 * Requires: settings:registration:read
 */
export async function GET(request: NextRequest) {
  try {
    const authMiddleware = requireAuth();
    const authResult = await authMiddleware(request);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const userId = authResult;
    const hasPermission = await userHasPermission(userId, 'settings:registration:read');

    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const settings = await getStoredRegistrationSettings();

    return NextResponse.json(
      {
        success: true,
        data: {
          enabled: settings.enabled ?? true, // Default to true if not set
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Registration Settings] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/settings/registration
 * Update registration configuration
 * Requires: settings:registration:update
 */
export async function PUT(request: NextRequest) {
  try {
    const authMiddleware = requireAuth();
    const authResult = await authMiddleware(request);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const userId = authResult;
    const hasPermission = await userHasPermission(userId, 'settings:registration:update');

    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { enabled } = body;

    if (typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'Validation failed', details: 'enabled must be a boolean' },
        { status: 400 }
      );
    }

    await saveRegistrationSettings({ enabled });

    return NextResponse.json(
      {
        success: true,
        message: 'Registration settings updated',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Registration Settings] PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

