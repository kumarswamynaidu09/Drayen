import { UserProfile, IntegrationState } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getIntegrationState } from './config';
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
    const currentCustomer = authService.getCurrentUser();

    if (isSupabaseConfigured && currentCustomer) {
      try {
        const { data, error } = await supabase
          .from('customer_profiles')
          .select('*')
          .eq('id', currentCustomer.id)
          .single();

        if (!error && data) {
          const profile: UserProfile = {
            id: data.id,
            fullName: data.full_name || `${currentCustomer.firstName} ${currentCustomer.lastName || ''}`.trim(),
            email: data.email || currentCustomer.email,
            phone: data.phone || currentCustomer.phone,
            displayName: data.display_name,
            dateOfBirth: data.date_of_birth,
            aestheticPreference: data.aesthetic_preference,
            isEmailVerified: true,
            isMobileVerified: Boolean(data.phone),
            createdAt: data.created_at || currentCustomer.createdAt,
          };
          return { profile, integrationState: { ...integration, status: 'CONNECTED' } };
        }
      } catch (err) {
        console.warn('[ProfileService] Supabase profile fetch note:', err);
      }
    }

    if (currentCustomer) {
      return {
        profile: {
          id: currentCustomer.id,
          fullName: `${currentCustomer.firstName} ${currentCustomer.lastName || ''}`.trim(),
          email: currentCustomer.email,
          phone: currentCustomer.phone,
          isEmailVerified: true,
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

  async updateProfile(changes: Partial<UserProfile>) {
    const integration = this.getIntegrationStatus();
    const currentCustomer = authService.getCurrentUser();

    if (!currentCustomer) {
      return { success: false, error: 'User is not authenticated.', integrationState: integration };
    }

    if (isSupabaseConfigured) {
      try {
        const payload: Record<string, any> = {
          id: currentCustomer.id,
          email: currentCustomer.email,
          updated_at: new Date().toISOString(),
        };

        if (changes.fullName !== undefined) payload.full_name = changes.fullName;
        if (changes.phone !== undefined) payload.phone = changes.phone;
        if (changes.displayName !== undefined) payload.display_name = changes.displayName;
        if (changes.dateOfBirth !== undefined) payload.date_of_birth = changes.dateOfBirth;
        if (changes.aestheticPreference !== undefined) payload.aesthetic_preference = changes.aestheticPreference;

        const { error } = await supabase.from('customer_profiles').upsert(payload);
        if (!error) {
          // Update local session
          const names = (payload.full_name || currentCustomer.firstName).split(' ');
          const updatedCustomer = {
            ...currentCustomer,
            firstName: names[0] || currentCustomer.firstName,
            lastName: names.slice(1).join(' ') || currentCustomer.lastName,
            phone: payload.phone || currentCustomer.phone,
          };
          sessionStorage.setItem('drayen_customer_user', JSON.stringify(updatedCustomer));

          return {
            success: true,
            profile: {
              ...changes,
              id: currentCustomer.id,
              fullName: payload.full_name || `${currentCustomer.firstName} ${currentCustomer.lastName || ''}`.trim(),
              email: currentCustomer.email,
              phone: payload.phone || currentCustomer.phone,
            } as UserProfile,
            integrationState: { ...integration, status: 'CONNECTED' },
          };
        }

        return { success: false, error: error.message, integrationState: integration };
      } catch (err: any) {
        return { success: false, error: err.message, integrationState: integration };
      }
    }

    return {
      success: true,
      profile: changes as UserProfile,
      integrationState: integration,
    };
  },
};
