import React from 'react';
import { CartItem } from '../types';
import { formatINR } from '../lib/money';
import { ShoppingBag, X, Trash2, ArrowRight, ShieldCheck } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onProceedCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onProceedCheckout,
}) => {
  if (!isOpen) return null;

  const subtotalPaise = items.reduce(
    (sum, item) => sum + item.product.selling_price_paise * item.quantity,
    0
  );

  const freeShippingThresholdPaise = 49900; // ₹499
  const remainingForFreeShipping = Math.max(0, freeShippingThresholdPaise - subtotalPaise);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md h-full bg-[#131313] border-l border-[#262626] flex flex-col justify-between shadow-2xl text-[#e5e2e1]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-[#262626] flex items-center justify-between bg-[#171717]">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-white" />
            <h3 className="font-serif text-lg tracking-wide text-white uppercase">Shopping Bag</h3>
            <span className="font-mono text-xs text-[#888888] px-2 py-0.5 bg-[#202020] border border-[#303030]">
              {items.length} {items.length === 1 ? 'Piece' : 'Pieces'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#888888] hover:text-white transition-colors cursor-pointer"
            aria-label="Close Bag"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Shipping Meter */}
        <div className="px-5 py-3 bg-[#191919] border-b border-[#242424]">
          {remainingForFreeShipping > 0 ? (
            <p className="text-xs font-mono text-[#a0a0a0]">
              Add <span className="text-white font-semibold">{formatINR(remainingForFreeShipping)}</span> more for Free Express Delivery across India.
            </p>
          ) : (
            <p className="text-xs font-mono text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>Complimentary Insured Shipping Unlocked</span>
            </p>
          )}
        </div>

        {/* Item List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-16">
              <ShoppingBag className="w-12 h-12 text-[#333333] stroke-1" />
              <p className="font-serif text-lg text-white">Your shopping bag is empty</p>
              <p className="text-xs text-[#888888] max-w-xs leading-relaxed">
                Discover our gothic necklaces, cross pendants, and heavy steel chains.
              </p>
              <button
                onClick={onClose}
                className="mt-3 px-6 py-2.5 bg-[#651C2D] text-white hover:bg-[#85253b] font-mono text-xs uppercase tracking-widest transition-colors cursor-pointer flex items-center gap-2"
              >
                <span>Browse Catalogue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.product.id}
                className="flex gap-3 p-3 bg-[#181818] border border-[#2a2a2a] group hover:border-[#383838] transition-colors"
              >
                <div className="w-20 h-24 bg-[#111111] flex-shrink-0 overflow-hidden border border-[#262626]">
                  <img
                    src={item.product.images[0] || 'https://placehold.co/200x250/131313/e5e2e1?text=DRAYEN'}
                    alt={item.product.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div>
                    <div className="flex items-start justify-between gap-1">
                      <h4 className="font-serif text-sm text-white truncate">
                        {item.product.name}
                      </h4>
                      <button
                        onClick={() => onRemoveItem(item.product.id)}
                        className="text-[#666666] hover:text-red-400 transition-colors p-1"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-[10px] uppercase tracking-wider text-[#888888] mt-0.5 truncate">
                      {item.selectedFinish || item.product.finish}
                    </p>
                    {item.selectedLength && (
                      <p className="text-[10px] font-mono text-[#777777] mt-0.5">
                        Length: {item.selectedLength}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    {/* Quantity Stepper */}
                    <div className="flex items-center bg-[#202020] h-7 border border-[#303030]">
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                        className="px-2 text-[#888888] hover:text-white font-bold cursor-pointer text-xs"
                        aria-label="Decrease quantity"
                      >
                        -
                      </button>
                      <span className="px-2 font-mono text-xs text-white">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                        className="px-2 text-[#888888] hover:text-white font-bold cursor-pointer text-xs"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>

                    <span className="font-mono text-xs text-white font-semibold">
                      {formatINR(item.product.selling_price_paise * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Checkout Bar */}
        {items.length > 0 && (
          <div className="p-5 bg-[#171717] border-t border-[#262626] space-y-3">
            <div className="flex justify-between items-baseline">
              <span className="font-mono text-xs uppercase text-[#888888]">Subtotal</span>
              <span className="font-mono text-lg text-white font-bold">
                {formatINR(subtotalPaise)}
              </span>
            </div>
            <p className="text-[11px] text-[#777777] font-mono">
              Taxes included. Insured delivery calculated at checkout.
            </p>
            <button
              onClick={() => {
                onClose();
                onProceedCheckout();
              }}
              className="w-full h-12 bg-[#651C2D] text-white font-mono text-xs uppercase tracking-[0.2em] font-bold hover:bg-[#85253b] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
