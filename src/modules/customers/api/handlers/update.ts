import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { getUserTenantId, userHasPermission } from '@/core/lib/permissions';
import { updateCustomer, getCustomerById } from '../../services/customerService';
import { updateCustomerSchema } from '../../schemas/customerValidation';
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
    const hasPermission = await userHasPermission(userId, 'customers:update', tenantId);
    if (!hasPermission) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const validationResult = updateCustomerSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    // Get existing customer to check for changes
    const existingCustomer = await getCustomerById(id, tenantId);
    if (!existingCustomer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const updatedCustomer = await updateCustomer({
      id,
      tenantId,
      userId,
      data: validationResult.data,
    });

    if (!updatedCustomer) {
      return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
    }

    // Send notification on assignment change
    if (validationResult.data.ownerId !== undefined && validationResult.data.ownerId !== existingCustomer.ownerId) {
      if (validationResult.data.ownerId && validationResult.data.ownerId !== userId) {
        try {
          await createNotification({
            tenantId,
            userId: validationResult.data.ownerId,
            title: 'Customer Assigned to You',
            message: `Customer "${updatedCustomer.customerName}" has been assigned to you`,
            type: 'info',
            category: 'customer_assigned',
            actionUrl: `/customers`,
            actionLabel: 'View Customer',
            resourceType: 'customer',
            resourceId: updatedCustomer.id,
          });
        } catch (notifError) {
          console.error('Failed to send assignment notification:', notifError);
        }
      }
    }

    // Send notification on status change
    if (validationResult.data.status !== undefined && validationResult.data.status !== existingCustomer.status) {
      const notifyUserId = updatedCustomer.ownerId || userId;
      try {
        await createNotification({
          tenantId,
          userId: notifyUserId,
          title: 'Customer Status Changed',
          message: `Customer "${updatedCustomer.customerName}" status changed to ${validationResult.data.status}`,
          type: 'info',
          category: 'customer_status_changed',
          actionUrl: `/customers`,
          actionLabel: 'View Customer',
          resourceType: 'customer',
          resourceId: updatedCustomer.id,
        });
      } catch (notifError) {
        console.error('Failed to send status change notification:', notifError);
      }
    }

    return NextResponse.json({ success: true, data: updatedCustomer }, { status: 200 });
  } catch (error) {
    console.error('Customer update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

