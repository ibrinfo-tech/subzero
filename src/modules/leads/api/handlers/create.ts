import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { getUserTenantId, userHasPermission } from '@/core/lib/permissions';
import { createLead } from '../../services/leadService';
import { createLeadSchema } from '../../schemas/leadValidation';
import { createNotification } from '@/core/lib/services/notificationService';

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

    // Check permission
    const hasPermission = await userHasPermission(userId, 'leads:create', tenantId);
    if (!hasPermission) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const body = await request.json();
    const validationResult = createLeadSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const lead = await createLead({
      data: validationResult.data,
      tenantId,
      userId,
    });

    // Send notification to owner if assigned
    if (lead.ownerId && lead.ownerId !== userId) {
      try {
        await createNotification({
          tenantId,
          userId: lead.ownerId,
          title: 'New Lead Assigned',
          message: `You have been assigned a new lead: ${lead.leadName}`,
          type: 'info',
          category: 'lead_assigned',
          actionUrl: `/leads`,
          actionLabel: 'View Lead',
          resourceType: 'lead',
          resourceId: lead.id,
        });
      } catch (notifError) {
        console.error('Failed to send assignment notification:', notifError);
        // Don't fail the request if notification fails
      }
    }

    // Send notification on creation (to creator if different from owner)
    if (!lead.ownerId || lead.ownerId !== userId) {
      try {
        await createNotification({
          tenantId,
          userId,
          title: 'Lead Created',
          message: `Lead "${lead.leadName}" has been created`,
          type: 'success',
          category: 'lead_created',
          actionUrl: `/leads`,
          actionLabel: 'View Lead',
          resourceType: 'lead',
          resourceId: lead.id,
        });
      } catch (notifError) {
        console.error('Failed to send creation notification:', notifError);
        // Don't fail the request if notification fails
      }
    }

    return NextResponse.json({ success: true, data: lead }, { status: 201 });
  } catch (error) {
    console.error('Lead create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


