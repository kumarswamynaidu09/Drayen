import React, { useState, useEffect } from 'react';
import { formatINR } from '../lib/money';
import { 
  QrCode, 
  Copy, 
  Check, 
  Upload, 
  AlertCircle, 
  Clock, 
  ShieldCheck, 
  ArrowRight, 
  FileText,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

interface PaymentViewProps {
  orderNumber: string;
  orderAccessToken: string;
  onNavigateToTracking: (orderNumber: string, token: string) => void;
  onNavigateHome: () => void;
}

interface PaymentQRData {
  orderNumber: string;
  totalPaise: number;
  formattedAmount: string;
  upiId: string;
  merchantName: string;
  qrCodeDataUrl: string;
  upiPayload: string;
  paymentStatus: string;
  orderStatus: string;
}

export const PaymentView: React.FC<PaymentViewProps> = ({
  orderNumber,
  orderAccessToken,
  onNavigateToTracking,
  onNavigateHome
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrData, setQrData] = useState<PaymentQRData | null>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);

  // Form states
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [utrNumber, setUtrNumber] = useState('');
  const [payerName, setPayerName] = useState('');
  const [payerVpa, setPayerVpa] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [declaredAuthentic, setDeclaredAuthentic] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    fetchPaymentDetails();
  }, [orderNumber, orderAccessToken]);

  const fetchPaymentDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/orders/${orderNumber}/payment-qr?token=${encodeURIComponent(orderAccessToken)}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch payment details');
      }
      const data: PaymentQRData = await res.json();
      setQrData(data);
      if (data.paymentStatus === 'submitted' || data.paymentStatus === 'verified') {
        setSubmitSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || 'Error loading payment protocol');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyUpi = () => {
    if (!qrData?.upiId) return;
    navigator.clipboard.writeText(qrData.upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleCopyAmount = () => {
    if (!qrData) return;
    const amountVal = (qrData.totalPaise / 100).toFixed(2);
    navigator.clipboard.writeText(amountVal);
    setCopiedAmount(true);
    setTimeout(() => setCopiedAmount(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(selected.type)) {
      setSubmitError('Invalid file format. Please upload JPEG, PNG, or WebP screenshot.');
      return;
    }

    // Validate size (10MB max)
    if (selected.size > 10 * 1024 * 1024) {
      setSubmitError('File is too large. Max size is 10MB.');
      return;
    }

    setSubmitError(null);
    setFile(selected);
    const objectUrl = URL.createObjectURL(selected);
    setPreviewUrl(objectUrl);
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setSubmitError('Please attach an authentic screenshot of your completed UPI transaction.');
      return;
    }
    if (!utrNumber.trim()) {
      setSubmitError('Please enter the 12-digit UPI Transaction ID / UTR number.');
      return;
    }
    if (!declaredAuthentic) {
      setSubmitError('You must confirm that this evidence matches your genuine transfer.');
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError(null);

      const formData = new FormData();
      formData.append('orderAccessToken', orderAccessToken);
      formData.append('utrNumber', utrNumber.trim());
      formData.append('payerName', payerName.trim());
      formData.append('payerVpa', payerVpa.trim());
      formData.append('customerNotes', customerNotes.trim());
      formData.append('paymentProof', file);

      const res = await fetch(`/api/orders/${orderNumber}/submit-payment`, {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Failed to submit payment evidence');
      }

      setSubmitSuccess(true);
    } catch (err: any) {
      setSubmitError(err.message || 'Submission failed. Please check your connection and retry.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0e0e0e] text-[#e5e2e1] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-[#651C2D] border-t-transparent rounded-full animate-spin"></div>
          <p className="font-mono text-xs uppercase tracking-widest text-[#858281]">Initializing Vault Settlement Protocol...</p>
        </div>
      </div>
    );
  }

  if (error || !qrData) {
    return (
      <div className="min-h-screen bg-[#0e0e0e] text-[#e5e2e1] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#171616] border border-[#2d2929] p-8 text-center space-y-6">
          <AlertCircle className="w-12 h-12 text-[#991b1b] mx-auto" />
          <h2 className="font-serif text-2xl tracking-wide text-white">Payment Session Unavailable</h2>
          <p className="text-sm text-[#a8a29e] leading-relaxed">{error || 'Order record could not be located.'}</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={fetchPaymentDetails}
              className="px-5 py-2.5 bg-[#201f1f] text-xs font-mono tracking-widest uppercase hover:bg-[#2d2929] transition-colors"
            >
              Retry
            </button>
            <button
              onClick={onNavigateHome}
              className="px-5 py-2.5 bg-[#651C2D] text-xs font-mono tracking-widest uppercase hover:bg-[#85253b] transition-colors"
            >
              Return to Sanctum
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-[#e5e2e1] pt-24 pb-20 px-4 md:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header Banner */}
        <div className="border border-[#2d2929] bg-[#131313] p-6 md:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#651C2D]/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2d2929] pb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                <span className="font-mono text-xs uppercase tracking-widest text-[#858281]">Step 2: Settlement & Proof Verification</span>
              </div>
              <h1 className="font-serif text-3xl md:text-4xl tracking-wide text-white">Settlement Protocol</h1>
            </div>

            <div className="text-right">
              <span className="font-mono text-xs uppercase tracking-widest text-[#858281] block">Order Identifier</span>
              <span className="font-mono text-lg font-bold text-white tracking-wider">{qrData.orderNumber}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
            <div>
              <span className="text-xs uppercase font-mono tracking-widest text-[#858281] block">Authoritative Total</span>
              <span className="font-serif text-2xl text-white font-bold tracking-tight">
                {formatINR(qrData.totalPaise)}
              </span>
            </div>
            <div>
              <span className="text-xs uppercase font-mono tracking-widest text-[#858281] block">Payment Gateway</span>
              <span className="font-mono text-sm text-[#e5e2e1]">Direct Merchant UPI Protocol</span>
            </div>
            <div>
              <span className="text-xs uppercase font-mono tracking-widest text-[#858281] block">Settlement State</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30">
                <Clock className="w-3.5 h-3.5" />
                {qrData.paymentStatus === 'submitted' ? 'Verification In Progress' : 'Awaiting Settlement Proof'}
              </span>
            </div>
          </div>
        </div>

        {submitSuccess ? (
          /* Submission Confirmed Screen */
          <div className="bg-[#171616] border border-emerald-900/50 p-8 md:p-12 text-center space-y-6">
            <div className="w-16 h-16 bg-emerald-950/60 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto text-emerald-400">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <div className="max-w-xl mx-auto space-y-3">
              <h2 className="font-serif text-2xl md:text-3xl tracking-wide text-white">Payment Submission Received</h2>
              <p className="text-sm text-[#c7c3c2] leading-relaxed">
                Your payment screenshot and UTR transaction reference have been securely vaulted.
                Your order is currently <span className="text-amber-400 font-mono">Awaiting Payment Verification</span>.
              </p>
            </div>

            <div className="bg-[#121212] border border-[#2d2929] p-6 max-w-lg mx-auto text-left space-y-3 font-mono text-xs">
              <div className="flex justify-between border-b border-[#201f1f] pb-2">
                <span className="text-[#858281]">Order Reference:</span>
                <span className="text-white font-bold">{qrData.orderNumber}</span>
              </div>
              <div className="flex justify-between border-b border-[#201f1f] pb-2">
                <span className="text-[#858281]">Verification Queue:</span>
                <span className="text-amber-400">Pending Atelier Inspection</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#858281]">Fulfillment Protocol:</span>
                <span className="text-[#a8a29e]">Dispatch initiates immediately after settlement verification</span>
              </div>
            </div>

            <p className="text-xs text-[#858281] max-w-md mx-auto italic">
              Our atelier audit team verifies transfers within 30–60 minutes during standard business hours. You can inspect live progress via your Order Tracking Sanctum.
            </p>

            <div className="flex flex-wrap gap-4 justify-center pt-4">
              <button
                onClick={() => onNavigateToTracking(qrData.orderNumber, orderAccessToken)}
                className="px-6 py-3.5 bg-[#651C2D] text-white font-mono text-xs uppercase tracking-widest hover:bg-[#85253b] transition-all flex items-center gap-2"
              >
                Track Order Progress
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={onNavigateHome}
                className="px-6 py-3.5 bg-[#201f1f] text-[#c7c3c2] font-mono text-xs uppercase tracking-widest hover:bg-[#2d2929] transition-all"
              >
                Return to Storefront
              </button>
            </div>
          </div>
        ) : (
          /* Payment Grid: QR & Info on Left, Proof Form on Right */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Step 1: Scan & Transfer */}
            <div className="lg:col-span-6 bg-[#131313] border border-[#2d2929] p-6 md:p-8 space-y-6">
              <div className="border-b border-[#201f1f] pb-4">
                <span className="font-mono text-xs text-[#651C2D] uppercase tracking-widest block mb-1">Direct Settlement</span>
                <h2 className="font-serif text-2xl text-white">Scan UPI QR or Copy VPA</h2>
                <p className="text-xs text-[#858281] mt-1">Open GPay, PhonePe, Paytm, CRED or any BHIM UPI app.</p>
              </div>

              {/* Dynamic QR Code display */}
              <div className="flex flex-col items-center justify-center p-6 bg-[#1a1919] border border-[#2d2929]">
                <div className="p-3 bg-white rounded-none shadow-2xl relative">
                  <img 
                    src={qrData.qrCodeDataUrl} 
                    alt={`UPI Payment QR for ${qrData.orderNumber}`}
                    className="w-56 h-56 object-contain"
                  />
                  <div className="absolute inset-0 border border-black/10 pointer-events-none" />
                </div>
                <p className="font-mono text-[11px] text-[#858281] mt-3 tracking-wider text-center">
                  Exact Amount Encoded: <span className="text-white font-bold">{formatINR(qrData.totalPaise)}</span>
                </p>
              </div>

              {/* Manual UPI details with copy */}
              <div className="space-y-3 font-mono text-xs">
                <div className="bg-[#171616] border border-[#2d2929] p-3.5 flex items-center justify-between">
                  <div>
                    <span className="text-[#858281] block text-[10px] uppercase tracking-wider">Merchant UPI VPA</span>
                    <span className="text-white font-bold select-all">{qrData.upiId}</span>
                  </div>
                  <button
                    onClick={handleCopyUpi}
                    className="px-3 py-1.5 bg-[#201f1f] hover:bg-[#2d2929] text-white flex items-center gap-1.5 transition-colors"
                  >
                    {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedUpi ? 'Copied' : 'Copy VPA'}</span>
                  </button>
                </div>

                <div className="bg-[#171616] border border-[#2d2929] p-3.5 flex items-center justify-between">
                  <div>
                    <span className="text-[#858281] block text-[10px] uppercase tracking-wider">Exact Amount to Transfer</span>
                    <span className="text-white font-bold select-all">₹{(qrData.totalPaise / 100).toFixed(2)}</span>
                  </div>
                  <button
                    onClick={handleCopyAmount}
                    className="px-3 py-1.5 bg-[#201f1f] hover:bg-[#2d2929] text-white flex items-center gap-1.5 transition-colors"
                  >
                    {copiedAmount ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedAmount ? 'Copied' : 'Copy ₹'}</span>
                  </button>
                </div>
              </div>

              {/* Security Advisory */}
              <div className="bg-[#171616] border-l-2 border-[#651C2D] p-4 text-xs text-[#a8a29e] space-y-1">
                <p className="font-bold text-white uppercase tracking-wider font-mono text-[11px]">Settlement Safeguard</p>
                <p>Ensure the transaction status reads "Success" in your UPI banking app before taking a screenshot. Note down the 12-digit UTR.</p>
              </div>
            </div>

            {/* Step 2: Proof Submission Form */}
            <div className="lg:col-span-6 bg-[#131313] border border-[#2d2929] p-6 md:p-8 space-y-6">
              <div className="border-b border-[#201f1f] pb-4">
                <span className="font-mono text-xs text-[#651C2D] uppercase tracking-widest block mb-1">Authentication</span>
                <h2 className="font-serif text-2xl text-white">Upload Payment Proof</h2>
                <p className="text-xs text-[#858281] mt-1">Submit authentic transfer evidence to trigger atelier verification.</p>
              </div>

              {submitError && (
                <div className="p-4 bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{submitError}</span>
                </div>
              )}

              <form onSubmit={handleSubmitProof} className="space-y-5">
                
                {/* File Upload Box */}
                <div>
                  <label className="block font-mono text-xs uppercase tracking-widest text-[#c7c3c2] mb-2">
                    Payment Screenshot <span className="text-[#651C2D]">*</span>
                  </label>
                  <div className="relative border-2 border-dashed border-[#2d2929] hover:border-[#651C2D] transition-colors p-6 text-center cursor-pointer bg-[#171616]">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      required
                    />
                    {previewUrl ? (
                      <div className="space-y-3">
                        <img 
                          src={previewUrl} 
                          alt="Screenshot preview" 
                          className="max-h-48 mx-auto object-contain border border-[#2d2929]"
                        />
                        <p className="font-mono text-xs text-emerald-400 flex items-center justify-center gap-1.5">
                          <Check className="w-3.5 h-3.5" />
                          {file?.name} ({(file!.size / 1024).toFixed(1)} KB)
                        </p>
                        <p className="text-[11px] text-[#858281]">Click or drag another image to replace</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="w-8 h-8 mx-auto text-[#858281]" />
                        <p className="font-mono text-xs text-white uppercase tracking-wider">Select Screenshot File</p>
                        <p className="text-[11px] text-[#858281]">JPEG, PNG, or WebP up to 10MB</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 12-Digit UTR */}
                <div>
                  <label className="block font-mono text-xs uppercase tracking-widest text-[#c7c3c2] mb-1.5">
                    UPI Transaction ID / UTR Number <span className="text-[#651C2D]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 512345678901 (usually 12 digits)"
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value)}
                    className="w-full bg-[#171616] border border-[#2d2929] px-4 py-3 text-sm text-white placeholder-[#858281] font-mono focus:border-[#651C2D] focus:outline-none"
                  />
                  <p className="text-[10px] text-[#858281] mt-1 font-mono">Found in payment details under 'UPI Ref No.' or 'Bank Reference'</p>
                </div>

                {/* Optional Payer details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-mono text-xs uppercase tracking-widest text-[#c7c3c2] mb-1.5">
                      Payer Account Name
                    </label>
                    <input
                      type="text"
                      placeholder="Name on bank account"
                      value={payerName}
                      onChange={(e) => setPayerName(e.target.value)}
                      className="w-full bg-[#171616] border border-[#2d2929] px-4 py-3 text-sm text-white placeholder-[#858281] focus:border-[#651C2D] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-xs uppercase tracking-widest text-[#c7c3c2] mb-1.5">
                      Payer UPI ID (VPA)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. customer@okhdfcbank"
                      value={payerVpa}
                      onChange={(e) => setPayerVpa(e.target.value)}
                      className="w-full bg-[#171616] border border-[#2d2929] px-4 py-3 text-sm text-white placeholder-[#858281] font-mono focus:border-[#651C2D] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Customer Note */}
                <div>
                  <label className="block font-mono text-xs uppercase tracking-widest text-[#c7c3c2] mb-1.5">
                    Transmission Remarks (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Any relevant transfer note for the auditor"
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    className="w-full bg-[#171616] border border-[#2d2929] px-4 py-2.5 text-sm text-white placeholder-[#858281] focus:border-[#651C2D] focus:outline-none"
                  />
                </div>

                {/* Legal Declaration Checkbox */}
                <div className="pt-2">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={declaredAuthentic}
                      onChange={(e) => setDeclaredAuthentic(e.target.checked)}
                      className="mt-1 h-4 w-4 bg-[#171616] border-[#2d2929] text-[#651C2D] focus:ring-0 focus:ring-offset-0 rounded-none cursor-pointer"
                    />
                    <span className="text-xs text-[#a8a29e] leading-relaxed select-none">
                      I declare that I have transferred the exact sum of <strong className="text-white">{formatINR(qrData.totalPaise)}</strong> to <strong className="text-white">{qrData.upiId}</strong> and that this submission contains authentic banking evidence.
                    </span>
                  </label>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-[#651C2D] text-white font-mono text-xs uppercase tracking-widest hover:bg-[#85253b] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Vaulting Proof & Logging Event...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Submit Payment Details</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
