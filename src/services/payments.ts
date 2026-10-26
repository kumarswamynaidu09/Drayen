import { PaymentInstructions, PaymentStatus, IntegrationState } from '../types';
import { config, getIntegrationState } from './config';
import { formatINR } from '../lib/money';

export interface PaymentEvidenceSubmissionRequest {
  orderNumber: string;
  orderAccessToken: string;
  utrNumber: string;
  screenshotFile: File;
  payerName?: string;
  payerVpa?: string;
  customerDeclaration: boolean;
}

export interface PaymentSubmissionResult {
  success: boolean;
  orderNumber?: string;
  paymentStatus: PaymentStatus;
  message: string;
  error?: string;
  integrationState: IntegrationState;
}

export interface PaymentsService {
  getPaymentInstructions(orderNumber: string, token: string): Promise<PaymentInstructions>;
  submitPaymentEvidence(request: PaymentEvidenceSubmissionRequest): Promise<PaymentSubmissionResult>;
  validateUTR(utr: string): { valid: boolean; error?: string };
  validateScreenshotFile(file: File): { valid: boolean; error?: string };
  getIntegrationStatus(): IntegrationState;
}

export const paymentsService: PaymentsService = {
  getIntegrationStatus(): IntegrationState {
    return getIntegrationState('Merchant Payment Service', '/api/orders/:orderNumber/payment-qr');
  },

  validateUTR(utr: string): { valid: boolean; error?: string } {
    const trimmed = utr.trim();
    if (!trimmed) {
      return { valid: false, error: 'UPI Transaction ID / UTR is required.' };
    }
    // Indian UPI UTR is typically 12 digits, sometimes 12-16 alphanumeric
    if (!/^[A-Za-z0-9]{10,22}$/.test(trimmed)) {
      return {
        valid: false,
        error: 'Please enter a valid 12-digit UPI reference number (UTR) from your banking app.',
      };
    }
    return { valid: true };
  },

  validateScreenshotFile(file: File): { valid: boolean; error?: string } {
    if (!file) {
      return { valid: false, error: 'Payment screenshot file is required.' };
    }
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Invalid file format. Only JPEG, PNG, and WebP screenshots are accepted.',
      };
    }
    const maxBytes = 5 * 1024 * 1024; // 5 MB limit
    if (file.size > maxBytes) {
      return {
        valid: false,
        error: 'Screenshot exceeds 5MB size limit. Please upload an optimized image.',
      };
    }
    return { valid: true };
  },

  async getPaymentInstructions(orderNumber: string, token: string): Promise<PaymentInstructions> {
    const isConfigured = Boolean(config.merchantUpiId);

    // Attempt backend fetch if configured
    if (orderNumber && token) {
      try {
        const baseUrl = config.apiBaseUrl || '';
        const res = await fetch(
          `${baseUrl}/api/orders/${encodeURIComponent(orderNumber)}/payment-qr?token=${encodeURIComponent(token)}`
        );
        if (res.ok) {
          const json = await res.json();
          return {
            orderNumber,
            orderId: orderNumber,
            amountPaise: json.totalPaise || 0,
            amountINR: json.formattedAmount || formatINR(json.totalPaise || 0),
            merchantUpiId: json.merchantUpiId || config.merchantUpiId,
            merchantName: json.merchantName || config.merchantName,
            merchantQrDataUrl: json.qrDataUrl,
            merchantQrUrl: config.merchantQrUrl,
            paymentStatus: json.paymentStatus || 'PENDING',
            instructions: [
              `Scan the authoritative merchant QR using any UPI app (GPay, PhonePe, Paytm, BHIM).`,
              `Verify the payee name displays: "${json.merchantName || config.merchantName}".`,
              `Complete the exact transfer without modifying the rupee amount.`,
              `Capture the receipt screenshot and copy the 12-digit UPI Transaction ID / UTR.`,
            ],
            isConfigured: true,
          };
        }
      } catch (err) {
        console.warn('[PaymentsService] Error fetching backend payment instructions:', err);
      }
    }

    return {
      orderNumber,
      orderId: orderNumber,
      amountPaise: 0,
      amountINR: '₹0',
      merchantUpiId: config.merchantUpiId,
      merchantName: config.merchantName,
      merchantQrUrl: config.merchantQrUrl,
      paymentStatus: 'PENDING',
      instructions: [
        `Scan the authoritative merchant QR code using any UPI-compatible app.`,
        `Confirm the payee shows "${config.merchantName}".`,
        `Submit your payment receipt screenshot and 12-digit UTR below for atelier verification.`,
      ],
      isConfigured,
    };
  },

  async submitPaymentEvidence(request: PaymentEvidenceSubmissionRequest): Promise<PaymentSubmissionResult> {
    const integration = this.getIntegrationStatus();

    // 1. Frontend validation
    const utrCheck = this.validateUTR(request.utrNumber);
    if (!utrCheck.valid) {
      return {
        success: false,
        paymentStatus: 'PENDING',
        message: utrCheck.error || 'Invalid UTR format.',
        error: utrCheck.error,
        integrationState: integration,
      };
    }

    const fileCheck = this.validateScreenshotFile(request.screenshotFile);
    if (!fileCheck.valid) {
      return {
        success: false,
        paymentStatus: 'PENDING',
        message: fileCheck.error || 'Invalid screenshot file.',
        error: fileCheck.error,
        integrationState: integration,
      };
    }

    if (!request.customerDeclaration) {
      return {
        success: false,
        paymentStatus: 'PENDING',
        message: 'You must confirm the authenticity of your payment evidence.',
        error: 'Declaration mandatory.',
        integrationState: integration,
      };
    }

    // 2. Dispatch to backend if available
    try {
      const baseUrl = config.apiBaseUrl || '';
      const formData = new FormData();
      formData.append('token', request.orderAccessToken);
      formData.append('orderAccessToken', request.orderAccessToken);
      formData.append('utrNumber', request.utrNumber.trim());
      formData.append('customerDeclaration', 'true');
      formData.append('paymentProof', request.screenshotFile);
      if (request.payerName) formData.append('payerName', request.payerName);
      if (request.payerVpa) formData.append('payerVpa', request.payerVpa);

      const res = await fetch(
        `${baseUrl}/api/orders/${encodeURIComponent(request.orderNumber)}/submit-payment`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (res.ok) {
          return {
            success: true,
            orderNumber: request.orderNumber,
            paymentStatus: 'SUBMITTED',
            message: 'Payment details submitted. Your order is awaiting verification.',
            integrationState: { ...integration, status: 'CONNECTED' },
          };
        } else {
          return {
            success: false,
            paymentStatus: 'PENDING',
            message: data.error || 'Payment evidence submission was rejected by server.',
            error: data.error,
            integrationState: integration,
          };
        }
      }
    } catch (err: any) {
      console.warn('[PaymentsService] Failed to submit payment evidence to backend:', err);
    }

    // Unconnected backend: Return typed explicit NOT_CONFIGURED state
    return {
      success: false,
      paymentStatus: 'PENDING',
      message:
        'Payment Evidence Upload Service is not yet connected to backend storage. Teammate will connect POST /api/orders/:orderNumber/submit-payment.',
      error: 'Backend payment submission integration required.',
      integrationState: integration,
    };
  },
};
