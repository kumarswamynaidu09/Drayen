import test from 'node:test';
import assert from 'node:assert/strict';
import { formatINR, calculateOrderPricing } from './money';
import { validateOrderStatusTransition, validatePaymentStatusTransition } from './state-machine';
import { validateIndianPinCode, validateIndianMobile, sanitizeAndValidateUTR } from './validation';

test('formatINR correctly formats integer paise to Indian Rupee strings', () => {
  assert.equal(formatINR(69900), '₹699');
  assert.equal(formatINR(129900), '₹1,299');
  assert.equal(formatINR(59950), '₹599.50');
  assert.equal(formatINR(0), '₹0');
});

test('calculateOrderPricing calculates correct subtotals, free shipping, and promo discounts', () => {
  const result = calculateOrderPricing({
    items: [{ productId: 'noctis-cross', unitPricePaise: 69900, quantity: 1 }],
    shippingTier: 'standard',
    paymentMethod: 'upi',
    promoCode: 'FIRSTDROP',
  });

  assert.equal(result.subtotalPaise, 69900);
  assert.equal(result.discountPaise, 10000); // ₹100 off
  assert.equal(result.shippingPaise, 0); // Free because >= 49900
  assert.equal(result.totalPayablePaise, 59900); // ₹599
});

test('calculateOrderPricing charges express shipping and COD surcharge properly', () => {
  const result = calculateOrderPricing({
    items: [{ productId: 'item-1', unitPricePaise: 30000, quantity: 1 }],
    shippingTier: 'express',
    paymentMethod: 'cod',
  });

  assert.equal(result.subtotalPaise, 30000);
  assert.equal(result.discountPaise, 0);
  // Express: 9900 + COD surcharge: 5000 = 14900 paise
  assert.equal(result.shippingPaise, 14900);
  assert.equal(result.totalPayablePaise, 44900);
});

test('state-machine blocks unverified payment from advancing to Shipped or Packed', () => {
  const blockedPacked = validateOrderStatusTransition(
    'Awaiting Payment Verification',
    'Packed',
    'Pending Review'
  );
  assert.equal(blockedPacked.valid, false);

  const blockedShipped = validateOrderStatusTransition(
    'Awaiting Payment Verification',
    'Shipped',
    'Pending Review'
  );
  assert.equal(blockedShipped.valid, false);

  const allowedVerified = validateOrderStatusTransition(
    'Awaiting Payment Verification',
    'Confirmed — Processing',
    'Verified'
  );
  assert.equal(allowedVerified.valid, true);
});

test('state-machine prevents customer from self-approving payment', () => {
  const customerSelfApprove = validatePaymentStatusTransition('Pending Review', 'Verified', true);
  assert.equal(customerSelfApprove.valid, false);

  const customerSubmit = validatePaymentStatusTransition('Not Submitted', 'Pending Review', true);
  assert.equal(customerSubmit.valid, true);

  const adminApprove = validatePaymentStatusTransition('Pending Review', 'Verified', false);
  assert.equal(adminApprove.valid, true);
});

test('validation properly checks Indian PIN codes, phone numbers, and UTRs', () => {
  assert.equal(validateIndianPinCode('560001'), true);
  assert.equal(validateIndianPinCode('110001'), true);
  assert.equal(validateIndianPinCode('012345'), false); // Starts with 0
  assert.equal(validateIndianPinCode('56000'), false); // 5 digits

  assert.equal(validateIndianMobile('9876543210'), true);
  assert.equal(validateIndianMobile('+91 98765 43210'), true);
  assert.equal(validateIndianMobile('1234567890'), false); // Starts with 1

  const utrCheck = sanitizeAndValidateUTR('  004928174920  ');
  assert.equal(utrCheck.valid, true);
  assert.equal(utrCheck.utr, '004928174920'); // Preserves leading zeroes

  const badUtr = sanitizeAndValidateUTR('123'); // Too short
  assert.equal(badUtr.valid, false);
});
