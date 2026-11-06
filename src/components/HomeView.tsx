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
  const [newsletterMsg, setNewsletterMsg] = useState(false);

  const bestsellers = products.slice(0, 4);
  const newArrivals = products.slice(4, 8);

  return (
    <div className="flex flex-col w-full">
      {/* Primary Brand Grand Entrance Hero */}
      <section className="relative w-full min-h-[85vh] sm:min-h-[90vh] md:min-h-screen bg-black overflow-hidden flex flex-col justify-end border-b border-[#202020]">
        {/* Full-bleed background visual:
            - Desktop: edge-to-edge cover centered
            - Mobile: object-cover focused right on the cross pendant and gothic aesthetic
            - Edge Dissolve & Vignette: radial and directional gradient mask softens and dissolves 
              all outer background elements smoothly into pure deep pitch-black! */}
        <div className="absolute inset-0 w-full h-full">
          <img
            src="/drayen-hero-cross.jpg"
            alt="DRAYEN Rebellion & Luxury Gothic Talismans"
            className="w-full h-full object-cover object-[70%_center] md:object-[60%_center] filter brightness-[0.92] contrast-[1.12]"
          />

          {/* Radial dissolve mask focusing on the cross talisman & gothic statue */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(circle at 60% 50%, rgba(0,0,0,0) 30%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.92) 80%, #000000 100%)'
            }}
          />

          {/* Directional gradients to dissolve top, bottom, and left/right edges into darkness */}
          <div className="absolute inset-x-0 top-0 h-32 md:h-44 bg-gradient-to-b from-black via-black/80 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-48 md:h-64 bg-gradient-to-t from-black via-black/90 to-transparent pointer-events-none" />
          <div className="absolute inset-y-0 left-0 w-24 md:w-48 bg-gradient-to-r from-black via-black/80 to-transparent pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-16 md:w-32 bg-gradient-to-l from-black via-black/70 to-transparent pointer-events-none" />
        </div>

        {/* Content Container with Animated Red Neon Logo Crest & Title */}
        <div className="relative z-10 w-full max-w-4xl mx-auto px-4 pb-10 sm:pb-14 md:pb-16 text-center flex flex-col items-center space-y-6 sm:space-y-8">
          
          {/* Central Animated Neon Crest & Branding Unit */}
          <div className="flex flex-col items-center justify-center space-y-3 sm:space-y-4">
            
            {/* Logo Emblem inside Pulsing Red Neon Light Ring */}
            <div className="relative flex items-center justify-center p-3 sm:p-4 rounded-full bg-black/80 border border-red-600/60 neon-red-box backdrop-blur-md">
              {/* Outer faint neon aura halo */}
              <div className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-red-600/30 via-red-500/20 to-red-600/30 blur-md pointer-events-none" />
              
              <img
                src="/drayen-logo.jpg"
                alt="DRAYEN Crest"
                className="relative z-10 h-8 sm:h-11 md:h-12 w-auto object-contain filter drop-shadow-[0_0_12px_rgba(255,20,60,0.8)]"
              />
            </div>

            {/* Title & Gothic Subtitle with Neon Glow */}
            <div className="space-y-1.5">
              <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl text-white uppercase tracking-[0.25em] sm:tracking-[0.3em] font-bold neon-red-text">
                DRAYEN
              </h1>
              <div className="subtle-blood-divider">
                <span className="font-mono text-[9px] sm:text-[11px] uppercase tracking-[0.35em] text-[#cccccc] font-medium">
                  ARMOR FOR THE SOVEREIGN VOID
                </span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 pt-1">
            <button
              onClick={() => onNavigate('shop')}
              className="w-full sm:w-auto h-12 sm:h-13 px-8 sm:px-10 bg-white hover:bg-[#8B0000] text-black hover:text-white flex items-center justify-center font-mono text-xs tracking-[0.25em] uppercase font-bold transition-all shadow-2xl hover:shadow-[0_0_25px_rgba(139,0,0,0.6)] cursor-pointer"
            >
              EXPLORE COLLECTION
            </button>
            <button
              onClick={() => onNavigate('shop', 'Pendants')}
              className="w-full sm:w-auto h-12 sm:h-13 px-8 sm:px-10 bg-black/90 text-[#F0ECE5] border border-[#333333] hover:border-[#8B0000] hover:text-white flex items-center justify-center font-mono text-xs tracking-[0.25em] uppercase transition-all backdrop-blur-md cursor-pointer"
            >
              VIEW TALISMANS
            </button>
          </div>
        </div>
      </section>

      {/* Section: THE BLOOD PACT (Authentic Ritual Reference Integration) */}
      <section className="relative w-full bg-black py-20 md:py-28 border-b border-[#1c1c1c] overflow-hidden">
        <div className="max-w-[1300px] mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
          {/* Left Column: Authentic Sanguis Bottle Visual */}
          <div className="relative group overflow-hidden border border-[#222222] bg-[#0a0a0a]">
            <img
              src="/the-blood-pact.jpg"
              alt="The Blood Pact - Drayen Atelier"
              className="w-full h-full object-cover filter contrast-[1.15] brightness-[0.9] transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60 pointer-events-none" />
          </div>

          {/* Right Column: Reference Typography & Narrative */}
          <div className="space-y-6 md:space-y-8 flex flex-col justify-center text-left">
            <div className="space-y-2">
              <span className="font-mono text-xs uppercase tracking-[0.3em] text-[#888888] block">
                ATELIER PHILOSOPHY • VOL. III
              </span>
              <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl text-[#8B0000] tracking-wide uppercase font-bold leading-[1.05] blood-glow-text">
                THE BLOOD<br />PACT
              </h2>
            </div>

            <p className="font-mono text-xs sm:text-sm text-[#a3a3a3] uppercase tracking-[0.2em] leading-loose max-w-lg">
              EVERY DROP WE RELEASE REQUIRES A TOLL. WHEN THE VAULT IS EMPTY, THE RELICS DISAPPEAR BACK INTO THE VOID. ACQUIRING A PIECE IS A BLOOD PACT. NO REMORSE.
            </p>

            <div className="pt-2">
              <button
                onClick={() => onNavigate('shop')}
                className="h-12 px-8 bg-white hover:bg-[#8B0000] text-black hover:text-white font-mono text-xs tracking-[0.25em] uppercase font-bold transition-all shadow-lg hover:shadow-[0_0_20px_rgba(139,0,0,0.6)] cursor-pointer"
              >
                SEAL THE PACT
              </button>
            </div>
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
