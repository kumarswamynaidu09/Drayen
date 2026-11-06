import { Address, IntegrationState } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getIntegrationState } from './config';
import { authService } from './auth';

export interface AddressService {
  getAddresses(): Promise<{ addresses: Address[]; integrationState: IntegrationState }>;
  createAddress(address: Address): Promise<{ success: boolean; address?: Address; error?: string; integrationState: IntegrationState }>;
  updateAddress(addressId: string, changes: Partial<Address>): Promise<{ success: boolean; address?: Address; error?: string; integrationState: IntegrationState }>;
  deleteAddress(addressId: string): Promise<{ success: boolean; error?: string; integrationState: IntegrationState }>;
  setDefaultAddress(addressId: string): Promise<{ success: boolean; error?: string; integrationState: IntegrationState }>;
  getIntegrationStatus(): IntegrationState;
}

export const addressService: AddressService = {
  getIntegrationStatus(): IntegrationState {
    return getIntegrationState('Customer Address Service', '/api/account/addresses');
  },

  async getAddresses() {
    const integration = this.getIntegrationStatus();
    const currentCustomer = authService.getCurrentUser();

    if (isSupabaseConfigured && currentCustomer) {
      try {
        const { data, error } = await supabase
          .from('customer_addresses')
          .select('*')
          .eq('customer_id', currentCustomer.id)
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          const addresses: Address[] = data.map((a) => ({
            id: a.id,
            fullName: a.recipient_name,
            phone: a.phone,
            addressLine1: a.line1,
            addressLine2: a.line2 || '',
            city: a.city,
            state: a.state,
            pincode: a.postal_code,
            addressType: 'home',
            isDefault: Boolean(a.is_default),
          }));
          return { addresses, integrationState: { ...integration, status: 'CONNECTED' } };
        }
      } catch (err) {
        console.warn('[AddressService] Supabase addresses note:', err);
      }
    }

    return {
      addresses: [],
      integrationState: integration,
    };
  },

  async createAddress(address: Address) {
    const integration = this.getIntegrationStatus();
    const currentCustomer = authService.getCurrentUser();

    if (!currentCustomer) {
      return { success: false, error: 'Sign in to save addresses.', integrationState: integration };
    }

    if (isSupabaseConfigured) {
      try {
        const payload = {
          customer_id: currentCustomer.id,
          recipient_name: address.fullName,
          phone: address.phone,
          line1: address.addressLine1,
          line2: address.addressLine2 || '',
          city: address.city,
          state: address.state,
          postal_code: address.pincode,
          is_default: Boolean(address.isDefault),
        };

        const { data, error } = await supabase
          .from('customer_addresses')
          .insert([payload])
          .select()
          .single();

        if (!error && data) {
          const created: Address = {
            id: data.id,
            fullName: data.recipient_name,
            phone: data.phone,
            addressLine1: data.line1,
            addressLine2: data.line2 || '',
            city: data.city,
            state: data.state,
            pincode: data.postal_code,
            addressType: 'home',
            isDefault: Boolean(data.is_default),
          };
          return { success: true, address: created, integrationState: { ...integration, status: 'CONNECTED' } };
        }
        return { success: false, error: error?.message, integrationState: integration };
      } catch (err: any) {
        return { success: false, error: err.message, integrationState: integration };
      }
    }

    return { success: true, address, integrationState: integration };
  },

  async updateAddress(addressId: string, changes: Partial<Address>) {
    const integration = this.getIntegrationStatus();
    if (isSupabaseConfigured) {
      try {
        const payload: Record<string, any> = {};
        if (changes.fullName) payload.recipient_name = changes.fullName;
        if (changes.phone) payload.phone = changes.phone;
        if (changes.addressLine1) payload.line1 = changes.addressLine1;
        if (changes.addressLine2 !== undefined) payload.line2 = changes.addressLine2;
        if (changes.city) payload.city = changes.city;
        if (changes.state) payload.state = changes.state;
        if (changes.pincode) payload.postal_code = changes.pincode;
        if (changes.isDefault !== undefined) payload.is_default = Boolean(changes.isDefault);

        const { error } = await supabase.from('customer_addresses').update(payload).eq('id', addressId);
        if (!error) {
          return { success: true, integrationState: { ...integration, status: 'CONNECTED' } };
        }
        return { success: false, error: error.message, integrationState: integration };
      } catch (err: any) {
        return { success: false, error: err.message, integrationState: integration };
      }
    }
    return { success: true, integrationState: integration };
  },

  async deleteAddress(addressId: string) {
    const integration = this.getIntegrationStatus();
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('customer_addresses').delete().eq('id', addressId);
        if (!error) {
          return { success: true, integrationState: { ...integration, status: 'CONNECTED' } };
        }
        return { success: false, error: error.message, integrationState: integration };
      } catch (err: any) {
        return { success: false, error: err.message, integrationState: integration };
      }
    }
    return { success: true, integrationState: integration };
  },

  async setDefaultAddress(addressId: string) {
    const integration = this.getIntegrationStatus();
    const currentCustomer = authService.getCurrentUser();
    if (isSupabaseConfigured && currentCustomer) {
      try {
        // Reset all defaults
        await supabase.from('customer_addresses').update({ is_default: false }).eq('customer_id', currentCustomer.id);
        // Set new default
        const { error } = await supabase.from('customer_addresses').update({ is_default: true }).eq('id', addressId);
        if (!error) {
          return { success: true, integrationState: { ...integration, status: 'CONNECTED' } };
        }
        return { success: false, error: error.message, integrationState: integration };
      } catch (err: any) {
        return { success: false, error: err.message, integrationState: integration };
      }
    }
    return { success: true, integrationState: integration };
  },
};
