import { Customer, IntegrationState } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
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
  requestOtp?(phone: string): Promise<OtpRequestResult>;
  verifyOtp?(phone: string, code: string): Promise<AuthResult>;
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
    } catch {}
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
    const email = (credentials.email || credentials.phone || '').trim().toLowerCase();
    const password = credentials.password || '';

    // 1. Direct Supabase Auth
    if (isSupabaseConfigured && email.includes('@')) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          return {
            success: false,
            error: error.message,
            integrationState: integration,
          };
        }

        if (data.user) {
          const names = (data.user.user_metadata?.full_name || email.split('@')[0]).split(' ');
          const customer: Customer = {
            id: data.user.id,
            email: data.user.email || email,
            phone: data.user.user_metadata?.phone || '',
            firstName: names[0] || 'Patron',
            lastName: names.slice(1).join(' ') || '',
            savedAddresses: [],
            createdAt: data.user.created_at,
          };
          const token = data.session?.access_token || 'sb_token_' + Date.now();
          sessionStorage.setItem('drayen_customer_token', token);
          sessionStorage.setItem('drayen_customer_user', JSON.stringify(customer));
          return { success: true, user: customer, token, integrationState: { ...integration, status: 'CONNECTED' } };
        }
      } catch (err: any) {
        return {
          success: false,
          error: err.message || 'Supabase authentication failed.',
          integrationState: integration,
        };
      }
    }

    // 2. API Proxy Fallback (when running local full-stack server)
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
        error: data.error || 'Invalid credentials.',
        integrationState: integration,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Network error connecting to auth server.',
        integrationState: integration,
      };
    }
  },

  async signUp(details: SignUpDetails): Promise<AuthResult> {
    const integration = this.getIntegrationStatus();
    const email = details.email.trim().toLowerCase();
    const password = details.password || '';

    // 1. Direct Supabase Auth Sign Up
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: details.fullName.trim(),
              phone: details.phone.trim(),
            },
          },
        });

        if (error) {
          return {
            success: false,
            error: error.message,
            integrationState: integration,
          };
        }

        if (data.user) {
          const names = details.fullName.trim().split(' ');
          const customer: Customer = {
            id: data.user.id,
            email: data.user.email || email,
            phone: details.phone.trim(),
            firstName: names[0] || 'Patron',
            lastName: names.slice(1).join(' ') || '',
            savedAddresses: [],
            createdAt: data.user.created_at,
          };
          const token = data.session?.access_token || 'sb_token_' + Date.now();
          sessionStorage.setItem('drayen_customer_token', token);
          sessionStorage.setItem('drayen_customer_user', JSON.stringify(customer));
          return {
            success: true,
            user: customer,
            token,
            message: data.session ? 'Account created and authenticated!' : 'Account registered! If confirmation is required, please check your inbox.',
            integrationState: { ...integration, status: 'CONNECTED' },
          };
        }
      } catch (err: any) {
        return {
          success: false,
          error: err.message || 'Supabase registration error.',
          integrationState: integration,
        };
      }
    }

    // 2. API Proxy Fallback (when running local full-stack server)
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
  },

  async signOut(): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch {}
    }
    sessionStorage.removeItem('drayen_customer_token');
    sessionStorage.removeItem('drayen_customer_user');
  },

  async requestPasswordReset(identifier: string): Promise<AuthResult> {
    const integration = this.getIntegrationStatus();
    if (isSupabaseConfigured && identifier.includes('@')) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(identifier.trim());
        if (!error) {
          return {
            success: true,
            message: 'Password reset link sent to your email.',
            integrationState: integration,
          };
        }
      } catch {}
    }
    return {
      success: true,
      message: 'If an account exists, instructions have been dispatched.',
      integrationState: integration,
    };
  },
};
