/**
 * DRAYEN Atelier - Precise Currency and Monetary Calculations
 * All internal authoritative amounts are stored in integer paise (1 INR = 100 paise)
 * Never use floating-point arithmetic for authoritative financial calculations.
 */

export interface CartItemInput {
  productId: string;
  unitPricePaise: number;
  quantity: number;
}

export interface OrderPricingResult {
  subtotalPaise: number;
  shippingPaise: number;
  discountPaise: number;
  totalPayablePaise: number;
}

export function formatINR(paise: number | undefined | null): string {
  if (paise == null || isNaN(paise)) return '₹0';
  const rupees = Math.floor(paise / 100);
  const remainder = paise % 100;
  
  // Format with Indian numbering system (e.g., ₹1,299 or ₹999)
  const formatted = rupees.toLocaleString('en-IN');
  return remainder > 0 
    ? `₹${formatted}.${remainder.toString().padStart(2, '0')}`
    : `₹${formatted}`;
}

export function calculateOrderPricing(params: {
  items: CartItemInput[];
  shippingTier: 'standard' | 'express';
  paymentMethod: 'upi' | 'card' | 'cod';
  promoCode?: string;
  freeShippingThresholdPaise?: number;
}): OrderPricingResult {
  const {
    items,
    shippingTier,
    paymentMethod,
    promoCode,
    freeShippingThresholdPaise = 49900 // ₹499
  } = params;

  if (!items || items.length === 0) {
    return {
      subtotalPaise: 0,
      shippingPaise: 0,
      discountPaise: 0,
      totalPayablePaise: 0,
    };
  }

  // Calculate integer subtotal
  const subtotalPaise = items.reduce((sum, item) => {
    if (item.quantity <= 0 || item.unitPricePaise < 0) {
      throw new Error(`Invalid item quantity (${item.quantity}) or price (${item.unitPricePaise})`);
    }
    return sum + (item.unitPricePaise * item.quantity);
  }, 0);

  // Discount validation
  let discountPaise = 0;
  if (promoCode) {
    const code = promoCode.trim().toUpperCase();
    if (code === 'FIRSTDROP') {
      discountPaise = 10000; // Flat ₹100 off
    } else if (code === 'NOCTURNE10') {
      discountPaise = Math.floor((subtotalPaise * 10) / 100); // 10% off
    }
  }

  // Ensure discount does not exceed subtotal
  if (discountPaise > subtotalPaise) {
    discountPaise = subtotalPaise;
  }

  // Shipping calculation
  let shippingPaise = 0;
  if (shippingTier === 'express') {
    shippingPaise = 9900; // Flat ₹99 Priority Air Cargo
  } else {
    // Standard Ground is free if subtotal >= ₹499, else ₹50
    shippingPaise = subtotalPaise >= freeShippingThresholdPaise ? 0 : 5000;
  }

  // COD logistics verification surcharge
  if (paymentMethod === 'cod') {
    shippingPaise += 5000; // ₹50 COD verification
  }

  const totalPayablePaise = Math.max(0, subtotalPaise - discountPaise + shippingPaise);

  return {
    subtotalPaise,
    shippingPaise,
    discountPaise,
    totalPayablePaise,
  };
}
