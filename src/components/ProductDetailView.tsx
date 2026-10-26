import React, { useState } from 'react';
import { Product } from '../types';
import { formatINR } from '../lib/money';
import { validateIndianPinCode } from '../lib/validation';

interface ProductDetailViewProps {
  product: Product;
  allProducts: Product[];
  onAddToCart: (product: Product, quantity: number, finish?: string, length?: string) => void;
  onBuyNow: (product: Product, quantity: number, finish?: string, length?: string) => void;
  onSelectProduct: (product: Product) => void;
  onNavigateShop: () => void;
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  product,
  allProducts,
  onAddToCart,
  onBuyNow,
  onSelectProduct,
  onNavigateShop,
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [selectedFinish, setSelectedFinish] = useState<string>(product.finish || 'Antique Silver');
  const [selectedLength, setSelectedLength] = useState<string>(product.chain_length || '20 INCH (50CM)');
  const [quantity, setQuantity] = useState<number>(1);
  const [showChainModal, setShowChainModal] = useState<boolean>(false);
  const [openAccordion, setOpenAccordion] = useState<string | null>('specs');
  const [pincode, setPincode] = useState<string>('');
  const [pincodeMessage, setPincodeMessage] = useState<string | null>(null);

  // Extract variants if available
  const finishVariant = product.variants?.find((v) => v.type === 'finish')?.options || [
    'Antique Silver',
    'Obsidian Black',
  ];
  const lengthVariant = product.variants?.find((v) => v.type === 'length')?.options || [
    '18 INCH (45CM)',
    '20 INCH (50CM)',
    '22 INCH (55CM)',
    '24 INCH (60CM)',
  ];

  const images = product.images.length > 0 ? product.images : [
    'https://placehold.co/600x750/131313/e5e2e1?text=DRAYEN'
  ];

  const handlePincodeCheck = () => {
    if (validateIndianPinCode(pincode)) {
      setPincodeMessage(`Express Dispatch available for PIN ${pincode}: Expected delivery within 2–4 business days via BlueDart / Delhivery Air.`);
    } else {
      setPincodeMessage('Please enter a valid 6-digit Indian PIN code.');
    }
  };

  const relatedProducts = allProducts.filter((p) => p.id !== product.id).slice(0, 4);

  return (
    <div className="flex flex-col w-full">
      {/* Chain Guide Modal */}
      {showChainModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-container-lowest/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-surface-container-low border border-surface-container max-w-lg w-full p-6 md:p-8 relative shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="font-label-caps text-label-caps text-outline uppercase tracking-[0.2em]">
                  Fit Architecture
                </span>
                <h3 className="font-headline-sm text-headline-sm text-primary">Chain Length Dimensions</h3>
              </div>
              <button
                onClick={() => setShowChainModal(false)}
                className="text-on-surface-variant hover:text-primary p-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>
            <div className="space-y-3 font-body-sm text-body-sm text-on-surface-variant">
              <div className="p-3 bg-surface-container flex items-center justify-between border border-surface-container-high">
                <div>
                  <p className="font-semibold text-primary">18 INCH (45 CM)</p>
                  <p className="text-outline text-xs">High clavicle drop; close-fitting collar talisman fit.</p>
                </div>
                <span className="font-label-mono-num text-xs text-primary px-2 py-1 bg-surface-container-high">CHOKER</span>
              </div>
              <div className="p-3 bg-surface-container flex items-center justify-between border border-surface-container-high">
                <div>
                  <p className="font-semibold text-primary">20 INCH (50 CM)</p>
                  <p className="text-outline text-xs">Sits neatly at the collarbone; the contemporary standard.</p>
                </div>
                <span className="font-label-mono-num text-xs text-primary px-2 py-1 bg-surface-container-high">STANDARD</span>
              </div>
              <div className="p-3 bg-surface-container flex items-center justify-between border border-surface-container-high">
                <div>
                  <p className="font-semibold text-primary">22 INCH (55 CM)</p>
                  <p className="text-outline text-xs">Mid-sternum poise; optimal layering baseline.</p>
                </div>
                <span className="font-label-mono-num text-xs text-primary px-2 py-1 bg-surface-container-high">MID-CHEST</span>
              </div>
              <div className="p-3 bg-surface-container flex items-center justify-between border border-surface-container-high">
                <div>
                  <p className="font-semibold text-primary">24 INCH (60 CM)</p>
                  <p className="text-outline text-xs">Deep cavernous drape; sovereign statement overhang.</p>
                </div>
                <span className="font-label-mono-num text-xs text-primary px-2 py-1 bg-surface-container-high">DEEP DROP</span>
              </div>
            </div>
            <button
              onClick={() => setShowChainModal(false)}
              className="w-full py-3 bg-surface-container-high text-primary font-label-caps text-label-caps uppercase hover:bg-surface-bright transition-colors cursor-pointer"
            >
              Dismiss Specification
            </button>
          </div>
        </div>
      )}

      {/* Breadcrumbs */}
      <div className="max-w-[1440px] w-full mx-auto px-margin md:px-margin-desktop pt-6 pb-4 flex flex-wrap items-center justify-between gap-4 border-b border-surface-container">
        <nav className="flex items-center gap-2 font-label-caps text-label-caps uppercase tracking-[0.16em] text-outline">
          <button onClick={onNavigateShop} className="hover:text-primary transition-colors cursor-pointer">
            Home
          </button>
          <span className="text-surface-variant">/</span>
          <button onClick={onNavigateShop} className="hover:text-primary transition-colors cursor-pointer">
            {product.category}
          </button>
          <span className="text-surface-variant">/</span>
          <span className="text-primary font-medium">{product.name}</span>
        </nav>
        <div className="flex items-center gap-2 font-label-mono-num text-label-mono-num text-outline uppercase tracking-widest text-[11px]">
          <span>INDEX NO: {product.sku}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-outline-variant"></span>
          <span className="text-secondary">ARCHIVE VAULT</span>
        </div>
      </div>

      {/* Main Detail Grid */}
      <section className="max-w-[1440px] w-full mx-auto px-margin md:px-margin-desktop py-space-lg">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-desktop items-start">
          {/* Gallery Column */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="relative w-full aspect-[4/5] bg-surface-container-low overflow-hidden group border border-surface-container">
              <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                <span className="px-3 py-1 bg-[#651C2D] text-primary font-label-caps text-label-caps tracking-widest uppercase">
                  Atelier Edition
                </span>
                <span className="px-3 py-1 bg-surface-container-lowest/90 backdrop-blur-md text-on-surface-variant font-label-caps text-label-caps tracking-widest uppercase flex items-center gap-1.5 border border-surface-container">
                  <span className="material-symbols-outlined text-[13px] text-primary">verified</span>
                  Guaranteed Tarnish-Resistant
                </span>
              </div>
              <img
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                src={images[activeImageIndex] || images[0]}
              />
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-2 sm:gap-3">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`aspect-square bg-surface-container-low relative overflow-hidden group focus:outline-none transition-all duration-200 cursor-pointer border ${
                      activeImageIndex === idx ? 'ring-2 ring-primary border-transparent' : 'border-surface-container opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img alt={`View ${idx + 1}`} className="w-full h-full object-cover" src={img} />
                    <span className="absolute bottom-1 left-1 font-label-mono-num text-[9px] bg-surface-container-lowest/90 px-1 text-primary">
                      0{idx + 1}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Micro banner */}
            <div className="mt-2 p-4 bg-surface-container border border-surface-container-high flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[20px] text-primary">shield</span>
                <div className="space-y-0.5">
                  <p className="font-label-caps text-label-caps text-primary tracking-wider uppercase">
                    Forged in {product.material}
                  </p>
                  <p className="font-body-sm text-body-sm text-outline">Impervious to salt water, sweat, heat, and corrosion.</p>
                </div>
              </div>
              <span className="font-label-mono-num text-xs text-outline hidden sm:block">LIFETIME ATELIER COVENANT</span>
            </div>
          </div>

          {/* Specs & Buy Column */}
          <div className="lg:col-span-5 flex flex-col space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-label-caps text-label-caps text-outline uppercase tracking-[0.2em]">
                  TALISMAN ARCHIVE / {product.sku}
                </span>
                <span className={`font-label-caps text-label-caps px-2 py-0.5 tracking-widest uppercase border ${
                  product.stock_quantity > 0
                    ? 'bg-surface-container-high text-secondary border-surface-container-highest'
                    : 'bg-error-container text-error border-error'
                }`}>
                  {product.stock_quantity > 0 ? `IN STOCK (${product.stock_quantity} AVAILABLE)` : 'OUT OF STOCK'}
                </span>
              </div>
              <h1 className="font-headline-lg text-headline-lg text-primary tracking-normal">{product.name}</h1>
              <div className="flex items-center gap-3 pt-1">
                <div className="flex text-primary text-[14px]">
                  <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                </div>
                <span className="font-label-mono-num text-label-mono-num text-on-surface-variant">
                  4.9 / 5.0 (ATELIER VERIFIED)
                </span>
              </div>
            </div>

            {/* Price Block */}
            <div className="p-4 bg-surface-container-low border border-surface-container flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-baseline gap-3">
                <span className="font-headline-md text-headline-md font-semibold text-primary">
                  {formatINR(product.selling_price_paise)}
                </span>
                {product.original_price_paise && (
                  <span className="font-body-lg text-body-lg line-through text-outline">
                    {formatINR(product.original_price_paise)}
                  </span>
                )}
              </div>
              {product.original_price_paise && (
                <span className="font-label-caps text-label-caps bg-on-tertiary-container text-primary px-3 py-1 tracking-wider uppercase">
                  Save {Math.round(((product.original_price_paise - product.selling_price_paise) / product.original_price_paise) * 100)}%
                </span>
              )}
            </div>

            {/* Narrative Description */}
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              {product.full_description || product.short_description}
            </p>

            {/* Finish Selector */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between font-label-caps text-label-caps uppercase tracking-wider">
                <span className="text-on-surface-variant">Selected Finish: <strong className="text-primary">{selectedFinish}</strong></span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {finishVariant.map((fin) => (
                  <button
                    key={fin}
                    type="button"
                    onClick={() => setSelectedFinish(fin)}
                    className={`flex items-center gap-3 p-3 transition-all cursor-pointer border ${
                      selectedFinish === fin
                        ? 'bg-surface-container-high border-primary text-primary'
                        : 'bg-surface-container border-surface-container-high text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full bg-slate-300 border border-surface-container-highest"></span>
                    <span className="font-label-caps text-label-caps uppercase tracking-widest text-left">{fin}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Chain Length Selector */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="font-label-caps text-label-caps uppercase text-on-surface-variant tracking-wider">
                  Chain Length: <strong className="text-primary">{selectedLength}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setShowChainModal(true)}
                  className="font-label-caps text-label-caps text-secondary hover:text-primary transition-colors uppercase tracking-widest flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px]">straighten</span>
                  Length Guide
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {lengthVariant.map((len) => (
                  <button
                    key={len}
                    type="button"
                    onClick={() => setSelectedLength(len)}
                    className={`p-3 text-left transition-all cursor-pointer border ${
                      selectedLength === len
                        ? 'bg-surface-container-high border-primary text-primary'
                        : 'bg-surface-container border-surface-container-high text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    <p className="font-label-caps text-label-caps text-primary tracking-wider uppercase">{len}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity & Add to Cart */}
            <div className="space-y-3 pt-3">
              <div className="flex items-center gap-3">
                {/* Quantity Box */}
                <div className="flex items-center bg-surface-container h-12 w-32 justify-between px-3 border border-surface-container-high">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="text-on-surface-variant hover:text-primary text-lg font-bold p-1 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="font-label-mono-num text-label-mono-num text-primary font-bold">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock_quantity || 10, quantity + 1))}
                    className="text-on-surface-variant hover:text-primary text-lg font-bold p-1 cursor-pointer"
                  >
                    +
                  </button>
                </div>
                {/* Add to Bag */}
                <button
                  onClick={() => onAddToCart(product, quantity, selectedFinish, selectedLength)}
                  disabled={product.stock_quantity <= 0}
                  className="flex-1 h-12 bg-primary text-on-primary font-label-caps text-label-caps uppercase tracking-[0.18em] hover:bg-secondary-fixed transition-colors flex items-center justify-center gap-2 font-bold shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">shopping_bag</span>
                  <span>ADD TO BAG — {formatINR(product.selling_price_paise * quantity)}</span>
                </button>
              </div>

              {/* Buy It Now Direct */}
              <button
                onClick={() => onBuyNow(product, quantity, selectedFinish, selectedLength)}
                disabled={product.stock_quantity <= 0}
                className="w-full h-12 bg-[#651C2D] text-primary font-label-caps text-label-caps uppercase tracking-[0.2em] hover:bg-on-tertiary-container transition-colors flex items-center justify-center gap-2 font-bold shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                type="button"
              >
                <span>BUY IT NOW</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>

            {/* Pincode Estimator */}
            <div className="p-4 bg-surface-container border border-surface-container-high space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-label-caps text-label-caps uppercase text-primary tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-outline">local_shipping</span>
                  Dispatch &amp; Delivery Estimator
                </span>
                <span className="font-label-mono-num text-[11px] text-outline uppercase">ALL-INDIA AIR EXPRESS</span>
              </div>
              <div className="flex gap-2">
                <input
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/[^0-9]/g, ''))}
                  className="flex-1 h-11 px-3 bg-surface-container-high text-primary font-label-mono-num text-label-mono-num placeholder:text-outline border border-surface-container-highest focus:outline-none"
                  maxLength={6}
                  placeholder="Enter 6-Digit PIN Code"
                  type="text"
                />
                <button
                  onClick={handlePincodeCheck}
                  className="px-5 h-11 bg-surface-bright text-primary font-label-caps text-label-caps uppercase tracking-wider hover:bg-secondary-container transition-colors cursor-pointer"
                  type="button"
                >
                  Check
                </button>
              </div>
              {pincodeMessage && (
                <p className="font-body-sm text-body-sm text-on-surface-variant pt-1">{pincodeMessage}</p>
              )}
            </div>

            {/* Triad Badges */}
            <div className="grid grid-cols-3 gap-2 py-3 bg-surface-container-low border border-surface-container p-3 text-center">
              <div className="space-y-1">
                <span className="material-symbols-outlined text-[20px] text-primary">local_shipping</span>
                <p className="font-label-caps text-[10px] tracking-wider text-primary uppercase">Free Shipping</p>
                <p className="text-[11px] text-outline">Orders Above ₹499</p>
              </div>
              <div className="space-y-1">
                <span className="material-symbols-outlined text-[20px] text-primary">replay</span>
                <p className="font-label-caps text-[10px] tracking-wider text-primary uppercase">7-Day Returns</p>
                <p className="text-[11px] text-outline">No-Hassle Exchange</p>
              </div>
              <div className="space-y-1">
                <span className="material-symbols-outlined text-[20px] text-primary">water_drop</span>
                <p className="font-label-caps text-[10px] tracking-wider text-primary uppercase">Sweat &amp; Water Proof</p>
                <p className="text-[11px] text-outline">Active 316L Steel</p>
              </div>
            </div>

            {/* Technical Specifications Accordion */}
            <div className="space-y-2 pt-2">
              <div className="bg-surface-container-low border border-surface-container overflow-hidden">
                <button
                  onClick={() => setOpenAccordion(openAccordion === 'specs' ? null : 'specs')}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-surface-container transition-colors cursor-pointer"
                >
                  <span className="font-label-caps text-label-caps uppercase tracking-[0.16em] text-primary">
                    Full Architectural Specifications
                  </span>
                  <span
                    className="material-symbols-outlined text-[20px] text-outline transition-transform duration-300"
                    style={{ transform: openAccordion === 'specs' ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  >
                    expand_more
                  </span>
                </button>
                {openAccordion === 'specs' && (
                  <div className="p-4 pt-0 font-body-sm text-body-sm text-on-surface-variant border-t border-surface-container">
                    <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 pt-3">
                      <div>
                        <span className="text-outline uppercase text-[10px] tracking-wider font-semibold block">Dimensions</span>
                        <p className="font-label-mono-num text-primary">
                          {product.pendant_height || '42mm'} × {product.pendant_width || '26mm'}
                        </p>
                      </div>
                      <div>
                        <span className="text-outline uppercase text-[10px] tracking-wider font-semibold block">Thickness</span>
                        <p className="font-label-mono-num text-primary">{product.pendant_thickness || '3.5mm Solid Core'}</p>
                      </div>
                      <div>
                        <span className="text-outline uppercase text-[10px] tracking-wider font-semibold block">Gross Weight</span>
                        <p className="font-label-mono-num text-primary">{product.pendant_weight || '18 Grams'}</p>
                      </div>
                      <div>
                        <span className="text-outline uppercase text-[10px] tracking-wider font-semibold block">Base Metallurgy</span>
                        <p className="text-primary">{product.material}</p>
                      </div>
                      <div>
                        <span className="text-outline uppercase text-[10px] tracking-wider font-semibold block">Locking Clasp</span>
                        <p className="text-primary">{product.clasp_type || 'Heavy-duty Lobster Clasp'}</p>
                      </div>
                      <div>
                        <span className="text-outline uppercase text-[10px] tracking-wider font-semibold block">Detachable Bail</span>
                        <p className="text-primary">{product.is_detachable ? 'Yes' : 'Integrated'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Care Accordion */}
              <div className="bg-surface-container-low border border-surface-container overflow-hidden">
                <button
                  onClick={() => setOpenAccordion(openAccordion === 'care' ? null : 'care')}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-surface-container transition-colors cursor-pointer"
                >
                  <span className="font-label-caps text-label-caps uppercase tracking-[0.16em] text-primary">
                    Care &amp; Nocturnal Cleansing
                  </span>
                  <span
                    className="material-symbols-outlined text-[20px] text-outline transition-transform duration-300"
                    style={{ transform: openAccordion === 'care' ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  >
                    expand_more
                  </span>
                </button>
                {openAccordion === 'care' && (
                  <div className="p-4 pt-0 font-body-sm text-body-sm text-on-surface-variant border-t border-surface-container pt-3 space-y-2">
                    <p>{product.care_instructions || 'Rinse with clean water and wipe dry with microfiber fleece.'}</p>
                    <p className="text-outline">Store separately within the padded DRAYEN Sanctum vault pouch.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Complete The Look */}
      {relatedProducts.length > 0 && (
        <section className="max-w-[1440px] w-full mx-auto px-margin md:px-margin-desktop py-space-xl border-t border-surface-container">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-space-md">
            <div>
              <span className="font-label-caps text-label-caps text-outline uppercase tracking-[0.2em] block mb-1">
                Curated Ensemble
              </span>
              <h2 className="font-headline-md text-headline-md text-primary">Complete The Look</h2>
            </div>
            <button
              onClick={onNavigateShop}
              className="font-label-caps text-label-caps uppercase text-on-surface-variant hover:text-primary transition-colors tracking-widest flex items-center gap-1 cursor-pointer"
            >
              Explore All Talismans <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter-desktop">
            {relatedProducts.map((rel) => (
              <div key={rel.id} className="group bg-surface-container-low border border-surface-container flex flex-col justify-between">
                <div
                  onClick={() => onSelectProduct(rel)}
                  className="relative aspect-[4/5] bg-surface-container overflow-hidden cursor-pointer"
                >
                  <img
                    alt={rel.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    src={rel.images[0] || 'https://placehold.co/400x500/131313/e5e2e1?text=DRAYEN'}
                  />
                  <span className="absolute top-3 left-3 bg-surface-container-lowest/80 px-2.5 py-1 font-label-caps text-[10px] text-primary uppercase tracking-widest">
                    {rel.category}
                  </span>
                </div>
                <div className="p-4 space-y-2">
                  <h4
                    onClick={() => onSelectProduct(rel)}
                    className="font-title-editorial text-title-editorial text-primary cursor-pointer hover:underline truncate"
                  >
                    {rel.name}
                  </h4>
                  <div className="flex items-center justify-between pt-2 border-t border-surface-container/60">
                    <span className="font-label-mono-num text-label-mono-num text-primary font-semibold">
                      {formatINR(rel.selling_price_paise)}
                    </span>
                    <button
                      onClick={() => onAddToCart(rel, 1)}
                      className="font-label-caps text-label-caps uppercase text-secondary hover:text-primary transition-colors tracking-widest cursor-pointer"
                    >
                      + Add
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
