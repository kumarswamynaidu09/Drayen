import React, { useState, useRef, useEffect } from 'react';
import { Search, Heart, ShoppingBag, User, Menu, X, ChevronRight, LogOut, Package, MapPin, Shield, CheckCircle } from 'lucide-react';
import { authService } from '../services/auth';
import { Customer } from '../types';

interface HeaderProps {
  currentView: string;
  activeCategory?: string;
  onNavigate: (view: string, param?: string) => void;
  cartCount: number;
  wishlistCount: number;
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  onOpenSearch: () => void;
  isAdminLoggedIn?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  activeCategory = '',
  onNavigate,
  cartCount,
  wishlistCount,
  onOpenCart,
  onOpenWishlist,
  onOpenSearch,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<Customer | null>(() => authService.getCurrentUser());
  const accountMenuRef = useRef<HTMLDivElement>(null);

  // Synchronise user session on re-renders or storage events
  useEffect(() => {
    const handleStorage = () => {
      setCurrentUser(authService.getCurrentUser());
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await authService.signOut();
    setCurrentUser(null);
    setIsAccountMenuOpen(false);
    onNavigate('home');
  };

  const handleNavClick = (view: string, param?: string) => {
    setIsMobileMenuOpen(false);
    setIsAccountMenuOpen(false);
    onNavigate(view, param);
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#080808]/95 backdrop-blur-md border-b border-[#202020]">


        {/* Primary Navigation Bar */}
        <div className="h-16 max-w-[1440px] mx-auto px-4 md:px-8 flex items-center justify-between gap-4">
          
          {/* Mobile Menu Toggle Button */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle navigation menu"
              className="p-2 -ml-2 text-[#BFC0C2] hover:text-[#F0ECE5] transition-colors cursor-pointer"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Brand Wordmark (Left on Desktop, Centered on Mobile) */}
          <div className="flex-1 lg:flex-initial text-center lg:text-left">
            <button
              onClick={() => handleNavClick('home')}
              className="inline-flex items-center gap-2 group cursor-pointer"
              aria-label="DRAYEN Home"
            >
              <img
                src="/drayen-logo.jpg"
                alt="DRAYEN"
                className="h-8 md:h-10 w-auto object-contain transition-opacity hover:opacity-90"
              />
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8 text-xs font-mono uppercase tracking-widest text-[#BFC0C2]">
            <button
              onClick={() => handleNavClick('shop')}
              className={`hover:text-[#F0ECE5] transition-colors cursor-pointer py-1 ${
                currentView === 'shop' && (!activeCategory || activeCategory.toLowerCase() === 'all')
                  ? 'text-[#F0ECE5] border-b-2 border-[#651C2D] font-bold'
                  : ''
              }`}
            >
              Shop All
            </button>
            <button
              onClick={() => handleNavClick('shop', 'Gothic Necklaces')}
              className={`hover:text-[#F0ECE5] transition-colors cursor-pointer py-1 ${
                currentView === 'shop' && activeCategory.toLowerCase().includes('necklace')
                  ? 'text-[#F0ECE5] border-b-2 border-[#651C2D] font-bold'
                  : ''
              }`}
            >
              Necklaces
            </button>
            <button
              onClick={() => handleNavClick('shop', 'Pendants')}
              className={`hover:text-[#F0ECE5] transition-colors cursor-pointer py-1 ${
                currentView === 'shop' && activeCategory.toLowerCase().includes('pendant')
                  ? 'text-[#F0ECE5] border-b-2 border-[#651C2D] font-bold'
                  : ''
              }`}
            >
              Pendants
            </button>
            <button
              onClick={() => handleNavClick('shop', 'Chains')}
              className={`hover:text-[#F0ECE5] transition-colors cursor-pointer py-1 ${
                currentView === 'shop' && activeCategory.toLowerCase().includes('chain')
                  ? 'text-[#F0ECE5] border-b-2 border-[#651C2D] font-bold'
                  : ''
              }`}
            >
              Chains
            </button>
            <button
              onClick={() => handleNavClick('orders')}
              className={`hover:text-[#F0ECE5] transition-colors cursor-pointer py-1 ${
                currentView === 'orders' ? 'text-[#F0ECE5] border-b-2 border-[#651C2D] font-bold' : ''
              }`}
            >
              Track Order
            </button>
          </nav>

          {/* Header Action Icons: Search, Wishlist, Account, Bag */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Search Trigger */}
            <button
              onClick={onOpenSearch}
              aria-label="Search Collection"
              className="p-2 text-[#BFC0C2] hover:text-[#F0ECE5] transition-colors cursor-pointer"
              type="button"
              title="Search collection (Press /)"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Wishlist Trigger */}
            <button
              onClick={onOpenWishlist}
              aria-label="Saved Pieces"
              className="relative p-2 text-[#BFC0C2] hover:text-[#F0ECE5] transition-colors cursor-pointer"
              type="button"
              title="Saved Pieces"
            >
              <Heart className="w-4 h-4" />
              {wishlistCount > 0 && (
                <span className="absolute top-1 right-1 font-mono text-[9px] w-3.5 h-3.5 bg-[#651C2D] text-[#F0ECE5] flex items-center justify-center rounded-full leading-none font-bold">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Account Popover Trigger */}
            <div className="relative" ref={accountMenuRef}>
              <button
                onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                aria-label="Account Dossier"
                className={`p-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  currentView === 'account' || currentView === 'login' || currentView === 'register'
                    ? 'text-[#F0ECE5]'
                    : 'text-[#BFC0C2] hover:text-[#F0ECE5]'
                }`}
                type="button"
                title="Customer Account"
              >
                <User className="w-4 h-4" />
                {currentUser && (
                  <span className="hidden xl:inline text-[11px] font-mono uppercase tracking-wider text-[#F0ECE5] truncate max-w-[80px]">
                    {currentUser.firstName}
                  </span>
                )}
              </button>

              {/* Account Dropdown Panel (Myntra-style Account Entry) */}
              {isAccountMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-[#121212] border border-[#202020] shadow-2xl py-4 z-50 text-left">
                  {!currentUser ? (
                    /* Unauthenticated State */
                    <div className="space-y-3 px-5 pb-3">
                      <div>
                        <h4 className="font-serif text-base text-[#F0ECE5] tracking-wide">Welcome to DRAYEN</h4>
                        <p className="text-[11px] font-sans text-[#777777] mt-0.5">
                          To view orders and manage your account
                        </p>
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => handleNavClick('login')}
                          className="flex-1 py-2 bg-[#651C2D] hover:bg-[#7e2338] text-[#F0ECE5] font-sans text-xs uppercase tracking-widest font-semibold transition-colors text-center"
                        >
                          Sign In
                        </button>
                        <button
                          onClick={() => handleNavClick('register')}
                          className="flex-1 py-2 border border-[#202020] hover:border-[#BFC0C2] text-[#F0ECE5] font-sans text-xs uppercase tracking-widest transition-colors text-center"
                        >
                          Join
                        </button>
                      </div>

                      <div className="border-t border-[#202020] pt-3 space-y-1">
                        <button
                          onClick={() => handleNavClick('/account/orders')}
                          className="w-full flex items-center justify-between py-1.5 text-xs text-[#BFC0C2] hover:text-[#F0ECE5] transition-colors"
                        >
                          <span className="flex items-center gap-2">
                            <Package className="w-3.5 h-3.5 text-[#777777]" /> Orders & Tracking
                          </span>
                          <ChevronRight className="w-3 h-3 text-[#777777]" />
                        </button>
                        <button
                          onClick={() => {
                            setIsAccountMenuOpen(false);
                            onOpenWishlist();
                          }}
                          className="w-full flex items-center justify-between py-1.5 text-xs text-[#BFC0C2] hover:text-[#F0ECE5] transition-colors"
                        >
                          <span className="flex items-center gap-2">
                            <Heart className="w-3.5 h-3.5 text-[#777777]" /> Wishlist
                          </span>
                          <ChevronRight className="w-3 h-3 text-[#777777]" />
                        </button>
                        <button
                          onClick={() => handleNavClick('/account/addresses')}
                          className="w-full flex items-center justify-between py-1.5 text-xs text-[#BFC0C2] hover:text-[#F0ECE5] transition-colors"
                        >
                          <span className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-[#777777]" /> Saved Addresses
                          </span>
                          <ChevronRight className="w-3 h-3 text-[#777777]" />
                        </button>
                      </div>

                      <div className="border-t border-[#202020] pt-2">
                        <button
                          onClick={() => handleNavClick('checkout')}
                          className="text-[11px] text-[#777777] hover:text-[#BFC0C2] transition-colors"
                        >
                          Continue as Guest →
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Authenticated State */
                    <div className="space-y-2">
                      <div className="px-5 pb-3 border-b border-[#202020]">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#651C2D]/30 border border-[#651C2D] flex items-center justify-center text-[#F0ECE5] font-serif text-sm">
                            {currentUser.firstName?.charAt(0) || 'D'}
                          </div>
                          <div className="overflow-hidden">
                            <h4 className="font-serif text-sm text-[#F0ECE5] truncate">{currentUser.firstName} {currentUser.lastName || ''}</h4>
                            <p className="font-mono text-[10px] text-[#777777] truncate">{currentUser.email}</p>
                          </div>
                        </div>
                      </div>

                      <div className="px-3 space-y-0.5">
                        <button
                          onClick={() => handleNavClick('/account')}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-[#BFC0C2] hover:text-[#F0ECE5] hover:bg-[#1a1a1a] transition-colors text-left"
                        >
                          <User className="w-3.5 h-3.5 text-[#777777]" />
                          <span>Account Overview</span>
                        </button>
                        <button
                          onClick={() => handleNavClick('/account/orders')}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-[#BFC0C2] hover:text-[#F0ECE5] hover:bg-[#1a1a1a] transition-colors text-left"
                        >
                          <Package className="w-3.5 h-3.5 text-[#777777]" />
                          <span>My Orders</span>
                        </button>
                        <button
                          onClick={() => handleNavClick('/account/profile')}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-[#BFC0C2] hover:text-[#F0ECE5] hover:bg-[#1a1a1a] transition-colors text-left"
                        >
                          <CheckCircle className="w-3.5 h-3.5 text-[#777777]" />
                          <span>My Profile</span>
                        </button>
                        <button
                          onClick={() => handleNavClick('/account/addresses')}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-[#BFC0C2] hover:text-[#F0ECE5] hover:bg-[#1a1a1a] transition-colors text-left"
                        >
                          <MapPin className="w-3.5 h-3.5 text-[#777777]" />
                          <span>Saved Addresses</span>
                        </button>
                        <button
                          onClick={() => handleNavClick('/account/wishlist')}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-[#BFC0C2] hover:text-[#F0ECE5] hover:bg-[#1a1a1a] transition-colors text-left"
                        >
                          <Heart className="w-3.5 h-3.5 text-[#777777]" />
                          <span>Wishlist</span>
                        </button>
                        <button
                          onClick={() => handleNavClick('/account/security')}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-[#BFC0C2] hover:text-[#F0ECE5] hover:bg-[#1a1a1a] transition-colors text-left"
                        >
                          <Shield className="w-3.5 h-3.5 text-[#777777]" />
                          <span>Security & Password</span>
                        </button>
                      </div>

                      <div className="border-t border-[#202020] px-3 pt-1">
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-[#1a1a1a] transition-colors text-left"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Cart Trigger */}
            <button
              onClick={onOpenCart}
              aria-label="Shopping Bag"
              className="relative p-2 text-[#BFC0C2] hover:text-[#F0ECE5] transition-colors cursor-pointer"
              type="button"
              title="Shopping Bag"
            >
              <ShoppingBag className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 font-mono text-[9px] w-3.5 h-3.5 bg-[#651C2D] text-[#F0ECE5] flex items-center justify-center rounded-full leading-none font-bold">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Body */}
          <div className="fixed top-0 bottom-0 left-0 w-4/5 max-w-xs bg-[#080808] border-r border-[#202020] p-6 flex flex-col justify-between overflow-y-auto z-10">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#202020]">
                <span className="font-serif text-xl tracking-[0.25em] text-[#F0ECE5] uppercase">
                  DRAYEN
                </span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 text-[#777777] hover:text-[#F0ECE5] transition-colors cursor-pointer"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Categories */}
              <nav className="space-y-3 font-mono text-xs uppercase tracking-widest">
                <button
                  onClick={() => handleNavClick('shop')}
                  className={`w-full text-left py-2 transition-colors flex items-center justify-between ${
                    currentView === 'shop' && (!activeCategory || activeCategory.toLowerCase() === 'all')
                      ? 'text-[#F0ECE5] font-bold border-l-2 border-[#651C2D] pl-2'
                      : 'text-[#BFC0C2] hover:text-[#F0ECE5]'
                  }`}
                >
                  <span>Shop All Catalogue</span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#777777]" />
                </button>
                <button
                  onClick={() => handleNavClick('shop', 'Gothic Necklaces')}
                  className={`w-full text-left py-2 transition-colors flex items-center justify-between ${
                    currentView === 'shop' && activeCategory.toLowerCase().includes('necklace')
                      ? 'text-[#F0ECE5] font-bold border-l-2 border-[#651C2D] pl-2'
                      : 'text-[#BFC0C2] hover:text-[#F0ECE5]'
                  }`}
                >
                  <span>Gothic Necklaces</span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#777777]" />
                </button>
                <button
                  onClick={() => handleNavClick('shop', 'Pendants')}
                  className={`w-full text-left py-2 transition-colors flex items-center justify-between ${
                    currentView === 'shop' && activeCategory.toLowerCase().includes('pendant')
                      ? 'text-[#F0ECE5] font-bold border-l-2 border-[#651C2D] pl-2'
                      : 'text-[#BFC0C2] hover:text-[#F0ECE5]'
                  }`}
                >
                  <span>Handcrafted Pendants</span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#777777]" />
                </button>
                <button
                  onClick={() => handleNavClick('shop', 'Chains')}
                  className={`w-full text-left py-2 transition-colors flex items-center justify-between ${
                    currentView === 'shop' && activeCategory.toLowerCase().includes('chain')
                      ? 'text-[#F0ECE5] font-bold border-l-2 border-[#651C2D] pl-2'
                      : 'text-[#BFC0C2] hover:text-[#F0ECE5]'
                  }`}
                >
                  <span>Solid Chains</span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#777777]" />
                </button>
                <button
                  onClick={() => handleNavClick('orders')}
                  className={`w-full text-left py-2 transition-colors flex items-center justify-between ${
                    currentView === 'orders'
                      ? 'text-[#F0ECE5] font-bold border-l-2 border-[#651C2D] pl-2'
                      : 'text-[#BFC0C2] hover:text-[#F0ECE5]'
                  }`}
                >
                  <span>Track Order</span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#777777]" />
                </button>
              </nav>

              {/* Account Quick Access on Mobile */}
              <div className="pt-4 border-t border-[#202020] space-y-2">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#777777] block">
                  Customer Account
                </span>
                {!currentUser ? (
                  <div className="space-y-2 pt-1">
                    <button
                      onClick={() => handleNavClick('login')}
                      className="w-full py-2.5 bg-[#651C2D] text-[#F0ECE5] font-sans text-xs uppercase tracking-widest font-semibold transition-colors text-center"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => handleNavClick('register')}
                      className="w-full py-2.5 border border-[#202020] text-[#F0ECE5] font-sans text-xs uppercase tracking-widest transition-colors text-center"
                    >
                      Create Account
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <button
                      onClick={() => handleNavClick('/account')}
                      className="w-full text-left py-1.5 text-xs text-[#BFC0C2] hover:text-[#F0ECE5]"
                    >
                      Overview & Profile
                    </button>
                    <button
                      onClick={() => handleNavClick('/account/orders')}
                      className="w-full text-left py-1.5 text-xs text-[#BFC0C2] hover:text-[#F0ECE5]"
                    >
                      My Orders
                    </button>
                    <button
                      onClick={() => handleNavClick('/account/addresses')}
                      className="w-full text-left py-1.5 text-xs text-[#BFC0C2] hover:text-[#F0ECE5]"
                    >
                      Saved Addresses
                    </button>
                    <button
                      onClick={() => handleNavClick('/account/wishlist')}
                      className="w-full text-left py-1.5 text-xs text-[#BFC0C2] hover:text-[#F0ECE5]"
                    >
                      Wishlist ({wishlistCount})
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left py-1.5 text-xs text-red-400 hover:text-red-300"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-6 border-t border-[#202020]">
              <p className="font-mono text-[10px] text-[#777777] uppercase tracking-widest">
                DRAYEN ATELIER © 2026
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
