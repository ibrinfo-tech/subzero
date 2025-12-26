import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { getModuleTableColumns } from '@/core/lib/services/customFieldsService';

/**
 * GET /api/settings/custom-fields/columns?moduleCode=xxx
 * Get table columns for a module (for reference field configuration)
 */
export async function GET(request: NextRequest) {
  try {
    const authMiddleware = requireAuth();
    const authResult = await authMiddleware(request);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const url = new URL(request.url);
    const moduleCode = url.searchParams.get('moduleCode');

    if (!moduleCode) {
      return NextResponse.json(
        { error: 'moduleCode parameter is required' },
        { status: 400 }
      );
    }

    const columns = await getModuleTableColumns(moduleCode);

    return NextResponse.json({
      success: true,
      data: columns,
    });
  } catch (error) {
    console.error('Get module columns error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

