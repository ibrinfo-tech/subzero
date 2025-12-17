import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { getUserTenantId } from '@/core/lib/permissions';
import { updateStudent } from '../../services/studentsService';
import { updateStudentSchema } from '../../schemas/studentsValidation';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const { id } = await params;
    const body = await request.json();
    const parseResult = updateStudentSchema.safeParse(body);

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

    const updated = await updateStudent({
      studentId: id,
      tenantId,
      userId,
      data: parseResult.data,
    });

    if (!updated) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json(
      {
        success: true,
        data: updated,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Update student error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}


