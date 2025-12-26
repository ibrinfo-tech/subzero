import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { getUserTenantId, userHasPermission } from '@/core/lib/permissions';
import { updateLead, getLeadById } from '../../services/leadService';
import { updateLeadSchema } from '../../schemas/leadValidation';
import { createNotification } from '@/core/lib/services/notificationService';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
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
    const hasPermission = await userHasPermission(userId, 'leads:update', tenantId);
    if (!hasPermission) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const validationResult = updateLeadSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    // Get existing lead to check for changes
    const existingLead = await getLeadById(id, tenantId);
    if (!existingLead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const updatedLead = await updateLead({
      id,
      tenantId,
      userId,
      data: validationResult.data,
    });

    if (!updatedLead) {
      return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 });
    }

    // Send notification on assignment change
    if (validationResult.data.ownerId !== undefined && validationResult.data.ownerId !== existingLead.ownerId) {
      if (validationResult.data.ownerId && validationResult.data.ownerId !== userId) {
        try {
          await createNotification({
            tenantId,
            userId: validationResult.data.ownerId,
            title: 'Lead Assigned to You',
            message: `Lead "${updatedLead.leadName}" has been assigned to you`,
            type: 'info',
            category: 'lead_assigned',
            actionUrl: `/leads`,
            actionLabel: 'View Lead',
            resourceType: 'lead',
            resourceId: updatedLead.id,
          });
        } catch (notifError) {
          console.error('Failed to send assignment notification:', notifError);
        }
      }
    }

    // Send notification on status change
    if (validationResult.data.status !== undefined && validationResult.data.status !== existingLead.status) {
      const notifyUserId = updatedLead.ownerId || userId;
      try {
        await createNotification({
          tenantId,
          userId: notifyUserId,
          title: 'Lead Status Changed',
          message: `Lead "${updatedLead.leadName}" status changed to ${validationResult.data.status}`,
          type: 'info',
          category: 'lead_status_changed',
          actionUrl: `/leads`,
          actionLabel: 'View Lead',
          resourceType: 'lead',
          resourceId: updatedLead.id,
        });
      } catch (notifError) {
        console.error('Failed to send status change notification:', notifError);
      }
    }

    return NextResponse.json({ success: true, data: updatedLead }, { status: 200 });
  } catch (error) {
    console.error('Lead update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


