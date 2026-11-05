import { Product, ProductFilterOptions, ProductVariant } from '../types';
import { config, getIntegrationState } from './config';

/**
 * DRAYEN Atelier Vault Catalogue
 * Live database-driven catalogue. No hardcoded or mock pieces.
 */
export const AUTHENTIC_DRAYEN_CATALOGUE: Product[] = [];

export interface CatalogueService {
  getProducts(filters?: ProductFilterOptions): Promise<Product[]>;
  getProductBySlug(slug: string): Promise<Product | null>;
  getProductById(id: string): Promise<Product | null>;
  getCategories(): Promise<string[]>;
  searchProducts(query: string, filters?: ProductFilterOptions): Promise<Product[]>;
  getAvailableVariants(productId: string): Promise<ProductVariant[]>;
}

export const catalogueService: CatalogueService = {
  async getProducts(filters?: ProductFilterOptions): Promise<Product[]> {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.category && filters.category !== 'All') queryParams.set('category', filters.category);
      if (filters?.search) queryParams.set('search', filters.search);
      if (filters?.minPricePaise) queryParams.set('minPrice', String(filters.minPricePaise));
      if (filters?.maxPricePaise) queryParams.set('maxPrice', String(filters.maxPricePaise));
      if (filters?.sortBy) queryParams.set('sort', filters.sortBy);

      const res = await fetch(`${config.apiBaseUrl}/api/products?${queryParams.toString()}`);
      if (res.ok) {
        const json = await res.json();
        return Array.isArray(json) ? json : [];
      }
    } catch (err) {
      console.warn('[CatalogueService] Backend fetch failed:', err);
    }
    return [];
  },

  async getProductBySlug(slug: string): Promise<Product | null> {
    try {
      const res = await fetch(`${config.apiBaseUrl}/api/products/${encodeURIComponent(slug)}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('[CatalogueService] Backend fetch failed for slug:', slug, err);
    }
    return null;
  },

  async getProductById(id: string): Promise<Product | null> {
    try {
      const res = await fetch(`${config.apiBaseUrl}/api/products/${encodeURIComponent(id)}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('[CatalogueService] Backend fetch failed for id:', id, err);
    }
    return null;
  },

  async getCategories(): Promise<string[]> {
    try {
      const products = await this.getProducts();
      const set = new Set<string>(['All']);
      for (const p of products) {
        if (p.category) set.add(p.category);
      }
      return Array.from(set);
    } catch {
      return ['All'];
    }
  },

  async searchProducts(query: string, filters?: ProductFilterOptions): Promise<Product[]> {
    return this.getProducts({ ...filters, search: query });
  },

  async getAvailableVariants(productId: string): Promise<ProductVariant[]> {
    const product = await this.getProductById(productId);
    return product?.variants || [];
  },
};
