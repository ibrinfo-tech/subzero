# Troubleshooting Guide

Common issues, solutions, and debugging tips.

## Database Issues

### Database Connection Error

**Error:** `DATABASE_URL environment variable is not set`

**Solution:**
1. Check `.env.local` exists in project root
2. Verify `DATABASE_URL` is set correctly
3. Restart development server after adding env variables

### Migration Errors

**Error:** `relation already exists`

**Solution:**
```bash
npm run db:drop
npm run db:generate
npm run db:migrate
```

### Wrong Schema Generated

**Problem:** Migration generates wrong schema

**Solution:**
1. Check `.env.local` has correct `MULTI_TENANT_ENABLED` value
2. Delete old migration files: `rm -rf drizzle/migrations/*`
3. Regenerate: `npm run db:generate`

### Seed Script Fails

**Solution:**
1. Ensure migrations were applied: `npm run db:migrate`
2. Check database connection
3. Verify tables exist: `\dt` in psql
4. Check seed script output for specific errors

---

## Authentication Issues

### Login Redirect Issue

**Problem:** Login successful but doesn't redirect to dashboard

**Solutions:**

1. **Check Cookie Security:**
   - Verify cookies are being set (check Network tab)
   - Ensure `secure` flag matches connection type (HTTP vs HTTPS)
   - Check `X-Forwarded-Proto` header in Docker/proxy

2. **Check Middleware:**
   - Verify middleware is reading cookies correctly
   - Check browser console for errors
   - Verify token is present in cookies

3. **Debug Steps:**
   ```bash
   # Check browser cookies
   # DevTools → Application → Cookies
   # Look for 'access-token' cookie
   
   # Check network requests
   # DevTools → Network → /api/auth/login
   # Verify Set-Cookie headers
   ```

### Cookie Not Being Set

**Problem:** Cookies appear in response but not in browser

**Solutions:**

1. **HTTP vs HTTPS:**
   - If running on HTTP, ensure `secure: false`
   - If behind proxy, ensure `X-Forwarded-Proto` header is set

2. **Domain/Path Mismatch:**
   - Verify cookies use `path: '/'`
   - Check domain matches frontend domain

### Token Expiration

**Problem:** User gets logged out frequently

**Solutions:**

1. **Increase Token Lifetime:**
   ```env
   JWT_ACCESS_TOKEN_EXPIRES_IN=1h  # Increase from 15m
   ```

2. **Implement Token Refresh:**
   - Call `/api/auth/refresh` before token expires
   - Update access token automatically

---

## Module Issues

### Module Not in Sidebar

**Solutions:**
- Check `module.config.json` has `navigation` section
- Verify folder name matches module `id`
- Check `enabled` is `true`
- Restart development server

### Routes Not Working

**Solutions:**
- Verify component exists in `routes/` folder
- Check component name matches config
- Ensure default export exists
- Check browser console for errors

### API Endpoints 404

**Solutions:**
- Check handler file exists in `api/handlers/`
- Verify handler exports correct HTTP method function
- Check `basePath` and `path` in config
- Verify module is enabled

### Database Errors in Module

**Solutions:**
- Ensure migration was generated and applied
- Check schema file naming (`*Schema.ts`)
- Verify database connection string
- Check schema file is in `schemas/` folder

---

## Permission Issues

### Permission Checks Always Return False

**Check:**
```sql
-- Verify user has role assignments
SELECT * FROM user_roles 
WHERE user_id = 'your-user-id' 
AND is_active = true;

-- Verify role has permissions
SELECT p.code 
FROM role_permissions rp
JOIN permissions p ON rp.permission_id = p.id
WHERE rp.role_id = 'your-role-id';
```

### User Can't See Any Users

**Check:**
```sql
-- Verify user's tenant
SELECT id, email, tenant_id FROM users WHERE id = 'your-user-id';

-- Verify tenant exists
SELECT * FROM tenants WHERE id = 'tenant-id';
```

### Wildcard Permissions Not Working

**Solution:** Verify permission checking logic includes wildcard matching:

```typescript
const hasPermission = 
  permissions.includes('users:create') || 
  permissions.includes('users:*') ||
  permissions.includes('admin:*');
```

---

## Environment Variable Issues

### Environment Variable Not Read

**Solutions:**
1. Ensure `.env.local` exists in project root
2. Restart development server
3. Check variable format (no spaces around `=`)
4. Verify variable name is correct

### Wrong Mode Detected

**Solutions:**
1. Restart your terminal/IDE
2. Verify environment variable:
   ```bash
   node -e "require('dotenv').config({path:'.env.local'}); console.log(process.env.MULTI_TENANT_ENABLED)"
   ```
3. Ensure no spaces around `=` in `.env.local`

---

## TypeScript Issues

### Type Errors About Missing `tenantId`

**Solution:** Use type guards:

```typescript
import { hasTenantId, MULTI_TENANT_ENABLED } from '@/core/lib/db/baseSchema';

if (MULTI_TENANT_ENABLED && hasTenantId(user)) {
  console.log(user.tenantId); // TypeScript knows this exists
}
```

### Module Import Errors

**Solutions:**
- Check import paths are correct
- Verify module exports exist
- Restart TypeScript server
- Check `tsconfig.json` paths configuration

---

## Build Issues

### Build Fails

**Solutions:**
1. Check for TypeScript errors: `npm run build`
2. Verify all imports are correct
3. Check for missing dependencies
4. Clear `.next` folder: `rm -rf .next`

### Module Not Found Errors

**Solutions:**
- Verify module folder exists
- Check module `id` matches folder name
- Ensure `module.config.json` exists
- Restart development server

---

## Performance Issues

### Slow Queries

**Solutions:**
1. Add database indexes
2. Check query performance with EXPLAIN
3. Optimize N+1 queries
4. Consider caching

### Slow Page Loads

**Solutions:**
1. Check network tab for slow requests
2. Optimize images and assets
3. Enable code splitting
4. Check for memory leaks

---

## Getting Help

1. **Check Documentation:**
   - Review relevant documentation section
   - Check inline code comments

2. **Check Logs:**
   - Browser console for frontend errors
   - Server logs for backend errors
   - Database logs for query issues

3. **Debug Steps:**
   - Reproduce the issue
   - Check error messages
   - Verify configuration
   - Test with minimal setup

---

## Common Commands

```bash
# Database
npm run db:init          # Initialize database
npm run db:generate      # Generate migrations
npm run db:migrate       # Apply migrations
npm run db:drop          # Drop all tables
npm run db:seed          # Seed database

# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run lint             # Run linter

# Debugging
npm run db:studio        # Open Drizzle Studio
```

---

**Still stuck?** Review the relevant documentation section or check the codebase for implementation details.

