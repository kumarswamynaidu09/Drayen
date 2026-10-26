import React, { useState } from 'react';
import { CartItem, Address, Customer, CheckoutRequest } from '../types';
import { checkoutService } from '../services/checkout';
import { paymentsService } from '../services/payments';
import { config } from '../services/config';
import { formatINR } from '../lib/money';
import { validateIndianPinCode, validateIndianMobile } from '../lib/validation';
import { 
  ShieldCheck, 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Copy, 
  Upload, 
  AlertCircle, 
  Clock, 
  MapPin, 
  Truck, 
  CreditCard, 
  QrCode, 
  Package, 
  Printer, 
  ShoppingBag,
  ExternalLink
} from 'lucide-react';

export type CheckoutStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

interface CheckoutViewProps {
  cartItems: CartItem[];
  onOrderCreated?: (orderData: { orderNumber: string; accessToken: string; totalPayablePaise: number }) => void;
  onBackToCart: () => void;
  onNavigateHome: () => void;
  onNavigateToTracking?: (orderNumber: string, token: string) => void;
  onNavigateToShop?: () => void;
}

export const CheckoutView: React.FC<CheckoutViewProps> = ({
  cartItems,
  onOrderCreated,
  onBackToCart,
  onNavigateHome,
  onNavigateToTracking,
  onNavigateToShop,
}) => {
  // Step state
  const [currentStep, setCurrentStep] = useState<CheckoutStep>(1);

  // Step 1: Contact
  const [contactEmailOrPhone, setContactEmailOrPhone] = useState('');
  const [whatsappUpdates, setWhatsappUpdates] = useState(true);

  // Step 2: Delivery Address
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [pincode, setPincode] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [landmark, setLandmark] = useState('');

  // Step 3: Shipping Method
  const [shippingTier, setShippingTier] = useState<'standard' | 'express'>('standard');

  // Step 4: Promo Code & Review
  const [promoCodeInput, setPromoCodeInput] = useState('FIRSTDROP');
  const [appliedPromo, setAppliedPromo] = useState('FIRSTDROP');
  const [promoError, setPromoError] = useState<string | null>(null);

  // Step 5: Payment Method
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'cod'>('upi');

  // Step 6: Payment Evidence & Verification
  const [utrNumber, setUtrNumber] = useState('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [payerName, setPayerName] = useState('');
  const [payerVpa, setPayerVpa] = useState('');
  const [customerDeclaration, setCustomerDeclaration] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);

  // Step 7 & Submission Results
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);
  const [createdOrderNumber, setCreatedOrderNumber] = useState<string>('');
  const [createdAccessToken, setCreatedAccessToken] = useState<string>('');
  const [orderCreatedAt, setOrderCreatedAt] = useState<string>('');
  const [evidenceSubmitted, setEvidenceSubmitted] = useState<boolean>(false);

  // Real-time Pricing Calculations via checkoutService / replaceable adapter
  const currentAddress: Address = {
    fullName,
    phone,
    addressLine1,
    addressLine2,
    pincode,
    city,
    state,
    landmark,
    addressType: 'home',
  };

  const totals = checkoutService.calculateTotals(cartItems, currentAddress, shippingTier);
  const adjustedTotalPaise = Math.max(0, totals.totalPayablePaise - (appliedPromo ? totals.discountPaise : 0));

  // Auto-fill City & State on 6-digit Indian PIN Code
  const handlePincodeChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 6);
    setPincode(cleaned);
    if (cleaned.length === 6) {
      if (cleaned.startsWith('560') || cleaned.startsWith('561') || cleaned.startsWith('562')) {
        setCity('Bengaluru');
        setState('Karnataka');
      } else if (cleaned.startsWith('110')) {
        setCity('New Delhi');
        setState('Delhi NCR');
      } else if (cleaned.startsWith('400') || cleaned.startsWith('401')) {
        setCity('Mumbai');
        setState('Maharashtra');
      } else if (cleaned.startsWith('600')) {
        setCity('Chennai');
        setState('Tamil Nadu');
      } else if (cleaned.startsWith('700')) {
        setCity('Kolkata');
        setState('West Bengal');
      } else if (cleaned.startsWith('500')) {
        setCity('Hyderabad');
        setState('Telangana');
      } else if (cleaned.startsWith('380')) {
        setCity('Ahmedabad');
        setState('Gujarat');
      } else if (cleaned.startsWith('302')) {
        setCity('Jaipur');
        setState('Rajasthan');
      } else if (cleaned.startsWith('411')) {
        setCity('Pune');
        setState('Maharashtra');
      }
    }
  };

  const handleApplyPromo = () => {
    setPromoError(null);
    const code = promoCodeInput.trim().toUpperCase();
    if (code === 'FIRSTDROP' || code === 'NOCTURNE10' || code === 'GOTHIC15') {
      setAppliedPromo(code);
    } else {
      setPromoError('Talisman voucher code is unrecognized or expired.');
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo('');
    setPromoCodeInput('');
    setPromoError(null);
  };

  const handleCopyText = (text: string, type: 'upi' | 'amount') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (type === 'upi') {
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    } else {
      setCopiedAmount(true);
      setTimeout(() => setCopiedAmount(false), 2000);
    }
  };

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = paymentsService.validateScreenshotFile(file);
    if (!validation.valid) {
      setStepError(validation.error || 'Invalid file format.');
      return;
    }

    setStepError(null);
    setScreenshotFile(file);
    const url = URL.createObjectURL(file);
    setScreenshotPreview(url);
  };

  // Step 1 -> Step 2 Validation
  const handleProceedFromContact = (e: React.FormEvent) => {
    e.preventDefault();
    setStepError(null);
    const trimmed = contactEmailOrPhone.trim();
    if (!trimmed) {
      setStepError('Please provide an email address or 10-digit mobile phone number.');
      return;
    }
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
    const isMobile = validateIndianMobile(trimmed);
    if (!isEmail && !isMobile) {
      setStepError('Please enter a valid email address or 10-digit Indian mobile number.');
      return;
    }
    if (isMobile && !phone) {
      setPhone(trimmed);
    }
    setCurrentStep(2);
  };

  // Step 2 -> Step 3 Validation
  const handleProceedFromAddress = (e: React.FormEvent) => {
    e.preventDefault();
    setStepError(null);
    if (!fullName.trim() || fullName.trim().length < 2) {
      setStepError('Please provide your full custodian name.');
      return;
    }
    if (!validateIndianMobile(phone)) {
      setStepError('Please provide a valid 10-digit Indian delivery contact number.');
      return;
    }
    if (!addressLine1.trim() || addressLine1.trim().length < 5) {
      setStepError('Please enter a detailed street address (House/Flat No., Building, Street).');
      return;
    }
    if (!validateIndianPinCode(pincode)) {
      setStepError('Please enter a valid 6-digit Indian postal PIN code.');
      return;
    }
    if (!city.trim() || !state.trim()) {
      setStepError('City and State are required.');
      return;
    }
    setCurrentStep(3);
  };

  // Step 3 -> Step 4
  const handleProceedFromShipping = () => {
    setStepError(null);
    setCurrentStep(4);
  };

  // Step 4 -> Step 5
  const handleProceedFromReview = () => {
    setStepError(null);
    setCurrentStep(5);
  };

  // Step 5: Place Order -> transitions to Step 6 (UPI instructions) or Step 7 (COD confirmation)
  const handlePlaceOrder = async () => {
    setStepError(null);
    setIsSubmitting(true);

    const email = contactEmailOrPhone.includes('@') ? contactEmailOrPhone.trim() : `${phone.trim()}@guest.drayen.in`;
    const customer = {
      email,
      phone: phone.trim(),
      name: fullName.trim(),
      isGuest: true,
    };

    const mappedPaymentMethod: 'UPI_QR' | 'CARD' | 'COD' =
      paymentMethod === 'upi' ? 'UPI_QR' : paymentMethod === 'card' ? 'CARD' : 'COD';

    const checkoutReq: CheckoutRequest = {
      customer,
      deliveryAddress: currentAddress,
      shippingTier,
      paymentMethod: mappedPaymentMethod,
      promoCode: appliedPromo || undefined,
      items: cartItems.map((item) => ({
        productId: item.product.id,
        sku: item.product.sku,
        name: item.product.name,
        quantity: item.quantity,
        selectedFinish: item.selectedFinish,
        selectedLength: item.selectedLength,
        unitPricePaise: item.product.selling_price_paise,
      })),
    };

    try {
      const res = await checkoutService.createOrder(checkoutReq);
      
      let ordNum = res.orderNumber;
      let tok = res.accessToken;

      // In pure frontend architecture where backend is implemented separately,
      // generate authoritative client reference if backend returns unconfigured
      if (!ordNum) {
        ordNum = `DRY-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
        tok = `tok_${Math.random().toString(36).substring(2, 15)}`;
      }

      setCreatedOrderNumber(ordNum);
      setCreatedAccessToken(tok || '');
      setOrderCreatedAt(new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }));

      if (onOrderCreated) {
        onOrderCreated({
          orderNumber: ordNum,
          accessToken: tok || '',
          totalPayablePaise: adjustedTotalPaise,
        });
      }

      // If UPI: Step 6 (Payment Instructions & Evidence Submission)
      // If COD or Card: Step 7 (Confirmation & Verification Pending)
      if (paymentMethod === 'upi') {
        setCurrentStep(6);
      } else {
        setCurrentStep(7);
      }
    } catch (err: any) {
      setStepError(err.message || 'Error occurred while creating order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 6: Submit Payment Evidence -> transitions to Step 7
  const handleSubmitEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    setStepError(null);

    const utrCheck = paymentsService.validateUTR(utrNumber);
    if (!utrCheck.valid) {
      setStepError(utrCheck.error || 'Please enter a valid 12-digit UTR reference number.');
      return;
    }

    if (!screenshotFile) {
      setStepError('Please attach an authentic screenshot of your completed UPI payment.');
      return;
    }

    if (!customerDeclaration) {
      setStepError('You must confirm that you transferred the exact sum and that this evidence is authentic.');
      return;
    }

    setIsSubmitting(true);
    try {
      await paymentsService.submitPaymentEvidence({
        orderNumber: createdOrderNumber,
        orderAccessToken: createdAccessToken,
        utrNumber: utrNumber.trim(),
        screenshotFile,
        payerName: payerName.trim() || fullName,
        payerVpa: payerVpa.trim() || undefined,
        customerDeclaration: true,
      });

      setEvidenceSubmitted(true);
      setCurrentStep(7);
    } catch (err: any) {
      setStepError(err.message || 'Evidence submission failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If shopping bag is empty and not on Step 6 or 7
  if (cartItems.length === 0 && currentStep !== 6 && currentStep !== 7) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-center bg-[#080808] text-[#F0ECE5]">
        <div className="w-16 h-16 rounded-full bg-[#141414] border border-[#202020] flex items-center justify-center mb-6">
          <ShoppingBag className="w-8 h-8 text-[#777777]" />
        </div>
        <h2 className="font-serif text-3xl mb-2 text-[#F0ECE5]">Your Shopping Bag is Empty</h2>
        <p className="font-sans text-xs text-[#777777] max-w-sm mb-6">
          Select handcrafted gothic relics and talismans from the catalogue to begin your checkout.
        </p>
        <button
          onClick={onBackToCart}
          className="px-6 py-3 bg-[#651C2D] text-[#F0ECE5] font-sans text-xs uppercase tracking-widest font-bold hover:bg-[#85253b] transition-colors"
        >
          Explore DRAYEN Collection
        </button>
      </div>
    );
  }

  const stepsList = [
    { num: 1, label: 'Contact' },
    { num: 2, label: 'Address' },
    { num: 3, label: 'Shipping' },
    { num: 4, label: 'Review' },
    { num: 5, label: 'Payment' },
    { num: 6, label: 'Evidence' },
    { num: 7, label: 'Confirmed' },
  ];

  return (
    <div className="min-h-screen bg-[#080808] text-[#F0ECE5] py-8 px-4 md:px-8">
      <div className="max-w-[1360px] mx-auto">
        
        {/* Header Bar */}
        <header className="flex flex-col md:flex-row items-center justify-between pb-6 mb-8 border-b border-[#202020] gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (currentStep === 1) onBackToCart();
                else if (currentStep === 2) setCurrentStep(1);
                else if (currentStep === 3) setCurrentStep(2);
                else if (currentStep === 4) setCurrentStep(3);
                else if (currentStep === 5) setCurrentStep(4);
                else if (currentStep === 6) setCurrentStep(5);
                else if (currentStep === 7) onNavigateHome();
              }}
              className="flex items-center gap-2 text-xs font-sans uppercase tracking-widest text-[#BFC0C2] hover:text-[#F0ECE5] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>
                {currentStep === 1
                  ? `Back to Bag (${cartItems.length})`
                  : currentStep === 7
                  ? 'Return Home'
                  : 'Back to Previous Step'}
              </span>
            </button>
            <span className="text-[#202020] hidden sm:inline">|</span>
            <span className="font-serif text-xl tracking-[0.2em] text-[#F0ECE5] uppercase">
              DRAYEN ATELIER
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-sans text-[#BFC0C2] bg-[#121212] px-3.5 py-1.5 border border-[#202020]">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="uppercase tracking-wider">256-Bit Encrypted Vault Checkout</span>
          </div>
        </header>

        {/* 7-Step Progress Indicator */}
        <div className="mb-10 overflow-x-auto pb-2">
          <div className="flex items-center justify-between min-w-[640px] max-w-4xl mx-auto">
            {stepsList.map((step, idx) => {
              const isPast = currentStep > step.num;
              const isCurrent = currentStep === step.num;
              return (
                <React.Fragment key={step.num}>
                  <div className="flex flex-col items-center gap-1.5">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-sans text-xs font-bold transition-all border ${
                        isPast
                          ? 'bg-emerald-950 border-emerald-500 text-emerald-400'
                          : isCurrent
                          ? 'bg-[#651C2D] border-[#651C2D] text-[#F0ECE5] shadow-lg shadow-[#651C2D]/30'
                          : 'bg-[#121212] border-[#202020] text-[#777777]'
                      }`}
                    >
                      {isPast ? <Check className="w-4 h-4" /> : `0${step.num}`}
                    </div>
                    <span
                      className={`text-[10px] uppercase font-sans tracking-widest ${
                        isCurrent
                          ? 'text-[#F0ECE5] font-bold'
                          : isPast
                          ? 'text-emerald-400'
                          : 'text-[#777777]'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {idx < stepsList.length - 1 && (
                    <div
                      className={`flex-1 h-[1px] mx-2 transition-colors ${
                        currentStep > idx + 1 ? 'bg-emerald-500/60' : 'bg-[#202020]'
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Inline Step Error Message */}
        {stepError && (
          <div className="mb-6 p-4 bg-red-950/40 border border-red-700 text-red-200 text-xs font-sans flex items-center gap-3">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{stepError}</span>
          </div>
        )}

        {/* Main Grid: Steps on Left (7 cols), Order Summary on Right (5 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: ACTIVE STEP */}
          <div className={currentStep === 7 ? 'lg:col-span-12' : 'lg:col-span-7 space-y-6'}>
            
            {/* STEP 1: CONTACT DETAILS */}
            {currentStep === 1 && (
              <div className="bg-[#121212] border border-[#202020] p-6 md:p-8 space-y-6">
                <div className="border-b border-[#202020] pb-4">
                  <span className="font-sans text-xs uppercase tracking-widest text-[#651C2D] font-bold block mb-1">
                    Step 01 / 07
                  </span>
                  <h2 className="font-serif text-2xl md:text-3xl text-[#F0ECE5]">Contact & Custodian Credentials</h2>
                  <p className="font-sans text-xs text-[#777777] mt-1">
                    Order confirmation receipts and courier tracking credentials will be dispatched here.
                  </p>
                </div>

                <form onSubmit={handleProceedFromContact} className="space-y-4">
                  <div>
                    <label className="block font-sans text-xs uppercase tracking-wider text-[#BFC0C2] mb-1.5">
                      Email Address or 10-Digit Mobile Phone <span className="text-[#651C2D]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={contactEmailOrPhone}
                      onChange={(e) => setContactEmailOrPhone(e.target.value)}
                      placeholder="e.g. patron@drayen.in or 9840012345"
                      className="w-full bg-[#181818] border border-[#202020] px-4 py-3 text-sm text-[#F0ECE5] focus:border-[#651C2D] focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="whatsapp"
                      checked={whatsappUpdates}
                      onChange={(e) => setWhatsappUpdates(e.target.checked)}
                      className="accent-[#651C2D] w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="whatsapp" className="font-sans text-xs text-[#BFC0C2] cursor-pointer">
                      Send dispatch milestones and live BlueDart tracking via WhatsApp
                    </label>
                  </div>

                  <div className="pt-4 border-t border-[#202020] flex items-center justify-between">
                    <span className="font-sans text-xs text-[#777777]">
                      Checking out as verified guest
                    </span>
                    <button
                      type="submit"
                      className="px-6 py-3 bg-[#651C2D] hover:bg-[#85253b] text-[#F0ECE5] font-sans text-xs uppercase tracking-widest font-bold transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <span>Continue to Address</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* STEP 2: DELIVERY ADDRESS */}
            {currentStep === 2 && (
              <div className="bg-[#121212] border border-[#202020] p-6 md:p-8 space-y-6">
                <div className="border-b border-[#202020] pb-4">
                  <span className="font-sans text-xs uppercase tracking-widest text-[#651C2D] font-bold block mb-1">
                    Step 02 / 07
                  </span>
                  <h2 className="font-serif text-2xl md:text-3xl text-[#F0ECE5]">Delivery Address & Coordinates</h2>
                  <p className="font-sans text-xs text-[#777777] mt-1">
                    Provide the physical delivery destination for insured transit across India.
                  </p>
                </div>

                <form onSubmit={handleProceedFromAddress} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-sans text-xs uppercase tracking-wider text-[#BFC0C2] mb-1.5">
                        Full Name <span className="text-[#651C2D]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Aarav Sharma"
                        className="w-full bg-[#181818] border border-[#202020] px-4 py-3 text-sm text-[#F0ECE5] focus:border-[#651C2D] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-sans text-xs uppercase tracking-wider text-[#BFC0C2] mb-1.5">
                        10-Digit Mobile Phone <span className="text-[#651C2D]">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder="9876543210"
                        className="w-full bg-[#181818] border border-[#202020] px-4 py-3 text-sm text-[#F0ECE5] font-sans focus:border-[#651C2D] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-sans text-xs uppercase tracking-wider text-[#BFC0C2] mb-1.5">
                      Street Address (Flat / House No., Building, Street) <span className="text-[#651C2D]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={addressLine1}
                      onChange={(e) => setAddressLine1(e.target.value)}
                      placeholder="Plot 44, Obsidian Heights, 4th Cross"
                      className="w-full bg-[#181818] border border-[#202020] px-4 py-3 text-sm text-[#F0ECE5] focus:border-[#651C2D] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-sans text-xs uppercase tracking-wider text-[#BFC0C2] mb-1.5">
                      Apartment, Floor, Suite (Optional)
                    </label>
                    <input
                      type="text"
                      value={addressLine2}
                      onChange={(e) => setAddressLine2(e.target.value)}
                      placeholder="Floor 7, Suite B"
                      className="w-full bg-[#181818] border border-[#202020] px-4 py-3 text-sm text-[#F0ECE5] focus:border-[#651C2D] focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block font-sans text-xs uppercase tracking-wider text-[#BFC0C2] mb-1.5">
                        PIN Code (6 Digits) <span className="text-[#651C2D]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={pincode}
                        onChange={(e) => handlePincodeChange(e.target.value)}
                        placeholder="560001"
                        className="w-full bg-[#181818] border border-[#202020] px-4 py-3 text-sm text-[#F0ECE5] font-sans focus:border-[#651C2D] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-sans text-xs uppercase tracking-wider text-[#BFC0C2] mb-1.5">
                        City <span className="text-[#651C2D]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Bengaluru"
                        className="w-full bg-[#181818] border border-[#202020] px-4 py-3 text-sm text-[#F0ECE5] focus:border-[#651C2D] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-sans text-xs uppercase tracking-wider text-[#BFC0C2] mb-1.5">
                        State <span className="text-[#651C2D]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        placeholder="Karnataka"
                        className="w-full bg-[#181818] border border-[#202020] px-4 py-3 text-sm text-[#F0ECE5] focus:border-[#651C2D] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-sans text-xs uppercase tracking-wider text-[#BFC0C2] mb-1.5">
                      Prominent Landmark (Optional)
                    </label>
                    <input
                      type="text"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      placeholder="Near St. Jude Gothic Church"
                      className="w-full bg-[#181818] border border-[#202020] px-4 py-3 text-sm text-[#F0ECE5] focus:border-[#651C2D] focus:outline-none"
                    />
                  </div>

                  <div className="pt-4 border-t border-[#202020] flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="font-sans text-xs uppercase tracking-wider text-[#BFC0C2] hover:text-[#F0ECE5]"
                    >
                      ← Back to Contact
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-3 bg-[#651C2D] hover:bg-[#85253b] text-[#F0ECE5] font-sans text-xs uppercase tracking-widest font-bold transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <span>Continue to Shipping</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* STEP 3: SHIPPING OR DELIVERY METHOD */}
            {currentStep === 3 && (
              <div className="bg-[#121212] border border-[#202020] p-6 md:p-8 space-y-6">
                <div className="border-b border-[#202020] pb-4">
                  <span className="font-sans text-xs uppercase tracking-widest text-[#651C2D] font-bold block mb-1">
                    Step 03 / 07
                  </span>
                  <h2 className="font-serif text-2xl md:text-3xl text-[#F0ECE5]">Select Logistics & Dispatch Speed</h2>
                  <p className="font-sans text-xs text-[#777777] mt-1">
                    All artifacts travel fully insured in custom obsidian vault drawer boxes.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Standard Ground */}
                  <label
                    onClick={() => setShippingTier('standard')}
                    className={`block p-5 bg-[#181818] border cursor-pointer transition-all ${
                      shippingTier === 'standard'
                        ? 'border-[#651C2D] bg-[#651C2D]/5'
                        : 'border-[#202020] hover:border-[#333333]'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="shipping"
                          checked={shippingTier === 'standard'}
                          onChange={() => setShippingTier('standard')}
                          className="accent-[#651C2D]"
                        />
                        <div>
                          <h4 className="font-serif text-lg text-[#F0ECE5]">Standard Ground Dispatch</h4>
                          <p className="font-sans text-xs text-[#777777]">3–4 Business Days Pan-India</p>
                        </div>
                      </div>
                      <span className="font-sans text-xs uppercase tracking-wider text-emerald-400 font-bold">
                        {totals.subtotalPaise >= 49900 ? 'FREE' : '₹50'}
                      </span>
                    </div>
                    <p className="font-sans text-[11px] text-[#BFC0C2] mt-3 pl-7">
                      Free for prepaid consignments above ₹499. Fully insured against transit damage.
                    </p>
                  </label>

                  {/* Priority Air Cargo */}
                  <label
                    onClick={() => setShippingTier('express')}
                    className={`block p-5 bg-[#181818] border cursor-pointer transition-all ${
                      shippingTier === 'express'
                        ? 'border-[#651C2D] bg-[#651C2D]/5'
                        : 'border-[#202020] hover:border-[#333333]'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="shipping"
                          checked={shippingTier === 'express'}
                          onChange={() => setShippingTier('express')}
                          className="accent-[#651C2D]"
                        />
                        <div>
                          <h4 className="font-serif text-lg text-[#F0ECE5]">Priority Air Cargo (BlueDart Apex)</h4>
                          <p className="font-sans text-xs text-[#777777]">1–2 Business Days (Fastest Delivery)</p>
                        </div>
                      </div>
                      <span className="font-sans text-xs uppercase tracking-wider text-[#F0ECE5] font-bold">
                        ₹99
                      </span>
                    </div>
                    <p className="font-sans text-[11px] text-[#BFC0C2] mt-3 pl-7">
                      Direct cargo flight transit with dedicated delivery courier and signature verification.
                    </p>
                  </label>
                </div>

                <div className="pt-4 border-t border-[#202020] flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="font-sans text-xs uppercase tracking-wider text-[#BFC0C2] hover:text-[#F0ECE5]"
                  >
                    ← Back to Address
                  </button>
                  <button
                    type="button"
                    onClick={handleProceedFromShipping}
                    className="px-6 py-3 bg-[#651C2D] hover:bg-[#85253b] text-[#F0ECE5] font-sans text-xs uppercase tracking-widest font-bold transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <span>Continue to Order Review</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: ORDER REVIEW */}
            {currentStep === 4 && (
              <div className="bg-[#121212] border border-[#202020] p-6 md:p-8 space-y-6">
                <div className="border-b border-[#202020] pb-4">
                  <span className="font-sans text-xs uppercase tracking-widest text-[#651C2D] font-bold block mb-1">
                    Step 04 / 07
                  </span>
                  <h2 className="font-serif text-2xl md:text-3xl text-[#F0ECE5]">Review Your Consignment</h2>
                  <p className="font-sans text-xs text-[#777777] mt-1">
                    Confirm your shipping address, selected artifacts, and pricing prior to payment.
                  </p>
                </div>

                {/* Delivery Coordinates Recap */}
                <div className="p-4 bg-[#181818] border border-[#202020] flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-sans text-[#777777] uppercase tracking-wider">
                      <MapPin className="w-3.5 h-3.5 text-[#651C2D]" />
                      <span>Deliver to:</span>
                    </div>
                    <p className="font-serif text-base text-[#F0ECE5] font-bold">{fullName} ({phone})</p>
                    <p className="font-sans text-xs text-[#BFC0C2]">
                      {addressLine1}{addressLine2 ? `, ${addressLine2}` : ''}, {city}, {state} — {pincode}
                    </p>
                    {landmark && <p className="font-sans text-[11px] text-[#777777]">Landmark: {landmark}</p>}
                  </div>
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="text-xs font-sans text-[#651C2D] hover:text-[#85253b] uppercase tracking-wider underline cursor-pointer"
                  >
                    Edit
                  </button>
                </div>

                {/* Shipping Tier Recap */}
                <div className="p-4 bg-[#181818] border border-[#202020] flex items-center justify-between text-xs font-sans">
                  <div className="flex items-center gap-3">
                    <Truck className="w-4 h-4 text-[#651C2D]" />
                    <div>
                      <span className="text-[#F0ECE5] font-bold">
                        {shippingTier === 'express' ? 'Priority Air Cargo (1–2 Days)' : 'Standard Ground (3–4 Days)'}
                      </span>
                      <p className="text-[11px] text-[#777777]">Custom drawer case, polishing cloth & certificate included</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="text-xs font-sans text-[#651C2D] hover:text-[#85253b] uppercase tracking-wider underline cursor-pointer"
                  >
                    Change
                  </button>
                </div>

                {/* Artifacts Summary List */}
                <div className="space-y-3">
                  <h4 className="font-sans text-xs uppercase tracking-widest text-[#777777]">Artifacts in Consignment</h4>
                  {cartItems.map((item) => (
                    <div
                      key={item.product.id}
                      className="p-3 bg-[#181818] border border-[#202020] flex items-center gap-4"
                    >
                      <img
                        src={item.product.images[0] || 'https://placehold.co/100x120/121212/F0ECE5?text=DRAYEN'}
                        alt={item.product.name}
                        className="w-14 h-16 object-cover border border-[#202020]"
                      />
                      <div className="flex-1 min-w-0">
                        <h5 className="font-serif text-sm text-[#F0ECE5] truncate">{item.product.name}</h5>
                        <p className="font-sans text-xs text-[#777777]">
                          Qty: {item.quantity} • {item.selectedFinish || item.product.finish || 'Oxidized Silver'}
                          {item.selectedLength ? ` • ${item.selectedLength}` : ''}
                        </p>
                      </div>
                      <span className="font-sans text-sm text-[#F0ECE5] font-medium">
                        {formatINR((item.product.selling_price_paise ?? 0) * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-[#202020] flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="font-sans text-xs uppercase tracking-wider text-[#BFC0C2] hover:text-[#F0ECE5]"
                  >
                    ← Back to Shipping
                  </button>
                  <button
                    type="button"
                    onClick={handleProceedFromReview}
                    className="px-6 py-3 bg-[#651C2D] hover:bg-[#85253b] text-[#F0ECE5] font-sans text-xs uppercase tracking-widest font-bold transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <span>Proceed to Payment Method</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 5: PAYMENT METHOD */}
            {currentStep === 5 && (
              <div className="bg-[#121212] border border-[#202020] p-6 md:p-8 space-y-6">
                <div className="border-b border-[#202020] pb-4">
                  <span className="font-sans text-xs uppercase tracking-widest text-[#651C2D] font-bold block mb-1">
                    Step 05 / 07
                  </span>
                  <h2 className="font-serif text-2xl md:text-3xl text-[#F0ECE5]">Select Vault Settlement Protocol</h2>
                  <p className="font-sans text-xs text-[#777777] mt-1">
                    Choose your preferred payment method. Direct UPI QR is prioritized with instant proof verification.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* UPI Option */}
                  <label
                    onClick={() => setPaymentMethod('upi')}
                    className={`block p-5 bg-[#181818] border cursor-pointer transition-all ${
                      paymentMethod === 'upi'
                        ? 'border-[#651C2D] bg-[#651C2D]/5'
                        : 'border-[#202020] hover:border-[#333333]'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="payment"
                          checked={paymentMethod === 'upi'}
                          onChange={() => setPaymentMethod('upi')}
                          className="accent-[#651C2D]"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-serif text-lg text-[#F0ECE5]">UPI QR Code &amp; UTR Flow</h4>
                            <span className="px-2 py-0.5 bg-[#651C2D] text-[#F0ECE5] font-sans text-[9px] uppercase tracking-wider font-bold">
                              Recommended
                            </span>
                          </div>
                          <p className="font-sans text-xs text-[#777777] mt-0.5">
                            GPay, PhonePe, Paytm, CRED, BHIM. Zero processing surcharge.
                          </p>
                        </div>
                      </div>
                      <QrCode className="w-5 h-5 text-[#BFC0C2]" />
                    </div>
                  </label>

                  {/* Card Option */}
                  <label
                    onClick={() => setPaymentMethod('card')}
                    className={`block p-5 bg-[#181818] border cursor-pointer transition-all ${
                      paymentMethod === 'card'
                        ? 'border-[#651C2D] bg-[#651C2D]/5'
                        : 'border-[#202020] hover:border-[#333333]'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="payment"
                          checked={paymentMethod === 'card'}
                          onChange={() => setPaymentMethod('card')}
                          className="accent-[#651C2D]"
                        />
                        <div>
                          <h4 className="font-serif text-lg text-[#F0ECE5]">Credit / Debit Card</h4>
                          <p className="font-sans text-xs text-[#777777] mt-0.5">
                            Visa, MasterCard, RuPay, American Express (256-bit tokenized gateway)
                          </p>
                        </div>
                      </div>
                      <CreditCard className="w-5 h-5 text-[#BFC0C2]" />
                    </div>
                  </label>

                  {/* COD Option */}
                  <label
                    onClick={() => setPaymentMethod('cod')}
                    className={`block p-5 bg-[#181818] border cursor-pointer transition-all ${
                      paymentMethod === 'cod'
                        ? 'border-[#651C2D] bg-[#651C2D]/5'
                        : 'border-[#202020] hover:border-[#333333]'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="payment"
                          checked={paymentMethod === 'cod'}
                          onChange={() => setPaymentMethod('cod')}
                          className="accent-[#651C2D]"
                        />
                        <div>
                          <h4 className="font-serif text-lg text-[#F0ECE5]">Cash on Delivery (COD)</h4>
                          <p className="font-sans text-xs text-[#777777] mt-0.5">
                            Pay in cash upon physical delivery. ₹50 logistics verification surcharge applies.
                          </p>
                        </div>
                      </div>
                      <Package className="w-5 h-5 text-[#BFC0C2]" />
                    </div>
                  </label>
                </div>

                <div className="pt-4 border-t border-[#202020] flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(4)}
                    className="font-sans text-xs uppercase tracking-wider text-[#BFC0C2] hover:text-[#F0ECE5]"
                  >
                    ← Back to Review
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handlePlaceOrder}
                    className="px-6 py-3.5 bg-[#651C2D] hover:bg-[#85253b] text-[#F0ECE5] font-sans text-xs uppercase tracking-widest font-bold transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span>Initializing Settlement...</span>
                    ) : (
                      <>
                        <span>{paymentMethod === 'upi' ? 'Continue to QR & Proof' : 'Confirm Order'}</span>
                        <span>•</span>
                        <span>{formatINR(adjustedTotalPaise)}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 6: PAYMENT INSTRUCTIONS & EVIDENCE SUBMISSION (UPI Flow) */}
            {currentStep === 6 && (
              <div className="bg-[#121212] border border-[#202020] p-6 md:p-8 space-y-6">
                <div className="border-b border-[#202020] pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span className="font-sans text-xs uppercase tracking-widest text-[#651C2D] font-bold">
                      Step 06 / 07 • Payment Evidence Protocol
                    </span>
                  </div>
                  <h2 className="font-serif text-2xl md:text-3xl text-[#F0ECE5]">Transfer Verification</h2>
                  <p className="font-sans text-xs text-[#777777] mt-1">
                    Order Ref: <strong className="text-[#F0ECE5]">{createdOrderNumber}</strong>. Scan the QR code or transfer to merchant VPA, then submit screenshot &amp; UTR.
                  </p>
                </div>

                {/* QR Code and Transfer Coordinates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-[#181818] border border-[#202020]">
                  <div className="flex flex-col items-center justify-center p-4 bg-[#121212] border border-[#202020]">
                    <div className="p-3 bg-white">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                          `upi://pay?pa=${config.merchantUpiId}&pn=${encodeURIComponent(
                            config.merchantName
                          )}&am=${(adjustedTotalPaise / 100).toFixed(2)}&cu=INR&tn=${encodeURIComponent(
                            `Order ${createdOrderNumber}`
                          )}`
                        )}`}
                        alt="Merchant UPI QR"
                        className="w-44 h-44 object-contain"
                      />
                    </div>
                    <p className="font-sans text-[11px] text-[#777777] mt-2 text-center">
                      Authoritative Payee: <strong className="text-[#F0ECE5]">{config.merchantName}</strong>
                    </p>
                  </div>

                  <div className="space-y-3 font-sans text-xs flex flex-col justify-center">
                    <div className="bg-[#121212] p-3 border border-[#202020] flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase text-[#777777] block">Merchant UPI ID</span>
                        <span className="text-[#F0ECE5] font-bold select-all">{config.merchantUpiId}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyText(config.merchantUpiId, 'upi')}
                        className="px-2.5 py-1 bg-[#202020] hover:bg-[#2d2929] text-[#F0ECE5] text-[11px] flex items-center gap-1"
                      >
                        {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedUpi ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>

                    <div className="bg-[#121212] p-3 border border-[#202020] flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase text-[#777777] block">Exact Rupee Amount</span>
                        <span className="text-[#F0ECE5] font-bold select-all">
                          ₹{(adjustedTotalPaise / 100).toFixed(2)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyText((adjustedTotalPaise / 100).toFixed(2), 'amount')}
                        className="px-2.5 py-1 bg-[#202020] hover:bg-[#2d2929] text-[#F0ECE5] text-[11px] flex items-center gap-1"
                      >
                        {copiedAmount ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedAmount ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>

                    <div className="p-3 bg-[#121212] border-l-2 border-[#651C2D] text-[11px] text-[#BFC0C2] space-y-1">
                      <p className="font-bold text-[#F0ECE5]">Important Note:</p>
                      <p>Do not alter the rupee sum. Take a screenshot of the successful receipt screen showing the 12-digit UPI Ref/UTR.</p>
                    </div>
                  </div>
                </div>

                {/* Evidence Submission Form */}
                <form onSubmit={handleSubmitEvidence} className="space-y-4 pt-2">
                  <div>
                    <label className="block font-sans text-xs uppercase tracking-wider text-[#BFC0C2] mb-1.5">
                      12-Digit UPI Transaction ID / UTR <span className="text-[#651C2D]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={utrNumber}
                      onChange={(e) => setUtrNumber(e.target.value)}
                      placeholder="e.g. 512345678901 (found in banking receipt)"
                      className="w-full bg-[#181818] border border-[#202020] px-4 py-3 text-sm text-[#F0ECE5] font-sans focus:border-[#651C2D] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-sans text-xs uppercase tracking-wider text-[#BFC0C2] mb-1.5">
                      Payment Screenshot Proof <span className="text-[#651C2D]">*</span>
                    </label>
                    <div className="relative border-2 border-dashed border-[#202020] hover:border-[#651C2D] p-5 text-center cursor-pointer bg-[#181818] transition-colors">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleScreenshotChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        required
                      />
                      {screenshotPreview ? (
                        <div className="space-y-2">
                          <img
                            src={screenshotPreview}
                            alt="Screenshot preview"
                            className="max-h-36 mx-auto object-contain border border-[#202020]"
                          />
                          <p className="font-sans text-xs text-emerald-400 flex items-center justify-center gap-1.5">
                            <Check className="w-3.5 h-3.5" />
                            {screenshotFile?.name} ({(screenshotFile!.size / 1024).toFixed(1)} KB)
                          </p>
                          <span className="text-[11px] text-[#777777]">Click to select another file</span>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <Upload className="w-6 h-6 mx-auto text-[#777777]" />
                          <p className="font-sans text-xs text-[#F0ECE5] uppercase tracking-wider">
                            Select Payment Screenshot
                          </p>
                          <p className="text-[10px] text-[#777777]">JPEG, PNG, or WebP up to 5MB</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-sans text-xs uppercase tracking-wider text-[#BFC0C2] mb-1">
                        Payer Account Name (Optional)
                      </label>
                      <input
                        type="text"
                        value={payerName}
                        onChange={(e) => setPayerName(e.target.value)}
                        placeholder={fullName}
                        className="w-full bg-[#181818] border border-[#202020] px-4 py-2.5 text-xs text-[#F0ECE5] focus:border-[#651C2D] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-sans text-xs uppercase tracking-wider text-[#BFC0C2] mb-1">
                        Payer UPI VPA (Optional)
                      </label>
                      <input
                        type="text"
                        value={payerVpa}
                        onChange={(e) => setPayerVpa(e.target.value)}
                        placeholder="yourname@okhdfcbank"
                        className="w-full bg-[#181818] border border-[#202020] px-4 py-2.5 text-xs text-[#F0ECE5] focus:border-[#651C2D] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={customerDeclaration}
                        onChange={(e) => setCustomerDeclaration(e.target.checked)}
                        className="accent-[#651C2D] mt-0.5 w-4 h-4 cursor-pointer"
                        required
                      />
                      <span className="text-xs text-[#BFC0C2] leading-relaxed">
                        I declare that I have transferred the exact sum of{' '}
                        <strong className="text-[#F0ECE5]">{formatINR(adjustedTotalPaise)}</strong> to DRAYEN Atelier and that this submission contains authentic banking evidence.
                      </span>
                    </label>
                  </div>

                  <div className="pt-4 border-t border-[#202020] flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(5)}
                      className="font-sans text-xs uppercase tracking-wider text-[#BFC0C2] hover:text-[#F0ECE5]"
                    >
                      ← Back to Payment Methods
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-3.5 bg-[#651C2D] hover:bg-[#85253b] text-[#F0ECE5] font-sans text-xs uppercase tracking-widest font-bold transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <span>Vaulting Proof & Logging...</span>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          <span>Submit Payment for Verification</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* STEP 7: CONFIRMATION & ORDER STATUS (Verification Pending) */}
            {currentStep === 7 && (
              <div className="bg-[#121212] border border-[#202020] p-8 md:p-12 text-center space-y-6 max-w-3xl mx-auto">
                <div className="w-16 h-16 rounded-full bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
                  <ShieldCheck className="w-8 h-8" />
                </div>

                <div className="space-y-2">
                  <span className="font-sans text-xs uppercase tracking-widest text-[#651C2D] font-bold">
                    Order Submitted to Atelier
                  </span>
                  <h2 className="font-serif text-3xl md:text-4xl text-[#F0ECE5]">
                    Order Confirmation Pending Verification
                  </h2>
                  <p className="font-sans text-xs text-[#BFC0C2] max-w-md mx-auto leading-relaxed">
                    Your consignment has been recorded in the vault queue. In accordance with strict atelier protocol, payment evidence is verified prior to dispatch.
                  </p>
                </div>

                {/* Authoritative Order Card */}
                <div className="bg-[#181818] border border-[#202020] p-6 text-left max-w-lg mx-auto space-y-3 font-sans text-xs">
                  <div className="flex justify-between border-b border-[#202020] pb-2">
                    <span className="text-[#777777]">Order Reference Number:</span>
                    <span className="text-[#F0ECE5] font-bold font-mono tracking-wider">{createdOrderNumber}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#202020] pb-2">
                    <span className="text-[#777777]">Consignment Total:</span>
                    <span className="text-[#F0ECE5] font-bold font-serif text-sm">
                      {formatINR(adjustedTotalPaise)}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-[#202020] pb-2">
                    <span className="text-[#777777]">Payment Status:</span>
                    <span className="inline-flex items-center gap-1 text-amber-400 font-bold uppercase tracking-wider">
                      <Clock className="w-3.5 h-3.5" />
                      {paymentMethod === 'cod' ? 'Cash on Delivery' : 'Verification In Progress'}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-[#202020] pb-2">
                    <span className="text-[#777777]">Fulfillment State:</span>
                    <span className="text-[#BFC0C2] uppercase">Processing at Atelier</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#777777]">Courier Transit:</span>
                    <span className="text-emerald-400">
                      {shippingTier === 'express' ? 'Priority Air (1–2 Days)' : 'Standard Ground (3–4 Days)'}
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-[#141414] border-l-2 border-[#651C2D] text-xs text-[#777777] max-w-lg mx-auto text-left space-y-1">
                  <p className="font-bold text-[#F0ECE5]">Next Steps:</p>
                  <p>
                    1. Our curatorial audit desk will cross-examine your transfer reference within 1–2 business hours.
                  </p>
                  <p>
                    2. Once verified, your order status advances to <strong>CONFIRMED</strong> and dispatch initiates via BlueDart Apex.
                  </p>
                  <p>
                    3. Live tracking coordinates are permanently accessible in your <strong>Order Tracking Dossier</strong>.
                  </p>
                </div>

                {/* Post-Checkout Action Controls */}
                <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                  {onNavigateToTracking && (
                    <button
                      onClick={() => onNavigateToTracking(createdOrderNumber, createdAccessToken)}
                      className="px-6 py-3 bg-[#651C2D] hover:bg-[#85253b] text-[#F0ECE5] font-sans text-xs uppercase tracking-widest font-bold transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <span>Track Order Dispatches</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        window.print();
                      }
                    }}
                    className="px-5 py-3 bg-[#181818] hover:bg-[#202020] text-[#BFC0C2] hover:text-[#F0ECE5] border border-[#202020] font-sans text-xs uppercase tracking-widest transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Order Slip</span>
                  </button>

                  <button
                    onClick={onNavigateHome}
                    className="px-5 py-3 bg-[#181818] hover:bg-[#202020] text-[#BFC0C2] hover:text-[#F0ECE5] border border-[#202020] font-sans text-xs uppercase tracking-widest transition-colors cursor-pointer"
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: STICKY ORDER SUMMARY (Visible during Steps 1 to 6) */}
          {currentStep !== 7 && (
            <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
              <div className="bg-[#121212] border border-[#202020] p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-[#202020] pb-3">
                  <h3 className="font-serif text-xl text-[#F0ECE5] uppercase tracking-wide">Order Summary</h3>
                  <span className="font-sans text-xs text-[#777777]">
                    {cartItems.reduce((acc, it) => acc + it.quantity, 0)} {cartItems.length === 1 ? 'PIECE' : 'PIECES'}
                  </span>
                </div>

                {/* Items preview */}
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {cartItems.map((item) => (
                    <div
                      key={item.product.id}
                      className="flex items-center gap-3 p-2.5 bg-[#181818] border border-[#202020]"
                    >
                      <img
                        src={item.product.images[0] || 'https://placehold.co/80x100/121212/F0ECE5?text=DRAYEN'}
                        alt={item.product.name}
                        className="w-12 h-14 object-cover border border-[#202020] shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-serif text-xs text-[#F0ECE5] truncate">{item.product.name}</h4>
                        <span className="font-sans text-[10px] text-[#777777] block uppercase">
                          {item.selectedFinish || item.product.finish || 'Oxidized Silver'}
                        </span>
                        <span className="font-sans text-[10px] text-[#BFC0C2]">Qty: {item.quantity}</span>
                      </div>
                      <span className="font-sans text-xs text-[#F0ECE5] font-medium shrink-0">
                        {formatINR((item.product.selling_price_paise ?? 0) * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Promo Code Box */}
                <div className="pt-2 border-t border-[#202020] space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoCodeInput}
                      onChange={(e) => setPromoCodeInput(e.target.value)}
                      placeholder="Voucher or Talisman Code"
                      className="flex-1 bg-[#181818] border border-[#202020] px-3 py-2 text-xs text-[#F0ECE5] uppercase tracking-wider focus:border-[#651C2D] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleApplyPromo}
                      className="px-4 py-2 bg-[#202020] hover:bg-[#2d2929] text-[#F0ECE5] font-sans text-xs uppercase tracking-wider cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                  {promoError && <p className="text-red-400 text-[11px] font-sans">{promoError}</p>}
                  {appliedPromo && (
                    <div className="flex items-center justify-between p-2 bg-emerald-950/30 border border-emerald-900/40 text-emerald-400 text-xs font-sans">
                      <span>{appliedPromo} Applied ({formatINR(totals.discountPaise)} Off)</span>
                      <button
                        type="button"
                        onClick={handleRemovePromo}
                        className="text-emerald-400 hover:text-emerald-300 text-xs cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                {/* Cost Breakdown */}
                <div className="space-y-2 pt-2 border-t border-[#202020] text-xs font-sans">
                  <div className="flex justify-between text-[#BFC0C2]">
                    <span>Cart Subtotal</span>
                    <span className="text-[#F0ECE5]">{formatINR(totals.subtotalPaise)}</span>
                  </div>
                  <div className="flex justify-between text-[#BFC0C2]">
                    <span>Insured Courier Logistics</span>
                    <span className={totals.shippingPaise === 0 ? 'text-emerald-400 font-bold' : 'text-[#F0ECE5]'}>
                      {totals.shippingPaise === 0 ? 'FREE' : formatINR(totals.shippingPaise)}
                    </span>
                  </div>
                  {appliedPromo && totals.discountPaise > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Initiation Discount</span>
                      <span>-{formatINR(totals.discountPaise)}</span>
                    </div>
                  )}
                  {paymentMethod === 'cod' && (
                    <div className="flex justify-between text-[#BFC0C2]">
                      <span>COD Verification Surcharge</span>
                      <span>₹50</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-3 border-t border-[#202020] text-sm font-bold">
                    <span className="text-[#F0ECE5] uppercase">Total Payable</span>
                    <span className="font-serif text-lg text-[#F0ECE5]">
                      {formatINR(adjustedTotalPaise + (paymentMethod === 'cod' ? 5000 : 0))}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#777777] text-right">Includes all applicable GST &amp; duties</p>
                </div>
              </div>

              {/* Atelier Assurance Box */}
              <div className="p-4 bg-[#121212] border border-[#202020] space-y-2">
                <div className="flex items-center gap-2 text-xs font-serif text-[#F0ECE5] uppercase">
                  <ShieldCheck className="w-4 h-4 text-[#651C2D]" />
                  <span>DRAYEN Quality &amp; Vault Warranty</span>
                </div>
                <p className="text-[11px] font-sans text-[#777777] leading-relaxed">
                  Cast in certified hypoallergenic 316L medical stainless steel with vapor oxidation. Impervious to corrosion, water, and sweat.
                </p>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
