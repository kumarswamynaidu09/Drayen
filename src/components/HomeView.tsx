import React, { useState } from 'react';
import { Product } from '../types';
import { formatINR } from '../lib/money';

interface HomeViewProps {
  products: Product[];
  isLoading: boolean;
  onSelectProduct: (product: Product) => void;
  onNavigate: (view: string, param?: string) => void;
  onAddToCart: (product: Product, quantity?: number) => void;
  onToggleWishlist: (productId: string) => void;
  wishlistIds: string[];
}

export const HomeView: React.FC<HomeViewProps> = ({
  products = [],
  isLoading = false,
  onSelectProduct,
  onNavigate,
  onAddToCart,
  onToggleWishlist,
  wishlistIds = [],
}) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [newsletterMsg, setNewsletterMsg] = useState(false);

  const bestsellers = products.slice(0, 4);
  const newArrivals = products.slice(4, 8);

  const faqs = [
    {
      q: 'What materials and finishes are used in DRAYEN pieces?',
      a: 'All DRAYEN jewelry is constructed from 316L surgical stainless steel or heavy solid pewter casts with hand-applied antique oxidation finishes. Our premium runs utilize genuine .925 sterling silver hallmarked components. They are 100% nickel-free and hypoallergenic.',
    },
    {
      q: 'Will these chains turn my skin green or tarnish over time?',
      a: 'Never. Our 316L stainless steel does not oxidize, rust, or leave green discoloration on skin, even with direct exposure to sweat, sea water, or daily showers. The antiqued dark highlights are permanently sealed.',
    },
    {
      q: 'What chain lengths are provided with pendants?',
      a: 'Most of our statement pendants come paired with an adjustable 20-inch to 24-inch (50cm – 60cm) heavy wheat or curb chain, designed to sit naturally on the chest over crewnecks and hoodies. Precise specs are specified on each product page.',
    },
    {
      q: 'How should I care for and clean my gothic jewelry?',
      a: 'Simply rinse with lukewarm water and mild soap, then wipe dry with a microfiber cloth. Avoid harsh chemical dips or ultrasonic jewelry cleaners, as these can strip the intended vintage patina in the recessed engravings.',
    },
    {
      q: 'What are the delivery timelines across India?',
      a: 'Metro orders are dispatched within 24 hours and typically arrive within 2 to 4 business days. Regional destinations take 4 to 6 business days. Full tracking details are emailed and WhatsApp messaged instantly upon dispatch.',
    },
    {
      q: 'What is your exchange and return policy?',
      a: 'We offer a hassle-free 7-day replacement or store credit guarantee if your piece arrives damaged or does not match your expectations. Items must remain unworn in original matte packaging.',
    },
  ];

  return (
    <div className="flex flex-col w-full">
      {/* Primary Brand Grand Entrance Hero */}
      <section className="relative w-full bg-black overflow-hidden flex flex-col justify-between border-b border-[#202020] min-h-[520px] sm:min-h-[640px] md:min-h-screen">
        {/* Background Artwork: 
            On mobile (< md), it fits with contain/proper aspect ratio so the entire 
            dragon head, crown, and DRAYEN graffiti are 100% visible without cropping! */}
        <div className="relative w-full flex-1 flex items-center justify-center pt-4 sm:pt-6 pb-2">
          {/* Mobile Display: full aspect-ratio preserved with subtle dark framing */}
          <div className="w-full md:hidden flex items-center justify-center px-2 py-4">
            <img
              src="/drayen-hero-street.jpg"
              alt="DRAYEN Rebellion & Luxury Gothic Talismans"
              className="w-full h-auto max-h-[62vh] object-contain shadow-2xl filter brightness-[0.96] contrast-[1.05]"
            />
          </div>

          {/* Tablet & Desktop Display: immersive edge-to-edge cover */}
          <img
            src="/drayen-hero-street.jpg"
            alt="DRAYEN Rebellion & Luxury Gothic Talismans"
            className="hidden md:block absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.95] contrast-[1.05]"
          />
          <div className="hidden md:block absolute inset-0 bg-gradient-to-t from-black via-black/25 to-black/30 pointer-events-none" />
        </div>

        {/* Floating / Bottom Action Bar: Crisp on Mobile & Desktop */}
        <div className="relative z-10 w-full max-w-4xl mx-auto px-4 pb-8 sm:pb-12 md:pb-16 text-center flex flex-col items-center space-y-3 sm:space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-4 sm:py-1.5 bg-black/85 border border-[#383535] backdrop-blur-md">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#651C2D] animate-pulse" />
            <span className="font-mono text-[9px] sm:text-[11px] uppercase tracking-[0.2em] sm:tracking-[0.25em] text-[#e5e2e1]">
              Autumn / Winter 2025 Capsule
            </span>
          </div>

          <div className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 sm:gap-4 pt-1">
            <button
              onClick={() => onNavigate('shop')}
              className="w-full sm:w-auto h-11 sm:h-13 px-6 sm:px-8 bg-[#651C2D] text-white flex items-center justify-center font-mono text-xs tracking-[0.2em] sm:tracking-[0.25em] uppercase font-bold hover:bg-[#85253b] active:scale-[0.99] transition-all shadow-2xl cursor-pointer"
            >
              EXPLORE COLLECTION
            </button>
            <button
              onClick={() => onNavigate('shop', 'Pendants')}
              className="w-full sm:w-auto h-11 sm:h-13 px-6 sm:px-8 bg-black/85 text-[#F0ECE5] border border-[#383535] hover:bg-white/10 active:scale-[0.99] flex items-center justify-center font-mono text-xs tracking-[0.2em] sm:tracking-[0.25em] uppercase transition-all backdrop-blur-md cursor-pointer"
            >
              VIEW TALISMANS
            </button>
          </div>
        </div>
      </section>

      {/* Section B: Hero Banner (Editorial Showcase) */}
      <section className="relative w-full bg-surface-container-lowest overflow-hidden">
        <div className="max-w-[1440px] mx-auto px-margin md:px-margin-desktop min-h-[calc(100vh-116px)] flex flex-col lg:flex-row items-center justify-between gap-gutter-desktop py-space-lg lg:py-0">
          {/* Left Column: Typography & CTAs */}
          <div className="w-full lg:w-1/2 flex flex-col justify-center space-y-space-md z-10 py-space-md lg:pr-space-lg">
            <div className="space-y-space-xs">
              <div className="text-xs font-mono tracking-[0.2em] text-[#a0a0a0] uppercase">
                Handcrafted Gothic Jewellery · 2025 Series
              </div>
              <h1 className="font-headline-lg lg:font-display-hero text-headline-lg lg:text-display-hero text-primary tracking-tight uppercase leading-[0.95]">
                NOT MADE TO<br />
                <span className="font-headline-md italic font-normal text-on-surface-variant">BLEND IN.</span>
              </h1>
            </div>
            <p className="font-body-lg text-body-lg text-outline max-w-lg leading-relaxed">
              Dark aesthetics. Distinctive symbols. Jewellery that speaks for itself. Forged in antique silver and surgical steel for the unapologetic sovereign.
            </p>
            <div className="pt-space-xs flex flex-col sm:flex-row items-stretch sm:items-center gap-space-sm font-label-caps text-label-caps">
              <button
                onClick={() => onNavigate('shop')}
                className="h-12 px-space-md bg-primary text-on-primary flex items-center justify-center tracking-[0.2em] uppercase font-bold hover:bg-secondary-fixed transition-colors text-center shadow-lg cursor-pointer"
              >
                SHOP COLLECTION
              </button>
              <button
                onClick={() => onNavigate('shop', 'Pendants')}
                className="h-12 px-space-md bg-surface-container-low text-primary hover:bg-surface-container flex items-center justify-center tracking-[0.2em] uppercase text-center transition-colors cursor-pointer"
              >
                EXPLORE PENDANTS
              </button>
            </div>
            {/* Micro stats */}
            <div className="pt-space-md grid grid-cols-3 gap-gutter max-w-md bg-surface-container-low p-4 border border-surface-container">
              <div>
                <span className="font-label-mono-num text-[11px] block text-outline uppercase tracking-wider">Purity</span>
                <span className="font-title-editorial text-title-editorial text-primary tracking-wide">316L / .925</span>
              </div>
              <div>
                <span className="font-label-mono-num text-[11px] block text-outline uppercase tracking-wider">Weight</span>
                <span className="font-title-editorial text-title-editorial text-primary tracking-wide">Heavy Cast</span>
              </div>
              <div>
                <span className="font-label-mono-num text-[11px] block text-outline uppercase tracking-wider">Craft</span>
                <span className="font-title-editorial text-title-editorial text-primary tracking-wide">Antiqued</span>
              </div>
            </div>
          </div>

          {/* Right Column: Editorial Imagery */}
          <div className="w-full lg:w-1/2 flex items-center justify-center relative self-stretch min-h-[480px] lg:min-h-full">
            <div className="relative w-full h-full max-h-[760px] bg-surface-container-low flex items-center justify-center overflow-hidden border border-surface-container">
              <img
                alt="Editorial model wearing layered antique silver cross chains"
                className="w-full h-full object-cover object-top filter contrast-[1.08] brightness-[0.96] transition-transform duration-700 hover:scale-[1.02]"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCVroHRf8USp-gWA2mtcHNXZoLYc7PhNad-KXGJMdfbu9ok-nQVdc7SEjgRR0SZgy7RK7XoWDldGmwCQYNcGisEcGjb6nkI6Sjz7CzRwtNtusEQOfk87I8EcOn89xXCTnxZTYwv7rG8mhAJvuTbL7vCcAXIDtrD6wHrVaPFhWryo0uNZ9TVjn3JEbV4SvuwuH8vxpFWBzEoMF2Vu6mA-hhhCwaQE_m9iVzofX-4IMC826LtK7Ekruli"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-transparent to-transparent opacity-60 pointer-events-none"></div>
              {/* Floating Artifact Tag */}
              <div className="absolute bottom-6 left-6 right-6 p-4 bg-surface-container-lowest/80 backdrop-blur-md border border-surface-container flex items-center justify-between">
                <div>
                  <span className="font-label-caps text-[10px] text-outline uppercase tracking-widest block">Featured Ensemble</span>
                  <span className="font-title-editorial text-title-editorial text-primary">Noctis Cross × Shadow Relic Stack</span>
                </div>
                <button
                  onClick={() => onNavigate('shop')}
                  className="font-label-mono-num text-label-mono-num text-primary hover:text-on-surface-variant flex items-center gap-1 uppercase tracking-wider cursor-pointer"
                >
                  VIEW SET <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section D: Bestsellers ("THE DARK FAVOURITES.") */}
      <section className="w-full bg-surface-container-lowest py-space-xl border-t border-surface-container">
        <div className="max-w-[1440px] mx-auto px-margin md:px-margin-desktop space-y-space-lg">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-sm">
            <div>
              <span className="font-label-caps text-label-caps text-on-tertiary-container uppercase tracking-[0.25em] block mb-2">
                Perpetual Icons
              </span>
              <h2 className="font-headline-lg text-headline-lg text-primary uppercase tracking-tight">THE DARK FAVOURITES.</h2>
            </div>
            <div className="flex items-center gap-space-xs font-label-caps text-label-caps">
              <button
                onClick={() => onNavigate('shop')}
                className="text-on-surface-variant hover:text-primary transition-colors uppercase tracking-widest flex items-center gap-1 cursor-pointer"
              >
                VIEW FULL ARCHIVE <span className="material-symbols-outlined text-[16px]">north_east</span>
              </button>
            </div>
          </div>

          {/* Database-Driven Product Cards or Honest Empty State */}
          {isLoading ? (
            <div className="py-16 text-center text-outline font-label-caps uppercase tracking-widest">
              Connecting to Atelier Database...
            </div>
          ) : bestsellers.length === 0 ? (
            <div className="p-12 text-center bg-surface-container-low border border-surface-container space-y-3">
              <span className="material-symbols-outlined text-[40px] text-outline">hourglass_empty</span>
              <h3 className="font-headline-sm text-headline-sm text-primary">Our collection is being prepared.</h3>
              <p className="font-body-md text-body-md text-outline">
                Please check back soon or visit the Atelier Admin Portal to publish pieces.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter-desktop">
              {bestsellers.map((prod) => {
                const isSaved = wishlistIds.includes(prod.id);
                return (
                  <div
                    key={prod.id}
                    className="group relative flex flex-col bg-surface-container-low border border-surface-container transition-colors duration-200"
                  >
                    <div className="relative w-full aspect-[4/5] bg-surface-container overflow-hidden">
                      {prod.original_price_paise && prod.original_price_paise > prod.selling_price_paise && (
                        <span className="absolute top-3 left-3 z-20 font-label-caps text-[10px] px-2 py-0.5 bg-[#651C2D] text-primary uppercase tracking-widest">
                          SAVE {Math.round(((prod.original_price_paise - prod.selling_price_paise) / prod.original_price_paise) * 100)}%
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleWishlist(prod.id);
                        }}
                        aria-label="Toggle Wishlist"
                        className="wishlist-btn absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center bg-surface-container-lowest/80 text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                        type="button"
                      >
                        <span
                          className={`material-symbols-outlined text-[18px] ${
                            isSaved ? 'text-on-tertiary-container' : ''
                          }`}
                          style={isSaved ? { fontVariationSettings: "'FILL' 1" } : undefined}
                        >
                          favorite
                        </span>
                      </button>
                      <img
                        onClick={() => onSelectProduct(prod)}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 cursor-pointer"
                        alt={prod.name}
                        referrerPolicy="no-referrer"
                        src={prod.images[0] || '/assets/aistudio/Image_1_2990c1d6.png'}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/assets/aistudio/Image_1_2990c1d6.png';
                        }}
                      />
                      {/* Quick Add Overlay */}
                      <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                        <button
                          onClick={() => onAddToCart(prod, 1)}
                          className="w-full h-11 bg-primary text-on-primary font-label-caps text-label-caps uppercase font-bold tracking-widest hover:bg-secondary-fixed transition-colors flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[16px]">add_shopping_cart</span> QUICK ADD
                        </button>
                      </div>
                    </div>
                    <div className="p-4 space-y-1">
                      <span className="font-label-caps text-[10px] text-outline uppercase tracking-wider block">
                        {prod.material}
                      </span>
                      <h3
                        onClick={() => onSelectProduct(prod)}
                        className="font-headline-sm text-[20px] text-primary truncate cursor-pointer hover:underline"
                      >
                        {prod.name}
                      </h3>
                      <div className="flex items-center gap-2 pt-1 font-label-mono-num text-label-mono-num">
                        <span className="text-primary font-bold">{formatINR(prod.selling_price_paise)}</span>
                        {prod.original_price_paise && (
                          <span className="text-outline line-through text-[12px]">
                            {formatINR(prod.original_price_paise)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Section E: Brand Story */}
      <section className="w-full bg-surface-container py-space-xl overflow-hidden relative border-t border-surface-container-high">
        <div className="max-w-[1440px] mx-auto px-margin md:px-margin-desktop">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-desktop items-center">
            {/* Left Visual */}
            <div className="lg:col-span-5 relative">
              <div className="relative aspect-[4/5] bg-surface-container-lowest overflow-hidden shadow-2xl border border-surface-container-highest">
                <img
                  className="w-full h-full object-cover filter contrast-125"
                  alt="Macro focus on hand-forged antique silver interlocking chain links"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuC-lOlzRtnci8_FlfuIIFJxpek9vl8G1NpGl_d5Aw5qTHTDnPOE0mMUTgzmkcYpMNlbkHM8Lcok86TjrOggBowlSUsTkHBvBRlNvDox7spOeYDVE4xHhlx1WT3814AQ01u7dcpW4OIXqQM4jiT1wZl-SA4UOZkANxf4A4lRn5K2d1B-KsYOtDE8N0DlRNslMv-N0ClDcGqVGbb3_xBsK_xxgguGxbjQlrnzUmZuJf-zAl6am6eHbvB3"
                />
              </div>
              <div className="hidden sm:block absolute -bottom-8 -right-8 p-6 bg-surface-container-lowest max-w-xs shadow-xl border border-surface-container">
                <span className="font-label-caps text-[10px] text-outline tracking-[0.2em] uppercase block mb-1">
                  MANUFACTURING CODE
                </span>
                <p className="font-title-editorial text-title-editorial text-primary italic leading-snug">
                  “No fragile platings. Only metals that endure your skin and journey.”
                </p>
              </div>
            </div>

            {/* Right Manifesto */}
            <div className="lg:col-span-7 space-y-space-md lg:pl-space-lg">
              <div className="space-y-space-xs">
                <span className="font-label-caps text-label-caps text-outline uppercase tracking-[0.25em]">Atelier Philosophy</span>
                <h2 className="font-headline-lg lg:font-display-hero text-headline-lg lg:text-[56px] text-primary uppercase leading-tight tracking-tight">
                  DARK IS AN<br />
                  <span className="italic font-normal text-on-surface-variant">IDENTITY.</span>
                </h2>
              </div>
              <div className="space-y-4 font-body-lg text-body-lg text-outline leading-relaxed max-w-xl">
                <p>
                  Created for those who choose their own path. DRAYEN brings together gothic symbolism, alternative culture, and everyday expression without compromise.
                </p>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Every cross, chain, and signet is engineered to carry real weight. We cast using hypoallergenic 316L marine-grade stainless steel and hand-oxidized silver finishes, resisting tarnish and sweat so your armor never yields.
                </p>
              </div>
              <div className="pt-space-xs">
                <button
                  onClick={() => onNavigate('shop')}
                  className="inline-flex items-center gap-3 h-12 px-space-md bg-surface-container-highest text-primary hover:bg-primary hover:text-on-primary font-label-caps text-label-caps uppercase tracking-[0.2em] transition-colors cursor-pointer"
                >
                  DISCOVER OUR ARCHIVE <span className="material-symbols-outlined text-[18px]">east</span>
                </button>
              </div>
              {/* Spec Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-space-sm pt-6 bg-surface-container-low/50 p-4 border border-surface-container">
                <div>
                  <span className="font-headline-sm text-headline-sm text-primary block">100%</span>
                  <span className="font-label-caps text-[10px] text-outline uppercase tracking-wider">Water &amp; Sweat Proof</span>
                </div>
                <div>
                  <span className="font-headline-sm text-headline-sm text-primary block">Zero</span>
                  <span className="font-label-caps text-[10px] text-outline uppercase tracking-wider">Green Skin Guarantee</span>
                </div>
                <div>
                  <span className="font-headline-sm text-headline-sm text-primary block">.925 / 316L</span>
                  <span className="font-label-caps text-[10px] text-outline uppercase tracking-wider">Substantial Core</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section F: New Arrivals */}
      {newArrivals.length > 0 && (
        <section className="w-full bg-surface py-space-xl border-t border-surface-container">
          <div className="max-w-[1440px] mx-auto px-margin md:px-margin-desktop space-y-space-lg">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-sm">
              <div>
                <span className="font-label-caps text-label-caps text-outline uppercase tracking-[0.2em] block mb-2">Recent Casts</span>
                <h2 className="font-headline-lg text-headline-lg text-primary uppercase tracking-tight">FRESH FROM THE SHADOWS.</h2>
              </div>
              <p className="font-body-sm text-body-sm text-outline max-w-xs">
                Strictly limited batches forged and numbered in small studio runs.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter-desktop">
              {newArrivals.map((prod) => (
                <div
                  key={prod.id}
                  className="group relative flex flex-col bg-surface-container-low border border-surface-container transition-colors duration-200"
                >
                  <div className="relative w-full aspect-[4/5] bg-surface-container overflow-hidden">
                    <span className="absolute top-3 left-3 z-20 font-label-caps text-[10px] px-2 py-0.5 bg-primary text-on-primary font-bold uppercase tracking-widest">
                      NEW
                    </span>
                    <img
                      onClick={() => onSelectProduct(prod)}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 cursor-pointer"
                      alt={prod.name}
                      referrerPolicy="no-referrer"
                      src={prod.images[0] || '/assets/aistudio/Image_3_f2ee25fe.png'}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/assets/aistudio/Image_3_f2ee25fe.png';
                      }}
                    />
                    <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                      <button
                        onClick={() => onAddToCart(prod, 1)}
                        className="w-full h-11 bg-primary text-on-primary font-label-caps text-label-caps uppercase font-bold tracking-widest hover:bg-secondary-fixed transition-colors flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[16px]">add_shopping_cart</span> QUICK ADD
                      </button>
                    </div>
                  </div>
                  <div className="p-4 space-y-1">
                    <span className="font-label-caps text-[10px] text-outline uppercase tracking-wider block">
                      {prod.category}
                    </span>
                    <h3
                      onClick={() => onSelectProduct(prod)}
                      className="font-headline-sm text-[20px] text-primary truncate cursor-pointer hover:underline"
                    >
                      {prod.name}
                    </h3>
                    <div className="flex items-center gap-2 pt-1 font-label-mono-num text-label-mono-num">
                      <span className="text-primary font-bold">{formatINR(prod.selling_price_paise)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Section G: Brand Benefits */}
      <section className="w-full bg-surface-container-lowest py-space-lg border-t border-surface-container">
        <div className="max-w-[1440px] mx-auto px-margin md:px-margin-desktop">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter-desktop">
            <div className="flex flex-col space-y-3 p-6 bg-surface-container-low border border-surface-container">
              <span className="material-symbols-outlined text-[32px] text-primary">auto_awesome</span>
              <div className="space-y-1">
                <h3 className="font-headline-sm text-[18px] text-primary">Distinctive Designs</h3>
                <p className="font-body-sm text-body-sm text-outline">
                  Hand-finished gothic iconography engineered for bold visual impact.
                </p>
              </div>
            </div>
            <div className="flex flex-col space-y-3 p-6 bg-surface-container-low border border-surface-container">
              <span className="material-symbols-outlined text-[32px] text-primary">straighten</span>
              <div className="space-y-1">
                <h3 className="font-headline-sm text-[18px] text-primary">Clear Specifications</h3>
                <p className="font-body-sm text-body-sm text-outline">
                  Exact millimetre measurements, chain thickness, and gram weight guides.
                </p>
              </div>
            </div>
            <div className="flex flex-col space-y-3 p-6 bg-surface-container-low border border-surface-container">
              <span className="material-symbols-outlined text-[32px] text-primary">shield_locked</span>
              <div className="space-y-1">
                <h3 className="font-headline-sm text-[18px] text-primary">Secure Checkout</h3>
                <p className="font-body-sm text-body-sm text-outline">
                  Instant UPI, RuPay, credit cards, and Cash on Delivery across India.
                </p>
              </div>
            </div>
            <div className="flex flex-col space-y-3 p-6 bg-surface-container-low border border-surface-container">
              <span className="material-symbols-outlined text-[32px] text-primary">inventory_2</span>
              <div className="space-y-1">
                <h3 className="font-headline-sm text-[18px] text-primary">Reliable Delivery</h3>
                <p className="font-body-sm text-body-sm text-outline">
                  Dispatched in discreet, custom matte black embossed jewelry boxes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section H: Styling Inspiration */}
      <section className="w-full bg-surface py-space-xl border-t border-surface-container">
        <div className="max-w-[1440px] mx-auto px-margin md:px-margin-desktop space-y-space-lg">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-sm">
            <div>
              <span className="font-label-caps text-label-caps text-outline uppercase tracking-[0.2em] block mb-2">Streetwear &amp; Darkness</span>
              <h2 className="font-headline-lg text-headline-lg text-primary uppercase tracking-tight">WEAR IT YOUR WAY.</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">Tag #DRAYEN to appear</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter-desktop">
            <div className="md:col-span-5 relative group overflow-hidden bg-surface-container-low min-h-[460px] border border-surface-container">
              <img
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                alt="Editorial streetwear model wearing washed charcoal oversized tee with layered chains"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAKFhM86m_AqanAhvFsGwKusgNUqmowKTYBvCB6D1J4uiVmuv5Syd-lbb8dnMjWd55u6IAj-fUbg8qGq4xb1sE5HGGexGJjn4V89rVUL1ibiiFMNkOpW-2jD3_JdZS6C6szSABQZV9yVdJ7A1JbEF6U44Zq4m3RxnJRligkyqa_sVuoBKd_1yhSCXT6pMHiAZzBj6vRg20KPYoHqrlgC5_IQJkdQa0iSADXdDXVlIn8_psys-gQMs4o"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-transparent to-transparent opacity-75"></div>
              <div className="absolute bottom-6 left-6 right-6">
                <span className="font-label-caps text-[10px] text-outline uppercase tracking-widest block mb-1">STREETWEAR COMPOSITION</span>
                <h3 className="font-headline-sm text-headline-sm text-primary">The Oversized Void Look</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Paired with Heavy Cuban Choker and Noctis Cross.</p>
              </div>
            </div>
            <div className="md:col-span-4 relative group overflow-hidden bg-surface-container-low min-h-[460px] border border-surface-container">
              <img
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                alt="Close-up of model wearing dark distressed leather jacket with layered silver chains"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCc5Po6VjArbce9TDOYEotDuRgI04vJRlyjJUKRT76zNfX5fZDKran4YlwGkw2eRdbtqyCLBf7BBrA7PBJqVR71FNpoB-4kdq0K30jIGy8kRoRyTKnuwphbSyygWBEIE9zoU_idWmOHlQ9ckj0JIHMFonL37Q8Ni6ToIOeAjvZKXhKXtnnaJm7_R2bAZu18uTeZGUo8mUeb0Rz8H26QOEX2_aKJzXThH7qTVpxTQ5U3oy2WNufv6sf0"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-transparent to-transparent opacity-75"></div>
              <div className="absolute bottom-6 left-6 right-6">
                <span className="font-label-caps text-[10px] text-outline uppercase tracking-widest block mb-1">LAYERED STACK</span>
                <h3 className="font-headline-sm text-headline-sm text-primary">Leather &amp; Silver Tension</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Triple gradient chain drop styling.</p>
              </div>
            </div>
            <div className="md:col-span-3 flex flex-col gap-gutter-desktop">
              <div className="relative group overflow-hidden bg-surface-container-low flex-1 min-h-[220px] border border-surface-container">
                <img
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  alt="Hands draped with heavy silver chain rings"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCVu8ul1pAwDg4NFyA74vWHSzRFSehwcPVy0CpqvzCmPKkUfd9YpoYYoy32g5c5A5qA6hgdvorlxwizspT2fwvXNgTKW8N_lnu8VBwYuKvVpQXlbFFTWZJdDcZkj_zjmgehUdBQFFf_CuXypX9WDhOYF-xpNdsaWn6WMMcGGNTCiUfKr3ueEVuNDvWgkUnc46ysusZFAtc77wJnr8ClnM9cEBGBv7RINqbtR5x9Mu_RpuAo4uaIx-bn"
                />
                <div className="absolute bottom-3 left-3 font-label-caps text-[10px] tracking-widest text-primary bg-surface-container-lowest/90 px-2 py-1">
                  RING STACKS
                </div>
              </div>
              <div className="relative group overflow-hidden bg-surface-container-low flex-1 min-h-[220px] border border-surface-container">
                <img
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  alt="Fashion model wearing single dramatic silver pendant"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCoBW4KIiEzrZbYI9cAov6G7-0_KnJV-bO15UIGZ2bJpkPCxXgMyPdF8io6pQJ1oXD_TmuCczJGZ--pxtiV7gWk7ZwKEZGVBgBDNxmpkC550peM7qh2iqffeXEkkwTUvbPhAUoeVfjw1cFUSXNyS3btXT2OkhNN-qDca6h0mKzJg04_L2U4XWjhYWmflFOf_58_TsMwe4jTYmc-j6EtuCH_QHYZPxVYB6kOiaSTs5_ymRg1ArpaHxiK"
                />
                <div className="absolute bottom-3 left-3 font-label-caps text-[10px] tracking-widest text-primary bg-surface-container-lowest/90 px-2 py-1">
                  TAILORED NOIR
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section I: Customer Reviews */}
      <section className="w-full bg-surface-container-lowest py-space-xl border-t border-surface-container">
        <div className="max-w-[1440px] mx-auto px-margin md:px-margin-desktop space-y-space-lg">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-sm">
            <div>
              <span className="font-label-caps text-label-caps text-outline uppercase tracking-[0.2em] block mb-2">Verified Testimonials</span>
              <h2 className="font-headline-lg text-headline-lg text-primary uppercase tracking-tight">WORN. LOVED. REPEATED.</h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex text-primary">
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              </div>
              <span className="font-label-mono-num text-label-mono-num text-primary">4.9 / 5.0 (840+ REVIEWS)</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter-desktop">
            <div className="p-6 bg-surface-container-low border border-surface-container flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex text-primary">
                    <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  </div>
                  <span className="font-label-mono-num text-[11px] text-outline">2 DAYS AGO</span>
                </div>
                <p className="font-body-md text-body-md text-on-surface leading-relaxed italic">
                  “The Noctis Cross has serious weight. It doesn't feel like flimsy fashion jewelry from standard sites. Worn it daily to gym and showers for three weeks, zero tarnishing.”
                </p>
              </div>
              <div className="pt-3 flex items-center justify-between border-t border-surface-container">
                <div>
                  <span className="font-label-caps text-label-caps text-primary uppercase block">Arjun V.</span>
                  <span className="font-body-sm text-[11px] text-outline">Bengaluru • Verified Owner</span>
                </div>
                <span className="font-label-mono-num text-[11px] text-on-surface-variant uppercase px-2 py-0.5 bg-surface-container">Noctis Cross</span>
              </div>
            </div>
            <div className="p-6 bg-surface-container-low border border-surface-container flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex text-primary">
                    <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  </div>
                  <span className="font-label-mono-num text-[11px] text-outline">1 WEEK AGO</span>
                </div>
                <p className="font-body-md text-body-md text-on-surface leading-relaxed italic">
                  “Packaging blew my mind. Matte black box with velvet pouch. The Death's Grasp pendant has insane sculpted detail. Truly dark streetwear at fair pricing.”
                </p>
              </div>
              <div className="pt-3 flex items-center justify-between border-t border-surface-container">
                <div>
                  <span className="font-label-caps text-label-caps text-primary uppercase block">Kavya M.</span>
                  <span className="font-body-sm text-[11px] text-outline">Mumbai • Verified Owner</span>
                </div>
                <span className="font-label-mono-num text-[11px] text-on-surface-variant uppercase px-2 py-0.5 bg-surface-container">Death's Grasp</span>
              </div>
            </div>
            <div className="p-6 bg-surface-container-low border border-surface-container flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex text-primary">
                    <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  </div>
                  <span className="font-label-mono-num text-[11px] text-outline">2 WEEKS AGO</span>
                </div>
                <p className="font-body-md text-body-md text-on-surface leading-relaxed italic">
                  “Layering the Thorn Choker with the Serpent Ribs completely elevated my everyday all-black outfits. Instant compliments. Fast 3-day delivery to Delhi.”
                </p>
              </div>
              <div className="pt-3 flex items-center justify-between border-t border-surface-container">
                <div>
                  <span className="font-label-caps text-label-caps text-primary uppercase block">Rohan S.</span>
                  <span className="font-body-sm text-[11px] text-outline">New Delhi • Verified Owner</span>
                </div>
                <span className="font-label-mono-num text-[11px] text-on-surface-variant uppercase px-2 py-0.5 bg-surface-container">Thorn Choker</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section J: FAQ Accordion */}
      <section className="w-full bg-surface py-space-xl border-t border-surface-container">
        <div className="max-w-[1000px] mx-auto px-margin md:px-margin-desktop space-y-space-lg">
          <div className="text-center space-y-2">
            <span className="font-label-caps text-label-caps text-outline uppercase tracking-[0.25em]">Atelier Inquiries</span>
            <h2 className="font-headline-lg text-headline-lg text-primary uppercase tracking-tight">FREQUENTLY ASKED QUESTIONS.</h2>
            <p className="font-body-md text-body-md text-outline">Everything you need to know about our metals, sizing, and dispatches.</p>
          </div>
          <div className="space-y-3 pt-space-xs">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className="bg-surface-container-low border border-surface-container transition-colors duration-200">
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none cursor-pointer"
                    type="button"
                  >
                    <span className="font-title-editorial text-title-editorial text-primary tracking-wide">{faq.q}</span>
                    <span
                      className="material-symbols-outlined text-on-surface-variant transition-transform duration-300"
                      style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    >
                      expand_more
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-6 text-on-surface-variant font-body-md text-body-md leading-relaxed border-t border-surface-container pt-4">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section K: Newsletter */}
      <section className="w-full bg-surface-container-high py-space-xl border-t border-surface-container">
        <div className="max-w-[840px] mx-auto px-margin md:px-margin-desktop text-center space-y-space-md">
          <div className="space-y-space-xs">
            <span className="font-label-caps text-label-caps text-on-tertiary-container uppercase tracking-[0.25em]">Inner Sanctum Access</span>
            <h2 className="font-headline-lg lg:font-display-hero text-headline-lg lg:text-headline-lg text-primary uppercase tracking-tight">
              ENTER THE DARKER SIDE.
            </h2>
            <p className="font-body-lg text-body-lg text-outline max-w-lg mx-auto">
              Subscribe to unlock private vault drops, secret batch restocks, and receive <span className="text-primary font-medium">10% OFF</span> your maiden statement piece.
            </p>
          </div>
          <form
            className="max-w-md mx-auto space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              setNewsletterMsg(true);
            }}
          >
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                className="flex-grow h-12 px-4 bg-surface-container-lowest text-primary placeholder-outline font-label-caps text-label-caps focus:outline-none focus:ring-1 focus:ring-secondary transition-all border border-surface-container"
                placeholder="YOUR SACRED EMAIL ADDRESS"
                required
                type="email"
              />
              <button
                className="h-12 px-space-md bg-primary text-on-primary font-label-caps text-label-caps uppercase font-bold tracking-[0.2em] hover:bg-secondary-fixed transition-colors flex-shrink-0 cursor-pointer"
                type="submit"
              >
                CLAIM 10% OFF
              </button>
            </div>
            {newsletterMsg && (
              <div className="text-left p-3 bg-surface-container-lowest border border-surface-container text-on-surface-variant font-body-sm text-body-sm">
                <span className="text-primary font-bold">INVITATION ACCEPTED:</span> Use code <span className="text-primary font-mono">NOCTURNE10</span> for 10% off at checkout.
              </div>
            )}
            <p className="font-body-sm text-[11px] text-outline text-center">
              By subscribing, you agree to receive encrypted dispatches from DRAYEN Atelier. Opt out anytime.
            </p>
          </form>
        </div>
      </section>
    </div>
  );
};
