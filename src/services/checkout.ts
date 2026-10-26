import {
  CartItem,
  CheckoutRequest,
  Order,
  IntegrationState,
  ShippingOption,
  CheckoutTotals,
  Address,
} from '../types';
import { config, getIntegrationState } from './config';
import { cartService } from './cart';
import { formatINR } from '../lib/money';

export interface OrderCreationResult {
  success: boolean;
  order?: Order;
  orderNumber?: string;
  accessToken?: string;
  totalPayablePaise?: number;
  totalPayableINR?: string;
  error?: string;
  integrationState: IntegrationState;
}

export interface CheckoutService {
  validateCart(cart: CartItem[]): { valid: boolean; issues: string[] };
  getShippingOptions(address?: Address): ShippingOption[];
  calculateTotals(cart: CartItem[], address?: Address, shippingTier?: string): CheckoutTotals;
  createOrder(request: CheckoutRequest): Promise<OrderCreationResult>;
  getIntegrationStatus(): IntegrationState;
}

export const checkoutService: CheckoutService = {
  getIntegrationStatus(): IntegrationState {
    return getIntegrationState('Order & Checkout Service', '/api/orders');
  },

  validateCart(cart: CartItem[]): { valid: boolean; issues: string[] } {
    return cartService.validateCart(cart);
  },

  getShippingOptions(_address?: Address): ShippingOption[] {
    return cartService.getShippingOptions(0);
  },

  calculateTotals(cart: CartItem[], address?: Address, shippingTier?: string): CheckoutTotals {
    return cartService.calculateTotals(cart, address, shippingTier);
  },

  async createOrder(request: CheckoutRequest): Promise<OrderCreationResult> {
    const integration = this.getIntegrationStatus();

    // 1. Validate payload locally before attempting transmission
    if (!request.items || request.items.length === 0) {
      return {
        success: false,
        error: 'Cannot create order for an empty shopping bag.',
        integrationState: integration,
      };
    }

    if (!request.deliveryAddress.fullName || !request.deliveryAddress.phone || !request.deliveryAddress.pincode) {
      return {
        success: false,
        error: 'Incomplete delivery address. Full name, phone, and 6-digit PIN code are required.',
        integrationState: integration,
      };
    }

    // 2. Dispatch to backend if available
    try {
      const baseUrl = config.apiBaseUrl || '';
      const res = await fetch(`${baseUrl}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          customerName: request.deliveryAddress.fullName,
          customerEmail: request.customer.email,
          customerPhone: request.deliveryAddress.phone,
          addressLine1: request.deliveryAddress.addressLine1,
          addressLine2: request.deliveryAddress.addressLine2,
          city: request.deliveryAddress.city,
          state: request.deliveryAddress.state,
          postalCode: request.deliveryAddress.pincode,
          shippingTier: request.shippingTier,
          paymentMethod: request.paymentMethod,
          promoCode: request.promoCode,
          items: request.items.map((it) => ({
            productId: it.productId,
            quantity: it.quantity,
            selectedFinish: it.selectedFinish,
            selectedLength: it.selectedLength,
          })),
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (res.ok && (data.orderNumber || data.order_number)) {
          const ordNum = data.orderNumber || data.order_number;
          const token = data.accessToken || data.access_token || '';
          const totalPaise = data.totalPayablePaise ?? data.total_payable_paise ?? 0;

          return {
            success: true,
            orderNumber: ordNum,
            accessToken: token,
            totalPayablePaise: totalPaise,
            totalPayableINR: formatINR(totalPaise),
            integrationState: { ...integration, status: 'CONNECTED' },
          };
        } else {
          return {
            success: false,
            error: data.error || `Order creation was rejected by backend (HTTP ${res.status}).`,
            integrationState: integration,
          };
        }
      }
    } catch (err: any) {
      // Network or fetch failed
      console.warn('[CheckoutService] Network error during order creation:', err);
    }

    // Return explicit NOT_CONFIGURED state in accordance with Section 2 & 9
    return {
      success: false,
      error:
        'Order Creation Service is not connected to an authoritative backend database. Teammate will connect POST /api/orders separately. Please review the integration contract.',
      integrationState: integration,
    };
  },
};
