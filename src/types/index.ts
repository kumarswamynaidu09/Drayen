/**
 * DRAYEN Atelier — Complete Domain & Architecture Types
 * Pure frontend typed contracts for catalog, cart, checkout, payments, orders, and admin.
 */

export type OrderStatus =
  | 'AWAITING_PAYMENT'
  | 'AWAITING_PAYMENT_VERIFICATION'
  | 'PAYMENT_NEEDS_CORRECTION'
  | 'PAYMENT_REJECTED'
  | 'CONFIRMED_PROCESSING'
  | 'PACKED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

export type PaymentStatus =
  | 'PENDING'
  | 'SUBMITTED'
  | 'VERIFIED'
  | 'REJECTED'
  | 'NEEDS_CORRECTION';

export type IntegrationStatus = 'CONNECTED' | 'NOT_CONFIGURED' | 'ERROR';

export interface IntegrationState {
  status: IntegrationStatus;
  serviceName: string;
  endpoint?: string;
  message: string;
  docsUrl?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  integrationState?: IntegrationState;
  timestamp: string;
}

export interface ApiError {
  code: string;
  message: string;
  field?: string;
  details?: Record<string, any>;
}

export interface ProductVariant {
  type: 'finish' | 'length' | 'color' | 'size';
  options: string[];
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  slug: string;
  short_description?: string;
  full_description?: string;
  category: string;
  selling_price_paise: number;
  original_price_paise?: number | null;
  material: string;
  finish: string;
  chain_length?: string;
  chain_thickness?: string;
  pendant_height?: string;
  pendant_width?: string;
  pendant_thickness?: string;
  pendant_weight?: string;
  clasp_type?: string;
  is_detachable: boolean | number;
  care_instructions?: string;
  images: string[];
  variants: ProductVariant[];
  stock_quantity: number;
  is_published: boolean | number;
  created_at?: string;
  updated_at?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedFinish?: string;
  selectedLength?: string;
}

export interface Address {
  id?: string;
  fullName: string;
  phone: string;
  pincode: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  addressType: 'home' | 'work' | 'other';
  isDefault?: boolean;
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  displayName?: string;
  isEmailVerified: boolean;
  isMobileVerified: boolean;
  createdAt?: string;
}

export interface Customer {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName?: string;
  savedAddresses: Address[];
  createdAt: string;
}

export interface WishlistItem {
  id: string;
  productId: string;
  product: Product;
  variantId?: string;
  selectedFinish?: string;
  selectedLength?: string;
  addedAt: string;
}

export interface CheckoutCustomerDetails {
  email: string;
  phone: string;
  name: string;
  isGuest: boolean;
}

export interface ShippingOption {
  id: string;
  name: string;
  description: string;
  estimatedDelivery: string;
  pricePaise: number;
  minDays: number;
  maxDays: number;
  carrier?: string;
}

export interface CheckoutTotals {
  subtotalPaise: number;
  discountPaise: number;
  shippingPaise: number;
  totalPayablePaise: number;
  subtotalINR: string;
  discountINR: string;
  shippingINR: string;
  totalPayableINR: string;
  isEstimate: boolean;
}

export interface CheckoutRequest {
  customer: CheckoutCustomerDetails;
  deliveryAddress: Address;
  shippingTier: string;
  paymentMethod: 'UPI_QR' | 'NET_BANKING' | 'CARD' | 'COD';
  promoCode?: string;
  items: {
    productId: string;
    sku: string;
    name: string;
    quantity: number;
    selectedFinish?: string;
    selectedLength?: string;
    unitPricePaise: number;
  }[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  sku: string;
  selected_finish?: string;
  selected_length?: string;
  quantity: number;
  unit_price_paise: number;
  total_paise: number;
  unitPriceINR: string;
  totalINR: string;
  image?: string;
}

export interface PaymentSubmission {
  id: string;
  utrNumber: string;
  screenshotUrl?: string;
  screenshotName?: string;
  verificationStatus: PaymentStatus;
  submittedAt: string;
  rejectionReason?: string;
}

export interface Shipment {
  carrier: string;
  trackingNumber: string;
  trackingUrl?: string;
  dispatchDate?: string;
  estimatedDeliveryDate?: string;
  deliveryStatus: 'MANIFESTED' | 'DISPATCHED' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED';
}

export interface OrderTimelineEvent {
  stage: OrderStatus;
  label: string;
  description: string;
  timestamp?: string;
  completed: boolean;
  isCurrent: boolean;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email?: string;
  customer_phone: string;
  deliveryAddress: Address;
  shipping_tier: string;
  payment_method: string;
  subtotal_paise: number;
  shipping_paise: number;
  discount_paise: number;
  total_payable_paise: number;
  subtotalINR: string;
  shippingINR: string;
  discountINR: string;
  totalPayableINR: string;
  order_status: OrderStatus;
  payment_status: PaymentStatus;
  access_token: string;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
  submissions: PaymentSubmission[];
  shipment?: Shipment;
  timeline?: OrderTimelineEvent[];
}

export interface StoreSettings {
  merchantUpiId: string;
  merchantName: string;
  merchantQrUrl?: string;
  merchantQrEnabled: boolean;
  freeShippingThresholdPaise: number;
  standardShippingFeePaise: number;
  contactEmail: string;
  contactPhone: string;
  supportWhatsApp?: string;
}

export interface PaymentInstructions {
  orderNumber: string;
  orderId: string;
  amountPaise: number;
  amountINR: string;
  merchantUpiId?: string;
  merchantName: string;
  merchantQrDataUrl?: string;
  merchantQrUrl?: string;
  paymentStatus: PaymentStatus;
  instructions: string[];
  isConfigured: boolean;
}

export interface ProductFilterOptions {
  category?: string;
  search?: string;
  minPricePaise?: number;
  maxPricePaise?: number;
  material?: string;
  finish?: string;
  inStockOnly?: boolean;
  sortBy?: 'recommended' | 'newest' | 'price-asc' | 'price-desc' | 'name-asc';
}

export interface AdminMetrics {
  totalRevenuePaise: number;
  totalRevenueINR: string;
  totalOrdersCount: number;
  awaitingVerificationCount: number;
  processingCount: number;
  dispatchedCount: number;
  totalCatalogProductsCount: number;
  activePublishedCount: number;
  outOfStockCount: number;
  inventoryValuationINR: string;
  isConfigured: boolean;
}
