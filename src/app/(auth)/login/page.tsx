'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/core/components/ui/input';
import { Button } from '@/core/components/ui/button';
import { useAuthStore } from '@/core/store/authStore';
import { loginSchema, type LoginInput } from '@/core/lib/validations/auth';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setUser = useAuthStore((state) => state.setUser);
  const { isAuthenticated, _hasHydrated, token } = useAuthStore();
  
  const [formData, setFormData] = useState<LoginInput>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof LoginInput, string>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showRegisterLink, setShowRegisterLink] = useState(false);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Redirect authenticated users away from login page
  useEffect(() => {
    if (!_hasHydrated) return;

    if (isAuthenticated) {
      // Get redirect path from URL query parameter (set by middleware when redirecting to login)
      const redirectPath = searchParams.get('redirect');
      
      if (redirectPath && redirectPath.startsWith('/') && !redirectPath.startsWith('/login')) {
        // Redirect to the page they were trying to access
        router.replace(redirectPath);
        return;
      }

      // If no redirect parameter, get the first accessible route
      const getAccessibleRoute = async () => {
        try {
          const response = await fetch('/api/modules/navigation', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            credentials: 'include',
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.navigation && data.navigation.length > 0) {
              const firstRoute = data.navigation[0]?.path || '/profile';
              router.replace(firstRoute);
              return;
            }
          }
        } catch (error) {
          console.error('[Login] Error fetching accessible route:', error);
        }

        // Fallback to profile (always accessible to authenticated users)
        router.replace('/profile');
      };

      getAccessibleRoute();
    }
  }, [_hasHydrated, isAuthenticated, router, token, searchParams]);

  // Fetch auth config to determine if register link should be shown
  useEffect(() => {
    fetch('/api/auth/config')
      .then((res) => res.json())
      .then((data) => {
        if (data.registration?.enabled && data.registration?.showOnLoginPage && data.ui?.showRegisterLink) {
          setShowRegisterLink(true);
        }
      })
      .catch(() => {
        // Default to showing register link if config fetch fails
        setShowRegisterLink(true);
      });
  }, []);

  // Show message when redirected from registration (read from URL query string)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const registered = params.get('registered');
    const emailFromQuery = params.get('email');

    if (registered === '1') {
      const safeEmail = emailFromQuery || '';
      if (safeEmail) {
        setPendingVerificationEmail(safeEmail);
      }

      setInfoMessage(
        'Registration successful! Please check your email inbox and click on the verification link to activate your account before signing in.'
      );
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof LoginInput]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (apiError) {
      setApiError(null);
    }
    if (infoMessage) {
      setInfoMessage(null);
    }
  };

  const validateForm = (): boolean => {
    const result = loginSchema.safeParse(formData);
    
    if (!result.success) {
      const newErrors: Partial<Record<keyof LoginInput, string>> = {};
      result.error.errors.forEach((error) => {
        if (error.path[0]) {
          newErrors[error.path[0] as keyof LoginInput] = error.message;
        }
      });
      setErrors(newErrors);
      return false;
    }
    
    setErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setApiError(null);
    setInfoMessage(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        // Special handling for unverified email
        if (data.code === 'EMAIL_NOT_VERIFIED') {
          const email = (data.email as string | undefined) || formData.email;
          setPendingVerificationEmail(email);
          setApiError(
            data.error ||
              'Your email address is not verified yet. Please check your inbox for the verification link.'
          );
        } else {
          setApiError(data.error || 'Login failed');
        }
        setIsLoading(false);
        return;
      }

      // Store user and tokens in Zustand store
      setUser(data.user, data.accessToken, data.refreshToken);
      
      // Tokens are also set in cookies by the API response
      // No need to manually set them here as they're HTTP-only

      // Fetch and cache permissions immediately to avoid delays on page load
      try {
        const { setPermissions } = await import('@/core/store/authStore');
        const permissionsResponse = await fetch('/api/auth/permissions', {
          headers: {
            Authorization: `Bearer ${data.accessToken}`,
          },
          credentials: 'include',
        });
        
        if (permissionsResponse.ok) {
          const permissionsData = await permissionsResponse.json();
          setPermissions(permissionsData.permissions || []);
        }
      } catch (error) {
        console.error('[Login] Failed to fetch permissions:', error);
        // Continue with login even if permissions fetch fails
      }

      // Get redirect path - prefer URL query parameter, then API response, then default
      const redirectFromUrl = searchParams.get('redirect');
      const redirectPath = redirectFromUrl && redirectFromUrl.startsWith('/') && !redirectFromUrl.startsWith('/login')
        ? redirectFromUrl
        : (data.redirectPath || '/profile');

      console.log('[Login] Success - redirecting to:', {
        userId: data.user.id,
        email: data.user.email,
        redirectPath,
      });

      // Redirect to the target route (use replace to avoid back button issues)
      router.replace(redirectPath);
    } catch (error) {
      console.error('Login error:', error);
      setApiError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!pendingVerificationEmail) return;

    setIsLoading(true);
    setApiError(null);
    setInfoMessage(null);

    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: pendingVerificationEmail }),
      });

      const data = await res.json();

      if (!res.ok) {
        setApiError(data.error || 'Failed to resend verification email. Please try again later.');
      } else {
        setInfoMessage(
          data.message ||
            'If an account exists with this email, a new verification link has been sent to your inbox.'
        );
      }
    } catch (error) {
      console.error('[Login] Resend verification error:', error);
      setApiError('Failed to resend verification email. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render login form if user is already authenticated (redirecting)
  if (_hasHydrated && isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 sm:px-6 lg:px-8">
      <div className="relative max-w-md w-full space-y-6 sm:space-y-8 rounded-2xl border border-border/60 bg-card/95 shadow-2xl backdrop-blur-xl px-6 py-6 sm:px-8 sm:py-8">
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 hidden sm:flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 shadow-lg">
          <span className="text-xl font-semibold text-primary-foreground">RF</span>
        </div>
        <div className="pt-1 sm:pt-4 text-center space-y-2">
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground/80">
            Welcome back
          </p>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
            Sign in to your account
          </h2>
          {showRegisterLink && (
            <p className="mt-1 text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="font-medium text-primary hover:text-primary/90">
                Sign up
              </Link>
            </p>
          )}
        </div>
        <form className="mt-4 sm:mt-6 space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md space-y-4">
            <Input
              id="email"
              name="email"
              type="email"
              label="Email address"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              placeholder="Enter your email"
            />
            <Input
              id="password"
              name="password"
              type="password"
              label="Password"
              autoComplete="current-password"
              required
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              placeholder="Enter your password"
            />
          </div>

          <div className="flex items-center justify-end">
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-primary hover:text-primary/90"
            >
              Forgot your password?
            </Link>
          </div>

          {infoMessage && (
            <div className="rounded-md bg-emerald-50 dark:bg-emerald-900/20 p-4">
              <p className="text-sm text-emerald-800 dark:text-emerald-200">{infoMessage}</p>
            </div>
          )}

          {apiError && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-4">
              <p className="text-sm text-red-800 dark:text-red-400">{apiError}</p>
              {pendingVerificationEmail && (
                <div className="mt-3 flex flex-col gap-2">
                  <p className="text-xs text-muted-foreground">
                    We&apos;ve sent a verification link to <span className="font-medium">{pendingVerificationEmail}</span>.
                    If you can&apos;t find it, you can request a new link below.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="self-start"
                    onClick={handleResendVerification}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Sending...' : 'Resend verification email'}
                  </Button>
                </div>
              )}
            </div>
          )}

          <div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

