import { NextResponse } from 'next/server';
import { getAuthConfig, isRegistrationEnabledAsync } from '@/core/config/authConfig';

/**
 * GET /api/auth/config
 * Returns auth configuration for client-side use
 * Checks database for registration enabled status
 */
export async function GET() {
  try {
    const config = getAuthConfig();
    
    // Check database for registration enabled status
    const registrationEnabled = await isRegistrationEnabledAsync();
    
    // Only return UI-relevant config (hide sensitive settings)
    return NextResponse.json({
      registration: {
        enabled: registrationEnabled,
        showOnLoginPage: config.registration.showOnLoginPage,
      },
      ui: {
        showRegisterLink: config.ui.showRegisterLink && registrationEnabled,
        showForgotPasswordLink: config.ui.showForgotPasswordLink,
      },
    });
  } catch (error) {
    console.error('Failed to load auth config:', error);
    return NextResponse.json(
      { error: 'Failed to load configuration' },
      { status: 500 }
    );
  }
}

