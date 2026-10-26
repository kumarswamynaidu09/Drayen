import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Product } from '../types';
import { formatINR } from '../lib/money';
import { Search, X, ArrowRight } from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onNavigateToShop: (category?: string, query?: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  products = [],
  onSelectProduct,
  onNavigateToShop,
}) => {
  const [query, setQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setSelectedTag(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const quickTags = ['Pendants', 'Necklaces', 'Chains', 'Silver', 'Black PVD', 'Under ₹500'];

  const handleTagClick = (tag: string) => {
    if (selectedTag === tag) {
      setSelectedTag(null);
    } else {
      setSelectedTag(tag);
      if (tag === 'Under ₹500') {
        setQuery('');
      } else {
        setQuery(tag);
      }
    }
  };

  const results = useMemo(() => {
    let list = Array.isArray(products) ? products : [];
    
    if (selectedTag === 'Under ₹500') {
      list = list.filter((p) => p.selling_price_paise < 50000);
    }

    const q = query.trim().toLowerCase();
    if (!q) return list.slice(0, 6);

    return list.filter((p) => {
      const matchName = p.name?.toLowerCase().includes(q);
      const matchCat = p.category?.toLowerCase().includes(q);
      const matchFinish = p.finish?.toLowerCase().includes(q);
      const matchDesc = p.short_description?.toLowerCase().includes(q) || p.full_description?.toLowerCase().includes(q);
      return matchName || matchCat || matchFinish || matchDesc;
    });
  }, [products, query, selectedTag]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/80 backdrop-blur-md transition-opacity"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-[#141414] border border-[#262626] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 p-4 border-b border-[#262626] bg-[#181818]">
          <Search className="w-5 h-5 text-[#888888] flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedTag(null);
            }}
            placeholder="Search necklaces, cross pendants, finishes..."
            className="w-full bg-transparent text-white placeholder-[#777777] text-base focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-[#888888] hover:text-white transition-colors p-1"
              aria-label="Clear query"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs uppercase tracking-widest text-[#888888] hover:text-white px-2 py-1 border border-[#333333] transition-colors"
          >
            Esc
          </button>
        </div>

        {/* Quick Suggestion Tags */}
        <div className="px-4 py-2.5 bg-[#121212] border-b border-[#222222] flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[#666666] uppercase tracking-wider text-[11px] mr-1">Quick:</span>
          {quickTags.map((tag) => (
            <button
              key={tag}
              onClick={() => handleTagClick(tag)}
              className={`px-2.5 py-1 text-xs transition-colors cursor-pointer border ${
                selectedTag === tag || query.toLowerCase() === tag.toLowerCase()
                  ? 'bg-[#651C2D] border-[#85253b] text-white'
                  : 'bg-[#1a1a1a] border-[#2c2c2c] text-[#a0a0a0] hover:text-white hover:border-[#444444]'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#202020] p-2">
          {results.length === 0 ? (
            <div className="py-12 text-center text-[#888888] space-y-2">
              <p className="text-sm">No items found matching "{query}"</p>
              <button
                onClick={() => {
                  onClose();
                  onNavigateToShop();
                }}
                className="text-xs text-[#c9a87c] hover:underline uppercase tracking-wider"
              >
                View all collection pieces →
              </button>
            </div>
          ) : (
            results.map((product) => (
              <div
                key={product.id}
                onClick={() => {
                  onClose();
                  onSelectProduct(product);
                }}
                className="flex items-center gap-4 p-3 hover:bg-[#1c1c1c] transition-colors cursor-pointer group"
              >
                <div className="w-14 h-16 bg-[#1a1a1a] flex-shrink-0 overflow-hidden border border-[#2a2a2a]">
                  <img
                    src={product.images[0] || 'https://placehold.co/100x120/131313/e5e2e1?text=DRAYEN'}
                    alt={product.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] uppercase tracking-widest text-[#777777] block">
                    {product.category} · {product.finish}
                  </span>
                  <h4 className="text-sm font-medium text-white truncate group-hover:text-[#c9a87c] transition-colors">
                    {product.name}
                  </h4>
                  <span className="text-xs font-mono text-[#dcdcdc] block mt-0.5">
                    {formatINR(product.selling_price_paise)}
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-[#555555] group-hover:text-white transition-colors group-hover:translate-x-1" />
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#111111] border-t border-[#262626] flex items-center justify-between text-xs text-[#777777]">
          <span>{results.length} pieces shown</span>
          <button
            onClick={() => {
              onClose();
              onNavigateToShop(undefined, query);
            }}
            className="text-white hover:text-[#c9a87c] transition-colors uppercase tracking-wider font-medium"
          >
            Explore all in Catalogue →
          </button>
        </div>
      </div>
    </div>
  );
};
