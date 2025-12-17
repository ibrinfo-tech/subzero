import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { getUserTenantId } from '@/core/lib/permissions';
import { createStudent } from '../../services/studentsService';
import { createStudentSchema } from '../../schemas/studentsValidation';

export async function POST(request: NextRequest) {
  try {
    const authMiddleware = requireAuth();
    const authResult = await authMiddleware(request);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const userId = authResult;
    const tenantId = await getUserTenantId(userId);

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found for user' }, { status: 400 });
    }

    const body = await request.json();
    const parseResult = createStudentSchema.safeParse(body);

    if (!parseResult.success) {
      const firstError = parseResult.error.errors[0];
      return NextResponse.json(
        {
          error: firstError?.message || 'Validation failed',
          details: parseResult.error.flatten(),
        },
        { status: 400 },
      );
    }

    const student = await createStudent({
      data: parseResult.data,
      tenantId,
      userId,
    });

    return NextResponse.json(
      {
        success: true,
        data: student,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Create student error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}


