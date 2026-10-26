import { Customer, IntegrationState } from '../types';
import { config, getIntegrationState } from './config';

export interface AuthCredentials {
  email?: string;
  phone?: string;
  password?: string;
  rememberMe?: boolean;
}

export interface SignUpDetails {
  fullName: string;
  email: string;
  phone: string;
  password?: string;
  consentAgreed?: boolean;
}

export interface AuthResult {
  success: boolean;
  user?: Customer;
  token?: string;
  message?: string;
  error?: string;
  integrationState: IntegrationState;
}

export interface OtpRequestResult {
  success: boolean;
  message?: string;
  error?: string;
  integrationState: IntegrationState;
}

export interface AuthService {
  getSession(): { isAuthenticated: boolean; token?: string; user?: Customer | null };
  getCurrentUser(): Customer | null;
  signIn(credentials: AuthCredentials): Promise<AuthResult>;
  signUp(details: SignUpDetails): Promise<AuthResult>;
  signOut(): Promise<void>;
  requestPasswordReset(identifier: string): Promise<AuthResult>;
  verifyEmail(code: string): Promise<AuthResult>;
  requestOtp(phone: string): Promise<OtpRequestResult>;
  verifyOtp(phone: string, code: string): Promise<AuthResult>;
  getIntegrationStatus(): IntegrationState;
}

export const authService: AuthService = {
  getIntegrationStatus(): IntegrationState {
    return getIntegrationState('Customer Authentication Service', '/api/auth');
  },

  getSession() {
    const user = this.getCurrentUser();
    let token: string | undefined;
    try {
      token = sessionStorage.getItem('drayen_customer_token') || undefined;
    } catch {
      // Storage unavailable
    }
    return {
      isAuthenticated: Boolean(user && token),
      token,
      user,
    };
  },

  getCurrentUser(): Customer | null {
    try {
      const raw = sessionStorage.getItem('drayen_customer_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  async signIn(credentials: AuthCredentials): Promise<AuthResult> {
    const integration = this.getIntegrationStatus();

    // When backend is connected, delegate to real endpoint
    if (config.isBackendConnected) {
      try {
        const res = await fetch(`${config.apiBaseUrl}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials),
        });
        const data = await res.json();
        if (res.ok && data.user) {
          sessionStorage.setItem('drayen_customer_token', data.token || '');
          sessionStorage.setItem('drayen_customer_user', JSON.stringify(data.user));
          return { success: true, user: data.user, token: data.token, integrationState: integration };
        }
        return {
          success: false,
          error: data.error || 'Authentication rejected by security provider.',
          integrationState: integration,
        };
      } catch (err: any) {
        return {
          success: false,
          error: err.message || 'Network error connecting to auth server.',
          integrationState: integration,
        };
      }
    }

    // Backend is not configured: Explicit typed NOT_CONFIGURED response. Never fake login!
    return {
      success: false,
      error:
        'Customer Authentication Service is not yet configured on the backend. Teammate will connect POST /api/auth/login. You can explore the storefront and use Guest Checkout seamlessly.',
      integrationState: integration,
    };
  },

  async signUp(details: SignUpDetails): Promise<AuthResult> {
    const integration = this.getIntegrationStatus();

    if (config.isBackendConnected) {
      try {
        const res = await fetch(`${config.apiBaseUrl}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(details),
        });
        const data = await res.json();
        if (res.ok && data.user) {
          sessionStorage.setItem('drayen_customer_token', data.token || '');
          sessionStorage.setItem('drayen_customer_user', JSON.stringify(data.user));
          return { success: true, user: data.user, token: data.token, integrationState: integration };
        }
        return {
          success: false,
          error: data.error || 'Account creation rejected.',
          integrationState: integration,
        };
      } catch (err: any) {
        return {
          success: false,
          error: err.message || 'Network error connecting to auth server.',
          integrationState: integration,
        };
      }
    }

    return {
      success: false,
      error:
        'Customer Account Registration requires backend integration. Teammate will connect POST /api/auth/register. Guest Checkout is available.',
      integrationState: integration,
    };
  },

  async requestPasswordReset(identifier: string): Promise<AuthResult> {
    const integration = this.getIntegrationStatus();

    if (config.isBackendConnected) {
      try {
        const res = await fetch(`${config.apiBaseUrl}/api/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier }),
        });
        const data = await res.json();
        return {
          success: res.ok,
          message: data.message,
          error: res.ok ? undefined : data.error,
          integrationState: integration,
        };
      } catch (err: any) {
        return { success: false, error: err.message, integrationState: integration };
      }
    }

    return {
      success: false,
      error:
        'Password recovery is unavailable until the backend mailer/SMS service is connected. Teammate will connect POST /api/auth/forgot-password.',
      integrationState: integration,
    };
  },

  async verifyEmail(code: string): Promise<AuthResult> {
    const integration = this.getIntegrationStatus();

    if (config.isBackendConnected) {
      try {
        const res = await fetch(`${config.apiBaseUrl}/api/auth/verify-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });
        const data = await res.json();
        return {
          success: res.ok,
          message: data.message,
          error: res.ok ? undefined : data.error,
          integrationState: integration,
        };
      } catch (err: any) {
        return { success: false, error: err.message, integrationState: integration };
      }
    }

    return {
      success: false,
      error: 'Email verification requires backend provider integration.',
      integrationState: integration,
    };
  },

  async requestOtp(phone: string): Promise<OtpRequestResult> {
    const integration = this.getIntegrationStatus();

    if (config.isBackendConnected) {
      try {
        const res = await fetch(`${config.apiBaseUrl}/api/auth/otp/request`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone }),
        });
        const data = await res.json();
        return {
          success: res.ok,
          message: data.message,
          error: res.ok ? undefined : data.error,
          integrationState: integration,
        };
      } catch (err: any) {
        return { success: false, error: err.message, integrationState: integration };
      }
    }

    return {
      success: false,
      error:
        'Mobile OTP dispatch is unavailable until an SMS gateway provider (e.g. MSG91, Twilio) is configured on the backend.',
      integrationState: integration,
    };
  },

  async verifyOtp(phone: string, code: string): Promise<AuthResult> {
    const integration = this.getIntegrationStatus();

    if (config.isBackendConnected) {
      try {
        const res = await fetch(`${config.apiBaseUrl}/api/auth/otp/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, code }),
        });
        const data = await res.json();
        if (res.ok && data.user) {
          sessionStorage.setItem('drayen_customer_token', data.token || '');
          sessionStorage.setItem('drayen_customer_user', JSON.stringify(data.user));
          return { success: true, user: data.user, token: data.token, integrationState: integration };
        }
        return {
          success: false,
          error: data.error || 'Invalid OTP code.',
          integrationState: integration,
        };
      } catch (err: any) {
        return { success: false, error: err.message, integrationState: integration };
      }
    }

    return {
      success: false,
      error: 'Mobile OTP verification requires backend SMS provider integration.',
      integrationState: integration,
    };
  },

  async signOut(): Promise<void> {
    try {
      sessionStorage.removeItem('drayen_customer_user');
      sessionStorage.removeItem('drayen_customer_token');
    } catch {
      // Storage unavailable
    }
  },
};
