import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { getUserTenantId, userHasPermission } from '@/core/lib/permissions';
import { createCustomer } from '../../services/customerService';
import { createCustomerSchema } from '../../schemas/customerValidation';
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
    const hasPermission = await userHasPermission(userId, 'customers:create', tenantId);
    if (!hasPermission) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const body = await request.json();
    const validationResult = createCustomerSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const customer = await createCustomer({
      data: validationResult.data,
      tenantId,
      userId,
    });

    // Send notification on creation
    try {
      await createNotification({
        tenantId,
        userId,
        title: 'Customer Created',
        message: `Customer "${customer.customerName}" has been created`,
        type: 'success',
        category: 'customer_created',
        actionUrl: `/customers`,
        actionLabel: 'View Customer',
        resourceType: 'customer',
        resourceId: customer.id,
      });
    } catch (notifError) {
      console.error('Failed to send creation notification:', notifError);
      // Don't fail the request if notification fails
    }

    // Send notification to owner if assigned
    if (customer.ownerId && customer.ownerId !== userId) {
      try {
        await createNotification({
          tenantId,
          userId: customer.ownerId,
          title: 'New Customer Assigned',
          message: `You have been assigned a new customer: ${customer.customerName}`,
          type: 'info',
          category: 'customer_assigned',
          actionUrl: `/customers`,
          actionLabel: 'View Customer',
          resourceType: 'customer',
          resourceId: customer.id,
        });
      } catch (notifError) {
        console.error('Failed to send assignment notification:', notifError);
        // Don't fail the request if notification fails
      }
    }

    return NextResponse.json({ success: true, data: customer }, { status: 201 });
  } catch (error) {
    console.error('Customer create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

