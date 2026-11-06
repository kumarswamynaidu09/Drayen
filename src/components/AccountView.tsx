import React, { useState, useEffect } from 'react';
import { Customer, Address, Product, CartItem, UserProfile } from '../types';
import { authService, AuthResult, OtpRequestResult } from '../services/auth';
import { profileService } from '../services/profile';
import { addressService } from '../services/addresses';
import { wishlistService } from '../services/wishlist';
import { formatINR } from '../lib/money';
import {
  User,
  MapPin,
  Package,
  Heart,
  LogOut,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Edit2,
  Shield,
  Key,
  Smartphone,
  ExternalLink,
  ChevronRight,
  Clock,
  Check,
  Search,
  ShoppingBag,
} from 'lucide-react';

interface AccountViewProps {
  initialTab?: 'overview' | 'login' | 'register' | 'forgot-password' | 'profile' | 'addresses' | 'orders' | 'wishlist' | 'security';
  onNavigate: (route: string, param?: string) => void;
  onOpenWishlist?: () => void;
  products?: Product[];
  wishlistIds?: string[];
  onToggleWishlist?: (productId: string) => void;
  onAddToCart?: (product: Product, quantity: number, finish?: string, length?: string) => void;
}

export const AccountView: React.FC<AccountViewProps> = ({
  initialTab = 'overview',
  onNavigate,
  products = [],
  wishlistIds = [],
  onToggleWishlist,
  onAddToCart,
}) => {
  const [currentUser, setCurrentUser] = useState<Customer | null>(() => authService.getCurrentUser());
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  // Sync initialTab when props change (e.g. route transitions)
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Auth Form State
  const [loginMode, setLoginMode] = useState<'password' | 'otp'>('password');
  const [loginEmailOrPhone, setLoginEmailOrPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // OTP State
  const [otpPhone, setOtpPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpCountdown, setOtpCountdown] = useState(0);

  // Register Form State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regConsent, setRegConsent] = useState(false);

  // Forgot Password State
  const [resetIdentifier, setResetIdentifier] = useState('');

  // Status & Feedback
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'error' | 'success' | 'info'; text: string } | null>(null);

  // Profile Edit State
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileName, setProfileName] = useState('');
  const [profileDisplayName, setProfileDisplayName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileDob, setProfileDob] = useState('');
  const [profileGender, setProfileGender] = useState('unspecified');
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);

  // Addresses State
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState<Address>({
    fullName: '',
    phone: '',
    pincode: '',
    addressLine1: '',
    addressLine2: '',
    landmark: '',
    city: '',
    state: '',
    addressType: 'home',
    isDefault: false,
  });

  // Orders Filter State
  const [orderFilter, setOrderFilter] = useState<'all' | 'awaiting' | 'transit' | 'delivered'>('all');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');

  // Security Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);

  // Load profile and addresses on mount or user change
  useEffect(() => {
    async function loadData() {
      const user = authService.getCurrentUser();
      setCurrentUser(user);
      if (user) {
        setProfileName(`${user.firstName} ${user.lastName || ''}`.trim());
        setProfileEmail(user.email);
        setProfilePhone(user.phone);
      }
      try {
        const { profile: fetchedProfile } = await profileService.getProfile();
        if (fetchedProfile) {
          setProfile(fetchedProfile);
          setProfileName(fetchedProfile.fullName);
          setProfileEmail(fetchedProfile.email);
          setProfilePhone(fetchedProfile.phone);
          if (fetchedProfile.displayName) setProfileDisplayName(fetchedProfile.displayName);
          if (fetchedProfile.dateOfBirth) setProfileDob(fetchedProfile.dateOfBirth);
        }
      } catch (e) {
        console.warn('Profile fetch note:', e);
      }

      try {
        const { addresses: fetchedAddresses } = await addressService.getAddresses();
        setAddresses(fetchedAddresses || []);
      } catch (e) {
        console.warn('Address fetch note:', e);
      }
    }
    loadData();
  }, [activeTab]);

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (otpCountdown > 0) {
      timer = setTimeout(() => setOtpCountdown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [otpCountdown]);

  // Helper PIN Code auto-fill for Indian pin codes
  const handlePincodeChange = (pin: string) => {
    const cleanPin = pin.replace(/\D/g, '').slice(0, 6);
    setAddressForm((prev) => ({ ...prev, pincode: cleanPin }));

    if (cleanPin.length === 6) {
      const prefix = cleanPin.slice(0, 2);
      let city = '';
      let state = '';

      if (['11'].includes(prefix)) {
        city = 'New Delhi';
        state = 'Delhi';
      } else if (['12', '13'].includes(prefix)) {
        city = 'Gurugram';
        state = 'Haryana';
      } else if (['20', '21', '22', '24', '25', '26', '27', '28'].includes(prefix)) {
        city = 'Noida';
        state = 'Uttar Pradesh';
      } else if (['40', '41', '42', '43', '44'].includes(prefix)) {
        city = 'Mumbai';
        state = 'Maharashtra';
      } else if (['56', '57', '58', '59'].includes(prefix)) {
        city = 'Bengaluru';
        state = 'Karnataka';
      } else if (['50', '51', '52', '53'].includes(prefix)) {
        city = 'Hyderabad';
        state = 'Telangana';
      } else if (['60', '61', '62', '63', '64'].includes(prefix)) {
        city = 'Chennai';
        state = 'Tamil Nadu';
      } else if (['70', '71', '72', '73', '74'].includes(prefix)) {
        city = 'Kolkata';
        state = 'West Bengal';
      }

      if (city && state && !addressForm.city) {
        setAddressForm((prev) => ({ ...prev, city, state }));
      }
    }
  };

  // Sign In Submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFeedbackMessage(null);
    try {
      if (loginMode === 'password') {
        const res = await authService.signIn({
          email: loginEmailOrPhone.includes('@') ? loginEmailOrPhone : undefined,
          phone: !loginEmailOrPhone.includes('@') ? loginEmailOrPhone : undefined,
          password: loginPassword,
          rememberMe,
        });
        if (res.success && res.user) {
          setCurrentUser(res.user);
          setActiveTab('overview');
        } else {
          setFeedbackMessage({
            type: 'error',
            text: res.error || 'Authentication rejected by security provider.',
          });
        }
      } else {
        // OTP login verification
        const res = await authService.verifyOtp(otpPhone, otpCode);
        if (res.success && res.user) {
          setCurrentUser(res.user);
          setActiveTab('overview');
        } else {
          setFeedbackMessage({
            type: 'error',
            text: res.error || 'Invalid OTP code. Please retry or connect backend.',
          });
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Send OTP
  const handleSendOtp = async () => {
    if (!otpPhone || otpPhone.length < 10) {
      setFeedbackMessage({ type: 'error', text: 'Please enter a valid 10-digit mobile number.' });
      return;
    }
    setIsLoading(true);
    setFeedbackMessage(null);
    try {
      const res = await authService.requestOtp(otpPhone);
      if (res.success) {
        setOtpSent(true);
        setOtpCountdown(30);
        setFeedbackMessage({ type: 'info', text: 'OTP dispatched to registered mobile number.' });
      } else {
        setFeedbackMessage({ type: 'error', text: res.error || 'OTP dispatch failed.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Register Submission
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regConsent) {
      setFeedbackMessage({ type: 'error', text: 'Please agree to DRAYEN Terms of Patronage to proceed.' });
      return;
    }
    setIsLoading(true);
    setFeedbackMessage(null);
    try {
      const res = await authService.signUp({
        fullName: regName,
        email: regEmail,
        phone: regPhone,
        password: regPassword,
        consentAgreed: regConsent,
      });
      if (res.success && res.user) {
        setCurrentUser(res.user);
        setActiveTab('overview');
      } else {
        setFeedbackMessage({
          type: 'error',
          text: res.error || 'Registration rejected by identity system.',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot Password Submission
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFeedbackMessage(null);
    try {
      const res = await authService.requestPasswordReset(resetIdentifier);
      if (res.success) {
        setFeedbackMessage({
          type: 'success',
          text: 'Recovery transmission initialized. Follow instructions sent to your inbox.',
        });
      } else {
        setFeedbackMessage({
          type: 'error',
          text: res.error || 'Password recovery requires backend service integration.',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Profile Update Submission
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setProfileSaveSuccess(false);
    setFeedbackMessage(null);
    try {
      const res = await profileService.updateProfile({
        fullName: profileName,
        displayName: profileDisplayName,
        dateOfBirth: profileDob,
      });
      if (res.success) {
        setProfileSaveSuccess(true);
        setFeedbackMessage({ type: 'success', text: 'Patron profile updated successfully.' });
      } else {
        setFeedbackMessage({
          type: 'error',
          text: res.error || 'Profile update is pending backend database connection.',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Address Save Submission
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFeedbackMessage(null);
    try {
      if (editingAddressId) {
        const res = await addressService.updateAddress(editingAddressId, addressForm);
        if (res.success) {
          setIsAddressModalOpen(false);
          setEditingAddressId(null);
          const { addresses: updated } = await addressService.getAddresses();
          setAddresses(updated);
        } else {
          setFeedbackMessage({ type: 'error', text: res.error || 'Address update failed.' });
        }
      } else {
        const res = await addressService.createAddress(addressForm);
        if (res.success) {
          setIsAddressModalOpen(false);
          const { addresses: updated } = await addressService.getAddresses();
          setAddresses(updated);
        } else {
          setFeedbackMessage({ type: 'error', text: res.error || 'Saving address requires backend connection.' });
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    setIsLoading(true);
    try {
      const res = await addressService.deleteAddress(id);
      if (res.success) {
        setAddresses((prev) => prev.filter((a) => a.id !== id));
        setDeleteConfirmId(null);
      } else {
        setFeedbackMessage({ type: 'error', text: res.error || 'Address deletion requires backend connection.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await authService.signOut();
    setCurrentUser(null);
    setActiveTab('login');
    onNavigate('/login');
  };

  // Password Strength validation
  const getPasswordStrength = (pass: string) => {
    const checks = {
      length: pass.length >= 8,
      upper: /[A-Z]/.test(pass),
      lower: /[a-z]/.test(pass),
      number: /[0-9]/.test(pass),
      symbol: /[^A-Za-z0-9]/.test(pass),
    };
    const passedCount = Object.values(checks).filter(Boolean).length;
    return { checks, passedCount };
  };

  const { checks: passChecks } = getPasswordStrength(regPassword);

  // Wishlist products
  const savedPieces = products.filter((p) => wishlistIds.includes(p.id));

  return (
    <div className="min-h-screen bg-[#080808] text-[#F0ECE5] pb-24 pt-6">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8">
        
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#777777] mb-8">
          <button onClick={() => onNavigate('/')} className="hover:text-[#F0ECE5] transition-colors">
            Home
          </button>
          <span>/</span>
          <button onClick={() => onNavigate('/account')} className="hover:text-[#F0ECE5] transition-colors">
            Customer Account
          </button>
          <span>/</span>
          <span className="text-[#F0ECE5] capitalize">{activeTab}</span>
        </div>

        {/* =========================================================================
            AUTH PAGES: LOGIN, REGISTER, FORGOT-PASSWORD
            ========================================================================= */}
        {activeTab === 'login' && (
          <div className="max-w-md mx-auto bg-[#121212] border border-[#202020] p-6 sm:p-10 shadow-2xl">
            {/* Header */}
            <div className="text-center mb-8">
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#651C2D] font-bold block mb-2">
                ATELIER AUTHENTICATION
              </span>
              <h1 className="font-serif text-3xl sm:text-4xl text-[#F0ECE5] tracking-wide uppercase">
                YOUR WORLD. YOUR RULES.
              </h1>
              <p className="font-sans text-xs text-[#777777] mt-3 leading-relaxed">
                Sign in to your DRAYEN account to manage your orders, save your favourites and discover your next statement piece.
              </p>
            </div>

            {/* Feedback Alert */}
            {feedbackMessage && (
              <div
                className={`p-3 mb-6 text-xs font-sans border ${
                  feedbackMessage.type === 'error'
                    ? 'bg-[#651C2D]/15 border-[#651C2D] text-red-200'
                    : 'bg-emerald-950/20 border-emerald-800 text-emerald-200'
                }`}
              >
                {feedbackMessage.text}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block font-mono text-xs uppercase tracking-wider text-[#BFC0C2] mb-1.5">
                  Email Address or Mobile Number
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#777777]" />
                  <input
                    type="text"
                    required
                    value={loginEmailOrPhone}
                    onChange={(e) => setLoginEmailOrPhone(e.target.value)}
                    placeholder="patron@drayen.in or 9840012345"
                    className="w-full bg-[#080808] border border-[#202020] pl-10 pr-4 py-3 text-sm text-[#F0ECE5] placeholder-[#777777] focus:border-[#651C2D] focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-mono text-xs uppercase tracking-wider text-[#BFC0C2]">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('forgot');
                      onNavigate('/forgot-password');
                    }}
                    className="text-xs font-sans text-[#777777] hover:text-[#BFC0C2] transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#777777]" />
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-[#080808] border border-[#202020] pl-10 pr-10 py-3 text-sm text-[#F0ECE5] placeholder-[#777777] focus:border-[#651C2D] focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#777777] hover:text-[#F0ECE5]"
                    aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="accent-[#651C2D] w-4 h-4 bg-[#080808] border-[#202020]"
                />
                <label htmlFor="rememberMe" className="text-xs text-[#777777] select-none cursor-pointer">
                  Remember my credentials on this device
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-[#651C2D] hover:bg-[#7e2338] text-[#F0ECE5] font-sans text-xs uppercase tracking-widest font-bold transition-colors disabled:opacity-50 mt-2"
              >
                {isLoading ? 'Verifying Credentials...' : 'Sign In'}
              </button>
            </form>

            <div className="border-t border-[#202020] mt-8 pt-6 space-y-4 text-center">
              <p className="text-xs text-[#777777]">
                New to DRAYEN?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('register');
                    onNavigate('/register');
                  }}
                  className="text-[#F0ECE5] font-semibold hover:text-[#BFC0C2] underline ml-1"
                >
                  Create an Account
                </button>
              </p>

              <div>
                <button
                  type="button"
                  onClick={() => onNavigate('checkout')}
                  className="text-xs font-mono uppercase tracking-wider text-[#777777] hover:text-[#BFC0C2] transition-colors"
                >
                  Continue as Guest to Checkout →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            REGISTER PAGE
            ========================================================================= */}
        {activeTab === 'register' && (
          <div className="max-w-md mx-auto bg-[#121212] border border-[#202020] p-6 sm:p-10 shadow-2xl">
            <div className="text-center mb-8">
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#651C2D] font-bold block mb-2">
                NEW PATRON ENROLMENT
              </span>
              <h1 className="font-serif text-3xl sm:text-4xl text-[#F0ECE5] tracking-wide uppercase">
                JOIN THE DARK SIDE.
              </h1>
              <p className="font-sans text-xs text-[#777777] mt-3 leading-relaxed">
                Create your DRAYEN account to access private drops, track your bespoke pieces, and curate your personal collection.
              </p>
            </div>

            {feedbackMessage && (
              <div
                className={`p-3 mb-6 text-xs font-sans border ${
                  feedbackMessage.type === 'error'
                    ? 'bg-[#651C2D]/15 border-[#651C2D] text-red-200'
                    : 'bg-emerald-950/20 border-emerald-800 text-emerald-200'
                }`}
              >
                {feedbackMessage.text}
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block font-mono text-xs uppercase tracking-wider text-[#BFC0C2] mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Vikramaditya Roy"
                  className="w-full bg-[#080808] border border-[#202020] px-4 py-3 text-sm text-[#F0ECE5] placeholder-[#777777] focus:border-[#651C2D] focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block font-mono text-xs uppercase tracking-wider text-[#BFC0C2] mb-1.5">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="patron@drayen.in"
                  className="w-full bg-[#080808] border border-[#202020] px-4 py-3 text-sm text-[#F0ECE5] placeholder-[#777777] focus:border-[#651C2D] focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block font-mono text-xs uppercase tracking-wider text-[#BFC0C2] mb-1.5">
                  10-Digit Mobile Number *
                </label>
                <div className="flex gap-2">
                  <span className="flex items-center px-3 bg-[#080808] border border-[#202020] text-xs font-mono text-[#777777]">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="9840012345"
                    className="flex-1 bg-[#080808] border border-[#202020] px-4 py-3 text-sm text-[#F0ECE5] font-mono placeholder-[#777777] focus:border-[#651C2D] focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono text-xs uppercase tracking-wider text-[#BFC0C2] mb-1.5">
                  Account Password *
                </label>
                <div className="relative">
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Create a strong password"
                    className="w-full bg-[#080808] border border-[#202020] pl-4 pr-10 py-3 text-sm text-[#F0ECE5] placeholder-[#777777] focus:border-[#651C2D] focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#777777] hover:text-[#F0ECE5]"
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Criteria Checklist */}
                {regPassword.length > 0 && (
                  <div className="mt-2.5 p-3 bg-[#080808] border border-[#202020] text-[11px] font-mono grid grid-cols-2 gap-1.5 text-[#777777]">
                    <span className={passChecks.length ? 'text-emerald-400 flex items-center gap-1' : 'flex items-center gap-1'}>
                      <Check className="w-3 h-3" /> 8+ Characters
                    </span>
                    <span className={passChecks.upper ? 'text-emerald-400 flex items-center gap-1' : 'flex items-center gap-1'}>
                      <Check className="w-3 h-3" /> Uppercase letter
                    </span>
                    <span className={passChecks.lower ? 'text-emerald-400 flex items-center gap-1' : 'flex items-center gap-1'}>
                      <Check className="w-3 h-3" /> Lowercase letter
                    </span>
                    <span className={passChecks.number ? 'text-emerald-400 flex items-center gap-1' : 'flex items-center gap-1'}>
                      <Check className="w-3 h-3" /> Number digit
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-start gap-2.5 pt-2">
                <input
                  type="checkbox"
                  id="consent"
                  checked={regConsent}
                  onChange={(e) => setRegConsent(e.target.checked)}
                  required
                  className="accent-[#651C2D] w-4 h-4 mt-0.5 bg-[#080808] border-[#202020]"
                />
                <label htmlFor="consent" className="text-xs text-[#777777] leading-relaxed cursor-pointer select-none">
                  I agree to DRAYEN's Terms of Patronage, Privacy Policy, and consent to receiving bespoke drops & order notifications.
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading || !regConsent}
                className="w-full py-3.5 bg-[#651C2D] hover:bg-[#7e2338] text-[#F0ECE5] font-sans text-xs uppercase tracking-widest font-bold transition-colors disabled:opacity-50 mt-2"
              >
                {isLoading ? 'Registering Account...' : 'Create Account'}
              </button>
            </form>

            <div className="border-t border-[#202020] mt-8 pt-6 text-center">
              <p className="text-xs text-[#777777]">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    onNavigate('/login');
                  }}
                  className="text-[#F0ECE5] font-semibold hover:text-[#BFC0C2] underline ml-1"
                >
                  Sign In
                </button>
              </p>
            </div>
          </div>
        )}

        {/* =========================================================================
            FORGOT PASSWORD PAGE
            ========================================================================= */}
        {activeTab === 'forgot-password' && (
          <div className="max-w-md mx-auto bg-[#121212] border border-[#202020] p-6 sm:p-10 shadow-2xl">
            <div className="text-center mb-8">
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#651C2D] font-bold block mb-2">
                ACCESS RECOVERY
              </span>
              <h1 className="font-serif text-3xl sm:text-4xl text-[#F0ECE5] tracking-wide uppercase">
                RECOVER PATRON PASS
              </h1>
              <p className="font-sans text-xs text-[#777777] mt-3 leading-relaxed">
                Enter your registered email address or mobile number to receive instructions for recovering your access.
              </p>
            </div>

            {feedbackMessage && (
              <div
                className={`p-3 mb-6 text-xs font-sans border ${
                  feedbackMessage.type === 'error'
                    ? 'bg-[#651C2D]/15 border-[#651C2D] text-red-200'
                    : 'bg-emerald-950/20 border-emerald-800 text-emerald-200'
                }`}
              >
                {feedbackMessage.text}
              </div>
            )}

            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div>
                <label className="block font-mono text-xs uppercase tracking-wider text-[#BFC0C2] mb-1.5">
                  Registered Email Address or Mobile
                </label>
                <input
                  type="text"
                  required
                  value={resetIdentifier}
                  onChange={(e) => setResetIdentifier(e.target.value)}
                  placeholder="patron@drayen.in or 9840012345"
                  className="w-full bg-[#080808] border border-[#202020] px-4 py-3 text-sm text-[#F0ECE5] placeholder-[#777777] focus:border-[#651C2D] focus:outline-none transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-[#651C2D] hover:bg-[#7e2338] text-[#F0ECE5] font-sans text-xs uppercase tracking-widest font-bold transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Transmitting Request...' : 'Send Recovery Instructions'}
              </button>
            </form>

            <div className="border-t border-[#202020] mt-8 pt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  onNavigate('/login');
                }}
                className="text-xs font-mono uppercase tracking-wider text-[#777777] hover:text-[#F0ECE5] transition-colors"
              >
                ← Return to Sign In
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            MYNTRA-STYLE CUSTOMER ACCOUNT DASHBOARD (OVERVIEW, PROFILE, ADDRESSES, ORDERS, WISHLIST, SECURITY)
            ========================================================================= */}
        {['overview', 'profile', 'addresses', 'orders', 'wishlist', 'security'].includes(activeTab) && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT SIDEBAR NAVIGATION */}
            <aside className="lg:col-span-3 space-y-4">
              {/* User Header Profile Card */}
              <div className="bg-[#121212] border border-[#202020] p-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#651C2D]/20 border border-[#651C2D] flex items-center justify-center text-[#F0ECE5] font-serif text-lg font-bold">
                    {currentUser ? currentUser.firstName?.charAt(0) : 'D'}
                  </div>
                  <div className="overflow-hidden">
                    <span className="font-mono text-[9px] uppercase tracking-widest text-[#777777] block">
                      {currentUser ? 'VERIFIED PATRON' : 'GUEST EXPLORER'}
                    </span>
                    <h3 className="font-serif text-base text-[#F0ECE5] truncate font-semibold">
                      {currentUser ? `${currentUser.firstName} ${currentUser.lastName || ''}`.trim() : 'Guest Visitor'}
                    </h3>
                    <p className="font-mono text-[11px] text-[#777777] truncate">
                      {currentUser ? currentUser.email : 'Explore collections'}
                    </p>
                  </div>
                </div>

                {!currentUser && (
                  <div className="mt-4 pt-3 border-t border-[#202020] flex gap-2">
                    <button
                      onClick={() => {
                        setActiveTab('login');
                        onNavigate('/login');
                      }}
                      className="flex-1 py-1.5 bg-[#651C2D] text-[#F0ECE5] text-[11px] font-sans uppercase tracking-wider font-semibold text-center"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('register');
                        onNavigate('/register');
                      }}
                      className="flex-1 py-1.5 border border-[#202020] text-[#F0ECE5] text-[11px] font-sans uppercase tracking-wider text-center"
                    >
                      Register
                    </button>
                  </div>
                )}
              </div>

              {/* Navigation Menu (Myntra-style Sectioned Sidebar) */}
              <nav className="bg-[#121212] border border-[#202020] divide-y divide-[#1a1a1a]">
                <button
                  onClick={() => {
                    setActiveTab('overview');
                    onNavigate('/account');
                  }}
                  className={`w-full flex items-center justify-between p-3.5 text-xs font-mono uppercase tracking-wider transition-colors ${
                    activeTab === 'overview'
                      ? 'bg-[#651C2D]/20 text-[#F0ECE5] font-bold border-l-2 border-[#651C2D]'
                      : 'text-[#BFC0C2] hover:text-[#F0ECE5] hover:bg-[#161616]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-[#651C2D]" />
                    <span>Overview</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[#777777]" />
                </button>

                <button
                  onClick={() => {
                    setActiveTab('orders');
                    onNavigate('/account/orders');
                  }}
                  className={`w-full flex items-center justify-between p-3.5 text-xs font-mono uppercase tracking-wider transition-colors ${
                    activeTab === 'orders'
                      ? 'bg-[#651C2D]/20 text-[#F0ECE5] font-bold border-l-2 border-[#651C2D]'
                      : 'text-[#BFC0C2] hover:text-[#F0ECE5] hover:bg-[#161616]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Package className="w-4 h-4 text-[#651C2D]" />
                    <span>My Orders</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[#777777]" />
                </button>

                <button
                  onClick={() => {
                    setActiveTab('profile');
                    onNavigate('/account/profile');
                  }}
                  className={`w-full flex items-center justify-between p-3.5 text-xs font-mono uppercase tracking-wider transition-colors ${
                    activeTab === 'profile'
                      ? 'bg-[#651C2D]/20 text-[#F0ECE5] font-bold border-l-2 border-[#651C2D]'
                      : 'text-[#BFC0C2] hover:text-[#F0ECE5] hover:bg-[#161616]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-[#651C2D]" />
                    <span>My Profile</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[#777777]" />
                </button>

                <button
                  onClick={() => {
                    setActiveTab('addresses');
                    onNavigate('/account/addresses');
                  }}
                  className={`w-full flex items-center justify-between p-3.5 text-xs font-mono uppercase tracking-wider transition-colors ${
                    activeTab === 'addresses'
                      ? 'bg-[#651C2D]/20 text-[#F0ECE5] font-bold border-l-2 border-[#651C2D]'
                      : 'text-[#BFC0C2] hover:text-[#F0ECE5] hover:bg-[#161616]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-[#651C2D]" />
                    <span>Saved Addresses</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[#777777]" />
                </button>

                <button
                  onClick={() => {
                    setActiveTab('wishlist');
                    onNavigate('/account/wishlist');
                  }}
                  className={`w-full flex items-center justify-between p-3.5 text-xs font-mono uppercase tracking-wider transition-colors ${
                    activeTab === 'wishlist'
                      ? 'bg-[#651C2D]/20 text-[#F0ECE5] font-bold border-l-2 border-[#651C2D]'
                      : 'text-[#BFC0C2] hover:text-[#F0ECE5] hover:bg-[#161616]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Heart className="w-4 h-4 text-[#651C2D]" />
                    <span>Wishlist ({wishlistIds.length})</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[#777777]" />
                </button>

                <button
                  onClick={() => {
                    setActiveTab('security');
                    onNavigate('/account/security');
                  }}
                  className={`w-full flex items-center justify-between p-3.5 text-xs font-mono uppercase tracking-wider transition-colors ${
                    activeTab === 'security'
                      ? 'bg-[#651C2D]/20 text-[#F0ECE5] font-bold border-l-2 border-[#651C2D]'
                      : 'text-[#BFC0C2] hover:text-[#F0ECE5] hover:bg-[#161616]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Shield className="w-4 h-4 text-[#651C2D]" />
                    <span>Account Security</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[#777777]" />
                </button>

                {currentUser && (
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center justify-between p-3.5 text-xs font-mono uppercase tracking-wider text-red-400 hover:text-red-300 hover:bg-[#161616] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </div>
                  </button>
                )}
              </nav>

              {/* Help & Support Box */}
              <div className="bg-[#121212] border border-[#202020] p-4 text-xs font-sans text-[#777777] space-y-2">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#BFC0C2] block">
                  Concierge Support
                </span>
                <p className="text-[11px] leading-relaxed">
                  Have an enquiry regarding a bespoke casting or delivery transit? Contact our atelier curators at <span className="text-[#F0ECE5]">concierge@drayen.in</span>.
                </p>
              </div>
            </aside>

            {/* MAIN RIGHT CONTENT AREA */}
            <main className="lg:col-span-9 space-y-6">
              
              {/* GLOBAL FEEDBACK MESSAGE IN DASHBOARD */}
              {feedbackMessage && (
                <div
                  className={`p-3 text-xs font-sans border ${
                    feedbackMessage.type === 'error'
                      ? 'bg-[#651C2D]/15 border-[#651C2D] text-red-200'
                      : 'bg-emerald-950/20 border-emerald-800 text-emerald-200'
                  }`}
                >
                  {feedbackMessage.text}
                </div>
              )}

              {/* SUB-VIEW 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Top Welcome Banner */}
                  <div className="bg-[#121212] border border-[#202020] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#651C2D] font-bold block mb-1">
                        PATRON DASHBOARD
                      </span>
                      <h2 className="font-serif text-2xl sm:text-3xl text-[#F0ECE5]">
                        {currentUser ? `Welcome back, ${currentUser.firstName}` : 'Welcome, Valued Guest'}
                      </h2>
                      <p className="font-sans text-xs text-[#777777] mt-1">
                        {currentUser
                          ? `Registered Patron ID: ${currentUser.id || 'DRY-ACTIVE'}`
                          : 'Sign in to access your private vault, custom measurements, and order history.'}
                      </p>
                    </div>

                    {!currentUser && (
                      <button
                        onClick={() => {
                          setActiveTab('login');
                          onNavigate('/login');
                        }}
                        className="px-5 py-2.5 bg-[#651C2D] hover:bg-[#7e2338] text-[#F0ECE5] font-sans text-xs uppercase tracking-widest font-semibold transition-colors"
                      >
                        Sign In Now
                      </button>
                    )}
                  </div>

                  {/* Summary Metric Tiles (Myntra-style overview cards) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <button
                      onClick={() => setActiveTab('orders')}
                      className="bg-[#121212] border border-[#202020] p-4 text-left hover:border-[#BFC0C2] transition-colors group"
                    >
                      <Package className="w-5 h-5 text-[#651C2D] mb-2 group-hover:scale-110 transition-transform" />
                      <span className="font-mono text-xl text-[#F0ECE5] font-bold block">
                        {currentUser ? '0' : '—'}
                      </span>
                      <span className="font-mono text-[11px] uppercase tracking-wider text-[#777777]">
                        Active Orders
                      </span>
                    </button>

                    <button
                      onClick={() => setActiveTab('wishlist')}
                      className="bg-[#121212] border border-[#202020] p-4 text-left hover:border-[#BFC0C2] transition-colors group"
                    >
                      <Heart className="w-5 h-5 text-[#651C2D] mb-2 group-hover:scale-110 transition-transform" />
                      <span className="font-mono text-xl text-[#F0ECE5] font-bold block">
                        {wishlistIds.length}
                      </span>
                      <span className="font-mono text-[11px] uppercase tracking-wider text-[#777777]">
                        Wishlist Pieces
                      </span>
                    </button>

                    <button
                      onClick={() => setActiveTab('addresses')}
                      className="bg-[#121212] border border-[#202020] p-4 text-left hover:border-[#BFC0C2] transition-colors group"
                    >
                      <MapPin className="w-5 h-5 text-[#651C2D] mb-2 group-hover:scale-110 transition-transform" />
                      <span className="font-mono text-xl text-[#F0ECE5] font-bold block">
                        {addresses.length}
                      </span>
                      <span className="font-mono text-[11px] uppercase tracking-wider text-[#777777]">
                        Saved Destinations
                      </span>
                    </button>

                    <button
                      onClick={() => setActiveTab('profile')}
                      className="bg-[#121212] border border-[#202020] p-4 text-left hover:border-[#BFC0C2] transition-colors group"
                    >
                      <CheckCircle className="w-5 h-5 text-[#651C2D] mb-2 group-hover:scale-110 transition-transform" />
                      <span className="font-mono text-xl text-[#F0ECE5] font-bold block">
                        {currentUser ? 'Active' : 'Guest'}
                      </span>
                      <span className="font-mono text-[11px] uppercase tracking-wider text-[#777777]">
                        Profile Status
                      </span>
                    </button>
                  </div>

                  {/* Profile Summary Card & Verification Badges */}
                  <div className="bg-[#121212] border border-[#202020] p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-[#202020] pb-3">
                      <h3 className="font-serif text-lg text-[#F0ECE5]">Profile Coordinates</h3>
                      <button
                        onClick={() => setActiveTab('profile')}
                        className="text-xs font-mono uppercase tracking-wider text-[#651C2D] hover:underline"
                      >
                        Edit Profile →
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-sans">
                      <div className="bg-[#080808] p-3 border border-[#202020]">
                        <span className="font-mono text-[10px] uppercase text-[#777777] block">Legal Name</span>
                        <span className="text-[#F0ECE5] font-semibold mt-1 block">
                          {currentUser ? `${currentUser.firstName} ${currentUser.lastName || ''}`.trim() : 'Guest Customer'}
                        </span>
                      </div>

                      <div className="bg-[#080808] p-3 border border-[#202020]">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] uppercase text-[#777777]">Email Address</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 bg-[#202020] text-[#777777]">
                            {profile?.isEmailVerified ? 'Verified' : 'Unverified'}
                          </span>
                        </div>
                        <span className="text-[#F0ECE5] font-mono mt-1 block truncate">
                          {currentUser ? currentUser.email : 'Not registered'}
                        </span>
                      </div>

                      <div className="bg-[#080808] p-3 border border-[#202020]">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] uppercase text-[#777777]">Mobile Phone</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 bg-[#202020] text-[#777777]">
                            {profile?.isMobileVerified ? 'Verified' : 'Unverified'}
                          </span>
                        </div>
                        <span className="text-[#F0ECE5] font-mono mt-1 block">
                          {currentUser ? currentUser.phone : 'Not registered'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-VIEW 2: PROFILE */}
              {activeTab === 'profile' && (
                <div className="bg-[#121212] border border-[#202020] p-6 sm:p-8 space-y-6">
                  <div className="border-b border-[#202020] pb-4">
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#651C2D] font-bold block mb-1">
                      PATRON IDENTIFIER
                    </span>
                    <h2 className="font-serif text-2xl text-[#F0ECE5]">My Profile</h2>
                    <p className="text-xs text-[#777777] mt-1">
                      Manage your legal contact details, display monikers, and aesthetic sizing preferences.
                    </p>
                  </div>

                  {profileSaveSuccess && (
                    <div className="p-3 bg-emerald-950/20 border border-emerald-800 text-emerald-200 text-xs font-sans flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 shrink-0" />
                      <span>Profile changes saved successfully.</span>
                    </div>
                  )}

                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-mono text-xs uppercase tracking-wider text-[#BFC0C2] mb-1.5">
                          Full Legal Name
                        </label>
                        <input
                          type="text"
                          required
                          value={profileName}
                          onChange={(e) => setProfileName(e.target.value)}
                          placeholder="Arjun Verma"
                          className="w-full bg-[#080808] border border-[#202020] px-4 py-2.5 text-sm text-[#F0ECE5] focus:border-[#651C2D] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-mono text-xs uppercase tracking-wider text-[#BFC0C2] mb-1.5">
                          Display Moniker (Optional)
                        </label>
                        <input
                          type="text"
                          value={profileDisplayName}
                          onChange={(e) => setProfileDisplayName(e.target.value)}
                          placeholder="e.g. Knight of Void"
                          className="w-full bg-[#080808] border border-[#202020] px-4 py-2.5 text-sm text-[#F0ECE5] focus:border-[#651C2D] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="font-mono text-xs uppercase tracking-wider text-[#BFC0C2]">
                            Email Address
                          </label>
                          <span className="text-[10px] font-mono text-amber-400">
                            {profile?.isEmailVerified ? 'Verified' : 'Verification Pending'}
                          </span>
                        </div>
                        <div className="relative">
                          <input
                            type="email"
                            disabled
                            value={profileEmail || (currentUser ? currentUser.email : 'patron@drayen.in')}
                            className="w-full bg-[#080808]/50 border border-[#202020] px-4 py-2.5 text-sm text-[#777777] font-mono cursor-not-allowed"
                          />
                        </div>
                        <p className="text-[10px] font-mono text-[#777777] mt-1">
                          Email change requires cryptographic identity re-verification.
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="font-mono text-xs uppercase tracking-wider text-[#BFC0C2]">
                            Mobile Phone Number
                          </label>
                          <span className="text-[10px] font-mono text-amber-400">
                            {profile?.isMobileVerified ? 'Verified' : 'OTP Pending'}
                          </span>
                        </div>
                        <input
                          type="tel"
                          disabled
                          value={profilePhone || (currentUser ? currentUser.phone : '9840012345')}
                          className="w-full bg-[#080808]/50 border border-[#202020] px-4 py-2.5 text-sm text-[#777777] font-mono cursor-not-allowed"
                        />
                        <p className="text-[10px] font-mono text-[#777777] mt-1">
                          Mobile number is linked to order dispatch SMS confirmations.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-mono text-xs uppercase tracking-wider text-[#BFC0C2] mb-1.5">
                          Date of Birth
                        </label>
                        <input
                          type="date"
                          value={profileDob}
                          onChange={(e) => setProfileDob(e.target.value)}
                          className="w-full bg-[#080808] border border-[#202020] px-4 py-2.5 text-sm text-[#F0ECE5] focus:border-[#651C2D] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-mono text-xs uppercase tracking-wider text-[#BFC0C2] mb-1.5">
                          Aesthetic Preference
                        </label>
                        <select
                          value={profileGender}
                          onChange={(e) => setProfileGender(e.target.value)}
                          className="w-full bg-[#080808] border border-[#202020] px-4 py-2.5 text-sm text-[#F0ECE5] focus:border-[#651C2D] focus:outline-none"
                        >
                          <option value="unspecified">All Sculptures & Pendants</option>
                          <option value="masculine">Bold & Heavy Chains</option>
                          <option value="androgynous">Gothic Minimal & Talismans</option>
                          <option value="feminine">Intricate Filigree & Chokers</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-3">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="px-6 py-3 bg-[#651C2D] hover:bg-[#7e2338] text-[#F0ECE5] font-sans text-xs uppercase tracking-widest font-bold transition-colors disabled:opacity-50"
                      >
                        {isLoading ? 'Saving Coordinates...' : 'Save Profile Changes'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* SUB-VIEW 3: SAVED ADDRESSES */}
              {activeTab === 'addresses' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#121212] border border-[#202020] p-6">
                    <div>
                      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#651C2D] font-bold block mb-1">
                        DELIVERY SANCTUM
                      </span>
                      <h2 className="font-serif text-2xl text-[#F0ECE5]">Saved Addresses</h2>
                      <p className="text-xs text-[#777777] mt-1">
                        Securely manage delivery destinations for rapid insured transit across India.
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setEditingAddressId(null);
                        setAddressForm({
                          fullName: currentUser ? `${currentUser.firstName} ${currentUser.lastName || ''}`.trim() : '',
                          phone: currentUser ? currentUser.phone : '',
                          pincode: '',
                          addressLine1: '',
                          addressLine2: '',
                          landmark: '',
                          city: '',
                          state: '',
                          addressType: 'home',
                          isDefault: addresses.length === 0,
                        });
                        setIsAddressModalOpen(true);
                      }}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#651C2D] hover:bg-[#7e2338] text-[#F0ECE5] font-sans text-xs uppercase tracking-widest font-semibold transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add New Address</span>
                    </button>
                  </div>

                  {/* Address List or Empty State */}
                  {addresses.length === 0 ? (
                    <div className="bg-[#121212] border border-[#202020] p-10 text-center space-y-4">
                      <MapPin className="w-10 h-10 text-[#777777] mx-auto opacity-50" />
                      <h3 className="font-serif text-lg text-[#F0ECE5]">No Saved Destinations</h3>
                      <p className="text-xs text-[#777777] max-w-md mx-auto leading-relaxed">
                        No addresses have been saved to this account yet. Add a delivery destination to streamline future checkout runs.
                      </p>
                      <button
                        onClick={() => {
                          setEditingAddressId(null);
                          setIsAddressModalOpen(true);
                        }}
                        className="px-6 py-2.5 border border-[#202020] hover:border-[#BFC0C2] text-[#F0ECE5] font-sans text-xs uppercase tracking-widest transition-colors"
                      >
                        + Add Destination
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {addresses.map((addr, idx) => (
                        <div
                          key={addr.id || idx}
                          className={`bg-[#121212] border p-5 relative space-y-3 transition-colors ${
                            addr.isDefault ? 'border-[#651C2D]' : 'border-[#202020]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 bg-[#202020] text-[#BFC0C2]">
                                {addr.addressType}
                              </span>
                              {addr.isDefault && (
                                <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 bg-[#651C2D]/30 border border-[#651C2D] text-[#F0ECE5] font-semibold">
                                  Default
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setEditingAddressId(addr.id || String(idx));
                                  setAddressForm(addr);
                                  setIsAddressModalOpen(true);
                                }}
                                className="p-1 text-[#777777] hover:text-[#F0ECE5] transition-colors"
                                title="Edit Address"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(addr.id || String(idx))}
                                className="p-1 text-[#777777] hover:text-red-400 transition-colors"
                                title="Delete Address"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-serif text-base text-[#F0ECE5]">{addr.fullName}</h4>
                            <p className="font-mono text-xs text-[#777777] mt-0.5">{addr.phone}</p>
                          </div>

                          <div className="text-xs font-sans text-[#BFC0C2] leading-relaxed">
                            <p>{addr.addressLine1}</p>
                            {addr.addressLine2 && <p>{addr.addressLine2}</p>}
                            {addr.landmark && <p className="text-[#777777]">Near: {addr.landmark}</p>}
                            <p className="font-mono text-[11px] mt-1 text-[#F0ECE5]">
                              {addr.city}, {addr.state} — {addr.pincode}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add / Edit Address Modal */}
                  {isAddressModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                      <div className="bg-[#121212] border border-[#202020] w-full max-w-lg p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-[#202020] pb-3">
                          <h3 className="font-serif text-xl text-[#F0ECE5]">
                            {editingAddressId ? 'Edit Delivery Destination' : 'Add New Delivery Destination'}
                          </h3>
                          <button
                            onClick={() => setIsAddressModalOpen(false)}
                            className="text-[#777777] hover:text-[#F0ECE5]"
                          >
                            ✕
                          </button>
                        </div>

                        <form onSubmit={handleSaveAddress} className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block font-mono text-xs uppercase tracking-wider text-[#BFC0C2] mb-1">
                                Full Name *
                              </label>
                              <input
                                type="text"
                                required
                                value={addressForm.fullName}
                                onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                                placeholder="Vikram Roy"
                                className="w-full bg-[#080808] border border-[#202020] px-3.5 py-2.5 text-xs text-[#F0ECE5] focus:border-[#651C2D] focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="block font-mono text-xs uppercase tracking-wider text-[#BFC0C2] mb-1">
                                10-Digit Phone *
                              </label>
                              <input
                                type="tel"
                                required
                                maxLength={10}
                                value={addressForm.phone}
                                onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value.replace(/\D/g, '') })}
                                placeholder="9840012345"
                                className="w-full bg-[#080808] border border-[#202020] px-3.5 py-2.5 text-xs text-[#F0ECE5] font-mono focus:border-[#651C2D] focus:outline-none"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                              <label className="block font-mono text-xs uppercase tracking-wider text-[#BFC0C2] mb-1">
                                PIN Code *
                              </label>
                              <input
                                type="text"
                                required
                                maxLength={6}
                                value={addressForm.pincode}
                                onChange={(e) => handlePincodeChange(e.target.value)}
                                placeholder="110001"
                                className="w-full bg-[#080808] border border-[#202020] px-3.5 py-2.5 text-xs text-[#F0ECE5] font-mono focus:border-[#651C2D] focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="block font-mono text-xs uppercase tracking-wider text-[#BFC0C2] mb-1">
                                City / District *
                              </label>
                              <input
                                type="text"
                                required
                                value={addressForm.city}
                                onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                                placeholder="New Delhi"
                                className="w-full bg-[#080808] border border-[#202020] px-3.5 py-2.5 text-xs text-[#F0ECE5] focus:border-[#651C2D] focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="block font-mono text-xs uppercase tracking-wider text-[#BFC0C2] mb-1">
                                State *
                              </label>
                              <input
                                type="text"
                                required
                                value={addressForm.state}
                                onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                                placeholder="Delhi"
                                className="w-full bg-[#080808] border border-[#202020] px-3.5 py-2.5 text-xs text-[#F0ECE5] focus:border-[#651C2D] focus:outline-none"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block font-mono text-xs uppercase tracking-wider text-[#BFC0C2] mb-1">
                              Flat, House no., Building, Company, Apartment *
                            </label>
                            <input
                              type="text"
                              required
                              value={addressForm.addressLine1}
                              onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
                              placeholder="Apartment 4B, Gothic Chambers"
                              className="w-full bg-[#080808] border border-[#202020] px-3.5 py-2.5 text-xs text-[#F0ECE5] focus:border-[#651C2D] focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block font-mono text-xs uppercase tracking-wider text-[#BFC0C2] mb-1">
                              Area, Street, Sector, Village
                            </label>
                            <input
                              type="text"
                              value={addressForm.addressLine2 || ''}
                              onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })}
                              placeholder="Connaught Place"
                              className="w-full bg-[#080808] border border-[#202020] px-3.5 py-2.5 text-xs text-[#F0ECE5] focus:border-[#651C2D] focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block font-mono text-xs uppercase tracking-wider text-[#BFC0C2] mb-1">
                              Landmark (Optional)
                            </label>
                            <input
                              type="text"
                              value={addressForm.landmark || ''}
                              onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })}
                              placeholder="Opposite Cathedral Square"
                              className="w-full bg-[#080808] border border-[#202020] px-3.5 py-2.5 text-xs text-[#F0ECE5] focus:border-[#651C2D] focus:outline-none"
                            />
                          </div>

                          <div className="flex items-center gap-4 pt-2">
                            <span className="font-mono text-xs uppercase text-[#BFC0C2]">Type:</span>
                            {(['home', 'work', 'other'] as const).map((type) => (
                              <label key={type} className="flex items-center gap-1.5 text-xs capitalize cursor-pointer">
                                <input
                                  type="radio"
                                  name="addrType"
                                  checked={addressForm.addressType === type}
                                  onChange={() => setAddressForm({ ...addressForm, addressType: type })}
                                  className="accent-[#651C2D]"
                                />
                                <span className="text-[#BFC0C2]">{type}</span>
                              </label>
                            ))}
                          </div>

                          <div className="flex items-center gap-2 pt-2">
                            <input
                              type="checkbox"
                              id="isDefaultAddr"
                              checked={addressForm.isDefault}
                              onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                              className="accent-[#651C2D]"
                            />
                            <label htmlFor="isDefaultAddr" className="text-xs text-[#777777] cursor-pointer">
                              Make this my default shipping address
                            </label>
                          </div>

                          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#202020]">
                            <button
                              type="button"
                              onClick={() => setIsAddressModalOpen(false)}
                              className="px-4 py-2 text-xs font-mono uppercase text-[#777777] hover:text-[#F0ECE5]"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={isLoading}
                              className="px-6 py-2.5 bg-[#651C2D] hover:bg-[#7e2338] text-[#F0ECE5] font-sans text-xs uppercase tracking-widest font-bold transition-colors disabled:opacity-50"
                            >
                              {isLoading ? 'Saving...' : 'Save Destination'}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* Delete Confirmation Modal */}
                  {deleteConfirmId && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                      <div className="bg-[#121212] border border-[#202020] max-w-sm w-full p-6 space-y-4">
                        <h4 className="font-serif text-lg text-[#F0ECE5]">Remove Address?</h4>
                        <p className="text-xs text-[#777777] leading-relaxed">
                          Are you certain you wish to purge this destination from your patron address registry?
                        </p>
                        <div className="flex items-center justify-end gap-3 pt-2">
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-4 py-2 text-xs font-mono uppercase text-[#777777] hover:text-[#F0ECE5]"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleDeleteAddress(deleteConfirmId)}
                            className="px-4 py-2 bg-red-900/60 hover:bg-red-800 text-[#F0ECE5] text-xs font-mono uppercase tracking-wider"
                          >
                            Confirm Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* SUB-VIEW 4: MY ORDERS */}
              {activeTab === 'orders' && (
                <div className="space-y-6">
                  <div className="bg-[#121212] border border-[#202020] p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#651C2D] font-bold block mb-1">
                          ORDER ARCHIVE & TRANSIT
                        </span>
                        <h2 className="font-serif text-2xl text-[#F0ECE5]">My Orders</h2>
                        <p className="text-xs text-[#777777] mt-1">
                          Review past dispatches, tracking events, and payment receipts.
                        </p>
                      </div>

                      <button
                        onClick={() => onNavigate('orders')}
                        className="px-4 py-2 bg-[#202020] hover:bg-[#2a2a2a] text-[#F0ECE5] font-mono text-xs uppercase tracking-wider transition-colors"
                      >
                        Track Order by PIN →
                      </button>
                    </div>

                    {/* Filter tabs */}
                    <div className="flex flex-wrap gap-2 border-b border-[#202020] pt-2 pb-3">
                      {(['all', 'awaiting', 'transit', 'delivered'] as const).map((filter) => (
                        <button
                          key={filter}
                          onClick={() => setOrderFilter(filter)}
                          className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-colors ${
                            orderFilter === filter
                              ? 'bg-[#651C2D] text-[#F0ECE5] font-bold'
                              : 'bg-[#080808] border border-[#202020] text-[#777777] hover:text-[#BFC0C2]'
                          }`}
                        >
                          {filter === 'all'
                            ? 'All Orders'
                            : filter === 'awaiting'
                            ? 'Awaiting Payment'
                            : filter === 'transit'
                            ? 'In Transit'
                            : 'Delivered'}
                        </button>
                      ))}
                    </div>

                    {/* Empty Orders State with zero-mock discipline */}
                    <div className="bg-[#080808] border border-[#202020] p-12 text-center space-y-4 my-4">
                      <Package className="w-10 h-10 text-[#777777] mx-auto opacity-50" />
                      <h3 className="font-serif text-lg text-[#F0ECE5]">No Order Records Located</h3>
                      <p className="text-xs text-[#777777] max-w-md mx-auto leading-relaxed">
                        You have not placed any requisitions under this account yet. Your future orders and tracking history will appear here.
                      </p>
                      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                        <button
                          onClick={() => onNavigate('shop')}
                          className="px-6 py-2.5 bg-[#651C2D] hover:bg-[#7e2338] text-[#F0ECE5] font-sans text-xs uppercase tracking-widest font-semibold transition-colors"
                        >
                          Explore Atelier Pieces
                        </button>
                        <button
                          onClick={() => onNavigate('orders')}
                          className="px-6 py-2.5 border border-[#202020] hover:border-[#BFC0C2] text-[#F0ECE5] font-sans text-xs uppercase tracking-widest transition-colors"
                        >
                          Track Guest Order
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-VIEW 5: WISHLIST */}
              {activeTab === 'wishlist' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#121212] border border-[#202020] p-6">
                    <div>
                      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#651C2D] font-bold block mb-1">
                        PERSONAL ARCHIVE
                      </span>
                      <h2 className="font-serif text-2xl text-[#F0ECE5]">Wishlist & Saved Pieces</h2>
                      <p className="text-xs text-[#777777] mt-1">
                        Curate your bespoke selection for future artisan releases.
                      </p>
                    </div>

                    <span className="font-mono text-xs text-[#777777]">
                      {savedPieces.length} {savedPieces.length === 1 ? 'Piece' : 'Pieces'} Saved
                    </span>
                  </div>

                  {savedPieces.length === 0 ? (
                    <div className="bg-[#121212] border border-[#202020] p-12 text-center space-y-4">
                      <Heart className="w-10 h-10 text-[#777777] mx-auto opacity-50" />
                      <h3 className="font-serif text-xl text-[#F0ECE5]">Your Vault is Currently Empty</h3>
                      <p className="text-xs text-[#777777] max-w-md mx-auto leading-relaxed">
                        Curate your personal collection by tapping the heart icon on any talisman across our catalogue.
                      </p>
                      <div className="pt-2">
                        <button
                          onClick={() => onNavigate('shop')}
                          className="px-6 py-3 bg-[#651C2D] hover:bg-[#7e2338] text-[#F0ECE5] font-sans text-xs uppercase tracking-widest font-bold transition-colors"
                        >
                          Explore Catalogue
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {savedPieces.map((piece) => (
                        <div
                          key={piece.id}
                          className="bg-[#121212] border border-[#202020] flex flex-col justify-between group hover:border-[#651C2D] transition-colors"
                        >
                          <div>
                            <div className="relative aspect-square overflow-hidden bg-[#080808]">
                              <img
                                src={piece.images[0]}
                                alt={piece.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                              <button
                                onClick={() => onToggleWishlist?.(piece.id)}
                                className="absolute top-3 right-3 p-2 bg-[#080808]/80 text-red-400 hover:text-white transition-colors"
                                title="Remove from wishlist"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="p-4 space-y-1.5">
                              <span className="font-mono text-[10px] uppercase tracking-wider text-[#777777]">
                                {piece.category}
                              </span>
                              <h4 className="font-serif text-base text-[#F0ECE5] group-hover:text-[#BFC0C2] transition-colors truncate">
                                {piece.name}
                              </h4>
                              <div className="flex items-center gap-2 pt-1">
                                <span className="font-mono text-sm text-[#F0ECE5] font-bold">
                                  {formatINR(piece.selling_price_paise)}
                                </span>
                                {piece.original_price_paise && (
                                  <span className="font-mono text-xs text-[#777777] line-through">
                                    {formatINR(piece.original_price_paise)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="p-4 pt-0 space-y-2">
                            <button
                              onClick={() => {
                                onAddToCart?.(piece, 1);
                                onToggleWishlist?.(piece.id);
                              }}
                              className="w-full py-2.5 bg-[#651C2D] hover:bg-[#7e2338] text-[#F0ECE5] font-sans text-xs uppercase tracking-widest font-semibold flex items-center justify-center gap-2 transition-colors"
                            >
                              <ShoppingBag className="w-3.5 h-3.5" />
                              <span>Move to Bag</span>
                            </button>
                            <button
                              onClick={() => onNavigate(`products/${piece.slug}`)}
                              className="w-full py-2 border border-[#202020] hover:border-[#BFC0C2] text-[#BFC0C2] text-xs font-mono uppercase tracking-wider transition-colors"
                            >
                              Inspect Details
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* SUB-VIEW 6: ACCOUNT SECURITY */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  {/* Password Update Form */}
                  <div className="bg-[#121212] border border-[#202020] p-6 sm:p-8 space-y-6">
                    <div className="border-b border-[#202020] pb-4">
                      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#651C2D] font-bold block mb-1">
                        CRYPTOGRAPHIC PROTOCOLS
                      </span>
                      <h2 className="font-serif text-2xl text-[#F0ECE5]">Security & Password</h2>
                      <p className="text-xs text-[#777777] mt-1">
                        Update your master passkey, verify credentials, and monitor authenticated active sessions.
                      </p>
                    </div>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (newPassword !== confirmPassword) {
                          setFeedbackMessage({ type: 'error', text: 'New passwords do not match.' });
                          return;
                        }
                        setFeedbackMessage({
                          type: 'error',
                          text: 'Password modification requires connected authentication server (PUT /api/auth/password).',
                        });
                      }}
                      className="space-y-4 max-w-md"
                    >
                      <div>
                        <label className="block font-mono text-xs uppercase tracking-wider text-[#BFC0C2] mb-1.5">
                          Current Passkey
                        </label>
                        <input
                          type="password"
                          required
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full bg-[#080808] border border-[#202020] px-4 py-2.5 text-sm text-[#F0ECE5] focus:border-[#651C2D] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-mono text-xs uppercase tracking-wider text-[#BFC0C2] mb-1.5">
                          New Secure Passkey
                        </label>
                        <input
                          type="password"
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full bg-[#080808] border border-[#202020] px-4 py-2.5 text-sm text-[#F0ECE5] focus:border-[#651C2D] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-mono text-xs uppercase tracking-wider text-[#BFC0C2] mb-1.5">
                          Confirm New Passkey
                        </label>
                        <input
                          type="password"
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full bg-[#080808] border border-[#202020] px-4 py-2.5 text-sm text-[#F0ECE5] focus:border-[#651C2D] focus:outline-none"
                        />
                      </div>

                      <button
                        type="submit"
                        className="px-6 py-3 bg-[#651C2D] hover:bg-[#7e2338] text-[#F0ECE5] font-sans text-xs uppercase tracking-widest font-bold transition-colors"
                      >
                        Update Master Passkey
                      </button>
                    </form>
                  </div>

                  {/* Active Sessions */}
                  <div className="bg-[#121212] border border-[#202020] p-6 space-y-4">
                    <h3 className="font-serif text-lg text-[#F0ECE5]">Active Authenticated Sessions</h3>
                    <div className="border border-[#202020] bg-[#080808] p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Smartphone className="w-5 h-5 text-[#651C2D]" />
                        <div>
                          <p className="text-xs font-semibold text-[#F0ECE5]">Current Browser Session</p>
                          <p className="font-mono text-[10px] text-[#777777]">
                            Local Client Device • Session Active
                          </p>
                        </div>
                      </div>
                      <span className="font-mono text-[10px] text-emerald-400 bg-emerald-950/40 px-2 py-0.5 border border-emerald-800">
                        Current
                      </span>
                    </div>
                  </div>

                  {/* Danger Zone: Account Deletion */}
                  <div className="bg-[#121212] border border-red-950/40 p-6 space-y-3">
                    <h3 className="font-serif text-lg text-red-400">Danger Zone</h3>
                    <p className="text-xs text-[#777777] leading-relaxed">
                      Permanently expunge your patronage records, saved measurements, and order history from DRAYEN records.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowDeleteAccountModal(true)}
                      className="px-4 py-2 border border-red-900 text-red-400 hover:bg-red-950/50 text-xs font-mono uppercase tracking-wider transition-colors"
                    >
                      Request Patron Record Deletion
                    </button>
                  </div>

                  {/* Delete Account Modal */}
                  {showDeleteAccountModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                      <div className="bg-[#121212] border border-[#202020] max-w-md w-full p-6 space-y-4">
                        <h4 className="font-serif text-xl text-red-400">Purge Patron Record?</h4>
                        <p className="text-xs text-[#777777] leading-relaxed">
                          This action is irreversible. All your saved addresses, bespoke measurements, and historical certificates of authenticity will be revoked.
                        </p>
                        <div className="p-3 bg-[#080808] border border-[#202020] text-[11px] font-mono text-[#BFC0C2]">
                          Deletion request will be queued for processing via <code className="text-[#651C2D]">DELETE /api/account</code> once connected.
                        </div>
                        <div className="flex items-center justify-end gap-3 pt-2">
                          <button
                            onClick={() => setShowDeleteAccountModal(false)}
                            className="px-4 py-2 text-xs font-mono uppercase text-[#777777] hover:text-[#F0ECE5]"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => {
                              setShowDeleteAccountModal(false);
                              handleSignOut();
                            }}
                            className="px-5 py-2.5 bg-red-900 hover:bg-red-800 text-white text-xs font-mono uppercase tracking-wider font-bold"
                          >
                            Confirm Deletion
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </main>
          </div>
        )}

      </div>
    </div>
  );
};
