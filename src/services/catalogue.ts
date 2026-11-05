import { Product, ProductFilterOptions, ProductVariant } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { config } from './config';

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
    // 1. Direct Supabase Query
    if (isSupabaseConfigured) {
      try {
        let query = supabase.from('products').select('*').eq('is_published', true);

        if (filters?.category && filters.category !== 'All') {
          query = query.ilike('category', `%${filters.category}%`);
        }
        if (filters?.minPricePaise != null) {
          query = query.gte('selling_price_paise', filters.minPricePaise);
        }
        if (filters?.maxPricePaise != null) {
          query = query.lte('selling_price_paise', filters.maxPricePaise);
        }
        if (filters?.search && filters.search.trim()) {
          query = query.or(`name.ilike.%${filters.search.trim()}%,sku.ilike.%${filters.search.trim()}%`);
        }
        if (filters?.sortBy === 'price-asc') {
          query = query.order('selling_price_paise', { ascending: true });
        } else if (filters?.sortBy === 'price-desc') {
          query = query.order('selling_price_paise', { ascending: false });
        } else {
          query = query.order('created_at', { ascending: false });
        }

        const { data, error } = await query;
        if (!error && Array.isArray(data)) {
          return data.map((p) => ({
            ...p,
            images: Array.isArray(p.images) ? p.images : JSON.parse(p.images || '[]'),
            variants: Array.isArray(p.variants) ? p.variants : JSON.parse(p.variants || '[]'),
          }));
        }
      } catch (err) {
        console.warn('[CatalogueService] Supabase query failed, falling back to API:', err);
      }
    }

    // 2. Fallback to API Router
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
      console.warn('[CatalogueService] API query error:', err);
    }
    return [];
  },

  async getProductBySlug(slug: string): Promise<Product | null> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('slug', slug)
          .maybeSingle();

        if (!error && data) {
          return {
            ...data,
            images: Array.isArray(data.images) ? data.images : JSON.parse(data.images || '[]'),
            variants: Array.isArray(data.variants) ? data.variants : JSON.parse(data.variants || '[]'),
          };
        }
      } catch (err) {
        console.warn('[CatalogueService] Supabase fetch slug error:', err);
      }
    }

    try {
      const res = await fetch(`${config.apiBaseUrl}/api/products/${encodeURIComponent(slug)}`);
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    return null;
  },

  async getProductById(id: string): Promise<Product | null> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (!error && data) {
          return {
            ...data,
            images: Array.isArray(data.images) ? data.images : JSON.parse(data.images || '[]'),
            variants: Array.isArray(data.variants) ? data.variants : JSON.parse(data.variants || '[]'),
          };
        }
      } catch (err) {
        console.warn('[CatalogueService] Supabase fetch id error:', err);
      }
    }

    try {
      const res = await fetch(`${config.apiBaseUrl}/api/products/${encodeURIComponent(id)}`);
      if (res.ok) {
        return await res.json();
      }
    } catch {}
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
