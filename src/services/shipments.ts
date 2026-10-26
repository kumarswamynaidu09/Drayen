import { Shipment, IntegrationState } from '../types';
import { config, getIntegrationState } from './config';

export interface ShipmentsService {
  getShipmentStatus(orderId: string): Promise<{ shipment?: Shipment; integrationState: IntegrationState }>;
  updateShipment(orderId: string, carrier: string, trackingNumber: string): Promise<{ success: boolean; message?: string; error?: string; integrationState: IntegrationState }>;
}

export const shipmentsService: ShipmentsService = {
  async getShipmentStatus(orderId: string) {
    const integration = getIntegrationState('Logistics & Courier Gateway', `/api/shipments/${orderId}`);

    if (config.isBackendConnected) {
      try {
        const res = await fetch(`${config.apiBaseUrl}/api/shipments/${orderId}`);
        if (res.ok) {
          const shipment = await res.json();
          return { shipment, integrationState: { ...integration, status: 'CONNECTED' } };
        }
      } catch (err) {
        console.warn('[ShipmentsService] Error fetching shipment:', err);
      }
    }

    return {
      shipment: undefined,
      integrationState: integration,
    };
  },

  async updateShipment(orderId: string, carrier: string, trackingNumber: string) {
    const integration = getIntegrationState('Logistics & Courier Gateway', `/api/shipments/${orderId}`);

    return {
      success: false,
      error: 'Courier dispatch API requires 3PL logistics provider credentials (Blue Dart / Delhivery).',
      integrationState: integration,
    };
  },
};
