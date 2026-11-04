import React, { useState } from 'react';
import { ArrowRight, Check, Shield } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: string, param?: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim().includes('@')) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className="w-full bg-[#0a0a0a] text-[#888888] pt-16 pb-12 border-t border-[#202020]">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8">
        {/* Brand statement */}
        <div className="lg:col-span-4 flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <span className="font-serif text-2xl uppercase tracking-[0.25em] text-white">
              DRAYEN
            </span>
            <p className="text-xs font-mono tracking-[0.18em] text-[#a0a0a0] uppercase">
              NOT MADE TO BLEND IN.
            </p>
            <p className="text-xs text-[#777777] max-w-sm leading-relaxed">
              Handcrafted .925 sterling talismans, personal armor, and sculptural statements forged for daily wear across India.
            </p>
          </div>
          <div className="space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#666666]">Connect</span>
            <div className="flex items-center gap-6 text-xs font-mono uppercase tracking-widest">
              <span className="text-[#a0a0a0] hover:text-white transition-colors cursor-pointer">Instagram</span>
              <span className="text-[#a0a0a0] hover:text-white transition-colors cursor-pointer">WhatsApp Concierge</span>
            </div>
          </div>
        </div>

        {/* Catalogue */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xs font-mono uppercase text-white tracking-[0.2em] font-semibold">Catalogue</h3>
          <ul className="space-y-2.5 text-xs font-mono text-[#a0a0a0]">
            <li>
              <button onClick={() => onNavigate('shop')} className="hover:text-white transition-colors cursor-pointer text-left">
                Shop All Pieces
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('shop', 'Gothic Necklaces')} className="hover:text-white transition-colors cursor-pointer text-left">
                Gothic Necklaces
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('shop', 'Pendants')} className="hover:text-white transition-colors cursor-pointer text-left">
                Pendants &amp; Talismans
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('shop', 'Chains')} className="hover:text-white transition-colors cursor-pointer text-left">
                Heavy Steel Chains
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('shop', 'Statement Pieces')} className="hover:text-white transition-colors cursor-pointer text-left">
                Statement Pieces
              </button>
            </li>
          </ul>
        </div>

        {/* Client Care */}
        <div className="lg:col-span-3 space-y-4">
          <h3 className="text-xs font-mono uppercase text-white tracking-[0.2em] font-semibold">Customer Care</h3>
          <ul className="space-y-2.5 text-xs font-mono text-[#a0a0a0]">
            <li>
              <button onClick={() => onNavigate('track-order')} className="hover:text-white transition-colors cursor-pointer text-left text-white">
                Track Your Order →
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('home')} className="hover:text-white transition-colors cursor-pointer text-left">
                Shipping &amp; Delivery (2-4 Days)
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('home')} className="hover:text-white transition-colors cursor-pointer text-left">
                7-Day Hassle-Free Exchange
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('home')} className="hover:text-white transition-colors cursor-pointer text-left">
                Lifetime Tarnish-Proof Promise
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('home')} className="hover:text-white transition-colors cursor-pointer text-left">
                Jewellery Care Guide
              </button>
            </li>
          </ul>
        </div>

        {/* Newsletter */}
        <div className="lg:col-span-3 space-y-4">
          <h3 className="text-xs font-mono uppercase text-white tracking-[0.2em] font-semibold">Private Dispatches</h3>
          <p className="text-xs text-[#777777] leading-relaxed">
            Subscribe for limited batch releases and receive 10% off your first acquisition.
          </p>
          {subscribed ? (
            <div className="p-3 bg-[#161616] border border-[#2e2e2e] text-xs text-[#dcdcdc] space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-400 font-mono">
                <Check className="w-4 h-4" />
                <span>Subscribed successfully</span>
              </div>
              <p className="text-[11px] text-[#888888]">Use welcome code <strong className="text-white font-mono">FIRSTDROP</strong> at checkout for ₹100 off.</p>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="space-y-2">
              <div className="flex">
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-10 px-3 bg-[#161616] text-white placeholder-[#666666] text-xs font-mono border border-[#2a2a2a] focus:outline-none focus:border-[#651C2D] transition-colors"
                  placeholder="Enter your email"
                  type="email"
                  required
                />
                <button
                  className="h-10 px-4 bg-[#651C2D] text-white hover:bg-[#85253b] transition-colors flex items-center justify-center cursor-pointer"
                  type="submit"
                  title="Subscribe"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 md:px-8 mt-12 pt-6 border-t border-[#1e1e1e] flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-[11px] font-mono text-[#666666] tracking-wider">
          © 2025 DRAYEN ATELIER. ALL RIGHTS RESERVED.
        </p>
        <div className="flex items-center gap-2 font-mono text-[10px] text-[#888888] tracking-widest uppercase">
          <span className="px-2 py-1 bg-[#141414] border border-[#242424]">UPI Instant Transfer</span>
          <span className="px-2 py-1 bg-[#141414] border border-[#242424]">Cash on Delivery</span>
        </div>
      </div>

      {/* Subtle Graphite Divider & Discreet Admin Dashboard Link */}
      <div className="w-full bg-[#080808] border-t border-[#1a1a1a] mt-8 pt-4 pb-2">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 flex items-center justify-between text-xs font-mono">
          <span className="text-[#444444] text-[11px] tracking-wider hidden sm:inline">
            Vault Protocol v2.4
          </span>
          <button
            onClick={() => onNavigate('admin')}
            className="flex items-center gap-1.5 text-[#777777] hover:text-[#BFC0C2] transition-colors cursor-pointer text-[11px] tracking-wider group"
          >
            <Shield className="w-3 h-3 text-[#555555] group-hover:text-[#BFC0C2] transition-colors" />
            <span>Admin Dashboard</span>
          </button>
        </div>
      </div>
    </footer>
  );
};
