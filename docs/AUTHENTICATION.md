# Authentication & Authorization

Complete guide to authentication, login, registration, tokens, and configuration.

## Overview

SubZero 2.0 uses a **custom authentication system** built with:
- JWT tokens (access + refresh)
- HTTP-only cookies for security
- Password hashing (bcrypt)
- Session management

---

## Configuration

### Auth Configuration File

**Location:** `src/core/config/auth.config.json`

```json
{
  "registration": {
    "enabled": true,
    "showOnLoginPage": true,
    "requireEmailVerification": false,
    "allowPublicRegistration": true,
    "minPasswordLength": 6,
    "requireStrongPassword": false
  },
  "login": {
    "enabled": true,
    "allowRememberMe": true,
    "sessionDuration": 604800,
    "maxLoginAttempts": 5,
    "lockoutDuration": 900
  },
  "features": {
    "passwordReset": true,
    "emailVerification": false,
    "twoFactorAuth": false,
    "socialLogin": false
  },
  "ui": {
    "showRegisterLink": true,
    "showForgotPasswordLink": true,
    "customBranding": {
      "enabled": false,
      "logo": null,
      "primaryColor": null
    }
  }
}
```

### Environment Variables

```env
# JWT Configuration (REQUIRED)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
# Generate with: openssl rand -base64 32

# JWT Expiration (Optional)
JWT_ACCESS_TOKEN_EXPIRES_IN=15m
JWT_REFRESH_TOKEN_EXPIRES_IN=7d

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

---

## Registration

### Enable/Disable Registration

**Disable completely:**
```json
{
  "registration": {
    "enabled": false,
    "showOnLoginPage": false,
    "allowPublicRegistration": false
  },
  "ui": {
    "showRegisterLink": false
  }
}
```

**Invite-only (hide from UI but allow via API):**
```json
{
  "registration": {
    "enabled": true,
    "showOnLoginPage": false,
    "allowPublicRegistration": false
  }
}
```

### Registration Flow

1. User submits registration form
2. Server validates input (email, password)
3. Checks if registration is enabled
4. Creates user account
5. Returns success/error response

**API Endpoint:** `POST /api/auth/register`

---

## Login

### Login Flow

1. User submits credentials
2. Server validates email/password
3. Verifies password hash
4. Generates access + refresh tokens
5. Sets HTTP-only cookies
6. Returns user data
7. Client redirects to dashboard

**API Endpoint:** `POST /api/auth/login`

### Default Credentials

After seeding:
- **Super Admin**: `admin@example.com` / `password123`
- **Tenant Admin**: `admin@acme.com` / `password123`
- **Manager**: `manager@acme.com` / `password123`
- **Viewer**: `viewer@techstart.com` / `password123`

---

## Token System

### Token Types

1. **Access Token** - Short-lived (15 minutes default)
   - Used for API authentication
   - Stored in HTTP-only cookie
   - Contains user ID and basic info

2. **Refresh Token** - Long-lived (7 days default)
   - Used to refresh access token
   - Stored in HTTP-only cookie
   - Rotated on each refresh

### Token Configuration

```env
JWT_ACCESS_TOKEN_EXPIRES_IN=15m    # Access token lifetime
JWT_REFRESH_TOKEN_EXPIRES_IN=7d    # Refresh token lifetime
```

### Cookie Security

Cookies are configured based on connection type:

```typescript
const isSecureConnection = 
  request.headers.get('x-forwarded-proto') === 'https' ||
  request.nextUrl.protocol === 'https:' ||
  process.env.NODE_ENV === 'development';

response.cookies.set('access-token', token, {
  httpOnly: true,
  secure: isSecureConnection,
  sameSite: isSecureConnection ? 'strict' : 'lax',
  path: '/',
  maxAge: cookieMaxAge,
});
```

**For Docker/Production:**
- Ensure proxy sets `X-Forwarded-Proto: https` header if using HTTPS
- Cookies automatically adapt to HTTP/HTTPS

---

## Password Security

### Password Hashing

Uses **bcrypt** for password hashing:

```typescript
import { hashPassword, verifyPassword } from '@/core/lib/utils';

// Hash password
const hashedPassword = await hashPassword('userpassword');

// Verify password
const isValid = await verifyPassword('userpassword', hashedPassword);
```

### Password Requirements

Configured in `auth.config.json`:

```json
{
  "registration": {
    "minPasswordLength": 6,
    "requireStrongPassword": false  // Future feature
  }
}
```

---

## Session Management

### Session Tracking

Sessions are tracked in the `sessions` table:
- User ID
- Token hash
- IP address
- User agent
- Last activity
- Expiration time

### Session Cleanup

Implement a cron job to clean expired sessions:

```typescript
// Clean expired sessions
await db.delete(sessions)
  .where(lt(sessions.expiresAt, new Date()));
```

---

## Route Protection

### Middleware Protection

**File:** `src/middleware.ts`

```typescript
export function middleware(request: NextRequest) {
  const token = request.cookies.get('access-token');
  
  if (!token && isProtectedRoute(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}
```

### Protected Routes

Routes under `(dashboard)` are automatically protected:
- `/dashboard/*` - Requires authentication
- `/login`, `/register` - Public routes

---

## API Authentication

### Require Auth Middleware

```typescript
import { requireAuth } from '@/core/middleware/auth';

export async function GET(request: NextRequest) {
  const authMiddleware = requireAuth();
  const authResult = await authMiddleware(request);
  
  if (authResult instanceof NextResponse) {
    return authResult; // Unauthorized response
  }
  
  const userId = authResult; // User ID
  // ... your logic
}
```

---

## Troubleshooting

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

3. **SameSite Policy:**
   - Use `sameSite: 'lax'` for development
   - Use `sameSite: 'strict'` for production HTTPS

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

### Registration Not Working

**Problem:** Registration form doesn't submit

**Solutions:**

1. **Check Configuration:**
   ```json
   {
     "registration": {
       "enabled": true,
       "allowPublicRegistration": true
     }
   }
   ```

2. **Check API Endpoint:**
   - Verify `/api/auth/register` exists
   - Check server logs for errors
   - Verify database connection

---

## Security Best Practices

1. **Never store passwords in plain text** - Always hash with bcrypt
2. **Use HTTP-only cookies** - Prevents XSS attacks
3. **Set secure flag in production** - Only send cookies over HTTPS
4. **Implement rate limiting** - Prevent brute force attacks
5. **Validate all inputs** - Use Zod schemas
6. **Rotate refresh tokens** - Generate new token on each refresh
7. **Log authentication events** - Track login attempts, failures

---

## Future Features

- [ ] Email verification
- [ ] Two-factor authentication (2FA)
- [ ] Social login (Google, GitHub, Azure AD)
- [ ] Password reset flow
- [ ] Account locking after failed attempts
- [ ] Session management UI
- [ ] Remember me functionality

---

## Related Documentation

- **RBAC:** See [RBAC.md](./RBAC.md) for role-based access control
- **Database:** See [DATABASE.md](./DATABASE.md) for user schema
- **Troubleshooting:** See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for more issues

---

**Need help?** Check the troubleshooting section or review the authentication middleware code.

