/**
 * DRAYEN Atelier - Input Validation & Sanitization Helpers
 */

export function validateIndianPinCode(pincode: string): boolean {
  if (!pincode) return false;
  const cleaned = pincode.trim();
  // Indian PIN codes are exactly 6 digits, first digit 1-9
  return /^[1-9][0-9]{5}$/.test(cleaned);
}

export function validateIndianMobile(phone: string): boolean {
  if (!phone) return false;
  const digitsOnly = phone.replace(/[^0-9]/g, '');
  // Accepts 10 digits starting with 6-9, or 12 digits starting with 91 followed by 6-9
  if (digitsOnly.length === 10) {
    return /^[6-9][0-9]{9}$/.test(digitsOnly);
  }
  if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
    return /^91[6-9][0-9]{9}$/.test(digitsOnly);
  }
  return false;
}

export function sanitizeAndValidateUTR(rawUtr: string): { valid: boolean; utr: string; error?: string } {
  if (!rawUtr) {
    return { valid: false, utr: '', error: 'UTR / Transaction Reference number is required.' };
  }

  // Trim accidental whitespace while preserving character case and leading zeroes
  const trimmed = rawUtr.trim();

  // Reasonable length check: UPI UTRs typically are 12 digits, but IMPS/NEFT/provider refs can range 8 to 30 chars
  if (trimmed.length < 6 || trimmed.length > 32) {
    return {
      valid: false,
      utr: trimmed,
      error: 'Invalid reference length. UPI UTRs are typically 12 characters.',
    };
  }

  // Ensure alphanumeric with no special injection chars
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return {
      valid: false,
      utr: trimmed,
      error: 'UTR must contain only letters and digits.',
    };
  }

  return { valid: true, utr: trimmed };
}
