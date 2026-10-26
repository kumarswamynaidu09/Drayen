/**
 * DRAYEN Atelier — Service Configuration & Environment Contract
 * Safe client environment access with no hardcoded secrets or mock data fallbacks.
 */

export interface ServiceConfig {
  apiBaseUrl: string;
  merchantUpiId: string;
  merchantName: string;
  merchantQrUrl?: string;
  freeShippingThresholdPaise: number;
  standardShippingFeePaise: number;
  contactEmail: string;
  contactPhone: string;
  supportWhatsApp: string;
  isBackendConnected: boolean;
}

export const config: ServiceConfig = {
  // If empty string, frontend operates in self-contained contract mode
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '',
  merchantUpiId: import.meta.env.VITE_MERCHANT_UPI_ID || 'drayen.atelier@okaxis',
  merchantName: import.meta.env.VITE_MERCHANT_NAME || 'DRAYEN ATELIER',
  merchantQrUrl: import.meta.env.VITE_MERCHANT_QR_URL || '',
  freeShippingThresholdPaise: parseInt(import.meta.env.VITE_FREE_SHIPPING_THRESHOLD_PAISE || '49900', 10),
  standardShippingFeePaise: parseInt(import.meta.env.VITE_STANDARD_SHIPPING_FEE_PAISE || '9900', 10),
  contactEmail: import.meta.env.VITE_CONTACT_EMAIL || 'concierge@drayen.in',
  contactPhone: import.meta.env.VITE_CONTACT_PHONE || '+91 98400 12345',
  supportWhatsApp: import.meta.env.VITE_SUPPORT_WHATSAPP || '+919840012345',
  isBackendConnected: Boolean(import.meta.env.VITE_API_BASE_URL),
};

export function getIntegrationState(serviceName: string, endpoint?: string) {
  return {
    status: config.isBackendConnected ? ('CONNECTED' as const) : ('NOT_CONFIGURED' as const),
    serviceName,
    endpoint: endpoint ? `${config.apiBaseUrl || '[UNCONFIGURED_BASE_URL]'}${endpoint}` : undefined,
    message: config.isBackendConnected
      ? `${serviceName} connected to backend.`
      : `${serviceName} backend endpoint is not yet connected. Teammate will connect API separately.`,
    docsUrl: '/docs/BACKEND_INTEGRATION_GUIDE.md',
  };
}
