import { useState, useEffect, useCallback } from 'react';

export type RoutePath =
  | 'home'
  | 'shop'
  | 'collection'
  | 'product'
  | 'search'
  | 'wishlist'
  | 'cart'
  | 'checkout'
  | 'payment'
  | 'orders'
  | 'order-details'
  | 'account'
  | 'login'
  | 'register'
  | 'forgot-password'
  | 'faq'
  | 'admin';

export interface RouteState {
  path: RoutePath;
  rawPathname: string;
  params: {
    slug?: string;
    orderId?: string;
    accountTab?: 'overview' | 'profile' | 'addresses' | 'orders' | 'wishlist' | 'security';
    adminTab?: 'overview' | 'products' | 'orders' | 'payments' | 'shipments' | 'settings';
  };
  query: {
    category?: string;
    search?: string;
    step?: 'contact' | 'address' | 'shipping' | 'review' | 'payment';
    token?: string;
    phone?: string;
    sort?: string;
    method?: string;
  };
}

export function parseCurrentLocation(): RouteState {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
  const search = typeof window !== 'undefined' ? window.location.search : '';
  const queryParams = new URLSearchParams(search);

  const query: RouteState['query'] = {};
  if (queryParams.get('category')) query.category = queryParams.get('category')!;
  if (queryParams.get('search')) query.search = queryParams.get('search')!;
  if (queryParams.get('step')) query.step = queryParams.get('step') as any;
  if (queryParams.get('token')) query.token = queryParams.get('token')!;
  if (queryParams.get('phone')) query.phone = queryParams.get('phone')!;
  if (queryParams.get('sort')) query.sort = queryParams.get('sort')!;

  const trimmed = pathname.replace(/\/+$/, '') || '/';

  // 1. Home
  if (trimmed === '/' || trimmed === '') {
    return { path: 'home', rawPathname: trimmed, params: {}, query };
  }

  // 2. Shop
  if (trimmed === '/shop') {
    return { path: 'shop', rawPathname: trimmed, params: {}, query };
  }

  // 3. Collections (/collections/:slug)
  if (trimmed.startsWith('/collections/')) {
    const slug = trimmed.replace('/collections/', '');
    return { path: 'collection', rawPathname: trimmed, params: { slug }, query: { ...query, category: slug } };
  }

  // 4. Products (/products/:slug)
  if (trimmed.startsWith('/products/')) {
    const slug = trimmed.replace('/products/', '');
    return { path: 'product', rawPathname: trimmed, params: { slug }, query };
  }

  // 5. Search
  if (trimmed === '/search') {
    return { path: 'search', rawPathname: trimmed, params: {}, query };
  }

  // 6. Wishlist
  if (trimmed === '/wishlist') {
    return { path: 'wishlist', rawPathname: trimmed, params: {}, query };
  }

  // 7. Cart
  if (trimmed === '/cart') {
    return { path: 'cart', rawPathname: trimmed, params: {}, query };
  }

  // 8. Checkout & Sub-routes
  if (trimmed === '/checkout') {
    return { path: 'checkout', rawPathname: trimmed, params: {}, query };
  }
  if (trimmed === '/checkout/address') {
    return { path: 'checkout', rawPathname: trimmed, params: {}, query: { ...query, step: 'address' } };
  }
  if (trimmed === '/checkout/payment') {
    return { path: 'checkout', rawPathname: trimmed, params: {}, query: { ...query, step: 'payment' } };
  }

  // 9. Payment (/payment/:orderId)
  if (trimmed.startsWith('/payment/')) {
    const orderId = trimmed.replace('/payment/', '');
    return { path: 'payment', rawPathname: trimmed, params: { orderId }, query };
  }

  // 10. Orders (/orders & /orders/:orderId)
  if (trimmed === '/orders' || trimmed === '/track-order') {
    return { path: 'orders', rawPathname: trimmed, params: {}, query };
  }
  if (trimmed.startsWith('/orders/')) {
    const orderId = trimmed.replace('/orders/', '');
    return { path: 'order-details', rawPathname: trimmed, params: { orderId }, query };
  }

  // 11. Customer Account & Sub-routes
  if (trimmed === '/faq') {
    return { path: 'faq', rawPathname: trimmed, params: {}, query };
  }
  if (trimmed === '/account') {
    return { path: 'account', rawPathname: trimmed, params: { accountTab: 'overview' }, query };
  }
  if (trimmed === '/account/profile') {
    return { path: 'account', rawPathname: trimmed, params: { accountTab: 'profile' }, query };
  }
  if (trimmed === '/account/addresses') {
    return { path: 'account', rawPathname: trimmed, params: { accountTab: 'addresses' }, query };
  }
  if (trimmed === '/account/orders') {
    return { path: 'account', rawPathname: trimmed, params: { accountTab: 'orders' }, query };
  }
  if (trimmed === '/account/wishlist') {
    return { path: 'account', rawPathname: trimmed, params: { accountTab: 'wishlist' }, query };
  }
  if (trimmed === '/account/security') {
    return { path: 'account', rawPathname: trimmed, params: { accountTab: 'security' }, query };
  }
  if (trimmed === '/login') {
    return { path: 'login', rawPathname: trimmed, params: {}, query };
  }
  if (trimmed === '/register') {
    return { path: 'register', rawPathname: trimmed, params: {}, query };
  }
  if (trimmed === '/forgot-password') {
    return { path: 'forgot-password', rawPathname: trimmed, params: {}, query };
  }

  // 12. Admin & Sub-tabs
  if (trimmed === '/admin') {
    return { path: 'admin', rawPathname: trimmed, params: { adminTab: 'overview' }, query };
  }
  if (trimmed === '/admin/products') {
    return { path: 'admin', rawPathname: trimmed, params: { adminTab: 'products' }, query };
  }
  if (trimmed === '/admin/orders') {
    return { path: 'admin', rawPathname: trimmed, params: { adminTab: 'orders' }, query };
  }
  if (trimmed === '/admin/payments') {
    return { path: 'admin', rawPathname: trimmed, params: { adminTab: 'payments' }, query };
  }
  if (trimmed === '/admin/shipments') {
    return { path: 'admin', rawPathname: trimmed, params: { adminTab: 'shipments' }, query };
  }

  // Fallback to shop
  return { path: 'shop', rawPathname: trimmed, params: {}, query };
}

export function useRouter() {
  const [route, setRoute] = useState<RouteState>(parseCurrentLocation);

  useEffect(() => {
    const handlePopState = () => {
      setRoute(parseCurrentLocation());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = useCallback(
    (targetPath: string, options?: { replace?: boolean; scrollToTop?: boolean }) => {
      if (typeof window === 'undefined') return;

      if (options?.replace) {
        window.history.replaceState(null, '', targetPath);
      } else {
        window.history.pushState(null, '', targetPath);
      }

      setRoute(parseCurrentLocation());

      if (options?.scrollToTop !== false) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    []
  );

  return { route, navigate };
}
