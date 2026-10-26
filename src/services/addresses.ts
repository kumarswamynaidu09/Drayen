import { Address, IntegrationState } from '../types';
import { config, getIntegrationState } from './config';

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
    const token = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('drayen_customer_token') : null;

    if (config.isBackendConnected && token) {
      try {
        const res = await fetch(`${config.apiBaseUrl}/api/account/addresses`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const addresses = await res.json();
          return { addresses, integrationState: { ...integration, status: 'CONNECTED' } };
        }
      } catch (err) {
        console.warn('[AddressService] Error fetching backend addresses:', err);
      }
    }

    // Do NOT invent fake saved addresses
    return {
      addresses: [],
      integrationState: integration,
    };
  },

  async createAddress(_address: Address) {
    const integration = this.getIntegrationStatus();
    const token = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('drayen_customer_token') : null;

    if (config.isBackendConnected && token) {
      try {
        const res = await fetch(`${config.apiBaseUrl}/api/account/addresses`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(_address),
        });
        const data = await res.json();
        return {
          success: res.ok,
          address: data.address,
          error: data.error,
          integrationState: { ...integration, status: res.ok ? 'CONNECTED' : 'ERROR' },
        };
      } catch (err: any) {
        return { success: false, error: err.message, integrationState: integration };
      }
    }

    return {
      success: false,
      error: 'Saving address requires backend database integration. Teammate will connect POST /api/account/addresses.',
      integrationState: integration,
    };
  },

  async updateAddress(addressId: string, changes: Partial<Address>) {
    const integration = this.getIntegrationStatus();
    const token = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('drayen_customer_token') : null;

    if (config.isBackendConnected && token) {
      try {
        const res = await fetch(`${config.apiBaseUrl}/api/account/addresses/${addressId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(changes),
        });
        const data = await res.json();
        return {
          success: res.ok,
          address: data.address,
          error: data.error,
          integrationState: { ...integration, status: res.ok ? 'CONNECTED' : 'ERROR' },
        };
      } catch (err: any) {
        return { success: false, error: err.message, integrationState: integration };
      }
    }

    return {
      success: false,
      error: 'Updating address requires backend database integration.',
      integrationState: integration,
    };
  },

  async deleteAddress(addressId: string) {
    const integration = this.getIntegrationStatus();
    const token = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('drayen_customer_token') : null;

    if (config.isBackendConnected && token) {
      try {
        const res = await fetch(`${config.apiBaseUrl}/api/account/addresses/${addressId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        return {
          success: res.ok,
          integrationState: { ...integration, status: res.ok ? 'CONNECTED' : 'ERROR' },
        };
      } catch (err: any) {
        return { success: false, error: err.message, integrationState: integration };
      }
    }

    return {
      success: false,
      error: 'Deleting address requires backend database integration.',
      integrationState: integration,
    };
  },

  async setDefaultAddress(addressId: string) {
    return this.updateAddress(addressId, { isDefault: true });
  },
};
