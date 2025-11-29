import { db } from './db';
import { roles } from './db/baseSchema';
import { eq, and, isNull } from 'drizzle-orm';

/**
 * Get the default "User" role for new registrations
 */
export async function getDefaultUserRole(): Promise<string | null> {
  const result = await db
    .select({ id: roles.id })
    .from(roles)
    .where(
      and(
        eq(roles.code, 'USER'),
        isNull(roles.deletedAt),
        eq(roles.status, 'active')
      )
    )
    .limit(1);

  return result.length > 0 ? result[0].id : null;
}

/**
 * Get role by code
 */
export async function getRoleByCode(code: string): Promise<string | null> {
  const result = await db
    .select({ id: roles.id })
    .from(roles)
    .where(
      and(
        eq(roles.code, code),
        isNull(roles.deletedAt),
        eq(roles.status, 'active')
      )
    )
    .limit(1);

  return result.length > 0 ? result[0].id : null;
}

