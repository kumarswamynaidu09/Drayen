import React, { useState, useMemo } from 'react';
import { Product } from '../types';
import { formatINR } from '../lib/money';
import { Search, X, SlidersHorizontal, Grid, Columns } from 'lucide-react';

interface ShopViewProps {
  products?: Product[];
  isLoading?: boolean;
  initialCategory?: string;
  initialSearchQuery?: string;
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

      // Category filter
      if (selectedCategory !== 'All') {
        if (selectedCategory === 'Pendants' && !p.category.toLowerCase().includes('pendant')) return false;
        if (selectedCategory === 'Gothic Necklaces' && !p.category.toLowerCase().includes('necklace') && !p.name.toLowerCase().includes('choker') && !p.name.toLowerCase().includes('chain')) return false;
        if (selectedCategory === 'Chains' && !p.name.toLowerCase().includes('chain') && !p.category.toLowerCase().includes('chain')) return false;
        if (selectedCategory === 'Chokers' && !p.name.toLowerCase().includes('choker') && !p.category.toLowerCase().includes('choker')) return false;
        if (selectedCategory === 'Statement Pieces' && p.selling_price_paise < 69900 && !p.short_description?.toLowerCase().includes('statement')) return false;
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
  };

  const hasActiveFilters = selectedCategory !== 'All' || selectedPriceRange !== 'all' || selectedFinish !== 'all' || searchQuery.trim().length > 0;

  return (
    <div className="flex flex-col w-full text-[#e5e2e1] pt-16">
      {/* Sub-Bar & Breadcrumbs */}
      <section className="w-full bg-[#111111] border-b border-[#222222]">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#888888]">
            <button onClick={onNavigateHome} className="hover:text-white transition-colors cursor-pointer">
              Home
            </button>
            <span className="text-[#444444]">/</span>
            <span className="text-[#888888]">Collections</span>
            <span className="text-[#444444]">/</span>
            <span className="text-white font-semibold">Shop All</span>
          </nav>
          <div className="flex items-center gap-4 text-[#888888] font-mono text-xs">
            <span>Fast Express Dispatch Across India</span>
          </div>
        </div>
      </section>

      {/* Section Title Banner */}
      <section className="w-full bg-[#0e0e0e] py-8 md:py-12 border-b border-[#222222]">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <span className="text-xs uppercase tracking-[0.25em] text-[#888888] font-mono block">
                Direct Handcrafted Atelier
              </span>
              <h1 className="font-serif text-3xl md:text-5xl uppercase tracking-wide text-white">
                Gothic Jewellery Collection
              </h1>
              <p className="text-sm text-[#a0a0a0] font-light max-w-xl leading-relaxed">
                Forged in 316L hypoallergenic surgical steel and hand-oxidized antique silver. Sweatproof, water-resistant, and non-tarnishing.
              </p>
            </div>
            <div className="flex items-baseline gap-2 font-mono text-xs text-[#888888] self-start md:self-end">
              <span className="text-2xl font-bold text-white leading-none">
                {filteredProducts.length}
              </span>
              <span className="tracking-widest uppercase">Pieces Available</span>
            </div>
          </div>
        </div>
      </section>

      {/* Filter & Sort Toolbar Bar */}
      <section className="sticky top-16 z-30 w-full bg-[#141414]/95 backdrop-blur-md border-b border-[#222222]">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
          {/* Left: Search input + Mobile Filter Toggle */}
          <div className="flex items-center gap-3 flex-1 min-w-[280px] max-w-md">
            <button
              onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
              className="lg:hidden flex items-center gap-2 px-3 py-2 bg-[#1c1c1c] text-white font-mono text-xs uppercase tracking-wider cursor-pointer border border-[#303030]"
              type="button"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
            </button>

            {/* In-Page Keyword Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#777777]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by name, finish, symbol..."
                className="w-full bg-[#1a1a1a] border border-[#2c2c2c] pl-9 pr-8 py-2 text-xs text-white placeholder-[#777777] font-mono focus:border-[#651C2D] focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#777777] hover:text-white"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Center: Quick category pill buttons */}
          <div className="hidden sm:flex items-center gap-1.5">
            {['All', 'Pendants', 'Gothic Necklaces', 'Chains', 'Chokers'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer border ${
                  selectedCategory === cat
                    ? 'bg-[#651C2D] text-white border-[#85253b]'
                    : 'bg-[#181818] text-[#888888] hover:text-white border-[#282828]'
                }`}
              >
                {cat === 'Gothic Necklaces' ? 'Necklaces' : cat}
              </button>
            ))}
          </div>

          {/* Right: Sort & Layout Toggle */}
          <div className="flex items-center gap-4 ml-auto">
            <div className="flex items-center gap-2">
              <label className="hidden md:inline font-mono text-xs uppercase text-[#888888]" htmlFor="sortSelector">
                Sort:
              </label>
              <select
                id="sortSelector"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-[#1a1a1a] text-white font-mono text-xs uppercase tracking-wider px-3 py-2 border border-[#2c2c2c] focus:outline-none cursor-pointer"
              >
                <option value="featured">Featured Pieces</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>

            {/* Layout Columns */}
            <div className="hidden md:flex items-center border border-[#2c2c2c] bg-[#1a1a1a] p-0.5">
              <button
                onClick={() => setColCount(3)}
                className={`p-1.5 cursor-pointer ${colCount === 3 ? 'bg-[#2a2a2a] text-white' : 'text-[#666666] hover:text-white'}`}
                title="3 Columns View"
              >
                <Columns className="w-4 h-4" />
              </button>
              <button
                onClick={() => setColCount(4)}
                className={`p-1.5 cursor-pointer ${colCount === 4 ? 'bg-[#2a2a2a] text-white' : 'text-[#666666] hover:text-white'}`}
                title="4 Columns View"
              >
                <Grid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Active Filters Tag Strip */}
        {hasActiveFilters && (
          <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-2 bg-[#101010] border-t border-[#1e1e1e] flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[#777777] uppercase text-[10px] font-mono">Filters:</span>
            {selectedCategory !== 'All' && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#1f1f1f] text-white font-mono text-xs border border-[#333333]">
                {selectedCategory}
                <button onClick={() => setSelectedCategory('All')} className="text-[#888888] hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#1f1f1f] text-white font-mono text-xs border border-[#333333]">
                Keyword: "{searchQuery}"
                <button onClick={() => setSearchQuery('')} className="text-[#888888] hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedPriceRange !== 'all' && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#1f1f1f] text-white font-mono text-xs border border-[#333333]">
                {selectedPriceRange === 'under-499' ? 'Under ₹499' : selectedPriceRange === '500-799' ? '₹500 – ₹799' : '₹800+'}
                <button onClick={() => setSelectedPriceRange('all')} className="text-[#888888] hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedFinish !== 'all' && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#1f1f1f] text-white font-mono text-xs border border-[#333333]">
                {selectedFinish}
                <button onClick={() => setSelectedFinish('all')} className="text-[#888888] hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              onClick={clearAllFilters}
              className="text-xs text-[#888888] hover:text-white underline font-mono uppercase tracking-wider ml-2 cursor-pointer"
            >
              Clear All
            </button>
          </div>
        )}
      </section>

      {/* Main Content Layout: Sidebar + Product Grid */}
      <section className="w-full bg-[#0e0e0e] py-8 md:py-12">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Filter Sidebar */}
            <aside className={`${mobileFilterOpen ? 'block' : 'hidden'} lg:block lg:col-span-3 sticky top-36 space-y-6 pr-4`}>
              {/* Category */}
              <div className="bg-[#141414] p-4 space-y-3 border border-[#262626]">
                <div className="pb-2 border-b border-[#262626]">
                  <span className="font-mono text-xs uppercase tracking-widest text-white font-semibold">Category</span>
                </div>
                <div className="space-y-2 pt-1 font-mono text-xs text-[#a0a0a0]">
                  {['All', 'Pendants', 'Gothic Necklaces', 'Chains', 'Chokers', 'Statement Pieces'].map((cat) => (
                    <label
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
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
                            src={prod.images[0] || 'https://placehold.co/400x500/131313/e5e2e1?text=DRAYEN'}
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
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
