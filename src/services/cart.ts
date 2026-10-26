import { CartItem, CheckoutTotals, Address, ShippingOption } from '../types';
import { config } from './config';
import { formatINR } from '../lib/money';

/**
 * Storage adapter interface for guest cart persistence.
 * Explicitly documented limitations: Session-only client storage.
 * Does NOT substitute for authoritative server persistence.
 */
export interface CartStorageAdapter {
  load(): CartItem[];
  save(items: CartItem[]): void;
  clear(): void;
}

export const sessionCartStorage: CartStorageAdapter = {
  load(): CartItem[] {
    try {
      const raw = sessionStorage.getItem('drayen_guest_cart');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },
  save(items: CartItem[]): void {
    try {
      sessionStorage.setItem('drayen_guest_cart', JSON.stringify(items));
    } catch (err) {
      console.warn('[CartStorage] Failed to save session cart:', err);
    }
  },
  clear(): void {
    try {
      sessionStorage.removeItem('drayen_guest_cart');
    } catch {}
  },
};

export interface CartService {
  storage: CartStorageAdapter;
  getCart(): CartItem[];
  saveCart(items: CartItem[]): void;
  clearCart(): void;
  calculateTotals(items: CartItem[], address?: Address, shippingTier?: string): CheckoutTotals;
  validateCart(items: CartItem[]): { valid: boolean; issues: string[] };
  getShippingOptions(subtotalPaise: number): ShippingOption[];
}

export const cartService: CartService = {
  storage: sessionCartStorage,

  getCart(): CartItem[] {
    return this.storage.load();
  },

  saveCart(items: CartItem[]): void {
    this.storage.save(items);
  },

  clearCart(): void {
    this.storage.clear();
  },

  calculateTotals(items: CartItem[], _address?: Address, shippingTier = 'standard'): CheckoutTotals {
    const subtotalPaise = items.reduce(
      (acc, it) => acc + (it.product.selling_price_paise || 0) * it.quantity,
      0
    );

    // Calculate discount against original prices if available
    const totalOriginalPaise = items.reduce((acc, it) => {
      const orig = it.product.original_price_paise ?? it.product.selling_price_paise;
      return acc + orig * it.quantity;
    }, 0);

    const discountPaise = Math.max(0, totalOriginalPaise - subtotalPaise);

    // Free delivery rule: ₹499 threshold
    let shippingPaise = 0;
    if (items.length > 0) {
      if (shippingTier === 'express') {
        shippingPaise = 19900; // ₹199 for Express Air
      } else {
        shippingPaise = subtotalPaise >= config.freeShippingThresholdPaise ? 0 : config.standardShippingFeePaise;
      }
    }

    const totalPayablePaise = subtotalPaise + shippingPaise;

    return {
      subtotalPaise,
      discountPaise,
      shippingPaise,
      totalPayablePaise,
      subtotalINR: formatINR(subtotalPaise),
      discountINR: formatINR(discountPaise),
      shippingINR: shippingPaise === 0 ? 'FREE' : formatINR(shippingPaise),
      totalPayableINR: formatINR(totalPayablePaise),
      isEstimate: !config.isBackendConnected,
    };
  },

  validateCart(items: CartItem[]): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (items.length === 0) {
      issues.push('Shopping bag is empty.');
    }

    for (const item of items) {
      if (!item.product) {
        issues.push('Invalid item reference in shopping bag.');
        continue;
      }
      if (item.quantity <= 0) {
        issues.push(`Quantity for ${item.product.name} must be at least 1.`);
      }
      if (item.product.stock_quantity != null && item.quantity > item.product.stock_quantity) {
        issues.push(
          `Only ${item.product.stock_quantity} pieces of ${item.product.name} are currently available in vault.`
        );
      }
      if (!item.product.selling_price_paise || item.product.selling_price_paise <= 0) {
        issues.push(`Price for ${item.product.name} is currently unlisted. Item cannot be ordered.`);
      }
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  },

  getShippingOptions(subtotalPaise: number): ShippingOption[] {
    const isFree = subtotalPaise >= config.freeShippingThresholdPaise;
    return [
      {
        id: 'standard',
        name: 'Complimentary Insured Courier',
        description: 'Delivered in signature matte noir gift packaging with tamper-evident seal.',
        estimatedDelivery: '2–4 Business Days across India',
        pricePaise: isFree ? 0 : config.standardShippingFeePaise,
        minDays: 2,
        maxDays: 4,
        carrier: 'Blue Dart / Delhivery Express',
      },
      {
        id: 'express',
        name: 'Priority Atelier Air Courier',
        description: 'Dispatched in priority batch with dedicated transit tracker.',
        estimatedDelivery: '1–2 Business Days across Metro Cities',
        pricePaise: 19900,
        minDays: 1,
        maxDays: 2,
        carrier: 'Blue Dart Apex Air',
      },
    ];
  },
};
