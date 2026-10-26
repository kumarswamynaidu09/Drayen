/**
 * DRAYEN Atelier - Controlled Order & Payment State Machines
 * Enforces server-side atomic status transitions and rules.
 */

export type OrderStatus =
  | 'Awaiting Payment'
  | 'Awaiting Payment Verification'
  | 'Confirmed — Processing'
  | 'Packed'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled';

export type PaymentStatus =
  | 'Not Submitted'
  | 'Pending Review'
  | 'Needs Correction'
  | 'Rejected'
  | 'Verified'
  | 'Refunded';

export interface TransitionCheckResult {
  valid: boolean;
  reason?: string;
}

/**
 * Validates whether an order can transition from currentOrderStatus to nextOrderStatus,
 * taking into consideration the current paymentStatus.
 */
export function validateOrderStatusTransition(
  currentOrderStatus: OrderStatus,
  nextOrderStatus: OrderStatus,
  paymentStatus: PaymentStatus
): TransitionCheckResult {
  if (currentOrderStatus === nextOrderStatus) {
    return { valid: true };
  }

  // Terminal states cannot transition to normal flow
  if (currentOrderStatus === 'Cancelled') {
    return { valid: false, reason: 'Cancelled orders cannot be reopened.' };
  }
  if (currentOrderStatus === 'Delivered' && nextOrderStatus !== 'Cancelled') {
    return { valid: false, reason: 'Delivered orders cannot transition backwards.' };
  }

  // Any state can transition to Cancelled
  if (nextOrderStatus === 'Cancelled') {
    return { valid: true };
  }

  // Fulfillment states: Packing, Shipping, Delivering REQUIRE Verified payment!
  const fulfillmentStates: OrderStatus[] = ['Confirmed — Processing', 'Packed', 'Shipped', 'Delivered'];
  if (fulfillmentStates.includes(nextOrderStatus)) {
    if (paymentStatus !== 'Verified') {
      return {
        valid: false,
        reason: `Cannot advance order to '${nextOrderStatus}' while payment status is '${paymentStatus}'. Payment must be 'Verified' first.`,
      };
    }
  }

  // Valid forward sequences
  const validGraph: Record<OrderStatus, OrderStatus[]> = {
    'Awaiting Payment': ['Awaiting Payment Verification', 'Cancelled'],
    'Awaiting Payment Verification': ['Confirmed — Processing', 'Awaiting Payment', 'Cancelled'],
    'Confirmed — Processing': ['Packed', 'Cancelled'],
    'Packed': ['Shipped', 'Cancelled'],
    'Shipped': ['Delivered', 'Cancelled'],
    'Delivered': [],
    'Cancelled': [],
  };

  const allowedNext = validGraph[currentOrderStatus] || [];
  if (!allowedNext.includes(nextOrderStatus)) {
    return {
      valid: false,
      reason: `Illegal order transition from '${currentOrderStatus}' to '${nextOrderStatus}'.`,
    };
  }

  return { valid: true };
}

/**
 * Validates payment status transitions.
 */
export function validatePaymentStatusTransition(
  currentPaymentStatus: PaymentStatus,
  nextPaymentStatus: PaymentStatus,
  isCustomerAction: boolean
): TransitionCheckResult {
  if (currentPaymentStatus === nextPaymentStatus) {
    return { valid: true };
  }

  // Customers can only submit or resubmit proof
  if (isCustomerAction) {
    if (nextPaymentStatus === 'Verified') {
      return { valid: false, reason: 'Customer cannot approve or verify payments.' };
    }
    if (nextPaymentStatus !== 'Pending Review') {
      return { valid: false, reason: `Customer cannot set payment status to '${nextPaymentStatus}'.` };
    }
    if (currentPaymentStatus === 'Verified') {
      return { valid: false, reason: 'Payment is already verified.' };
    }
    return { valid: true };
  }

  // Admin transitions
  if (currentPaymentStatus === 'Verified' && nextPaymentStatus !== 'Refunded') {
    return { valid: false, reason: 'Verified payments can only transition to Refunded.' };
  }

  return { valid: true };
}
