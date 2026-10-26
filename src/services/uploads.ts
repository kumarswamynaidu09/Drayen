import { IntegrationState } from '../types';
import { getIntegrationState } from './config';

export interface UploadProofResult {
  success: boolean;
  fileReference?: string;
  error?: string;
  integrationState: IntegrationState;
}

export interface UploadsService {
  uploadPaymentProof(file: File): Promise<UploadProofResult>;
}

export const uploadsService: UploadsService = {
  async uploadPaymentProof(file: File): Promise<UploadProofResult> {
    const integration = getIntegrationState('Secure Storage Service', '/api/uploads/payment-proofs');

    if (!file) {
      return {
        success: false,
        error: 'No file supplied for upload.',
        integrationState: integration,
      };
    }

    // In frontend-only architecture without active cloud storage (S3/GCS bucket),
    // we return a temporary client ObjectURL along with explicit integration status
    const tempUrl = URL.createObjectURL(file);
    return {
      success: true,
      fileReference: tempUrl,
      integrationState: integration,
    };
  },
};
