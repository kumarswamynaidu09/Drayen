import { AdminMetrics, Order, Product, IntegrationState, StoreSettings } from '../types';
import { config, getIntegrationState } from './config';
import { catalogueService } from './catalogue';

export interface AdminDashboardSummary {
  totalOrders: number | null;
  awaitingPaymentVerification: number | null;
  confirmedOrders: number | null;
  awaitingDispatch: number | null;
  shippedOrders: number | null;
  verifiedRevenuePaise: number | null;
  verifiedRevenueINR: string | null;
  isConfigured: boolean;
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  stockQuantity: number;
  material: string;
  finish: string;
  variantsCount: number;
  isPublished: boolean;
  isLowStock: boolean;
}

export interface ShipmentRecord {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  city: string;
  state: string;
  shippingTier: string;
  totalPaise: number;
  orderStatus: string;
  paymentStatus: string;
  courier?: string;
  trackingNumber?: string;
  dispatchDate?: string;
  isEligibleForFulfillment: boolean;
}

export interface PendingPaymentRecord {
  id: string;
  orderId: string;
  orderNumber: string;
  amountPaise: number;
  utrNumber: string;
  screenshotUrl?: string;
  submittedAt: string;
  paymentStatus: string;
  customerName?: string;
  customerPhone?: string;
  payerName?: string;
  payerVpa?: string;
  customerNotes?: string;
}

export interface AdminService {
  getDashboardSummary(): Promise<{ summary?: AdminDashboardSummary; integrationState: IntegrationState }>;
  getProducts(filters?: { search?: string; category?: string }): Promise<{ products: Product[]; integrationState: IntegrationState }>;
  createProduct(product: Partial<Product>): Promise<{ success: boolean; product?: Product; error?: string; integrationState: IntegrationState }>;
  updateProduct(productId: string, changes: Partial<Product>): Promise<{ success: boolean; product?: Product; error?: string; integrationState: IntegrationState }>;
  getOrders(filters?: { status?: string; search?: string }): Promise<{ orders: Order[]; integrationState: IntegrationState }>;
  getPendingPayments(): Promise<{ submissions: PendingPaymentRecord[]; integrationState: IntegrationState }>;
  approvePayment(orderId: string, notes?: string): Promise<{ success: boolean; message?: string; error?: string; integrationState: IntegrationState }>;
  rejectPayment(orderId: string, reason: string): Promise<{ success: boolean; message?: string; error?: string; integrationState: IntegrationState }>;
  getInventory(filters?: { search?: string; status?: string }): Promise<{ inventory: InventoryItem[]; integrationState: IntegrationState }>;
  getShipments(filters?: { status?: string; search?: string }): Promise<{ shipments: ShipmentRecord[]; integrationState: IntegrationState }>;
  updateShipment(orderId: string, shipmentDetails: { carrier: string; trackingNumber: string; dispatchDate?: string }): Promise<{ success: boolean; message?: string; error?: string; integrationState: IntegrationState }>;
  getStoreSettings(): Promise<{ settings?: StoreSettings; integrationState: IntegrationState }>;
  getIntegrationStatus(): IntegrationState;
}

export const adminService: AdminService = {
  getIntegrationStatus(): IntegrationState {
    return getIntegrationState('Admin Command Center Service', '/api/admin');
  },

  async getDashboardSummary() {
    const integration = this.getIntegrationStatus();
    const token = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('drayen_admin_token') : null;

    if (config.isBackendConnected && token) {
      try {
        const res = await fetch(`${config.apiBaseUrl}/api/admin/metrics`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const metrics = await res.json();
          return {
            summary: {
              totalOrders: metrics.totalOrders ?? metrics.totalOrdersCount ?? 0,
              awaitingPaymentVerification: metrics.awaitingReview ?? metrics.awaitingVerificationCount ?? 0,
              confirmedOrders: metrics.confirmedOrders ?? metrics.confirmedOrdersCount ?? 0,
              awaitingDispatch: metrics.awaitingDispatch ?? metrics.pendingFulfillmentCount ?? 0,
              shippedOrders: metrics.shippedOrders ?? metrics.shippedOrdersCount ?? 0,
              verifiedRevenuePaise: metrics.totalSalesPaise ?? metrics.totalRevenuePaise ?? 0,
              verifiedRevenueINR: metrics.totalSalesINR ?? metrics.totalRevenueINR ?? '₹0.00',
              isConfigured: true,
            },
            integrationState: { ...integration, status: 'CONNECTED' },
          };
        }
      } catch (err) {
        console.warn('[AdminService] Backend metrics fetch error:', err);
      }
    }

    // Pure frontend state: Never fabricate mock numbers. Return undefined summary and explicit NOT_CONFIGURED state.
    return {
      summary: undefined,
      integrationState: integration,
    };
  },

  async getProducts(filters?: { search?: string; category?: string }) {
    const integration = this.getIntegrationStatus();
    const token = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('drayen_admin_token') : null;

    if (config.isBackendConnected && token) {
      try {
        const queryParams = new URLSearchParams();
        if (filters?.search) queryParams.set('search', filters.search);
        if (filters?.category) queryParams.set('category', filters.category);

        const res = await fetch(`${config.apiBaseUrl}/api/admin/products?${queryParams.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const products = await res.json();
          return { products, integrationState: { ...integration, status: 'CONNECTED' } };
        }
      } catch (err) {
        console.warn('[AdminService] Backend products fetch error:', err);
      }
    }

    // Authoritative fallback: Display genuine catalog products for inspection
    const catalog = await catalogueService.getProducts({
      search: filters?.search,
      category: filters?.category,
    });

    return {
      products: catalog,
      integrationState: integration,
    };
  },

  async createProduct(_product: Partial<Product>) {
    const integration = this.getIntegrationStatus();
    return {
      success: false,
      error: 'Product creation requires privileged backend integration with database persistence. Teammate will connect POST /api/admin/products.',
      integrationState: integration,
    };
  },

  async updateProduct(_productId: string, _changes: Partial<Product>) {
    const integration = this.getIntegrationStatus();
    return {
      success: false,
      error: 'Product update requires privileged backend integration. Teammate will connect PUT /api/admin/products/:id.',
      integrationState: integration,
    };
  },

  async getOrders(filters?: { status?: string; search?: string }) {
    const integration = this.getIntegrationStatus();
    const token = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('drayen_admin_token') : null;

    if (config.isBackendConnected && token) {
      try {
        const query = new URLSearchParams();
        if (filters?.status && filters.status !== 'all') query.set('status', filters.status);
        if (filters?.search) query.set('search', filters.search);

        const res = await fetch(`${config.apiBaseUrl}/api/admin/orders?${query.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const orders = await res.json();
          return { orders, integrationState: { ...integration, status: 'CONNECTED' } };
        }
      } catch (err) {
        console.warn('[AdminService] Backend orders fetch error:', err);
      }
    }

    // Do not fabricate fake orders when backend is not connected
    return {
      orders: [],
      integrationState: integration,
    };
  },

  async getPendingPayments() {
    const integration = this.getIntegrationStatus();
    const token = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('drayen_admin_token') : null;

    if (config.isBackendConnected && token) {
      try {
        const res = await fetch(`${config.apiBaseUrl}/api/admin/verifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const submissions = await res.json();
          return { submissions, integrationState: { ...integration, status: 'CONNECTED' } };
        }
      } catch (err) {
        console.warn('[AdminService] Backend verifications fetch error:', err);
      }
    }

    return {
      submissions: [],
      integrationState: integration,
    };
  },

  async approvePayment(orderId: string, notes?: string) {
    const integration = this.getIntegrationStatus();
    const token = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('drayen_admin_token') : null;

    if (config.isBackendConnected && token) {
      try {
        const res = await fetch(`${config.apiBaseUrl}/api/admin/orders/${orderId}/verify-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ decision: 'approve', notes }),
        });
        const data = await res.json();
        return {
          success: res.ok,
          message: data.message,
          error: data.error,
          integrationState: { ...integration, status: res.ok ? 'CONNECTED' : 'ERROR' },
        };
      } catch (err: any) {
        return { success: false, error: err.message, integrationState: integration };
      }
    }

    return {
      success: false,
      error: 'Payment verification is unavailable until the secure backend integration is configured.',
      integrationState: integration,
    };
  },

  async rejectPayment(orderId: string, reason: string) {
    const integration = this.getIntegrationStatus();
    const token = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('drayen_admin_token') : null;

    if (config.isBackendConnected && token) {
      try {
        const res = await fetch(`${config.apiBaseUrl}/api/admin/orders/${orderId}/verify-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ decision: 'reject', notes: reason }),
        });
        const data = await res.json();
        return {
          success: res.ok,
          message: data.message,
          error: data.error,
          integrationState: { ...integration, status: res.ok ? 'CONNECTED' : 'ERROR' },
        };
      } catch (err: any) {
        return { success: false, error: err.message, integrationState: integration };
      }
    }

    return {
      success: false,
      error: 'Payment verification is unavailable until the secure backend integration is configured.',
      integrationState: integration,
    };
  },

  async getInventory(filters?: { search?: string; status?: string }) {
    const integration = this.getIntegrationStatus();
    const catalog = await catalogueService.getProducts();

    let items: InventoryItem[] = catalog.map((p) => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      category: p.category,
      stockQuantity: p.stock_quantity ?? 0,
      material: p.material,
      finish: p.finish,
      variantsCount: p.variants ? p.variants.reduce((acc, v) => acc + v.options.length, 0) : 0,
      isPublished: Boolean(p.is_published),
      isLowStock: (p.stock_quantity ?? 0) <= 5 && (p.stock_quantity ?? 0) > 0,
    }));

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      items = items.filter((i) => i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q));
    }

    if (filters?.status) {
      if (filters.status === 'low_stock') items = items.filter((i) => i.isLowStock);
      else if (filters.status === 'out_of_stock') items = items.filter((i) => i.stockQuantity === 0);
      else if (filters.status === 'in_stock') items = items.filter((i) => i.stockQuantity > 5);
    }

    return {
      inventory: items,
      integrationState: integration,
    };
  },

  async getShipments(filters?: { status?: string; search?: string }) {
    const integration = this.getIntegrationStatus();
    const token = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('drayen_admin_token') : null;

    if (config.isBackendConnected && token) {
      try {
        const query = new URLSearchParams();
        if (filters?.status) query.set('status', filters.status);
        if (filters?.search) query.set('search', filters.search);

        const res = await fetch(`${config.apiBaseUrl}/api/admin/shipments?${query.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const shipments = await res.json();
          return { shipments, integrationState: { ...integration, status: 'CONNECTED' } };
        }
      } catch (err) {
        console.warn('[AdminService] Backend shipments fetch error:', err);
      }
    }

    // Do not fabricate fake shipments
    return {
      shipments: [],
      integrationState: integration,
    };
  },

  async updateShipment(orderId: string, shipmentDetails: { carrier: string; trackingNumber: string; dispatchDate?: string }) {
    const integration = this.getIntegrationStatus();
    const token = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('drayen_admin_token') : null;

    if (config.isBackendConnected && token) {
      try {
        const res = await fetch(`${config.apiBaseUrl}/api/admin/orders/${orderId}/update-fulfillment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            nextStatus: 'Shipped',
            carrier: shipmentDetails.carrier,
            trackingNumber: shipmentDetails.trackingNumber,
          }),
        });
        const data = await res.json();
        return {
          success: res.ok,
          message: data.message,
          error: data.error,
          integrationState: { ...integration, status: res.ok ? 'CONNECTED' : 'ERROR' },
        };
      } catch (err: any) {
        return { success: false, error: err.message, integrationState: integration };
      }
    }

    return {
      success: false,
      error: 'Backend admin session required.',
      integrationState: integration,
    };
  },

  async getStoreSettings() {
    const integration = this.getIntegrationStatus();
    const token = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('drayen_admin_token') : null;

    if (config.isBackendConnected && token) {
      try {
        const res = await fetch(`${config.apiBaseUrl}/api/admin/settings`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const settings = await res.json();
          return { settings, integrationState: { ...integration, status: 'CONNECTED' } };
        }
      } catch (err) {
        console.warn('[AdminService] Backend settings fetch error:', err);
      }
    }

    return {
      settings: {
        merchantUpiId: config.merchantUpiId || 'drayen.atelier@okaxis',
        merchantName: config.merchantName || 'DRAYEN ATELIER',
        merchantQrUrl: config.merchantQrUrl,
        merchantQrEnabled: true,
        freeShippingThresholdPaise: config.freeShippingThresholdPaise || 49900,
        standardShippingFeePaise: config.standardShippingFeePaise || 5000,
        contactEmail: 'concierge@drayen.in',
        contactPhone: '+91 98400 12345',
        supportWhatsApp: '+91 98400 12345',
      },
      integrationState: integration,
    };
  },
};
