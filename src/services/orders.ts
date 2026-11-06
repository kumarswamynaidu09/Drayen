import { Order, OrderTimelineEvent, IntegrationState, OrderStatus } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { config, getIntegrationState } from './config';
import { authService } from './auth';

export interface OrdersQueryResult {
  orders: Order[];
  error?: string;
  integrationState: IntegrationState;
}

export interface SingleOrderResult {
  order?: Order;
  error?: string;
  integrationState: IntegrationState;
}

export interface OrdersService {
  getMyOrders(phoneOrToken?: string): Promise<OrdersQueryResult>;
  getOrderById(orderNumber: string, tokenOrPhone?: string): Promise<SingleOrderResult>;
  getOrderTracking(orderNumber: string, tokenOrPhone?: string): Promise<SingleOrderResult>;
  buildTimeline(order: Order): OrderTimelineEvent[];
  getIntegrationStatus(): IntegrationState;
}

const STAGES: { stage: OrderStatus; label: string; description: string }[] = [
  {
    stage: 'AWAITING_PAYMENT',
    label: 'Order Placed',
    description: 'Consignment requisition logged. Awaiting customer UPI remittance.',
  },
  {
    stage: 'AWAITING_PAYMENT_VERIFICATION',
    label: 'Payment Verification',
    description: 'Payment receipt & UTR under manual review against bank statements.',
  },
  {
    stage: 'CONFIRMED_PROCESSING',
    label: 'Order Confirmed',
    description: 'Payment verified. Talisman allocated for inspection & finishing.',
  },
  {
    stage: 'PACKED',
    label: 'Packed in Atelier',
    description: 'Sealed inside signature matte black presentation box with authenticity certificate.',
  },
  {
    stage: 'SHIPPED',
    label: 'Shipped via Insured Courier',
    description: 'Handed to priority air logistics partner with door-to-door tracking.',
  },
  {
    stage: 'DELIVERED',
    label: 'Delivered',
    description: 'Consignment successfully received by customer.',
  },
];

export const ordersService: OrdersService = {
  getIntegrationStatus(): IntegrationState {
    return getIntegrationState('Customer Orders Service', '/api/orders');
  },

  buildTimeline(order: Order): OrderTimelineEvent[] {
    const statusOrder: OrderStatus[] = [
      'AWAITING_PAYMENT',
      'AWAITING_PAYMENT_VERIFICATION',
      'CONFIRMED_PROCESSING',
      'PACKED',
      'SHIPPED',
      'DELIVERED',
    ];

    const currentIndex = statusOrder.indexOf(order.order_status);

    return STAGES.map((s, idx) => {
      const isPast = currentIndex > idx;
      const isCurrent = currentIndex === idx;
      let timestamp = undefined;

      if (idx === 0) timestamp = order.created_at;
      if (idx === 1 && order.submissions?.[0]?.submittedAt) timestamp = order.submissions[0].submittedAt;
      if (idx === 4 && order.shipment?.dispatchDate) timestamp = order.shipment.dispatchDate;

      return {
        stage: s.stage,
        label: s.label,
        description: s.description,
        timestamp,
        completed: isPast || isCurrent,
        isCurrent,
      };
    });
  },

  async getMyOrders(phoneOrToken?: string): Promise<OrdersQueryResult> {
    const integration = this.getIntegrationStatus();
    const currentCustomer = authService.getCurrentUser();

    // 1. Direct Supabase Query for Authenticated Customer or Phone
    if (isSupabaseConfigured) {
      try {
        let query = supabase
          .from('orders')
          .select('*, order_items(*), shipments(*)')
          .order('created_at', { ascending: false });

        if (currentCustomer?.id) {
          query = query.or(`customer_id.eq.${currentCustomer.id},customer_email.eq.${currentCustomer.email}`);
        } else if (phoneOrToken && phoneOrToken.length === 10) {
          query = query.eq('customer_phone', phoneOrToken);
        } else if (phoneOrToken) {
          query = query.eq('access_token', phoneOrToken);
        } else {
          return { orders: [], integrationState: integration };
        }

        const { data, error } = await query;
        if (!error && Array.isArray(data)) {
          const orders: Order[] = data.map((o) => ({
            id: o.id,
            orderNumber: o.order_number,
            createdAt: o.created_at,
            customer: {
              fullName: o.customer_name,
              email: o.customer_email || '',
              phone: o.customer_phone,
            },
            shippingAddress: {
              fullName: o.customer_name,
              phone: o.customer_phone,
              addressLine1: o.address_line1,
              addressLine2: o.address_line2 || '',
              city: o.city,
              state: o.state,
              pincode: o.postal_code,
              addressType: 'home',
            },
            items: (o.order_items || []).map((item: any) => ({
              product: {
                id: item.product_id,
                sku: item.product_sku,
                name: item.product_name,
                selling_price_paise: item.unit_price_paise,
              } as any,
              quantity: item.quantity,
              unitPricePaise: item.unit_price_paise,
              totalPricePaise: item.total_price_paise,
            })),
            shippingTier: o.shipping_tier === 'EXPRESS' ? 'express' : 'standard',
            subtotalPaise: o.subtotal_paise,
            shippingPaise: o.shipping_paise,
            discountPaise: o.discount_paise,
            promoCode: o.promo_code,
            totalPayablePaise: o.total_payable_paise,
            orderStatus: o.order_status,
            paymentStatus: o.payment_status,
            paymentMethod: o.payment_method === 'COD' ? 'cod' : 'upi',
            accessToken: o.access_token,
          }));

          return { orders, integrationState: { ...integration, status: 'CONNECTED' } };
        }
      } catch (err: any) {
        console.warn('[OrdersService] Supabase orders fetch note:', err);
      }
    }

    return {
      orders: [],
      integrationState: integration,
    };
  },

  async getOrderById(orderNumber: string, tokenOrPhone?: string): Promise<SingleOrderResult> {
    const integration = this.getIntegrationStatus();

    if (!orderNumber) {
      return {
        error: 'Order number is required for lookup.',
        integrationState: integration,
      };
    }

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*, order_items(*), shipments(*)')
          .eq('order_number', orderNumber.trim())
          .single();

        if (!error && data) {
          const order: Order = {
            id: data.id,
            orderNumber: data.order_number,
            createdAt: data.created_at,
            customer: {
              fullName: data.customer_name,
              email: data.customer_email || '',
              phone: data.customer_phone,
            },
            shippingAddress: {
              fullName: data.customer_name,
              phone: data.customer_phone,
              addressLine1: data.address_line1,
              addressLine2: data.address_line2 || '',
              city: data.city,
              state: data.state,
              pincode: data.postal_code,
              addressType: 'home',
            },
            items: (data.order_items || []).map((item: any) => ({
              product: {
                id: item.product_id,
                sku: item.product_sku,
                name: item.product_name,
                selling_price_paise: item.unit_price_paise,
              } as any,
              quantity: item.quantity,
              unitPricePaise: item.unit_price_paise,
              totalPricePaise: item.total_price_paise,
            })),
            shippingTier: data.shipping_tier === 'EXPRESS' ? 'express' : 'standard',
            subtotalPaise: data.subtotal_paise,
            shippingPaise: data.shipping_paise,
            discountPaise: data.discount_paise,
            promoCode: data.promo_code,
            totalPayablePaise: data.total_payable_paise,
            orderStatus: data.order_status,
            paymentStatus: data.payment_status,
            paymentMethod: data.payment_method === 'COD' ? 'cod' : 'upi',
            accessToken: data.access_token,
          };

          return { order, integrationState: { ...integration, status: 'CONNECTED' } };
        }
      } catch (err: any) {
        console.warn('[OrdersService] Supabase single order note:', err);
      }
    }

    return {
      error: `Order #${orderNumber} could not be retrieved from the database.`,
      integrationState: integration,
    };
  },

  async getOrderTracking(orderNumber: string, tokenOrPhone?: string): Promise<SingleOrderResult> {
    return this.getOrderById(orderNumber, tokenOrPhone);
  },
};
