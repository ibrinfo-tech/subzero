import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/core/middleware/auth';
import { getUserTenantId } from '@/core/lib/permissions';
import { db } from '@/core/lib/db';
import { modules } from '@/core/lib/db/baseSchema';
import { eq, sql } from 'drizzle-orm';
import { moduleRegistry } from '@/core/config/moduleRegistry';

/**
 * GET /api/modules/[moduleCode]/reference?column=xxx&label=xxx
 * Get reference data for a module (for reference custom fields)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ moduleCode: string }> }
) {
  try {
    const authMiddleware = requireAuth();
    const authResult = await authMiddleware(request);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const userId = authResult;
    
    const { moduleCode: moduleCodeParam } = await params;
    const moduleCode = moduleCodeParam.toLowerCase();
    
    // Special tables that don't have module entries
    const specialTables = ['users', 'roles'];
    const isSpecialTable = specialTables.includes(moduleCode);
    
    // Only require tenantId for regular modules (special tables might not have tenant isolation)
    let tenantId: string | null = null;
    if (!isSpecialTable) {
      tenantId = await getUserTenantId(userId);
      if (!tenantId) {
        return NextResponse.json({ error: 'Tenant not found for user' }, { status: 400 });
      }
    }

    const url = new URL(request.url);
    const column = url.searchParams.get('column');
    const label = url.searchParams.get('label');
    const id = url.searchParams.get('id'); // Optional: if provided, fetch only this specific record

    if (!column || !label) {
      return NextResponse.json(
        { error: 'column and label parameters are required' },
        { status: 400 }
      );
    }

    let tableName: string;

    if (isSpecialTable) {
      // For special tables, use the code directly as table name
      tableName = moduleCode;
    } else {
      // Get module from database
      const module = await db
        .select()
        .from(modules)
        .where(eq(modules.code, moduleCode.toUpperCase()))
        .limit(1);

      if (module.length === 0) {
        return NextResponse.json(
          { error: `Module "${moduleCode}" not found` },
          { status: 404 }
        );
      }

      // Table name is typically the module code (lowercase)
      tableName = moduleCode;
    }

    // Fetch data from the module's table
    // We'll use raw SQL to dynamically query the table
    let query;
    
    // Special tables might not have tenant_id or deleted_at columns
    if (isSpecialTable) {
      if (id) {
        // If ID is provided, fetch only that specific record
        query = sql`
          SELECT 
            ${sql.identifier(column)} as value,
            ${sql.identifier(label)} as label
          FROM ${sql.identifier(tableName)}
          WHERE ${sql.identifier(column)} = ${id}
          LIMIT 1
        `;
      } else {
        // Otherwise, fetch all records
        query = sql`
          SELECT 
            ${sql.identifier(column)} as value,
            ${sql.identifier(label)} as label
          FROM ${sql.identifier(tableName)}
          ORDER BY ${sql.identifier(label)} ASC
          LIMIT 1000
        `;
      }
    } else {
      // Regular modules have tenant_id and deleted_at
      if (id) {
        // If ID is provided, fetch only that specific record
        query = sql`
          SELECT 
            ${sql.identifier(column)} as value,
            ${sql.identifier(label)} as label
          FROM ${sql.identifier(tableName)}
          WHERE tenant_id = ${tenantId}
            AND deleted_at IS NULL
            AND ${sql.identifier(column)} = ${id}
          LIMIT 1
        `;
      } else {
        // Otherwise, fetch all records
        query = sql`
          SELECT 
            ${sql.identifier(column)} as value,
            ${sql.identifier(label)} as label
          FROM ${sql.identifier(tableName)}
          WHERE tenant_id = ${tenantId}
            AND deleted_at IS NULL
          ORDER BY ${sql.identifier(label)} ASC
          LIMIT 1000
        `;
      }
    }

    const result = await db.execute(query);

    // Drizzle execute returns an array-like result
    const rows = Array.isArray(result) ? result : (result as any).rows || [];
    const options = rows.map((row: Record<string, unknown>) => ({
      value: String(row.value || ''),
      label: String(row.label || ''),
    })).filter((opt: { value: string; label: string }) => opt.value && opt.label);

    return NextResponse.json({
      success: true,
      data: options,
    });
  } catch (error) {
    console.error('Get reference data error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

