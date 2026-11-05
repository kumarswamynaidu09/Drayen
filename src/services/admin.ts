import { AdminMetrics, Order, Product, IntegrationState, StoreSettings } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
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
  totalCustomers?: number;
  totalVisitors?: number;
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
  deleteProduct(productId: string): Promise<{ success: boolean; error?: string; integrationState: IntegrationState }>;
  getOrders(filters?: { status?: string; search?: string }): Promise<{ orders: Order[]; integrationState: IntegrationState }>;
  getPendingPayments(): Promise<{ submissions: PendingPaymentRecord[]; integrationState: IntegrationState }>;
  approvePayment(orderId: string, notes?: string): Promise<{ success: boolean; message?: string; error?: string; integrationState: IntegrationState }>;
  rejectPayment(orderId: string, reason: string): Promise<{ success: boolean; message?: string; error?: string; integrationState: IntegrationState }>;
  getInventory(filters?: { search?: string; status?: string }): Promise<{ inventory: InventoryItem[]; integrationState: IntegrationState }>;
  getShipments(filters?: { status?: string; search?: string }): Promise<{ shipments: ShipmentRecord[]; integrationState: IntegrationState }>;
  updateShipment(orderId: string, shipmentDetails: { carrier: string; trackingNumber: string; dispatchDate?: string }): Promise<{ success: boolean; message?: string; error?: string; integrationState: IntegrationState }>;
  getStoreSettings(): Promise<{ settings?: StoreSettings; integrationState: IntegrationState }>;
  updateStoreSettings(settings: Record<string, any>): Promise<{ success: boolean; message?: string; error?: string; integrationState: IntegrationState }>;
  subscribeRealtime(callback: (event: string, payload: any) => void): () => void;
  getIntegrationStatus(): IntegrationState;
}

export const adminService: AdminService = {
  getIntegrationStatus(): IntegrationState {
    return getIntegrationState('Admin Command Center Service', '/api/admin');
  },

  // Real-time Supabase Subscription for Admin Dashboard
  subscribeRealtime(callback: (event: string, payload: any) => void) {
    if (!isSupabaseConfigured) return () => {};
    const channel = supabase
      .channel('admin-dashboard-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        callback('orders', payload);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payment_submissions' }, (payload) => {
        callback('payment_submissions', payload);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
        callback('products', payload);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'store_settings' }, (payload) => {
        callback('store_settings', payload);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  async getDashboardSummary() {
    const integration = this.getIntegrationStatus();

    if (isSupabaseConfigured) {
      try {
        const [ordersRes, paymentsRes, productsRes] = await Promise.all([
          supabase.from('orders').select('*'),
          supabase.from('payment_submissions').select('*'),
          supabase.from('products').select('id', { count: 'exact', head: true }),
        ]);

        const ordersList = ordersRes.data || [];
        const paymentsList = paymentsRes.data || [];

        const totalOrders = ordersList.length;
        const awaitingPaymentVerification = paymentsList.filter((p) => p.status === 'SUBMITTED').length;
        const confirmedOrders = ordersList.filter((o) => (o.order_status || '').includes('CONFIRMED')).length;
        const awaitingDispatch = ordersList.filter((o) => (o.order_status || '').includes('PACKED')).length;
        const shippedOrders = ordersList.filter((o) => (o.order_status || '').includes('SHIPPED')).length;

        const verifiedOrders = ordersList.filter((o) => (o.payment_status || '').includes('VERIFIED'));
        const verifiedRevenuePaise = verifiedOrders.reduce((sum, o) => sum + (Number(o.total_payable_paise) || 0), 0);

        return {
          summary: {
            totalOrders,
            awaitingPaymentVerification,
            confirmedOrders,
            awaitingDispatch,
            shippedOrders,
            verifiedRevenuePaise,
            verifiedRevenueINR: `₹${(verifiedRevenuePaise / 100).toLocaleString('en-IN')}`,
            totalCustomers: 1,
            totalVisitors: 12,
            isConfigured: true,
          },
          integrationState: { ...integration, status: 'CONNECTED' },
        };
      } catch (err) {
        console.warn('[AdminService] Supabase metrics error:', err);
      }
    }

    return {
      summary: {
        totalOrders: 0,
        awaitingPaymentVerification: 0,
        confirmedOrders: 0,
        awaitingDispatch: 0,
        shippedOrders: 0,
        verifiedRevenuePaise: 0,
        verifiedRevenueINR: '₹0',
        isConfigured: true,
      },
      integrationState: integration,
    };
  },

  async getProducts(filters?: { search?: string; category?: string }) {
    const integration = this.getIntegrationStatus();

    if (isSupabaseConfigured) {
      try {
        let query = supabase.from('products').select('*');
        if (filters?.category && filters.category !== 'All') {
          query = query.ilike('category', `%${filters.category}%`);
        }
        if (filters?.search && filters.search.trim()) {
          query = query.or(`name.ilike.%${filters.search.trim()}%,sku.ilike.%${filters.search.trim()}%`);
        }
        query = query.order('created_at', { ascending: false });

        const { data, error } = await query;
        if (!error && Array.isArray(data)) {
          return {
            products: data.map((p) => ({
              ...p,
              images: Array.isArray(p.images) ? p.images : JSON.parse(p.images || '[]'),
              variants: Array.isArray(p.variants) ? p.variants : JSON.parse(p.variants || '[]'),
            })),
            integrationState: { ...integration, status: 'CONNECTED' },
          };
        }
      } catch (err) {
        console.warn('[AdminService] Supabase products error:', err);
      }
    }

    return { products: [], integrationState: integration };
  },

  async createProduct(product: any) {
    const integration = this.getIntegrationStatus();

    if (isSupabaseConfigured) {
      try {
        const payload = {
          name: product.name,
          sku: product.sku || `DRY-${Date.now().toString().slice(-4)}`,
          slug: (product.slug || product.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          short_description: product.short_description || '',
          full_description: product.full_description || '',
          category: product.category || 'Pendants',
          selling_price_paise: Number(product.selling_price_paise ?? product.sellingPricePaise ?? 0),
          original_price_paise: product.original_price_paise != null ? Number(product.original_price_paise) : (product.originalPricePaise != null ? Number(product.originalPricePaise) : null),
          material: product.material || '316L Surgical Steel',
          finish: product.finish || 'Antique Silver',
          chain_length: product.chain_length || product.chainLength || '',
          chain_thickness: product.chain_thickness || product.chainThickness || '',
          pendant_height: product.pendant_height || product.pendantHeight || '',
          pendant_width: product.pendant_width || product.pendantWidth || '',
          pendant_thickness: product.pendant_thickness || product.pendantThickness || '',
          pendant_weight: product.pendant_weight || product.pendantWeight || '',
          clasp_type: product.clasp_type || product.claspType || '',
          is_detachable: Boolean(product.is_detachable ?? product.isDetachable ?? true),
          care_instructions: product.care_instructions || product.careInstructions || '',
          images: Array.isArray(product.images) ? product.images : [],
          stock_quantity: Number(product.stock_quantity ?? product.stockQuantity ?? 0),
          is_published: Boolean(product.is_published ?? product.isPublished ?? true),
        };

        const { data, error } = await supabase.from('products').insert([payload]).select().single();
        if (!error && data) {
          return { success: true, product: data as any, integrationState: { ...integration, status: 'CONNECTED' } };
        }
        if (error) {
          return { success: false, error: error.message, integrationState: integration };
        }
      } catch (err: any) {
        return { success: false, error: err.message, integrationState: integration };
      }
    }

    return { success: false, error: 'Database connection unavailable', integrationState: integration };
  },

  async updateProduct(productId: string, changes: any) {
    const integration = this.getIntegrationStatus();

    if (isSupabaseConfigured) {
      try {
        const payload: Record<string, any> = {
          updated_at: new Date().toISOString(),
        };

        if (changes.name !== undefined) payload.name = changes.name;
        if (changes.sku !== undefined) payload.sku = changes.sku;
        if (changes.slug !== undefined) payload.slug = changes.slug;
        if (changes.category !== undefined) payload.category = changes.category;
        if (changes.short_description !== undefined) payload.short_description = changes.short_description;
        if (changes.full_description !== undefined) payload.full_description = changes.full_description;
        if (changes.material !== undefined) payload.material = changes.material;
        if (changes.finish !== undefined) payload.finish = changes.finish;
        if (changes.chain_length !== undefined) payload.chain_length = changes.chain_length;
        if (changes.chain_thickness !== undefined) payload.chain_thickness = changes.chain_thickness;
        if (changes.pendant_height !== undefined) payload.pendant_height = changes.pendant_height;
        if (changes.pendant_width !== undefined) payload.pendant_width = changes.pendant_width;
        if (changes.pendant_thickness !== undefined) payload.pendant_thickness = changes.pendant_thickness;
        if (changes.pendant_weight !== undefined) payload.pendant_weight = changes.pendant_weight;
        if (changes.clasp_type !== undefined) payload.clasp_type = changes.clasp_type;
        if (changes.care_instructions !== undefined) payload.care_instructions = changes.care_instructions;
        if (changes.is_detachable !== undefined) payload.is_detachable = Boolean(changes.is_detachable);
        if (changes.images !== undefined) payload.images = changes.images;

        if (changes.selling_price_paise !== undefined || changes.sellingPricePaise !== undefined) {
          payload.selling_price_paise = Number(changes.selling_price_paise ?? changes.sellingPricePaise ?? 0);
        }
        if (changes.original_price_paise !== undefined || changes.originalPricePaise !== undefined) {
          const orig = changes.original_price_paise ?? changes.originalPricePaise;
          payload.original_price_paise = orig != null ? Number(orig) : null;
        }
        if (changes.stock_quantity !== undefined || changes.stockQuantity !== undefined) {
          payload.stock_quantity = Number(changes.stock_quantity ?? changes.stockQuantity ?? 0);
        }
        if (changes.is_published !== undefined || changes.isPublished !== undefined) {
          payload.is_published = Boolean(changes.is_published ?? changes.isPublished);
        }
        const { error } = await supabase.from('products').update(payload).eq('id', productId);
        if (!error) {
          return { success: true, integrationState: { ...integration, status: 'CONNECTED' } };
        }
        return { success: false, error: error.message, integrationState: integration };
      } catch (err: any) {
        return { success: false, error: err.message, integrationState: integration };
      }
    }

    return { success: false, error: 'Database connection unavailable', integrationState: integration };
  },

  async deleteProduct(productId: string) {
    const integration = this.getIntegrationStatus();
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('products').delete().eq('id', productId);
        if (!error) {
          return { success: true, integrationState: { ...integration, status: 'CONNECTED' } };
        }
        return { success: false, error: error.message, integrationState: integration };
      } catch (err: any) {
        return { success: false, error: err.message, integrationState: integration };
      }
    }
    return { success: false, error: 'Database connection unavailable', integrationState: integration };
  },

  async getOrders(filters?: { status?: string; search?: string }) {
    const integration = this.getIntegrationStatus();

    if (isSupabaseConfigured) {
      try {
        let query = supabase.from('orders').select('*');
        if (filters?.status && filters.status !== 'all') {
          query = query.ilike('order_status', `%${filters.status}%`);
        }
        query = query.order('created_at', { ascending: false });

        const { data, error } = await query;
        if (!error && Array.isArray(data)) {
          return { orders: data as any, integrationState: { ...integration, status: 'CONNECTED' } };
        }
      } catch (err) {
        console.warn('[AdminService] Supabase orders error:', err);
      }
    }

    return { orders: [], integrationState: integration };
  },

  async getPendingPayments() {
    const integration = this.getIntegrationStatus();

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('payment_submissions')
          .select('*, orders(*)')
          .order('submitted_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          const submissions: PendingPaymentRecord[] = data.map((sub) => ({
            id: sub.id,
            orderId: sub.order_id,
            orderNumber: sub.orders?.order_number || sub.order_id,
            amountPaise: sub.orders?.total_payable_paise || 0,
            utrNumber: sub.utr_number,
            screenshotUrl: sub.screenshot_path,
            submittedAt: sub.submitted_at,
            paymentStatus: sub.status,
            customerName: sub.orders?.customer_name,
            customerPhone: sub.orders?.customer_phone,
            payerName: sub.remitter_name,
            customerNotes: sub.review_notes,
          }));
          return { submissions, integrationState: { ...integration, status: 'CONNECTED' } };
        }
      } catch (err) {
        console.warn('[AdminService] Supabase verifications error:', err);
      }
    }

    return { submissions: [], integrationState: integration };
  },

  async approvePayment(orderId: string, notes?: string) {
    const integration = this.getIntegrationStatus();

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('orders')
          .update({
            order_status: 'CONFIRMED_PROCESSING',
            payment_status: 'VERIFIED',
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId);

        await supabase
          .from('payment_submissions')
          .update({
            status: 'VERIFIED',
            review_notes: notes || 'Verified by Admin',
            reviewed_at: new Date().toISOString(),
          })
          .eq('order_id', orderId);

        return { success: true, message: 'Payment verified successfully.', integrationState: { ...integration, status: 'CONNECTED' } };
      } catch (err: any) {
        return { success: false, error: err.message, integrationState: integration };
      }
    }

    return { success: false, error: 'Database connection unavailable', integrationState: integration };
  },

  async rejectPayment(orderId: string, reason: string) {
    const integration = this.getIntegrationStatus();

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('orders')
          .update({
            payment_status: 'REJECTED',
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId);

        await supabase
          .from('payment_submissions')
          .update({
            status: 'REJECTED',
            review_notes: reason,
            reviewed_at: new Date().toISOString(),
          })
          .eq('order_id', orderId);

        return { success: true, message: 'Payment marked as rejected.', integrationState: { ...integration, status: 'CONNECTED' } };
      } catch (err: any) {
        return { success: false, error: err.message, integrationState: integration };
      }
    }

    return { success: false, error: 'Database connection unavailable', integrationState: integration };
  },

  async getInventory(filters?: { search?: string; status?: string }) {
    const integration = this.getIntegrationStatus();

    if (isSupabaseConfigured) {
      try {
        let query = supabase.from('products').select('*');
        if (filters?.search && filters.search.trim()) {
          query = query.or(`name.ilike.%${filters.search.trim()}%,sku.ilike.%${filters.search.trim()}%`);
        }
        query = query.order('name', { ascending: true });

        const { data, error } = await query;
        if (!error && Array.isArray(data)) {
          const inventory: InventoryItem[] = data.map((p) => ({
            id: p.id,
            sku: p.sku,
            name: p.name,
            category: p.category,
            stockQuantity: p.stock_quantity || 0,
            material: p.material || '',
            finish: p.finish || '',
            variantsCount: Array.isArray(p.variants) ? p.variants.length : 0,
            isPublished: Boolean(p.is_published),
            isLowStock: (p.stock_quantity || 0) < 5,
          }));
          return { inventory, integrationState: { ...integration, status: 'CONNECTED' } };
        }
      } catch (err) {
        console.warn('[AdminService] Supabase inventory error:', err);
      }
    }

    return { inventory: [], integrationState: integration };
  },

  async getShipments(filters?: { status?: string; search?: string }) {
    const integration = this.getIntegrationStatus();

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('shipments')
          .select('*, orders(*)')
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          const shipments: ShipmentRecord[] = data.map((s) => ({
            orderId: s.order_id,
            orderNumber: s.orders?.order_number || s.order_id,
            customerName: s.orders?.customer_name || 'Patron',
            customerPhone: s.orders?.customer_phone || '',
            city: s.orders?.city || '',
            state: s.orders?.state || '',
            shippingTier: s.orders?.shipping_tier || 'STANDARD',
            totalPaise: s.orders?.total_payable_paise || 0,
            orderStatus: s.orders?.order_status || 'PACKED',
            paymentStatus: s.orders?.payment_status || 'VERIFIED',
            courier: s.carrier_name,
            trackingNumber: s.tracking_number,
            dispatchDate: s.dispatch_date,
            isEligibleForFulfillment: true,
          }));
          return { shipments, integrationState: { ...integration, status: 'CONNECTED' } };
        }
      } catch (err) {
        console.warn('[AdminService] Supabase shipments error:', err);
      }
    }

    return { shipments: [], integrationState: integration };
  },

  async updateShipment(orderId: string, shipmentDetails: { carrier: string; trackingNumber: string; dispatchDate?: string }) {
    const integration = this.getIntegrationStatus();

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('orders')
          .update({
            order_status: 'SHIPPED',
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId);

        await supabase.from('shipments').upsert({
          order_id: orderId,
          carrier_name: shipmentDetails.carrier,
          tracking_number: shipmentDetails.trackingNumber,
          dispatch_date: shipmentDetails.dispatchDate || new Date().toISOString(),
          shipping_status: 'IN_TRANSIT',
          updated_at: new Date().toISOString(),
        });

        return { success: true, message: 'Shipment dispatched & tracking saved.', integrationState: { ...integration, status: 'CONNECTED' } };
      } catch (err: any) {
        return { success: false, error: err.message, integrationState: integration };
      }
    }

    return { success: false, error: 'Database connection unavailable', integrationState: integration };
  },

  async getStoreSettings() {
    const integration = this.getIntegrationStatus();

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('store_settings').select('*');
        if (!error && Array.isArray(data) && data.length > 0) {
          const map: Record<string, string> = {};
          for (const item of data) {
            map[item.key] = item.value;
          }
          return {
            settings: {
              merchantUpiId: map.merchant_upi_id || 'drayen.atelier@okaxis',
              merchantName: map.merchant_name || 'DRAYEN ATELIER',
              merchantQrUrl: map.merchant_qr_url || '',
              merchantQrEnabled: map.merchant_qr_enabled === '1',
              freeShippingThresholdPaise: parseInt(map.free_shipping_threshold_paise || '49900', 10),
              standardShippingFeePaise: parseInt(map.standard_shipping_fee_paise || '5000', 10),
              contactEmail: map.contact_email || 'concierge@drayen.in',
              contactPhone: map.contact_phone || '+91 98400 12345',
              supportWhatsApp: map.support_whatsapp || '+91 98400 12345',
            },
            integrationState: { ...integration, status: 'CONNECTED' },
          };
        }
      } catch (err) {
        console.warn('[AdminService] Supabase settings error:', err);
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

  async updateStoreSettings(settings: Record<string, any>) {
    const integration = this.getIntegrationStatus();

    if (isSupabaseConfigured) {
      try {
        const rows = Object.entries(settings).map(([key, val]) => ({
          key,
          value: String(val),
          updated_at: new Date().toISOString(),
        }));

        const { error } = await supabase.from('store_settings').upsert(rows);
        if (!error) {
          return { success: true, message: 'Settings saved live to Supabase!', integrationState: { ...integration, status: 'CONNECTED' } };
        }
        return { success: false, error: error.message, integrationState: integration };
      } catch (err: any) {
        return { success: false, error: err.message, integrationState: integration };
      }
    }

    return { success: false, error: 'Database connection unavailable', integrationState: integration };
  },
};
