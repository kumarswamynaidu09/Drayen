import React from 'react';
import { Product } from '../types';
import { formatINR } from '../lib/money';
import { X, ShoppingBag, Trash2, Heart, ArrowRight } from 'lucide-react';

interface WishlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  wishlistIds: string[];
  products: Product[];
  onToggleWishlist: (productId: string) => void;
  onAddToCart: (product: Product, quantity?: number) => void;
  onSelectProduct: (product: Product) => void;
  onNavigateToShop: () => void;
}

export const WishlistDrawer: React.FC<WishlistDrawerProps> = ({
  isOpen,
  onClose,
  wishlistIds,
  products,
  onToggleWishlist,
  onAddToCart,
  onSelectProduct,
  onNavigateToShop,
}) => {
  if (!isOpen) return null;

  const savedProducts = products.filter((p) => wishlistIds.includes(p.id));

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md h-full bg-[#131313] border-l border-[#262626] flex flex-col justify-between shadow-2xl text-[#e5e2e1]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-[#262626] flex items-center justify-between bg-[#171717]">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-[#651C2D] fill-[#651C2D]" />
            <h3 className="font-serif text-lg tracking-wide text-white uppercase">Saved Pieces</h3>
            <span className="font-mono text-xs text-[#888888] px-2 py-0.5 bg-[#202020] border border-[#303030]">
              {savedProducts.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#888888] hover:text-white transition-colors cursor-pointer"
            aria-label="Close Wishlist"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wishlist Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {savedProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-16">
              <Heart className="w-12 h-12 text-[#333333] stroke-1" />
              <p className="font-serif text-lg text-white">Your wishlist is empty</p>
              <p className="text-xs text-[#888888] max-w-xs leading-relaxed">
                Save pieces you desire by tapping the heart icon on any talisman or necklace.
              </p>
              <button
                onClick={() => {
                  onClose();
                  onNavigateToShop();
                }}
                className="mt-3 px-6 py-2.5 bg-[#651C2D] text-white hover:bg-[#85253b] font-mono text-xs uppercase tracking-widest transition-colors cursor-pointer flex items-center gap-2"
              >
                <span>Browse Collection</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            savedProducts.map((prod) => (
              <div
                key={prod.id}
                className="flex gap-3 p-3 bg-[#181818] border border-[#2a2a2a] group hover:border-[#383838] transition-colors"
              >
                <div 
                  onClick={() => {
                    onClose();
                    onSelectProduct(prod);
                  }}
                  className="w-20 h-24 bg-[#111111] flex-shrink-0 overflow-hidden cursor-pointer"
                >
                  <img
                    src={prod.images[0] || '/assets/aistudio/Image_1_2990c1d6.png'}
                    alt={prod.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/assets/aistudio/Image_1_2990c1d6.png';
                    }}
                  />
                </div>
                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div>
                    <div className="flex items-start justify-between gap-1">
                      <h4 
                        onClick={() => {
                          onClose();
                          onSelectProduct(prod);
                        }}
                        className="font-serif text-sm text-white truncate cursor-pointer hover:underline"
                      >
                        {prod.name}
                      </h4>
                      <button
                        onClick={() => onToggleWishlist(prod.id)}
                        className="text-[#666666] hover:text-red-400 transition-colors p-1"
                        title="Remove from wishlist"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-[10px] uppercase tracking-wider text-[#888888] mt-0.5 truncate">
                      {prod.category} · {prod.finish}
                    </p>
                    <span className="font-mono text-xs text-white font-semibold block mt-1">
                      {formatINR(prod.selling_price_paise)}
                    </span>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => {
                        onAddToCart(prod, 1);
                        onClose();
                      }}
                      className="w-full py-2 bg-[#252525] hover:bg-[#651C2D] text-white text-[11px] font-mono uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Move to Bag</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {savedProducts.length > 0 && (
          <div className="p-4 bg-[#171717] border-t border-[#262626] space-y-2">
            <button
              onClick={() => {
                savedProducts.forEach((p) => onAddToCart(p, 1));
                onClose();
              }}
              className="w-full py-3 bg-[#651C2D] hover:bg-[#85253b] text-white font-mono text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2 cursor-pointer font-bold shadow-lg"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Add All to Bag ({savedProducts.length})</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
