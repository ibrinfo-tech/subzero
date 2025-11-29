import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import { createHash, randomBytes } from 'crypto';

/**
 * Hash password using SHA-256 (for production, use bcryptjs)
 * Note: Install bcryptjs for production: npm install bcryptjs @types/bcryptjs
 */
export async function hashPassword(password: string): Promise<string> {
  // Using crypto for now - in production, prefer bcryptjs
  // For now, we'll use a simple approach that can be upgraded
  const salt = randomBytes(16).toString('hex');
  const hash = createHash('sha256')
    .update(password + salt)
    .digest('hex');
  return `${salt}:${hash}`;
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!hash || !hash.includes(':')) {
    return false;
  }
  const [salt, storedHash] = hash.split(':');
  const computedHash = createHash('sha256')
    .update(password + salt)
    .digest('hex');
  return computedHash === storedHash;
}

/**
 * Hash token for storage in database
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Generate random token
 */
export function generateToken(length: number = 32): string {
  return randomBytes(length).toString('hex');
}

