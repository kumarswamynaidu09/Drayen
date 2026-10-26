import React, { useState, useEffect, useCallback } from 'react';
import { Product, CartItem, StoreSettings } from './types';
import { useRouter } from './lib/router';
import { catalogueService } from './services/catalogue';
import { cartService } from './services/cart';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { HomeView } from './components/HomeView';
import { ShopView } from './components/ShopView';
import { ProductDetailView } from './components/ProductDetailView';
import { CheckoutView } from './components/CheckoutView';
import { PaymentView } from './components/PaymentView';
import { OrderTrackingView } from './components/OrderTrackingView';
import { AccountView } from './components/AccountView';
import { AdminPortal } from './components/AdminPortal';
import { SearchModal } from './components/SearchModal';
import { WishlistDrawer } from './components/WishlistDrawer';

export default function App() {
  const { route, navigate } = useRouter();

  // Active product catalogue state
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  // Cart state backed by replaceable cart adapter
  const [cartItems, setCartItems] = useState<CartItem[]>(() => cartService.getCart());
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Wishlist state
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [wishlistIds, setWishlistIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('drayen_wishlist');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Search modal state
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Active payment and tracking state
  const [activeOrderNumber, setActiveOrderNumber] = useState<string>(route.params.orderId || '');
  const [activeOrderToken, setActiveOrderToken] = useState<string>(route.query.token || '');

  // Persist cart changes
  useEffect(() => {
    cartService.saveCart(cartItems);
  }, [cartItems]);

  // Persist wishlist changes
  useEffect(() => {
    try {
      localStorage.setItem('drayen_wishlist', JSON.stringify(wishlistIds));
    } catch {
      // Storage unavailable or disabled
    }
  }, [wishlistIds]);



  // Keyboard shortcut: '/' opens search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch authentic products from catalogue service
  useEffect(() => {
    let isMounted = true;
    async function loadCatalogue() {
      setProductsLoading(true);
      try {
        const items = await catalogueService.getProducts();
        if (isMounted) {
          setProducts(items);
        }
      } catch (err) {
        console.error('[DRAYEN] Error retrieving catalogue:', err);
      } finally {
        if (isMounted) {
          setProductsLoading(false);
        }
      }
    }
    loadCatalogue();
    return () => {
      isMounted = false;
    };
  }, []);

  // Universal Navigation Dispatcher
  const handleNavigate = useCallback(
    (target: string, param?: string) => {
      if (target === 'home') {
        navigate('/');
      } else if (target === 'shop') {
        if (param) {
          navigate(`/shop?category=${encodeURIComponent(param)}`);
        } else {
          navigate('/shop');
        }
      } else if (target === 'product' && param) {
        navigate(`/products/${encodeURIComponent(param)}`);
      } else if (target === 'checkout') {
        navigate('/checkout');
      } else if (target === 'payment' && param) {
        setActiveOrderNumber(param);
        navigate(`/payment/${encodeURIComponent(param)}`);
      } else if (target === 'orders' || target === 'track-order' || target === 'tracking') {
        if (param) {
          navigate(`/orders/${encodeURIComponent(param)}`);
        } else {
          navigate('/orders');
        }
      } else if (target === 'account') {
        navigate('/account');
      } else if (target === 'login') {
        navigate('/login');
      } else if (target === 'register') {
        navigate('/register');
      } else if (target === 'forgot-password') {
        navigate('/forgot-password');
      } else if (target === 'wishlist') {
        navigate('/wishlist');
      } else if (target === 'admin') {
        navigate('/admin');
      } else if (target.startsWith('/')) {
        navigate(target);
      }
    },
    [navigate]
  );

  // Cart operations
  const handleAddToCart = (product: Product, quantity = 1, finish?: string, length?: string) => {
    const maxStock = product.stock_quantity ?? 10;
    setCartItems((prev) => {
      const existingIdx = prev.findIndex(
        (item) =>
          item.product.id === product.id &&
          item.selectedFinish === finish &&
          item.selectedLength === length
      );

      if (existingIdx > -1) {
        const updated = [...prev];
        const newQty = updated[existingIdx].quantity + quantity;
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: Math.min(newQty, maxStock),
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            product,
            quantity: Math.min(quantity, maxStock),
            selectedFinish: finish,
            selectedLength: length,
          },
        ];
      }
    });

    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    setCartItems((prev) => {
      if (quantity <= 0) {
        return prev.filter((item) => item.product.id !== productId);
      }
      return prev.map((item) => {
        if (item.product.id === productId) {
          const maxStock = item.product.stock_quantity ?? 10;
          return { ...item, quantity: Math.min(quantity, maxStock) };
        }
        return item;
      });
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleToggleWishlist = (productId: string) => {
    setWishlistIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const handleOrderCreated = (orderData: {
    orderNumber: string;
    accessToken: string;
    totalPayablePaise: number;
  }) => {
    setCartItems([]);
    cartService.clearCart();
    setActiveOrderNumber(orderData.orderNumber);
    setActiveOrderToken(orderData.accessToken);
    // Stay in checkout flow for Step 6/7 or navigate to payment
    if (route.path === 'checkout') {
      // Handled directly inside CheckoutView steps 6 & 7
    } else {
      navigate(`/payment/${encodeURIComponent(orderData.orderNumber)}?token=${encodeURIComponent(orderData.accessToken)}`);
    }
  };

  // Full screen Admin Dashboard Route
  if (route.path === 'admin') {
    return (
      <AdminPortal
        onClose={() => navigate('/')}
        onNavigateHome={() => navigate('/')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#080808] text-[#F0ECE5] flex flex-col font-sans selection:bg-[#651C2D] selection:text-[#F0ECE5]">
      
      {/* Primary Sticky Header */}
      <Header
        currentView={route.path}
        onNavigate={handleNavigate}
        cartCount={cartItems.reduce((acc, item) => acc + item.quantity, 0)}
        wishlistCount={wishlistIds.length}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        isAdminLoggedIn={Boolean(sessionStorage.getItem('drayen_admin_token'))}
      />

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveFromCart}
        onProceedCheckout={() => {
          setIsCartOpen(false);
          navigate('/checkout');
        }}
      />

      {/* Wishlist Drawer */}
      <WishlistDrawer
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        wishlistIds={wishlistIds}
        products={products}
        onToggleWishlist={handleToggleWishlist}
        onAddToCart={handleAddToCart}
        onSelectProduct={(p) => navigate(`/products/${p.slug}`)}
        onNavigateToShop={() => navigate('/shop')}
      />

      {/* Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        products={products}
        onSelectProduct={(p) => navigate(`/products/${p.slug}`)}
        onNavigateToShop={(cat, q) => {
          if (cat) {
            navigate(`/shop?category=${encodeURIComponent(cat)}`);
          } else if (q) {
            navigate(`/shop?search=${encodeURIComponent(q)}`);
          } else {
            navigate('/shop');
          }
        }}
      />

      {/* Active Route Viewport */}
      <main className="flex-1 pt-20">
        
        {/* ROUTE: / (Home) */}
        {route.path === 'home' && (
          <HomeView
            products={products}
            isLoading={productsLoading}
            onSelectProduct={(p) => navigate(`/products/${p.slug}`)}
            onNavigate={handleNavigate}
            onAddToCart={handleAddToCart}
            onToggleWishlist={handleToggleWishlist}
            wishlistIds={wishlistIds}
          />
        )}

        {/* ROUTE: /shop & /collections/:slug */}
        {(route.path === 'shop' || route.path === 'collection') && (
          <ShopView
            products={products}
            isLoading={productsLoading}
            initialCategory={route.params.slug || route.query.category}
            initialSearchQuery={route.query.search}
            onSelectProduct={(p) => navigate(`/products/${p.slug}`)}
            onAddToCart={handleAddToCart}
            wishlistIds={wishlistIds}
            onToggleWishlist={handleToggleWishlist}
            onNavigateHome={() => navigate('/')}
          />
        )}

        {/* ROUTE: /products/:slug */}
        {route.path === 'product' && (
          (() => {
            const currentSlug = route.params.slug || '';
            const prod = products.find(
              (p) => p.slug.toLowerCase() === currentSlug.toLowerCase()
            );

            if (!prod && !productsLoading) {
              return (
                <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center space-y-4">
                  <h2 className="font-serif text-3xl text-[#F0ECE5]">Artifact Not Located in Vault</h2>
                  <p className="text-xs text-[#777777] font-sans">
                    This piece may be archived or unavailable in the active catalogue.
                  </p>
                  <button
                    onClick={() => navigate('/shop')}
                    className="px-6 py-3 bg-[#651C2D] text-[#F0ECE5] font-sans text-xs uppercase tracking-widest font-bold hover:bg-[#85253b] transition-colors"
                  >
                    Return to Catalogue
                  </button>
                </div>
              );
            }

            if (!prod) {
              return (
                <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
                  <div className="w-8 h-8 border-2 border-[#651C2D] border-t-transparent rounded-full animate-spin" />
                  <p className="font-sans text-xs text-[#777777] uppercase tracking-widest mt-4">
                    Locating Artifact Coordinates...
                  </p>
                </div>
              );
            }

            return (
              <ProductDetailView
                product={prod}
                allProducts={products}
                onAddToCart={handleAddToCart}
                onBuyNow={(p, qty, fin, len) => {
                  handleAddToCart(p, qty, fin, len);
                  navigate('/checkout');
                }}
                onSelectProduct={(p) => navigate(`/products/${p.slug}`)}
                onNavigateShop={() => navigate('/shop')}
              />
            );
          })()
        )}

        {/* ROUTE: /checkout */}
        {route.path === 'checkout' && (
          <CheckoutView
            cartItems={cartItems}
            onOrderCreated={handleOrderCreated}
            onBackToCart={() => setIsCartOpen(true)}
            onNavigateHome={() => navigate('/')}
            onNavigateToTracking={(ordNum, tok) => {
              navigate(`/orders/${encodeURIComponent(ordNum)}?token=${encodeURIComponent(tok)}`);
            }}
            onNavigateToShop={() => navigate('/shop')}
          />
        )}

        {/* ROUTE: /payment/:orderId */}
        {route.path === 'payment' && (
          <PaymentView
            orderNumber={route.params.orderId || activeOrderNumber}
            orderAccessToken={route.query.token || activeOrderToken}
            onNavigateToTracking={(ordNum, tok) => {
              navigate(`/orders/${encodeURIComponent(ordNum)}?token=${encodeURIComponent(tok)}`);
            }}
            onNavigateHome={() => navigate('/')}
          />
        )}

        {/* ROUTE: /orders & /orders/:orderId */}
        {(route.path === 'orders' || route.path === 'order-details') && (
          <OrderTrackingView
            initialOrderNumber={route.params.orderId || activeOrderNumber}
            initialToken={route.query.token || activeOrderToken}
            onNavigateToPayment={(ordNum, tok) => {
              navigate(`/payment/${encodeURIComponent(ordNum)}?token=${encodeURIComponent(tok)}`);
            }}
            onNavigateHome={() => navigate('/')}
          />
        )}

        {/* ROUTE: /account, /account/*, /login, /register, /forgot-password, /wishlist */}
        {(route.path === 'account' ||
          route.path === 'login' ||
          route.path === 'register' ||
          route.path === 'forgot-password' ||
          route.path === 'wishlist') && (
          <AccountView
            initialTab={
              route.path === 'login'
                ? 'login'
                : route.path === 'register'
                ? 'register'
                : route.path === 'forgot-password'
                ? 'forgot-password'
                : route.path === 'wishlist'
                ? 'wishlist'
                : route.params.accountTab || 'overview'
            }
            onNavigate={handleNavigate}
            onOpenWishlist={() => setIsWishlistOpen(true)}
            products={products}
            wishlistIds={wishlistIds}
            onToggleWishlist={handleToggleWishlist}
            onAddToCart={handleAddToCart}
          />
        )}

      </main>

      {/* Universal Footer */}
      <Footer onNavigate={handleNavigate} />

    </div>
  );
}
