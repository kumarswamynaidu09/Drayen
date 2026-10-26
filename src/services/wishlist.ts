import { Product, WishlistItem, IntegrationState } from '../types';
import { config, getIntegrationState } from './config';

/**
 * Storage adapter interface for transient wishlist persistence during client browsing.
 * Limitations: Local device/browser storage only; does NOT replace server-authoritative account sync.
 */
export interface WishlistStorageAdapter {
  load(): string[];
  save(ids: string[]): void;
  clear(): void;
}

export const localWishlistStorage: WishlistStorageAdapter = {
  load(): string[] {
    try {
      const raw = localStorage.getItem('drayen_wishlist');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },
  save(ids: string[]): void {
    try {
      localStorage.setItem('drayen_wishlist', JSON.stringify(ids));
    } catch (err) {
      console.warn('[WishlistStorage] Failed to save wishlist:', err);
    }
  },
  clear(): void {
    try {
      localStorage.removeItem('drayen_wishlist');
    } catch {}
  },
};

export interface WishlistService {
  storage: WishlistStorageAdapter;
  getIntegrationStatus(): IntegrationState;
  getWishlistIds(): string[];
  isInWishlist(productId: string): boolean;
  toggleWishlist(productId: string): string[];
  fetchServerWishlist(): Promise<{ items: WishlistItem[]; integrationState: IntegrationState }>;
  syncWishlist(ids: string[]): Promise<{ success: boolean; error?: string; integrationState: IntegrationState }>;
}

export const wishlistService: WishlistService = {
  storage: localWishlistStorage,

  getIntegrationStatus(): IntegrationState {
    return getIntegrationState('Customer Wishlist Service', '/api/account/wishlist');
  },

  getWishlistIds(): string[] {
    return this.storage.load();
  },

  isInWishlist(productId: string): boolean {
    const ids = this.getWishlistIds();
    return ids.includes(productId);
  },

  toggleWishlist(productId: string): string[] {
    const current = this.getWishlistIds();
    const updated = current.includes(productId)
      ? current.filter((id) => id !== productId)
      : [...current, productId];
    this.storage.save(updated);
    return updated;
  },

  async fetchServerWishlist() {
    const integration = this.getIntegrationStatus();
    const token = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('drayen_customer_token') : null;

    if (config.isBackendConnected && token) {
      try {
        const res = await fetch(`${config.apiBaseUrl}/api/account/wishlist`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const items: WishlistItem[] = await res.json();
          return { items, integrationState: { ...integration, status: 'CONNECTED' } };
        }
      } catch (err) {
        console.warn('[WishlistService] Backend wishlist fetch failed:', err);
      }
    }

    return {
      items: [],
      integrationState: integration,
    };
  },

  async syncWishlist(_ids: string[]) {
    const integration = this.getIntegrationStatus();
    const token = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('drayen_customer_token') : null;

    if (config.isBackendConnected && token) {
      try {
        const res = await fetch(`${config.apiBaseUrl}/api/account/wishlist`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ productIds: _ids }),
        });
        const data = await res.json();
        return {
          success: res.ok,
          error: data.error,
          integrationState: { ...integration, status: res.ok ? 'CONNECTED' : 'ERROR' },
        };
      } catch (err: any) {
        return { success: false, error: err.message, integrationState: integration };
      }
    }

    return {
      success: false,
      error: 'Account wishlist synchronisation requires backend integration (POST /api/account/wishlist). Items remain in current browser session.',
      integrationState: integration,
    };
  },
};
