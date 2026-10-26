import { UserProfile, IntegrationState } from '../types';
import { config, getIntegrationState } from './config';
import { authService } from './auth';

export interface ProfileService {
  getProfile(): Promise<{ profile?: UserProfile; integrationState: IntegrationState }>;
  updateProfile(changes: Partial<UserProfile>): Promise<{ success: boolean; profile?: UserProfile; error?: string; integrationState: IntegrationState }>;
  getIntegrationStatus(): IntegrationState;
}

export const profileService: ProfileService = {
  getIntegrationStatus(): IntegrationState {
    return getIntegrationState('Customer Profile Service', '/api/account/profile');
  },

  async getProfile() {
    const integration = this.getIntegrationStatus();
    const token = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('drayen_customer_token') : null;

    if (config.isBackendConnected && token) {
      try {
        const res = await fetch(`${config.apiBaseUrl}/api/account/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const profile = await res.json();
          return { profile, integrationState: { ...integration, status: 'CONNECTED' } };
        }
      } catch (err) {
        console.warn('[ProfileService] Backend profile fetch error:', err);
      }
    }

    const currentCustomer = authService.getCurrentUser();
    if (currentCustomer) {
      return {
        profile: {
          id: currentCustomer.id,
          fullName: `${currentCustomer.firstName} ${currentCustomer.lastName || ''}`.trim(),
          email: currentCustomer.email,
          phone: currentCustomer.phone,
          isEmailVerified: false,
          isMobileVerified: false,
          createdAt: currentCustomer.createdAt,
        },
        integrationState: integration,
      };
    }

    return {
      profile: undefined,
      integrationState: integration,
    };
  },

  async updateProfile(_changes: Partial<UserProfile>) {
    const integration = this.getIntegrationStatus();
    const token = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('drayen_customer_token') : null;

    if (config.isBackendConnected && token) {
      try {
        const res = await fetch(`${config.apiBaseUrl}/api/account/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(_changes),
        });
        const data = await res.json();
        return {
          success: res.ok,
          profile: data.profile,
          error: data.error,
          integrationState: { ...integration, status: res.ok ? 'CONNECTED' : 'ERROR' },
        };
      } catch (err: any) {
        return { success: false, error: err.message, integrationState: integration };
      }
    }

    return {
      success: false,
      error: 'Profile updates are unavailable until the customer database is connected. Teammate will connect PUT /api/account/profile.',
      integrationState: integration,
    };
  },
};
