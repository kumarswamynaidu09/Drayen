import { Order, OrderTimelineEvent, IntegrationState, OrderStatus } from '../types';
import { config, getIntegrationState } from './config';

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

    // Check if phone or token provided
    if (phoneOrToken) {
      try {
        const baseUrl = config.apiBaseUrl || '';
        const param = phoneOrToken.length === 10 ? `phone=${encodeURIComponent(phoneOrToken)}` : `token=${encodeURIComponent(phoneOrToken)}`;
        const res = await fetch(`${baseUrl}/api/orders/my-orders?${param}`);
        if (res.ok) {
          const data = await res.json();
          return {
            orders: Array.isArray(data) ? data : [],
            integrationState: { ...integration, status: 'CONNECTED' },
          };
        }
      } catch (err: any) {
        console.warn('[OrdersService] Error querying orders from backend:', err);
      }
    }

    // If backend is not connected or phone was not provided
    return {
      orders: [],
      error: config.isBackendConnected
        ? 'Please enter your customer phone number or order access token to retrieve your orders.'
        : 'Customer Orders Service is not connected to a backend database. Teammate will connect GET /api/orders/my-orders.',
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

    try {
      const baseUrl = config.apiBaseUrl || '';
      let url = `${baseUrl}/api/orders/${encodeURIComponent(orderNumber)}/track`;
      if (tokenOrPhone) {
        url += tokenOrPhone.length === 10 ? `?phone=${encodeURIComponent(tokenOrPhone)}` : `?token=${encodeURIComponent(tokenOrPhone)}`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const order = await res.json();
        return {
          order,
          integrationState: { ...integration, status: 'CONNECTED' },
        };
      }
    } catch (err: any) {
      console.warn('[OrdersService] Backend lookup error for order:', orderNumber, err);
    }

    return {
      error: `Order #${orderNumber} could not be retrieved. Backend orders lookup endpoint is not connected.`,
      integrationState: integration,
    };
  },

  async getOrderTracking(orderNumber: string, tokenOrPhone?: string): Promise<SingleOrderResult> {
    return this.getOrderById(orderNumber, tokenOrPhone);
  },
};
