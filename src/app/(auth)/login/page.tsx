'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/core/components/ui/input';
import { Button } from '@/core/components/ui/button';
import { useAuthStore } from '@/core/store/authStore';
import { loginSchema, type LoginInput } from '@/core/lib/validations/auth';

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  
  const [formData, setFormData] = useState<LoginInput>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof LoginInput, string>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showRegisterLink, setShowRegisterLink] = useState(false);

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
        setApiError(data.error || 'Login failed');
        setIsLoading(false);
        return;
      }

      // Store user and tokens in Zustand store
      setUser(data.user, data.accessToken, data.refreshToken);
      
      // Tokens are also set in cookies by the API response
      // No need to manually set them here as they're HTTP-only

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      setApiError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
            Sign in to your account
          </h2>
          {showRegisterLink && (
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link href="/register" className="font-medium text-primary hover:text-primary/90">
                Sign up
              </Link>
            </p>
          )}
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px space-y-4">
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

          {apiError && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{apiError}</p>
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

