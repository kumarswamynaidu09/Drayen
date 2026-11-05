import React, { useState, useMemo } from 'react';
import { formatINR } from '../lib/money';
import {
  Package,
  Plus,
  Search,
  ArrowUpDown,
  Check,
  CheckSquare,
  Square,
  Trash2,
  Edit3,
  Copy,
  Eye,
  Download,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  Grid,
  List,
  SlidersHorizontal,
  Layers,
  ExternalLink,
  X,
  TrendingUp,
  Tag,
  DollarSign,
  Upload,
  Image as ImageIcon
} from 'lucide-react';

export interface ProductItem {
  id: string;
  sku: string;
  name: string;
  slug: string;
  short_description?: string;
  full_description?: string;
  category: string;
  selling_price_paise: number;
  original_price_paise?: number | null;
  material: string;
  finish: string;
  chain_length?: string;
  chain_thickness?: string;
  pendant_height?: string;
  pendant_width?: string;
  pendant_thickness?: string;
  pendant_weight?: string;
  clasp_type?: string;
  is_detachable?: boolean | number;
  care_instructions?: string;
  images: string[];
  stock_quantity: number;
  is_published: boolean | number;
  created_at?: string;
  updated_at?: string;
}

interface AdminProductDashboardProps {
  products: ProductItem[];
  isLoading: boolean;
  onRefresh: () => void;
  onSeed: () => void;
  onShowToast: (msg: string) => void;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const CATEGORIES = [
  'All',
  'Pendants',
  'Necklaces',
  'Chains',
  'Chokers',
  'Statement Pieces'
];

const PRESET_IMAGES = [
  'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1611591475850-5387431fb5b2?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1600003014755-ba31aa59c4b6?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?auto=format&fit=crop&w=800&q=80'
];

export const AdminProductDashboard: React.FC<AdminProductDashboardProps> = ({
  products,
  isLoading,
  onRefresh,
  onSeed,
  onShowToast,
  authFetch
}) => {
  // Filters & State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [publishFilter, setPublishFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc' | 'stock_asc' | 'stock_desc' | 'name_asc'>('newest');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Selection for bulk actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Edit / Add Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<ProductItem> | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [modalTab, setModalTab] = useState<'general' | 'pricing' | 'specs' | 'media'>('general');
  const [isSaving, setIsSaving] = useState(false);

  // Delete Confirm Modal
  const [deleteTarget, setDeleteTarget] = useState<ProductItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Quick updating tracking
  const [updatingStockId, setUpdatingStockId] = useState<string | null>(null);
  const [togglingPublishId, setTogglingPublishId] = useState<string | null>(null);

  // KPI Calculations
  const metrics = useMemo(() => {
    const total = products.length;
    let publishedCount = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let totalValuationPaise = 0;

    for (const p of products) {
      const isPub = Boolean(p.is_published);
      const stock = Number(p.stock_quantity || 0);
      const price = Number(p.selling_price_paise || 0);

      if (isPub) publishedCount++;
      if (stock === 0) outOfStockCount++;
      else if (stock < 5) lowStockCount++;

      totalValuationPaise += stock * price;
    }

    return {
      total,
      publishedCount,
      lowStockCount,
      outOfStockCount,
      totalValuationINR: formatINR(totalValuationPaise)
    };
  }, [products]);

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesSku = p.sku.toLowerCase().includes(q);
        const matchesMaterial = p.material.toLowerCase().includes(q);
        const matchesFinish = p.finish.toLowerCase().includes(q);
        const matchesCat = p.category.toLowerCase().includes(q);
        if (!matchesName && !matchesSku && !matchesMaterial && !matchesFinish && !matchesCat) {
          return false;
        }
      }

      // Category
      if (selectedCategory !== 'All') {
        if (p.category.toLowerCase() !== selectedCategory.toLowerCase()) {
          return false;
        }
      }

      // Stock
      const stock = Number(p.stock_quantity || 0);
      if (stockFilter === 'in_stock' && stock < 5) return false;
      if (stockFilter === 'low_stock' && (stock < 1 || stock >= 5)) return false;
      if (stockFilter === 'out_of_stock' && stock > 0) return false;

      // Publish
      const isPub = Boolean(p.is_published);
      if (publishFilter === 'published' && !isPub) return false;
      if (publishFilter === 'draft' && isPub) return false;

      return true;
    }).sort((a, b) => {
      switch (sortBy) {
        case 'price_asc':
          return a.selling_price_paise - b.selling_price_paise;
        case 'price_desc':
          return b.selling_price_paise - a.selling_price_paise;
        case 'stock_asc':
          return a.stock_quantity - b.stock_quantity;
        case 'stock_desc':
          return b.stock_quantity - a.stock_quantity;
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'newest':
        default:
          return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
      }
    });
  }, [products, searchQuery, selectedCategory, stockFilter, publishFilter, sortBy]);

  // Bulk Selection Handlers
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map((p) => p.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Toggle publish single
  const handleTogglePublish = async (p: ProductItem) => {
    try {
      setTogglingPublishId(p.id);
      const res = await authFetch(`/api/admin/products/${p.id}/toggle-publish`, {
        method: 'PATCH'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to toggle status');

      onShowToast(data.message || 'Status updated');
      onRefresh();
    } catch (err: any) {
      onShowToast(`Error: ${err.message}`);
    } finally {
      setTogglingPublishId(null);
    }
  };

  // Quick adjust stock
  const handleStockDelta = async (p: ProductItem, delta: number) => {
    try {
      setUpdatingStockId(p.id);
      const newStock = Math.max(0, p.stock_quantity + delta);
      const res = await authFetch(`/api/admin/products/${p.id}/stock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stockQuantity: newStock })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update stock');

      onShowToast(`Stock updated: ${p.sku} is now ${newStock}`);
      onRefresh();
    } catch (err: any) {
      onShowToast(`Error: ${err.message}`);
    } finally {
      setUpdatingStockId(null);
    }
  };

  // Bulk operations
  const handleBulkAction = async (action: 'publish' | 'draft' | 'delete') => {
    if (selectedIds.length === 0) return;
    try {
      setBulkActionLoading(true);
      const res = await authFetch('/api/admin/products/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ids: selectedIds })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Bulk action failed');

      onShowToast(data.message || 'Bulk operation complete');
      setSelectedIds([]);
      onRefresh();
    } catch (err: any) {
      onShowToast(`Error: ${err.message}`);
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Open Create Modal
  const openCreateModal = () => {
    setModalMode('create');
    setModalTab('general');
    setEditingProduct({
      sku: '',
      name: '',
      slug: '',
      category: 'Pendants',
      selling_price_paise: 0,
      original_price_paise: null,
      material: '',
      finish: '',
      chain_length: '',
      chain_thickness: '',
      pendant_height: '',
      pendant_width: '',
      pendant_thickness: '',
      pendant_weight: '',
      clasp_type: '',
      is_detachable: 1,
      short_description: '',
      full_description: '',
      care_instructions: '',
      stock_quantity: 0,
      is_published: 1,
      images: []
    });
    setIsEditModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (p: ProductItem) => {
    setModalMode('edit');
    setModalTab('general');
    setEditingProduct({
      ...p,
      images: Array.isArray(p.images) ? [...p.images] : []
    });
    setIsEditModalOpen(true);
  };

  // Clone / Duplicate Product
  const handleDuplicateProduct = (p: ProductItem) => {
    setModalMode('create');
    setModalTab('general');
    setEditingProduct({
      ...p,
      id: undefined,
      sku: `${p.sku}-COPY`,
      name: `${p.name} (Copy)`,
      slug: `${p.slug}-copy-${Math.floor(Math.random() * 1000)}`,
      is_published: 0,
      images: Array.isArray(p.images) ? [...p.images] : []
    });
    setIsEditModalOpen(true);
  };

  // Save Product (Create or Update)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    if (!editingProduct.name || !editingProduct.sku || !editingProduct.slug) {
      onShowToast('Please specify Product Name, SKU, and Slug.');
      return;
    }

    try {
      setIsSaving(true);
      const isCreate = modalMode === 'create';
      const url = isCreate ? '/api/admin/products' : `/api/admin/products/${editingProduct.id}`;
      const method = isCreate ? 'POST' : 'PUT';

      const payload = {
        name: editingProduct.name,
        sku: editingProduct.sku,
        slug: editingProduct.slug,
        category: editingProduct.category || 'Pendants',
        sellingPricePaise: editingProduct.selling_price_paise,
        originalPricePaise: editingProduct.original_price_paise || null,
        material: editingProduct.material || '316L Stainless Steel',
        finish: editingProduct.finish || 'Oxidized Matte Gunmetal',
        chainLength: editingProduct.chain_length || '',
        chainThickness: editingProduct.chain_thickness || '',
        pendantHeight: editingProduct.pendant_height || '',
        pendantWidth: editingProduct.pendant_width || '',
        pendantThickness: editingProduct.pendant_thickness || '',
        pendantWeight: editingProduct.pendant_weight || '',
        claspType: editingProduct.clasp_type || '',
        isDetachable: editingProduct.is_detachable ? 1 : 0,
        shortDescription: editingProduct.short_description || '',
        fullDescription: editingProduct.full_description || '',
        careInstructions: editingProduct.care_instructions || '',
        stockQuantity: Number(editingProduct.stock_quantity || 0),
        isPublished: editingProduct.is_published ? 1 : 0,
        images: editingProduct.images && editingProduct.images.length > 0 ? editingProduct.images : [PRESET_IMAGES[0]]
      };

      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save product');

      onShowToast(isCreate ? 'Piece added to collection catalogue.' : 'Product specifications updated.');
      setIsEditModalOpen(false);
      setEditingProduct(null);
      onRefresh();
    } catch (err: any) {
      onShowToast(`Error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete product confirmation
  const executeDeleteProduct = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      const res = await authFetch(`/api/admin/products/${deleteTarget.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete product');

      onShowToast(data.message || 'Product removed');
      setDeleteTarget(null);
      onRefresh();
    } catch (err: any) {
      onShowToast(`Error: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    if (products.length === 0) {
      onShowToast('No products available to export.');
      return;
    }

    const headers = [
      'SKU',
      'Name',
      'Slug',
      'Category',
      'Selling Price (INR)',
      'Original Price (INR)',
      'Stock',
      'Status',
      'Material',
      'Finish',
      'Primary Image'
    ];

    const rows = products.map((p) => [
      `"${p.sku}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.slug}"`,
      `"${p.category}"`,
      (p.selling_price_paise / 100).toFixed(2),
      p.original_price_paise ? (p.original_price_paise / 100).toFixed(2) : '',
      p.stock_quantity,
      p.is_published ? 'Active' : 'Draft',
      `"${p.material}"`,
      `"${p.finish}"`,
      `"${p.images?.[0] || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `drayen_products_catalog_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast('Product catalog exported as CSV.');
  };

  // Export to JSON
  const exportToJSON = () => {
    if (products.length === 0) {
      onShowToast('No products available to export.');
      return;
    }

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(products, null, 2))}`;
    const link = document.createElement('a');
    link.setAttribute('href', jsonString);
    link.setAttribute('download', `drayen_products_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast('Product catalog exported as JSON.');
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#201f1f] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[11px] uppercase tracking-widest text-[#651C2D] font-bold">
              Inventory & Catalog Engine
            </span>
            <span className="text-[#403e3d]">•</span>
            <span className="font-mono text-[11px] text-[#858281]">
              Live Database Records
            </span>
          </div>
          <h1 className="font-serif text-3xl text-white tracking-wide">Products Dashboard</h1>
          <p className="text-xs text-[#858281] mt-1 font-mono">
            Manage jewelry designs, adjust physical stock counts, configure pricing, and publish drops.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={exportToCSV}
            className="px-3 py-2 bg-[#171616] hover:bg-[#201f1f] border border-[#2d2929] text-xs font-mono text-[#858281] hover:text-white transition-colors flex items-center gap-1.5"
            title="Download CSV export"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>

          <button
            onClick={exportToJSON}
            className="px-3 py-2 bg-[#171616] hover:bg-[#201f1f] border border-[#2d2929] text-xs font-mono text-[#858281] hover:text-white transition-colors flex items-center gap-1.5"
            title="Download JSON export"
          >
            <Download className="w-3.5 h-3.5" />
            <span>JSON</span>
          </button>

          <button
            onClick={onRefresh}
            className="p-2 bg-[#171616] hover:bg-[#201f1f] border border-[#2d2929] text-[#858281] hover:text-white transition-colors"
            title="Refresh database records"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#651C2D]' : ''}`} />
          </button>

          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-[#651C2D] hover:bg-[#85253b] text-white font-mono text-xs uppercase tracking-wider font-semibold transition-colors flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {/* Total Products */}
        <div className="bg-[#131313] border border-[#262424] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#858281] mb-2">
            <span className="font-mono text-[11px] uppercase tracking-wider">Total Pieces</span>
            <Layers className="w-4 h-4 text-[#858281]" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="font-serif text-2xl text-white font-bold">{metrics.total}</span>
            <span className="font-mono text-[11px] text-[#858281]">in vault</span>
          </div>
        </div>

        {/* Active Published */}
        <div className="bg-[#131313] border border-[#262424] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="font-mono text-[11px] uppercase tracking-wider">Active Published</span>
            <Check className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="font-serif text-2xl text-emerald-400 font-bold">{metrics.publishedCount}</span>
            <span className="font-mono text-[11px] text-[#858281]">
              {metrics.total > 0 ? `${Math.round((metrics.publishedCount / metrics.total) * 100)}% live` : '0%'}
            </span>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-[#131313] border border-[#262424] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <span className="font-mono text-[11px] uppercase tracking-wider">Low / Out of Stock</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="font-serif text-2xl text-amber-400 font-bold">
              {metrics.lowStockCount + metrics.outOfStockCount}
            </span>
            <span className="font-mono text-[11px] text-[#858281]">
              {metrics.outOfStockCount} zero stock
            </span>
          </div>
        </div>

        {/* Catalog Inventory Value */}
        <div className="bg-[#131313] border border-[#262424] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#858281] mb-2">
            <span className="font-mono text-[11px] uppercase tracking-wider">Stock Valuation</span>
            <DollarSign className="w-4 h-4 text-[#858281]" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="font-serif text-2xl text-white font-bold">{metrics.totalValuationINR}</span>
            <span className="font-mono text-[11px] text-[#858281]">at retail</span>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="bg-[#131313] border border-[#262424] p-4 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Keyword Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#858281]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by name, SKU, material, finish, or description..."
              className="w-full bg-[#181717] border border-[#2d2929] pl-9 pr-8 py-2 text-xs font-mono text-white placeholder-[#605d5c] focus:border-[#651C2D] focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#858281] hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Dropdown Selectors */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Category Dropdown */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-[#181717] border border-[#2d2929] px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#651C2D]"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'All' ? 'All Categories' : cat}
                </option>
              ))}
            </select>

            {/* Stock Filter */}
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as any)}
              className="bg-[#181717] border border-[#2d2929] px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#651C2D]"
            >
              <option value="all">All Stock Statuses</option>
              <option value="in_stock">Healthy (5+ in vault)</option>
              <option value="low_stock">Low Stock (1–4 left)</option>
              <option value="out_of_stock">Out of Stock (0)</option>
            </select>

            {/* Publish Filter */}
            <select
              value={publishFilter}
              onChange={(e) => setPublishFilter(e.target.value as any)}
              className="bg-[#181717] border border-[#2d2929] px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#651C2D]"
            >
              <option value="all">All Statuses</option>
              <option value="published">Active & Published</option>
              <option value="draft">Draft / Unpublished</option>
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#181717] border border-[#2d2929] px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#651C2D]"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="name_asc">Sort: Name (A-Z)</option>
              <option value="price_asc">Sort: Price (Low → High)</option>
              <option value="price_desc">Sort: Price (High → Low)</option>
              <option value="stock_asc">Sort: Stock (Low → High)</option>
              <option value="stock_desc">Sort: Stock (High → Low)</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex border border-[#2d2929] overflow-hidden">
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 transition-colors ${
                  viewMode === 'table' ? 'bg-[#651C2D] text-white' : 'bg-[#181717] text-[#858281] hover:text-white'
                }`}
                title="Dense Data Table View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 transition-colors ${
                  viewMode === 'grid' ? 'bg-[#651C2D] text-white' : 'bg-[#181717] text-[#858281] hover:text-white'
                }`}
                title="Visual Card Grid View"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Active Filter Chips Bar */}
        <div className="flex flex-wrap items-center justify-between text-xs font-mono pt-1 text-[#858281]">
          <div className="flex items-center gap-2">
            <span>Showing <strong className="text-white">{filteredProducts.length}</strong> of {products.length} products</span>
            {(searchQuery || selectedCategory !== 'All' || stockFilter !== 'all' || publishFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                  setStockFilter('all');
                  setPublishFilter('all');
                }}
                className="text-[#651C2D] hover:underline ml-2"
              >
                Reset filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* FLOATING / INLINE BULK ACTION BAR */}
      {selectedIds.length > 0 && (
        <div className="bg-[#1b1919] border border-[#651C2D]/60 p-3 px-4 flex flex-wrap items-center justify-between gap-3 shadow-lg animate-in fade-in">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-white">
              <strong className="text-[#651C2D] font-bold">{selectedIds.length}</strong> piece{selectedIds.length > 1 ? 's' : ''} selected
            </span>
            <button
              onClick={() => setSelectedIds([])}
              className="text-[#858281] hover:text-white text-xs font-mono underline"
            >
              Clear
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={bulkActionLoading}
              onClick={() => handleBulkAction('publish')}
              className="px-3 py-1.5 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 text-xs font-mono uppercase tracking-wider disabled:opacity-50"
            >
              Publish Selected
            </button>
            <button
              disabled={bulkActionLoading}
              onClick={() => handleBulkAction('draft')}
              className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 border border-stone-700 text-[#c7c3c2] text-xs font-mono uppercase tracking-wider disabled:opacity-50"
            >
              Move to Draft
            </button>
            <button
              disabled={bulkActionLoading}
              onClick={() => handleBulkAction('delete')}
              className="px-3 py-1.5 bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-300 text-xs font-mono uppercase tracking-wider disabled:opacity-50 flex items-center gap-1.5"
            >
              <Trash2 className="w-3 h-3" />
              <span>Delete Selected</span>
            </button>
          </div>
        </div>
      )}

      {/* PRODUCTS DISPLAY (TABLE OR GRID) */}
      {isLoading ? (
        <div className="bg-[#131313] border border-[#262424] p-16 text-center space-y-3">
          <RefreshCw className="w-6 h-6 text-[#651C2D] animate-spin mx-auto" />
          <p className="font-mono text-xs text-[#858281]">Fetching real products from SQLite vault...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-[#131313] border border-[#262424] p-16 text-center space-y-4">
          <Layers className="w-10 h-10 text-[#403e3d] mx-auto" />
          <h3 className="font-serif text-xl text-white">No Pieces Match Filter Criteria</h3>
          <p className="font-mono text-xs text-[#858281] max-w-md mx-auto">
            {products.length === 0
              ? 'The database currently contains 0 records. Click "Seed Catalog" above to populate the authentic DRAYEN Atelier collection.'
              : 'Try clearing your search query or adjusting your category/stock filter.'}
          </p>
          {products.length === 0 ? (
            <button
              onClick={onSeed}
              className="px-6 py-2.5 bg-[#651C2D] hover:bg-[#85253b] text-white font-mono text-xs uppercase tracking-widest inline-flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Seed Authentic Atelier Vault</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setStockFilter('all');
                setPublishFilter('all');
              }}
              className="px-4 py-2 bg-[#1b1919] hover:bg-[#252323] border border-[#2d2929] text-xs font-mono text-white"
            >
              Clear All Filters
            </button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        /* ======================== DENSE TABLE VIEW ======================== */
        <div className="bg-[#131313] border border-[#262424] overflow-x-auto shadow-sm">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#171616] border-b border-[#262424] text-[#858281] uppercase tracking-wider">
              <tr>
                <th className="p-3.5 w-10 text-center">
                  <button
                    onClick={toggleSelectAll}
                    className="text-[#858281] hover:text-white"
                    title="Select all on this page"
                  >
                    {selectedIds.length === filteredProducts.length ? (
                      <CheckSquare className="w-4 h-4 text-[#651C2D]" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="p-3.5">Piece & SKU</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Material & Finish</th>
                <th className="p-3.5">Retail Price</th>
                <th className="p-3.5">Vault Stock</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#201f1f]">
              {filteredProducts.map((p) => {
                const isSelected = selectedIds.includes(p.id);
                const isPub = Boolean(p.is_published);
                const stock = Number(p.stock_quantity || 0);
                const imgUrl = p.images?.[0] || PRESET_IMAGES[0];
                const originalPrice = p.original_price_paise;
                const discount = originalPrice && originalPrice > p.selling_price_paise
                  ? Math.round(((originalPrice - p.selling_price_paise) / originalPrice) * 100)
                  : null;

                return (
                  <tr
                    key={p.id}
                    className={`transition-colors ${
                      isSelected ? 'bg-[#651C2D]/10' : 'hover:bg-[#171616]'
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => toggleSelectOne(p.id)}
                        className="text-[#858281] hover:text-white"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-[#651C2D]" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>

                    {/* Piece & SKU */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <div className="relative w-11 h-11 bg-black border border-[#2d2929] flex-shrink-0 overflow-hidden group">
                          <img
                            src={imgUrl}
                            alt={p.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = PRESET_IMAGES[0];
                            }}
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-serif text-sm text-white font-medium hover:text-[#c5a059] transition-colors">
                              {p.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-[#858281]">
                            <span className="font-mono text-[11px] font-bold text-[#c7c3c2]">{p.sku}</span>
                            <span>•</span>
                            <span className="text-[10px] text-[#605d5c]">{p.slug}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="p-3.5">
                      <span className="text-[#c7c3c2] capitalize">{p.category}</span>
                    </td>

                    {/* Material & Finish */}
                    <td className="p-3.5">
                      <div className="text-white text-xs">{p.material}</div>
                      <div className="text-[#858281] text-[11px]">{p.finish}</div>
                    </td>

                    {/* Price */}
                    <td className="p-3.5">
                      <div className="font-bold text-white text-xs">{formatINR(p.selling_price_paise)}</div>
                      {originalPrice && originalPrice > p.selling_price_paise && (
                        <div className="flex items-center gap-1.5 text-[10px] mt-0.5">
                          <span className="line-through text-[#605d5c]">{formatINR(originalPrice)}</span>
                          <span className="text-amber-400 font-semibold">-{discount}%</span>
                        </div>
                      )}
                    </td>

                    {/* Stock Stepper */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          disabled={updatingStockId === p.id || stock <= 0}
                          onClick={() => handleStockDelta(p, -1)}
                          className="w-5 h-5 bg-[#1f1e1e] hover:bg-[#2d2929] border border-[#2d2929] text-white flex items-center justify-center text-xs disabled:opacity-30 disabled:pointer-events-none"
                          title="Decrease stock by 1"
                        >
                          -
                        </button>
                        <span
                          className={`font-mono font-bold min-w-[28px] text-center ${
                            stock === 0
                              ? 'text-red-400'
                              : stock < 5
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {stock}
                        </span>
                        <button
                          disabled={updatingStockId === p.id}
                          onClick={() => handleStockDelta(p, 1)}
                          className="w-5 h-5 bg-[#1f1e1e] hover:bg-[#2d2929] border border-[#2d2929] text-white flex items-center justify-center text-xs disabled:opacity-30"
                          title="Increase stock by 1"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-[10px] text-[#605d5c] block mt-0.5">
                        {stock === 0 ? 'Out of stock' : stock < 5 ? 'Low inventory' : 'In stock'}
                      </span>
                    </td>

                    {/* Status Toggle */}
                    <td className="p-3.5">
                      <button
                        disabled={togglingPublishId === p.id}
                        onClick={() => handleTogglePublish(p)}
                        className={`px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider border transition-colors flex items-center gap-1.5 ${
                          isPub
                            ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300 hover:bg-emerald-900/60'
                            : 'bg-stone-900 border-stone-700 text-[#858281] hover:text-white'
                        }`}
                        title="Click to toggle publish status"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isPub ? 'bg-emerald-400' : 'bg-stone-600'}`} />
                        <span>{isPub ? 'Active' : 'Draft'}</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1.5 bg-[#1a1818] hover:bg-[#252323] border border-[#2d2929] text-[#c7c3c2] hover:text-white transition-colors"
                          title="Edit Piece Specifications"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDuplicateProduct(p)}
                          className="p-1.5 bg-[#1a1818] hover:bg-[#252323] border border-[#2d2929] text-[#858281] hover:text-white transition-colors"
                          title="Clone Piece as Draft"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(p)}
                          className="p-1.5 bg-[#1a1818] hover:bg-red-950/60 border border-[#2d2929] hover:border-red-900 text-[#858281] hover:text-red-400 transition-colors"
                          title="Delete Piece"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* ======================== VISUAL CARD GRID VIEW ======================== */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((p) => {
            const isSelected = selectedIds.includes(p.id);
            const isPub = Boolean(p.is_published);
            const stock = Number(p.stock_quantity || 0);
            const imgUrl = p.images?.[0] || PRESET_IMAGES[0];
            const originalPrice = p.original_price_paise;

            return (
              <div
                key={p.id}
                className={`bg-[#131313] border transition-all flex flex-col justify-between overflow-hidden group ${
                  isSelected ? 'border-[#651C2D] ring-1 ring-[#651C2D]' : 'border-[#262424] hover:border-[#3d3a3a]'
                }`}
              >
                {/* Visual Image with overlays */}
                <div className="relative aspect-square bg-black overflow-hidden">
                  <img
                    src={imgUrl}
                    alt={p.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = PRESET_IMAGES[0];
                    }}
                  />

                  {/* Top Overlay Badges */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                    <button
                      onClick={() => toggleSelectOne(p.id)}
                      className="p-1 bg-black/70 backdrop-blur-sm border border-[#2d2929] text-white"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-[#651C2D]" />
                      ) : (
                        <Square className="w-4 h-4 text-[#858281]" />
                      )}
                    </button>

                    <button
                      disabled={togglingPublishId === p.id}
                      onClick={() => handleTogglePublish(p)}
                      className={`px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider backdrop-blur-md border ${
                        isPub
                          ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
                          : 'bg-black/80 border-stone-700 text-[#858281]'
                      }`}
                    >
                      {isPub ? 'Active' : 'Draft'}
                    </button>
                  </div>

                  {/* Bottom Stock Chip */}
                  <div className="absolute bottom-2.5 left-2.5">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider backdrop-blur-md border ${
                        stock === 0
                          ? 'bg-red-950/80 border-red-800 text-red-300'
                          : stock < 5
                          ? 'bg-amber-950/80 border-amber-800 text-amber-300'
                          : 'bg-black/80 border-[#2d2929] text-white'
                      }`}
                    >
                      {stock === 0 ? 'Out of Stock' : `${stock} in Vault`}
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-[#858281] mb-1">
                      <span className="font-bold text-[#c7c3c2]">{p.sku}</span>
                      <span className="capitalize">{p.category}</span>
                    </div>

                    <h3 className="font-serif text-base text-white line-clamp-1 font-medium group-hover:text-[#c5a059] transition-colors">
                      {p.name}
                    </h3>

                    <p className="text-xs text-[#858281] line-clamp-2 mt-1">
                      {p.short_description || `${p.material} with ${p.finish}`}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#201f1f] space-y-3">
                    {/* Price & Stock Adjustment */}
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-serif text-base font-bold text-white">
                          {formatINR(p.selling_price_paise)}
                        </span>
                        {originalPrice && originalPrice > p.selling_price_paise && (
                          <span className="line-through text-xs text-[#605d5c] ml-2 font-mono">
                            {formatINR(originalPrice)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 font-mono text-xs">
                        <button
                          disabled={updatingStockId === p.id || stock <= 0}
                          onClick={() => handleStockDelta(p, -1)}
                          className="w-5 h-5 bg-[#1f1e1e] hover:bg-[#2d2929] border border-[#2d2929] text-white flex items-center justify-center text-xs disabled:opacity-30"
                        >
                          -
                        </button>
                        <span className="px-1 text-white">{stock}</span>
                        <button
                          disabled={updatingStockId === p.id}
                          onClick={() => handleStockDelta(p, 1)}
                          className="w-5 h-5 bg-[#1f1e1e] hover:bg-[#2d2929] border border-[#2d2929] text-white flex items-center justify-center text-xs"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="grid grid-cols-3 gap-1.5 pt-1">
                      <button
                        onClick={() => openEditModal(p)}
                        className="py-1.5 px-2 bg-[#1a1818] hover:bg-[#252323] border border-[#2d2929] text-[#c7c3c2] hover:text-white font-mono text-[10px] uppercase tracking-wider flex items-center justify-center gap-1 transition-colors"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDuplicateProduct(p)}
                        className="py-1.5 px-2 bg-[#1a1818] hover:bg-[#252323] border border-[#2d2929] text-[#858281] hover:text-white font-mono text-[10px] uppercase tracking-wider flex items-center justify-center gap-1 transition-colors"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Clone</span>
                      </button>
                      <button
                        onClick={() => setDeleteTarget(p)}
                        className="py-1.5 px-2 bg-[#1a1818] hover:bg-red-950/60 border border-[#2d2929] hover:border-red-900 text-[#858281] hover:text-red-400 font-mono text-[10px] uppercase tracking-wider flex items-center justify-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT / CREATE PRODUCT MODAL */}
      {/* ========================================================================= */}
      {isEditModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#131313] border border-[#2d2929] max-w-4xl w-full p-6 md:p-8 space-y-6 max-h-[92vh] overflow-y-auto shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-[#201f1f] pb-4">
              <div>
                <span className="font-mono text-xs uppercase tracking-widest text-[#651C2D] font-bold block mb-1">
                  {modalMode === 'create' ? 'Atelier Vault Catalogue Entry' : `SKU #${editingProduct.sku}`}
                </span>
                <h3 className="font-serif text-2xl text-white">
                  {modalMode === 'create' ? 'Add New Gothic Jewelry Piece' : `Edit: ${editingProduct.name}`}
                </h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-[#858281] hover:text-white font-mono text-lg p-1"
              >
                ✕
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex border-b border-[#201f1f] gap-4 font-mono text-xs">
              <button
                type="button"
                onClick={() => setModalTab('general')}
                className={`pb-2.5 transition-colors border-b-2 uppercase tracking-wider ${
                  modalTab === 'general'
                    ? 'border-[#651C2D] text-white font-bold'
                    : 'border-transparent text-[#858281] hover:text-white'
                }`}
              >
                1. Identity & Description
              </button>
              <button
                type="button"
                onClick={() => setModalTab('pricing')}
                className={`pb-2.5 transition-colors border-b-2 uppercase tracking-wider ${
                  modalTab === 'pricing'
                    ? 'border-[#651C2D] text-white font-bold'
                    : 'border-transparent text-[#858281] hover:text-white'
                }`}
              >
                2. Pricing & Stock
              </button>
              <button
                type="button"
                onClick={() => setModalTab('specs')}
                className={`pb-2.5 transition-colors border-b-2 uppercase tracking-wider ${
                  modalTab === 'specs'
                    ? 'border-[#651C2D] text-white font-bold'
                    : 'border-transparent text-[#858281] hover:text-white'
                }`}
              >
                3. Materials & Specs
              </button>
              <button
                type="button"
                onClick={() => setModalTab('media')}
                className={`pb-2.5 transition-colors border-b-2 uppercase tracking-wider ${
                  modalTab === 'media'
                    ? 'border-[#651C2D] text-white font-bold'
                    : 'border-transparent text-[#858281] hover:text-white'
                }`}
              >
                4. Images & Visuals
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-6">
              {/* TAB 1: GENERAL IDENTITY */}
              {modalTab === 'general' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-mono text-xs uppercase tracking-widest text-[#858281] mb-1">
                        Piece Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={editingProduct.name || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditingProduct({
                            ...editingProduct,
                            name: val,
                            slug: editingProduct.slug || val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                          });
                        }}
                        placeholder="e.g. Vampiric Thorn Choker"
                        className="w-full bg-[#181717] border border-[#2d2929] px-4 py-2.5 text-sm text-white focus:border-[#651C2D] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-mono text-xs uppercase tracking-widest text-[#858281] mb-1">
                        SKU Identifier *
                      </label>
                      <input
                        type="text"
                        required
                        value={editingProduct.sku || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value.toUpperCase() })}
                        placeholder="e.g. DRY-THORN-01"
                        className="w-full bg-[#181717] border border-[#2d2929] px-4 py-2.5 text-sm text-white font-mono focus:border-[#651C2D] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-mono text-xs uppercase tracking-widest text-[#858281] mb-1">
                        Slug (URL identifier) *
                      </label>
                      <input
                        type="text"
                        required
                        value={editingProduct.slug || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                        placeholder="vampiric-thorn-choker"
                        className="w-full bg-[#181717] border border-[#2d2929] px-4 py-2.5 text-sm text-white font-mono focus:border-[#651C2D] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-mono text-xs uppercase tracking-widest text-[#858281] mb-1">
                        Category Classification *
                      </label>
                      <select
                        value={editingProduct.category || 'Pendants'}
                        onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                        className="w-full bg-[#181717] border border-[#2d2929] px-4 py-2.5 text-sm text-white focus:border-[#651C2D] focus:outline-none"
                      >
                        <option value="Pendants">Pendants</option>
                        <option value="Necklaces">Necklaces</option>
                        <option value="Chains">Chains</option>
                        <option value="Chokers">Chokers</option>
                        <option value="Statement Pieces">Statement Pieces</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-mono text-xs uppercase tracking-widest text-[#858281] mb-1">
                      Short Description (Card teaser)
                    </label>
                    <input
                      type="text"
                      value={editingProduct.short_description || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, short_description: e.target.value })}
                      placeholder="Sculpted barbed wire motif with blackened finish."
                      className="w-full bg-[#181717] border border-[#2d2929] px-4 py-2.5 text-sm text-white focus:border-[#651C2D] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-xs uppercase tracking-widest text-[#858281] mb-1">
                      Full Atelier Description & Lore
                    </label>
                    <textarea
                      rows={4}
                      value={editingProduct.full_description || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, full_description: e.target.value })}
                      placeholder="Detailed artistic and metallurgical description..."
                      className="w-full bg-[#181717] border border-[#2d2929] px-4 py-2.5 text-sm text-white focus:border-[#651C2D] focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: PRICING & STOCK */}
              {modalTab === 'pricing' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-mono text-xs uppercase tracking-widest text-[#858281] mb-1">
                        Selling Price (₹ INR) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={editingProduct.selling_price_paise ? Math.round(editingProduct.selling_price_paise / 100) : ''}
                        onChange={(e) =>
                          setEditingProduct({
                            ...editingProduct,
                            selling_price_paise: e.target.value === '' ? 0 : Math.round(Number(e.target.value) * 100)
                          })
                        }
                        placeholder="e.g. 1999"
                        className="w-full bg-[#181717] border border-[#2d2929] px-4 py-2.5 text-sm text-white font-mono focus:border-[#651C2D] focus:outline-none"
                      />
                      <p className="text-[11px] text-[#858281] mt-1 font-mono">
                        Formatted: {formatINR(editingProduct.selling_price_paise || 0)}
                      </p>
                    </div>

                    <div>
                      <label className="block font-mono text-xs uppercase tracking-widest text-[#858281] mb-1">
                        Original / Compare-at Price (₹ INR)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={editingProduct.original_price_paise ? Math.round(editingProduct.original_price_paise / 100) : ''}
                        onChange={(e) =>
                          setEditingProduct({
                            ...editingProduct,
                            original_price_paise: e.target.value === '' ? null : Math.round(Number(e.target.value) * 100)
                          })
                        }
                        placeholder="Leave blank for regular pricing"
                        className="w-full bg-[#181717] border border-[#2d2929] px-4 py-2.5 text-sm text-white font-mono focus:border-[#651C2D] focus:outline-none"
                      />
                      {editingProduct.original_price_paise && editingProduct.original_price_paise > (editingProduct.selling_price_paise || 0) && (
                        <p className="text-[11px] text-amber-400 mt-1 font-mono">
                          Discount: {Math.round((((editingProduct.original_price_paise - (editingProduct.selling_price_paise || 0)) / editingProduct.original_price_paise) * 100))}% off
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-mono text-xs uppercase tracking-widest text-[#858281] mb-1">
                        Physical Stock Quantity in Vault *
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={editingProduct.stock_quantity !== undefined && editingProduct.stock_quantity !== 0 ? editingProduct.stock_quantity : (editingProduct.stock_quantity === 0 ? '' : '')}
                        placeholder="0"
                        onChange={(e) =>
                          setEditingProduct({
                            ...editingProduct,
                            stock_quantity: e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0)
                          })
                        }
                        className="w-full bg-[#181717] border border-[#2d2929] px-4 py-2.5 text-sm text-white font-mono focus:border-[#651C2D] focus:outline-none"
                      />
                    </div>

                    <div className="flex flex-col justify-end">
                      <label className="flex items-center gap-3 p-3 bg-[#181717] border border-[#2d2929] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(editingProduct.is_published)}
                          onChange={(e) => setEditingProduct({ ...editingProduct, is_published: e.target.checked ? 1 : 0 })}
                          className="w-4 h-4 text-[#651C2D] rounded focus:ring-0 focus:outline-none"
                        />
                        <div>
                          <span className="font-mono text-xs uppercase tracking-wider text-white font-bold block">
                            Active & Published in Store
                          </span>
                          <span className="text-[11px] text-[#858281]">
                            Uncheck to keep as draft invisible to customers.
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: MATERIALS & SPECS */}
              {modalTab === 'specs' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-mono text-xs uppercase tracking-widest text-[#858281] mb-1">
                        Material
                      </label>
                      <input
                        type="text"
                        value={editingProduct.material || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, material: e.target.value })}
                        placeholder="316L Surgical Stainless Steel"
                        className="w-full bg-[#181717] border border-[#2d2929] px-4 py-2.5 text-sm text-white focus:border-[#651C2D] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-mono text-xs uppercase tracking-widest text-[#858281] mb-1">
                        Finish
                      </label>
                      <input
                        type="text"
                        value={editingProduct.finish || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, finish: e.target.value })}
                        placeholder="Oxidized Matte Gunmetal"
                        className="w-full bg-[#181717] border border-[#2d2929] px-4 py-2.5 text-sm text-white focus:border-[#651C2D] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block font-mono text-xs uppercase tracking-widest text-[#858281] mb-1">
                        Chain Length
                      </label>
                      <input
                        type="text"
                        value={editingProduct.chain_length || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, chain_length: e.target.value })}
                        placeholder="55 cm (Adjustable to 60 cm)"
                        className="w-full bg-[#181717] border border-[#2d2929] px-4 py-2 text-xs text-white font-mono focus:border-[#651C2D] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-mono text-xs uppercase tracking-widest text-[#858281] mb-1">
                        Chain Thickness
                      </label>
                      <input
                        type="text"
                        value={editingProduct.chain_thickness || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, chain_thickness: e.target.value })}
                        placeholder="3.5 mm Cuban link"
                        className="w-full bg-[#181717] border border-[#2d2929] px-4 py-2 text-xs text-white font-mono focus:border-[#651C2D] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-mono text-xs uppercase tracking-widest text-[#858281] mb-1">
                        Clasp Type
                      </label>
                      <input
                        type="text"
                        value={editingProduct.clasp_type || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, clasp_type: e.target.value })}
                        placeholder="Reinforced Lobster Clasp"
                        className="w-full bg-[#181717] border border-[#2d2929] px-4 py-2 text-xs text-white font-mono focus:border-[#651C2D] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block font-mono text-xs uppercase tracking-widest text-[#858281] mb-1">
                        Height
                      </label>
                      <input
                        type="text"
                        value={editingProduct.pendant_height || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, pendant_height: e.target.value })}
                        placeholder="42 mm"
                        className="w-full bg-[#181717] border border-[#2d2929] px-3 py-2 text-xs text-white font-mono focus:border-[#651C2D] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-xs uppercase tracking-widest text-[#858281] mb-1">
                        Width
                      </label>
                      <input
                        type="text"
                        value={editingProduct.pendant_width || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, pendant_width: e.target.value })}
                        placeholder="24 mm"
                        className="w-full bg-[#181717] border border-[#2d2929] px-3 py-2 text-xs text-white font-mono focus:border-[#651C2D] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-xs uppercase tracking-widest text-[#858281] mb-1">
                        Thickness
                      </label>
                      <input
                        type="text"
                        value={editingProduct.pendant_thickness || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, pendant_thickness: e.target.value })}
                        placeholder="4 mm"
                        className="w-full bg-[#181717] border border-[#2d2929] px-3 py-2 text-xs text-white font-mono focus:border-[#651C2D] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-xs uppercase tracking-widest text-[#858281] mb-1">
                        Weight
                      </label>
                      <input
                        type="text"
                        value={editingProduct.pendant_weight || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, pendant_weight: e.target.value })}
                        placeholder="28 g"
                        className="w-full bg-[#181717] border border-[#2d2929] px-3 py-2 text-xs text-white font-mono focus:border-[#651C2D] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: IMAGES & VISUALS */}
              {modalTab === 'media' && (
                <div className="space-y-5">
                  {/* Local Image File Upload Area */}
                  <div className="p-4 bg-[#181717] border border-dashed border-[#3d3939] hover:border-[#651C2D] transition-colors">
                    <label className="flex flex-col items-center justify-center cursor-pointer text-center p-3">
                      <Upload className="w-6 h-6 text-[#a32e49] mb-2" />
                      <span className="font-mono text-xs uppercase tracking-wider text-white font-bold block">
                        Upload Product Images
                      </span>
                      <span className="text-[11px] text-[#858281] mt-1 block">
                        Select JPG, PNG, WEBP from your device (multiple files supported)
                      </span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const files = e.target.files;
                          if (!files || files.length === 0) return;
                          Array.from(files).forEach((file) => {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const base64Url = event.target?.result as string;
                              if (base64Url) {
                                setEditingProduct((prev) => ({
                                  ...prev,
                                  images: [...(prev?.images || []), base64Url]
                                }));
                              }
                            };
                            reader.readAsDataURL(file);
                          });
                          e.target.value = '';
                        }}
                      />
                    </label>
                  </div>

                  <div>
                    <label className="block font-mono text-xs uppercase tracking-widest text-[#858281] mb-1">
                      Or Paste Image URLs (One URL per line)
                    </label>
                    <textarea
                      rows={2}
                      value={(editingProduct.images || []).filter(img => !img.startsWith('data:')).join('\n')}
                      onChange={(e) => {
                        const urls = e.target.value.split('\n').map((s) => s.trim()).filter(Boolean);
                        const uploadedDataUrls = (editingProduct.images || []).filter(img => img.startsWith('data:'));
                        setEditingProduct({
                          ...editingProduct,
                          images: [...uploadedDataUrls, ...urls]
                        });
                      }}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="w-full bg-[#181717] border border-[#2d2929] px-4 py-2.5 text-xs text-white font-mono focus:border-[#651C2D] focus:outline-none"
                    />
                  </div>

                  {/* Configured Previews */}
                  {editingProduct.images && editingProduct.images.length > 0 && (
                    <div>
                      <span className="font-mono text-xs uppercase tracking-widest text-white block mb-2">
                        Attached Images ({editingProduct.images.length})
                      </span>
                      <div className="flex flex-wrap gap-3">
                        {editingProduct.images.map((img, i) => (
                          <div key={i} className="relative w-20 h-20 border border-[#2d2929] overflow-hidden bg-black group">
                            <img src={img} alt={`Preview ${i}`} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => {
                                const updated = (editingProduct.images || []).filter((_, idx) => idx !== i);
                                setEditingProduct({ ...editingProduct, images: updated });
                              }}
                              className="absolute top-1 right-1 bg-red-950/80 hover:bg-red-800 text-white w-4 h-4 flex items-center justify-center text-[10px] cursor-pointer"
                              title="Remove image"
                            >
                              ✕
                            </button>
                            {i === 0 && (
                              <span className="absolute bottom-0 inset-x-0 bg-black/80 text-[8px] font-mono uppercase text-center text-amber-300 py-0.5">
                                Primary
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Modal Footer Controls */}
              <div className="flex items-center justify-between border-t border-[#201f1f] pt-4">
                <div className="flex items-center gap-2">
                  {modalTab !== 'general' && (
                    <button
                      type="button"
                      onClick={() => {
                        if (modalTab === 'media') setModalTab('specs');
                        else if (modalTab === 'specs') setModalTab('pricing');
                        else if (modalTab === 'pricing') setModalTab('general');
                      }}
                      className="px-4 py-2 bg-[#1b1919] hover:bg-[#252323] border border-[#2d2929] text-xs font-mono text-[#858281] hover:text-white"
                    >
                      ← Previous
                    </button>
                  )}
                  {modalTab !== 'media' && (
                    <button
                      type="button"
                      onClick={() => {
                        if (modalTab === 'general') setModalTab('pricing');
                        else if (modalTab === 'pricing') setModalTab('specs');
                        else if (modalTab === 'specs') setModalTab('media');
                      }}
                      className="px-4 py-2 bg-[#1b1919] hover:bg-[#252323] border border-[#2d2929] text-xs font-mono text-white"
                    >
                      Next Step →
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 border border-[#2d2929] text-xs font-mono text-[#858281] hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2 bg-[#651C2D] hover:bg-[#85253b] text-white font-mono text-xs uppercase tracking-widest font-bold disabled:opacity-50"
                  >
                    {isSaving ? 'Securing Record...' : modalMode === 'create' ? 'Save New Piece' : 'Update Piece'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#131313] border border-red-900/50 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <h3 className="font-serif text-xl text-white">Delete Product Record?</h3>
            </div>
            <p className="font-mono text-xs text-[#858281] leading-relaxed">
              Are you sure you want to delete <strong className="text-white font-serif">{deleteTarget.name}</strong> ({deleteTarget.sku})?
            </p>
            <p className="text-[11px] font-mono text-[#605d5c] bg-[#171616] p-3 border border-[#201f1f]">
              If this product is linked to past customer orders, it will be safely unpublished and archived to maintain historical consignment audit integrity.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 border border-[#2d2929] text-xs font-mono text-[#858281] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={executeDeleteProduct}
                className="px-4 py-2 bg-red-950 hover:bg-red-900 border border-red-800 text-red-300 font-mono text-xs uppercase tracking-wider disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Deletion'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
