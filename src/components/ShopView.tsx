import React, { useState, useMemo, useEffect } from 'react';
import { Product } from '../types';
import { formatINR } from '../lib/money';
import { Search, X, SlidersHorizontal, Grid, Columns } from 'lucide-react';

interface ShopViewProps {
  products?: Product[];
  isLoading?: boolean;
  initialCategory?: string;
  initialSearchQuery?: string;
  onCategoryChange?: (category: string) => void;
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product, quantity?: number) => void;
  onToggleWishlist: (productId: string) => void;
  wishlistIds?: string[];
  onNavigateHome: () => void;
}

export const ShopView: React.FC<ShopViewProps> = ({
  products = [],
  isLoading = false,
  initialCategory,
  initialSearchQuery = '',
  onCategoryChange,
  onSelectProduct,
  onAddToCart,
  onToggleWishlist,
  wishlistIds = [],
  onNavigateHome,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'All');
  const [searchQuery, setSearchQuery] = useState<string>(initialSearchQuery || '');
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('all');
  const [selectedFinish, setSelectedFinish] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('featured');
  const [colCount, setColCount] = useState<number>(3);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Sync category with external prop changes (e.g. clicking top navigation bar)
  useEffect(() => {
    if (!initialCategory || initialCategory === 'All' || initialCategory.toLowerCase() === 'all') {
      setSelectedCategory('All');
    } else {
      const catLower = initialCategory.toLowerCase();
      if (catLower.includes('necklace')) {
        setSelectedCategory('Gothic Necklaces');
      } else if (catLower.includes('pendant')) {
        setSelectedCategory('Pendants');
      } else if (catLower.includes('chain')) {
        setSelectedCategory('Chains');
      } else if (catLower.includes('choker')) {
        setSelectedCategory('Chokers');
      } else {
        setSelectedCategory(initialCategory);
      }
    }
  }, [initialCategory]);

  // Sync search query from external prop changes
  useEffect(() => {
    if (initialSearchQuery !== undefined) {
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  const handleCategorySelect = (cat: string) => {
    setSelectedCategory(cat);
    onCategoryChange?.(cat);
  };

  // Filter and sort pure logic
  const filteredProducts = useMemo(() => {
    const list = Array.isArray(products) ? products : [];
    return list.filter((p) => {
      // Search query filter
      if (searchQuery && searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = p.name?.toLowerCase().includes(q);
        const matchesCategory = p.category?.toLowerCase().includes(q);
        const matchesDesc = p.short_description?.toLowerCase().includes(q) || p.full_description?.toLowerCase().includes(q);
        const matchesFinish = p.finish?.toLowerCase().includes(q);
        if (!matchesName && !matchesCategory && !matchesDesc && !matchesFinish) return false;
      }

      // Category filter with flexible matching
      if (selectedCategory !== 'All') {
        const catLower = selectedCategory.toLowerCase();
        const pCat = (p.category || '').toLowerCase();
        const pName = (p.name || '').toLowerCase();
        const pDesc = (p.short_description || '').toLowerCase();

        if (catLower.includes('pendant')) {
          if (!pCat.includes('pendant') && !pName.includes('pendant')) return false;
        } else if (catLower.includes('necklace')) {
          if (!pCat.includes('necklace') && !pName.includes('necklace') && !pName.includes('chain') && !pName.includes('choker')) return false;
        } else if (catLower.includes('chain')) {
          if (!pName.includes('chain') && !pCat.includes('chain')) return false;
        } else if (catLower.includes('choker')) {
          if (!pName.includes('choker') && !pCat.includes('choker')) return false;
        } else if (catLower.includes('statement')) {
          if (p.selling_price_paise < 69900 && !pDesc.includes('statement')) return false;
        } else {
          if (!pCat.includes(catLower) && !pName.includes(catLower)) return false;
        }
      }

      // Price filter
      if (selectedPriceRange === 'under-499' && p.selling_price_paise >= 50000) return false;
      if (selectedPriceRange === '500-799' && (p.selling_price_paise < 50000 || p.selling_price_paise > 79900)) return false;
      if (selectedPriceRange === '800-plus' && p.selling_price_paise < 80000) return false;

      // Finish filter
      if (selectedFinish === 'silver' && !p.finish.toLowerCase().includes('silver')) return false;
      if (selectedFinish === 'black' && !p.finish.toLowerCase().includes('black') && !p.finish.toLowerCase().includes('pvd')) return false;
      if (selectedFinish === 'steel' && !p.finish.toLowerCase().includes('steel')) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return a.selling_price_paise - b.selling_price_paise;
      if (sortBy === 'price-desc') return b.selling_price_paise - a.selling_price_paise;
      return 0; // featured default
    });
  }, [products, selectedCategory, selectedPriceRange, selectedFinish, sortBy, searchQuery]);

  const clearAllFilters = () => {
    setSelectedCategory('All');
    setSelectedPriceRange('all');
    setSelectedFinish('all');
    setSortBy('featured');
    setSearchQuery('');
    onCategoryChange?.('All');
  };

  const hasActiveFilters = selectedCategory !== 'All' || selectedPriceRange !== 'all' || selectedFinish !== 'all' || searchQuery.trim().length > 0;

  return (
    <div className="flex flex-col w-full text-[#e5e2e1]">

      {/* Section Title Banner — Sleek and compact with dynamic category title */}
      <section className="w-full bg-[#0c0c0c] py-4 md:py-5 border-b border-[#202020]">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-[#888888]">
                <span>Direct Handcrafted Atelier</span>
                <span>•</span>
                <span className="text-[#BFC0C2]">{selectedCategory === 'All' ? 'Full Vault' : selectedCategory}</span>
              </div>
              <h1 className="font-serif text-2xl md:text-3xl uppercase tracking-wide text-white">
                {selectedCategory === 'All'
                  ? 'Gothic Jewellery Collection'
                  : selectedCategory.toLowerCase().includes('necklace')
                  ? 'Gothic Necklaces Collection'
                  : `${selectedCategory} Collection`}
              </h1>
              <p className="text-xs text-[#8e8e8e] font-light max-w-xl">
                Forged in 316L hypoallergenic surgical steel and hand-oxidized antique silver. Sweatproof and non-tarnishing.
              </p>
            </div>
            <div className="flex items-center gap-4 self-start sm:self-auto">
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="text-[11px] font-mono text-[#888888] hover:text-white underline cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
              <div className="flex items-baseline gap-1.5 font-mono text-xs text-[#888888]">
                <span className="text-xl font-bold text-white leading-none">
                  {filteredProducts.length}
                </span>
                <span className="tracking-widest uppercase text-[10px]">Pieces Available</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Layout: Sidebar + Product Grid */}
      <section className="w-full bg-[#0a0a0a] py-6 md:py-8">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Filter Sidebar */}
            <aside className={`${mobileFilterOpen ? 'block' : 'hidden'} lg:block lg:col-span-3 sticky top-20 space-y-6 pr-4`}>
              {/* Category */}
              <div className="bg-[#141414] p-4 space-y-3 border border-[#262626]">
                <div className="pb-2 border-b border-[#262626]">
                  <span className="font-mono text-xs uppercase tracking-widest text-white font-semibold">Category</span>
                </div>
                <div className="space-y-2 pt-1 font-mono text-xs text-[#a0a0a0]">
                  {['All', 'Pendants', 'Gothic Necklaces', 'Chains', 'Chokers', 'Statement Pieces'].map((cat) => (
                    <label
                      key={cat}
                      onClick={() => handleCategorySelect(cat)}
                      className="flex items-center justify-between cursor-pointer hover:text-white transition-colors group py-0.5"
                    >
                      <span className="flex items-center gap-2.5">
                        <span className="w-3.5 h-3.5 bg-[#1f1f1f] flex items-center justify-center border border-[#383838]">
                          {selectedCategory === cat && <span className="w-1.5 h-1.5 bg-[#651C2D]"></span>}
                        </span>
                        {cat}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="bg-[#141414] p-4 space-y-3 border border-[#262626]">
                <div className="pb-2 border-b border-[#262626]">
                  <span className="font-mono text-xs uppercase tracking-widest text-white font-semibold">Price Range</span>
                </div>
                <div className="space-y-2 pt-1 font-mono text-xs text-[#a0a0a0]">
                  {[
                    { id: 'all', label: 'All Prices' },
                    { id: 'under-499', label: 'Under ₹499' },
                    { id: '500-799', label: '₹500 – ₹799' },
                    { id: '800-plus', label: '₹800 and Above' },
                  ].map((range) => (
                    <label
                      key={range.id}
                      onClick={() => setSelectedPriceRange(range.id)}
                      className="flex items-center justify-between cursor-pointer hover:text-white transition-colors group py-0.5"
                    >
                      <span className="flex items-center gap-2.5">
                        <span className="w-3.5 h-3.5 bg-[#1f1f1f] flex items-center justify-center border border-[#383838]">
                          {selectedPriceRange === range.id && <span className="w-1.5 h-1.5 bg-[#651C2D]"></span>}
                        </span>
                        {range.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Finish */}
              <div className="bg-[#141414] p-4 space-y-3 border border-[#262626]">
                <div className="pb-2 border-b border-[#262626]">
                  <span className="font-mono text-xs uppercase tracking-widest text-white font-semibold">Metallurgy Finish</span>
                </div>
                <div className="space-y-2 pt-1 font-mono text-xs text-[#a0a0a0]">
                  {[
                    { id: 'all', label: 'All Metallurgy' },
                    { id: 'silver', label: 'Antique Silver (.925 Look)' },
                    { id: 'black', label: 'Obsidian Black PVD' },
                    { id: 'steel', label: 'Raw 316L Stainless Steel' },
                  ].map((fin) => (
                    <label
                      key={fin.id}
                      onClick={() => setSelectedFinish(fin.id)}
                      className="flex items-center justify-between cursor-pointer hover:text-white transition-colors group py-0.5"
                    >
                      <span className="flex items-center gap-2.5">
                        <span className="w-3.5 h-3.5 bg-[#1f1f1f] flex items-center justify-center border border-[#383838]">
                          {selectedFinish === fin.id && <span className="w-1.5 h-1.5 bg-[#651C2D]"></span>}
                        </span>
                        {fin.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Quality Guarantee Card */}
              <div className="p-4 bg-[#141414] border border-[#262626] space-y-2">
                <span className="font-serif text-sm text-white font-semibold block">Craftsmanship Guarantee</span>
                <p className="text-xs text-[#888888] leading-relaxed">
                  Every talisman is hypoallergenic, sweatproof, and backed by our Lifetime Tarnish-Proof Promise.
                </p>
              </div>
            </aside>

            {/* Product Grid Area */}
            <div className="lg:col-span-9 space-y-6">
              {isLoading ? (
                <div className="py-24 text-center text-[#888888] font-mono text-xs uppercase tracking-widest">
                  Loading Jewellery Collection...
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="p-16 text-center bg-[#141414] border border-[#262626] space-y-4">
                  <h3 className="font-serif text-xl text-white">No matching pieces found.</h3>
                  <p className="text-xs text-[#888888] max-w-md mx-auto leading-relaxed">
                    Try adjusting your keyword search or resetting the active filters.
                  </p>
                  {hasActiveFilters && (
                    <button
                      onClick={clearAllFilters}
                      className="px-6 py-2.5 bg-[#651C2D] text-white font-mono text-xs uppercase tracking-widest hover:bg-[#85253b] transition-colors cursor-pointer"
                    >
                      Reset All Filters
                    </button>
                  )}
                </div>
              ) : (
                <div
                  className={`grid grid-cols-1 sm:grid-cols-2 ${
                    colCount === 4 ? 'md:grid-cols-4' : 'md:grid-cols-3'
                  } gap-6`}
                >
                  {filteredProducts.map((prod) => {
                    const isSaved = wishlistIds.includes(prod.id);
                    return (
                      <article
                        key={prod.id}
                        className="group bg-[#141414] border border-[#262626] flex flex-col justify-between transition-all hover:border-[#404040]"
                      >
                        <div className="relative w-full aspect-[4/5] bg-[#111111] overflow-hidden">
                          {prod.original_price_paise && prod.original_price_paise > prod.selling_price_paise && (
                            <div className="absolute top-3 left-3 z-10 bg-[#651C2D] text-white px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest">
                              -{Math.round(((prod.original_price_paise - prod.selling_price_paise) / prod.original_price_paise) * 100)}%
                            </div>
                          )}
                          <button
                            onClick={() => onToggleWishlist(prod.id)}
                            aria-label={`Save ${prod.name}`}
                            className="absolute top-3 right-3 z-10 w-8 h-8 bg-black/60 backdrop-blur-sm text-[#888888] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <span
                              className={`material-symbols-outlined text-[18px] ${
                                isSaved ? 'text-red-400' : ''
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
                          <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black via-black/80 to-transparent flex items-center gap-2 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
                            <button
                              onClick={() => onAddToCart(prod, 1)}
                              className="flex-1 py-2.5 bg-[#651C2D] text-white font-mono text-xs uppercase tracking-wider hover:bg-[#85253b] transition-colors cursor-pointer font-bold"
                              type="button"
                            >
                              Add to Bag
                            </button>
                            <button
                              onClick={() => onSelectProduct(prod)}
                              aria-label={`View ${prod.name}`}
                              className="p-2.5 bg-[#252525] text-white hover:bg-[#333333] transition-colors cursor-pointer"
                              type="button"
                              title="View details"
                            >
                              <span className="material-symbols-outlined text-[18px]">visibility</span>
                            </button>
                          </div>
                        </div>

                        {/* Details */}
                        <div className="p-4 space-y-2 flex flex-col justify-between flex-1">
                          <div>
                            <div className="flex items-center justify-between text-[#888888] font-mono text-[10px] uppercase tracking-wider mb-1">
                              <span>{prod.category}</span>
                              <span className="text-[#666666] truncate max-w-[120px]">{prod.finish}</span>
                            </div>
                            <h3
                              onClick={() => onSelectProduct(prod)}
                              className="font-serif text-base text-white tracking-wide hover:underline cursor-pointer"
                            >
                              {prod.name}
                            </h3>
                          </div>
                          <div className="pt-2 flex items-baseline justify-between border-t border-[#222222]">
                            <div className="flex items-baseline gap-2 font-mono text-xs">
                              <span className="text-white font-semibold text-sm">
                                {formatINR(prod.selling_price_paise)}
                              </span>
                              {prod.original_price_paise && (
                                <span className="text-[#666666] line-through text-[11px]">
                                  {formatINR(prod.original_price_paise)}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-[#888888] font-mono">In Stock</span>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
