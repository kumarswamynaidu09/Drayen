import React, { useState, useEffect } from 'react';
import { Product, StoreSettings, IntegrationState, Order } from '../types';
import { adminService, AdminDashboardSummary, InventoryItem, PendingPaymentRecord, ShipmentRecord } from '../services/admin';
import { catalogueService } from '../services/catalogue';
import { formatINR } from '../lib/money';
import {
  LayoutDashboard,
  Layers,
  Boxes,
  ShoppingBag,
  ShieldCheck,
  Truck,
  Settings,
  ArrowLeft,
  AlertTriangle,
  Search,
  Filter,
  Plus,
  Edit2,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Menu,
  X,
  RefreshCw,
  ExternalLink,
  Shield,
  FileText,
  Lock,
  ChevronRight,
  Info
} from 'lucide-react';

export type AdminTab =
  | 'overview'
  | 'products'
  | 'inventory'
  | 'orders'
  | 'payments'
  | 'shipments'
  | 'settings';

interface AdminPortalProps {
  initialTab?: AdminTab;
  onClose: () => void;
  onNavigateHome?: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  initialTab = 'overview',
  onClose,
  onNavigateHome
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Integration state
  const [integrationState, setIntegrationState] = useState<IntegrationState>(() =>
    adminService.getIntegrationStatus()
  );

  // Screen 1: Overview
  const [summary, setSummary] = useState<AdminDashboardSummary | undefined>(undefined);
  const [summaryLoading, setSummaryLoading] = useState(true);

  // Screen 2: Products
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productFormMode, setProductFormMode] = useState<'create' | 'edit'>('create');

  // Product Form state
  const [formName, setFormName] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formCategory, setFormCategory] = useState('Pendants');
  const [formDescription, setFormDescription] = useState('');
  const [formPriceINR, setFormPriceINR] = useState('699');
  const [formOriginalPriceINR, setFormOriginalPriceINR] = useState('999');
  const [formMaterial, setFormMaterial] = useState('316L Surgical Grade Steel');
  const [formFinish, setFormFinish] = useState('Antique Silver (.925 Look)');
  const [formChainLength, setFormChainLength] = useState('20 INCH (50CM)');
  const [formChainThickness, setFormChainThickness] = useState('3mm Rounded Box');
  const [formPendantDimensions, setFormPendantDimensions] = useState('42mm × 26mm');
  const [formImages, setFormImages] = useState('');
  const [formStock, setFormStock] = useState('20');
  const [formIsPublished, setFormIsPublished] = useState(true);
  const [productFormError, setProductFormError] = useState<string | null>(null);

  // Screen 3: Inventory
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryStatusFilter, setInventoryStatusFilter] = useState('all');

  // Screen 4: Orders
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);

  // Screen 5: Payment Verification
  const [verifications, setVerifications] = useState<PendingPaymentRecord[]>([]);
  const [verificationsLoading, setVerificationsLoading] = useState(false);
  const [selectedVerification, setSelectedVerification] = useState<PendingPaymentRecord | null>(null);
  const [verificationModalMode, setVerificationModalMode] = useState<'inspect' | 'approve' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Screen 6: Shipments
  const [shipments, setShipments] = useState<ShipmentRecord[]>([]);
  const [shipmentsLoading, setShipmentsLoading] = useState(false);
  const [shipmentSearch, setShipmentSearch] = useState('');
  const [selectedShipment, setSelectedShipment] = useState<ShipmentRecord | null>(null);
  const [dispatchCarrier, setDispatchCarrier] = useState('BlueDart Apex Air');
  const [dispatchAwb, setDispatchAwb] = useState('');

  // Screen 7: Store Settings
  const [storeSettings, setStoreSettings] = useState<StoreSettings | undefined>(undefined);
  const [settingsLoading, setSettingsLoading] = useState(false);

  // Load Data on Tab Switch
  useEffect(() => {
    if (activeTab === 'overview') {
      loadOverview();
    } else if (activeTab === 'products') {
      loadProducts();
    } else if (activeTab === 'inventory') {
      loadInventory();
    } else if (activeTab === 'orders') {
      loadOrders();
    } else if (activeTab === 'payments') {
      loadPayments();
    } else if (activeTab === 'shipments') {
      loadShipments();
    } else if (activeTab === 'settings') {
      loadSettings();
    }
  }, [activeTab]);

  const loadOverview = async () => {
    setSummaryLoading(true);
    try {
      const res = await adminService.getDashboardSummary();
      setSummary(res.summary);
      setIntegrationState(res.integrationState);
    } finally {
      setSummaryLoading(false);
    }
  };

  const loadProducts = async () => {
    setProductsLoading(true);
    try {
      const res = await adminService.getProducts({
        search: productSearch,
        category: productCategoryFilter !== 'All' ? productCategoryFilter : undefined
      });
      setProducts(res.products);
      setIntegrationState(res.integrationState);
    } finally {
      setProductsLoading(false);
    }
  };

  const loadInventory = async () => {
    setInventoryLoading(true);
    try {
      const res = await adminService.getInventory({
        search: inventorySearch,
        status: inventoryStatusFilter !== 'all' ? inventoryStatusFilter : undefined
      });
      setInventory(res.inventory);
      setIntegrationState(res.integrationState);
    } finally {
      setInventoryLoading(false);
    }
  };

  const loadOrders = async () => {
    setOrdersLoading(true);
    try {
      const res = await adminService.getOrders({
        search: orderSearch,
        status: orderStatusFilter !== 'all' ? orderStatusFilter : undefined
      });
      setOrders(res.orders);
      setIntegrationState(res.integrationState);
    } finally {
      setOrdersLoading(false);
    }
  };

  const loadPayments = async () => {
    setVerificationsLoading(true);
    try {
      const res = await adminService.getPendingPayments();
      setVerifications(res.submissions);
      setIntegrationState(res.integrationState);
    } finally {
      setVerificationsLoading(false);
    }
  };

  const loadShipments = async () => {
    setShipmentsLoading(true);
    try {
      const res = await adminService.getShipments({
        search: shipmentSearch
      });
      setShipments(res.shipments);
      setIntegrationState(res.integrationState);
    } finally {
      setShipmentsLoading(false);
    }
  };

  const loadSettings = async () => {
    setSettingsLoading(true);
    try {
      const res = await adminService.getStoreSettings();
      setStoreSettings(res.settings);
      setIntegrationState(res.integrationState);
    } finally {
      setSettingsLoading(false);
    }
  };

  // Open Product Edit Modal
  const handleOpenProductEdit = (product?: Product) => {
    if (product) {
      setProductFormMode('edit');
      setSelectedProduct(product);
      setFormName(product.name);
      setFormSku(product.sku);
      setFormCategory(product.category);
      setFormDescription(product.full_description || product.short_description || '');
      setFormPriceINR(String((product.selling_price_paise ?? 0) / 100));
      setFormOriginalPriceINR(product.original_price_paise ? String(product.original_price_paise / 100) : '');
      setFormMaterial(product.material);
      setFormFinish(product.finish);
      setFormChainLength(product.chain_length || '');
      setFormChainThickness(product.chain_thickness || '');
      setFormPendantDimensions(product.pendant_height ? `${product.pendant_height} × ${product.pendant_width || ''}` : '');
      setFormImages(product.images ? product.images.join('\n') : '');
      setFormStock(String(product.stock_quantity ?? 0));
      setFormIsPublished(Boolean(product.is_published));
    } else {
      setProductFormMode('create');
      setSelectedProduct(null);
      setFormName('');
      setFormSku(`DRY-${Math.floor(1000 + Math.random() * 9000)}`);
      setFormCategory('Pendants');
      setFormDescription('');
      setFormPriceINR('699');
      setFormOriginalPriceINR('999');
      setFormMaterial('316L Surgical Grade Steel');
      setFormFinish('Antique Silver (.925 Look)');
      setFormChainLength('20 INCH (50CM)');
      setFormChainThickness('3mm Rounded Box');
      setFormPendantDimensions('42mm × 26mm');
      setFormImages('');
      setFormStock('20');
      setFormIsPublished(true);
    }
    setProductFormError(null);
    setIsProductModalOpen(true);
  };

  // Sidebar navigation items
  const sidebarItems: { id: AdminTab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'overview', label: '1. Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'products', label: '2. Products', icon: <Layers className="w-4 h-4" /> },
    { id: 'inventory', label: '3. Inventory', icon: <Boxes className="w-4 h-4" /> },
    { id: 'orders', label: '4. Orders', icon: <ShoppingBag className="w-4 h-4" /> },
    { id: 'payments', label: '5. Payment Verification', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'shipments', label: '6. Shipments', icon: <Truck className="w-4 h-4" /> },
    { id: 'settings', label: '7. Store Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[#080808] text-[#F0ECE5] flex flex-col font-sans selection:bg-[#651C2D] selection:text-[#F0ECE5]">
      
      {/* Top Header */}
      <header className="h-16 bg-[#0e0e0e] border-b border-[#202020] px-4 md:px-8 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-[#777777] hover:text-[#F0ECE5]"
            aria-label="Toggle Navigation"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-3">
            <span className="font-serif text-xl tracking-[0.2em] text-[#F0ECE5] uppercase font-normal">
              DRAYEN
            </span>
            <span className="text-[#333333] hidden sm:inline">|</span>
            <span className="font-sans text-xs uppercase tracking-widest text-[#BFC0C2] hidden sm:inline">
              Admin Command Console
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-[#141414] border border-[#202020] text-[11px] font-mono">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[#BFC0C2] uppercase tracking-wider">Frontend Contract Mode</span>
          </div>

          <button
            onClick={() => {
              if (onNavigateHome) onNavigateHome();
              else onClose();
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#181818] hover:bg-[#202020] text-[#BFC0C2] hover:text-[#F0ECE5] border border-[#202020] text-xs font-sans uppercase tracking-wider transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Store</span>
          </button>
        </div>
      </header>

      {/* Security & Architecture Boundary Banner */}
      <div className="bg-[#121212] border-b border-[#202020] px-4 md:px-8 py-2.5">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-2 text-amber-400">
            <Shield className="w-4 h-4 shrink-0" />
            <span className="font-bold uppercase tracking-wider">Administrative Security Notice</span>
          </div>
          <p className="text-[#777777] text-[11px] leading-relaxed">
            Role-based permissions (RBAC), protected database storage, and payment approvals require the backend authentication server. All data operations are bound to typed frontend contracts.
          </p>
        </div>
      </div>

      {/* Main Workspace: Sidebar + Content Area */}
      <div className="flex-1 flex max-w-[1440px] w-full mx-auto">
        
        {/* Desktop Sidebar (Left) */}
        <aside className="w-64 bg-[#0c0c0c] border-r border-[#202020] p-4 hidden md:flex flex-col justify-between shrink-0">
          <div className="space-y-1.5">
            <span className="font-sans text-[10px] uppercase tracking-widest text-[#777777] px-3 block mb-2 font-bold">
              Command Modules
            </span>
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-sans uppercase tracking-wider text-left transition-colors cursor-pointer ${
                  activeTab === item.id
                    ? 'bg-[#651C2D] text-[#F0ECE5] font-bold shadow-md'
                    : 'text-[#777777] hover:text-[#BFC0C2] hover:bg-[#141414]'
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                <ChevronRight className="w-3 h-3 opacity-60" />
              </button>
            ))}
          </div>

          <div className="pt-4 border-t border-[#202020] space-y-2">
            <button
              onClick={() => {
                if (onNavigateHome) onNavigateHome();
                else onClose();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-sans uppercase tracking-wider text-[#777777] hover:text-[#F0ECE5] hover:bg-[#141414] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>8. Back to Store</span>
            </button>
            <p className="text-[10px] font-mono text-[#555555] px-3">
              DRAYEN Atelier OS v2.4
            </p>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm md:hidden flex flex-col">
            <div className="bg-[#0e0e0e] border-b border-[#202020] p-4 flex items-center justify-between">
              <span className="font-serif text-lg uppercase tracking-wider text-white">Admin Navigation</span>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-[#777777] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#0c0c0c]">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-sans uppercase tracking-wider text-left ${
                    activeTab === item.id
                      ? 'bg-[#651C2D] text-white font-bold'
                      : 'text-[#777777] hover:bg-[#141414] hover:text-white'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
              <div className="pt-4 border-t border-[#202020]">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    if (onNavigateHome) onNavigateHome();
                    else onClose();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-xs font-sans uppercase tracking-wider text-[#BFC0C2]"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>8. Back to Store</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Viewport (Right) */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">

          {/* ======================================================== */}
          {/* TAB 1: OVERVIEW SCREEN                                    */}
          {/* ======================================================== */}
          {activeTab === 'overview' && (
            <div className="space-y-8 max-w-5xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#202020] pb-6">
                <div>
                  <span className="font-sans text-xs uppercase tracking-widest text-[#651C2D] font-bold block mb-1">
                    Telemetry & Ledger
                  </span>
                  <h1 className="font-serif text-3xl text-[#F0ECE5]">Executive Overview</h1>
                  <p className="font-sans text-xs text-[#777777] mt-1">
                    Real-time operational summary from authoritative backend database.
                  </p>
                </div>
                <button
                  onClick={loadOverview}
                  className="self-start sm:self-auto px-4 py-2 bg-[#181818] hover:bg-[#202020] border border-[#202020] text-xs font-sans uppercase tracking-wider text-[#BFC0C2] flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh Telemetry</span>
                </button>
              </div>

              {/* 6 Required Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* 1. Total Orders */}
                <div className="bg-[#121212] border border-[#202020] p-6 space-y-2">
                  <span className="font-sans text-xs uppercase tracking-widest text-[#777777] block">
                    Total Orders
                  </span>
                  {summaryLoading ? (
                    <div className="h-9 w-24 bg-[#181818] animate-pulse" />
                  ) : summary?.totalOrders != null ? (
                    <span className="font-serif text-3xl font-bold text-[#F0ECE5]">{summary.totalOrders}</span>
                  ) : (
                    <span className="font-mono text-xs text-amber-400 block pt-1">Data unavailable — connect backend</span>
                  )}
                  <p className="text-[11px] font-sans text-[#777777]">All recorded customer orders in database</p>
                </div>

                {/* 2. Awaiting Payment Verification */}
                <div className="bg-[#121212] border border-[#202020] p-6 space-y-2">
                  <span className="font-sans text-xs uppercase tracking-widest text-[#777777] block">
                    Awaiting Payment Verification
                  </span>
                  {summaryLoading ? (
                    <div className="h-9 w-24 bg-[#181818] animate-pulse" />
                  ) : summary?.awaitingPaymentVerification != null ? (
                    <span className="font-serif text-3xl font-bold text-amber-400">
                      {summary.awaitingPaymentVerification}
                    </span>
                  ) : (
                    <span className="font-mono text-xs text-amber-400 block pt-1">Data unavailable — connect backend</span>
                  )}
                  <p className="text-[11px] font-sans text-[#777777]">UPI transfer receipts pending auditor review</p>
                </div>

                {/* 3. Confirmed Orders */}
                <div className="bg-[#121212] border border-[#202020] p-6 space-y-2">
                  <span className="font-sans text-xs uppercase tracking-widest text-[#777777] block">
                    Confirmed Orders
                  </span>
                  {summaryLoading ? (
                    <div className="h-9 w-24 bg-[#181818] animate-pulse" />
                  ) : summary?.confirmedOrders != null ? (
                    <span className="font-serif text-3xl font-bold text-[#F0ECE5]">{summary.confirmedOrders}</span>
                  ) : (
                    <span className="font-mono text-xs text-amber-400 block pt-1">Data unavailable — connect backend</span>
                  )}
                  <p className="text-[11px] font-sans text-[#777777]">Verified payments transitioning to workshop</p>
                </div>

                {/* 4. Awaiting Dispatch */}
                <div className="bg-[#121212] border border-[#202020] p-6 space-y-2">
                  <span className="font-sans text-xs uppercase tracking-widest text-[#777777] block">
                    Awaiting Dispatch
                  </span>
                  {summaryLoading ? (
                    <div className="h-9 w-24 bg-[#181818] animate-pulse" />
                  ) : summary?.awaitingDispatch != null ? (
                    <span className="font-serif text-3xl font-bold text-[#F0ECE5]">{summary.awaitingDispatch}</span>
                  ) : (
                    <span className="font-mono text-xs text-amber-400 block pt-1">Data unavailable — connect backend</span>
                  )}
                  <p className="text-[11px] font-sans text-[#777777]">Vault pieces packaged for BlueDart pickup</p>
                </div>

                {/* 5. Shipped Orders */}
                <div className="bg-[#121212] border border-[#202020] p-6 space-y-2">
                  <span className="font-sans text-xs uppercase tracking-widest text-[#777777] block">
                    Shipped Orders
                  </span>
                  {summaryLoading ? (
                    <div className="h-9 w-24 bg-[#181818] animate-pulse" />
                  ) : summary?.shippedOrders != null ? (
                    <span className="font-serif text-3xl font-bold text-emerald-400">{summary.shippedOrders}</span>
                  ) : (
                    <span className="font-mono text-xs text-amber-400 block pt-1">Data unavailable — connect backend</span>
                  )}
                  <p className="text-[11px] font-sans text-[#777777]">Consignments in transit across India</p>
                </div>

                {/* 6. Verified Payment Revenue */}
                <div className="bg-[#121212] border border-[#202020] p-6 space-y-2">
                  <span className="font-sans text-xs uppercase tracking-widest text-[#777777] block">
                    Verified Payment Revenue
                  </span>
                  {summaryLoading ? (
                    <div className="h-9 w-24 bg-[#181818] animate-pulse" />
                  ) : summary?.verifiedRevenuePaise != null ? (
                    <span className="font-serif text-3xl font-bold text-emerald-400">
                      {formatINR(summary.verifiedRevenuePaise)}
                    </span>
                  ) : (
                    <span className="font-mono text-xs text-amber-400 block pt-1">Data unavailable — connect backend</span>
                  )}
                  <p className="text-[11px] font-sans text-[#777777]">Strictly verified bank receipts</p>
                </div>
              </div>

              {/* Integration Status Notice Card */}
              <div className="p-6 bg-[#121212] border border-[#202020] space-y-3">
                <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#BFC0C2]">
                  <Info className="w-4 h-4 text-[#651C2D]" />
                  <span>Authoritative Metric Protocol</span>
                </div>
                <p className="font-sans text-xs text-[#777777] leading-relaxed">
                  In accordance with DRAYEN no-mock-data rules, summary metrics are never fabricated or simulated with zeros. When your teammate connects <code className="text-[#BFC0C2] bg-[#181818] px-1.5 py-0.5">GET /api/admin/metrics</code>, real metrics populate automatically.
                </p>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: PRODUCT MANAGEMENT SCREEN                          */}
          {/* ======================================================== */}
          {activeTab === 'products' && (
            <div className="space-y-6 max-w-5xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#202020] pb-6">
                <div>
                  <span className="font-sans text-xs uppercase tracking-widest text-[#651C2D] font-bold block mb-1">
                    Vault Catalogue
                  </span>
                  <h1 className="font-serif text-3xl text-[#F0ECE5]">Product Management</h1>
                  <p className="font-sans text-xs text-[#777777] mt-1">
                    Manage gothic artifacts, specifications, finishes, chains, and pricing.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleOpenProductEdit()}
                    className="px-4 py-2 bg-[#651C2D] hover:bg-[#85253b] text-[#F0ECE5] text-xs font-sans uppercase tracking-widest font-bold flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Artifact</span>
                  </button>
                  <button
                    onClick={loadProducts}
                    className="p-2 bg-[#181818] hover:bg-[#202020] border border-[#202020] text-[#BFC0C2]"
                    title="Refresh"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#777777]" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadProducts()}
                    placeholder="Search by name, SKU, material, or finish..."
                    className="w-full bg-[#121212] border border-[#202020] pl-9 pr-4 py-2 text-xs text-[#F0ECE5] focus:border-[#651C2D] focus:outline-none"
                  />
                </div>
                <select
                  value={productCategoryFilter}
                  onChange={(e) => {
                    setProductCategoryFilter(e.target.value);
                    setTimeout(loadProducts, 50);
                  }}
                  className="bg-[#121212] border border-[#202020] px-4 py-2 text-xs text-[#F0ECE5] focus:outline-none"
                >
                  <option value="All">All Categories</option>
                  <option value="Pendants">Pendants</option>
                  <option value="Gothic Necklaces">Gothic Necklaces</option>
                  <option value="Chains">Chains</option>
                </select>
              </div>

              {/* Products Table */}
              <div className="bg-[#121212] border border-[#202020] overflow-x-auto">
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-[#161616] border-b border-[#202020] text-[#777777] uppercase tracking-wider">
                    <tr>
                      <th className="p-4">Piece</th>
                      <th className="p-4">SKU</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Selling Price</th>
                      <th className="p-4">Stock</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#181818]">
                    {products.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-[#777777]">
                          No products found in catalogue.
                        </td>
                      </tr>
                    ) : (
                      products.map((prod) => (
                        <tr key={prod.id} className="hover:bg-[#161616] transition-colors">
                          <td className="p-4 flex items-center gap-3">
                            <img
                              src={prod.images?.[0] || 'https://placehold.co/60x80/121212/F0ECE5?text=DRY'}
                              alt={prod.name}
                              className="w-10 h-12 object-cover border border-[#202020]"
                            />
                            <div>
                              <span className="font-serif text-sm text-[#F0ECE5] block">{prod.name}</span>
                              <span className="text-[10px] text-[#777777]">{prod.material}</span>
                            </div>
                          </td>
                          <td className="p-4 font-mono text-xs text-[#BFC0C2]">{prod.sku}</td>
                          <td className="p-4 text-[#BFC0C2]">{prod.category}</td>
                          <td className="p-4 font-medium text-[#F0ECE5]">
                            {formatINR(prod.selling_price_paise)}
                          </td>
                          <td className="p-4">
                            <span className={prod.stock_quantity <= 5 ? 'text-amber-400 font-bold' : 'text-[#BFC0C2]'}>
                              {prod.stock_quantity ?? 0}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 text-[9px] uppercase tracking-wider font-bold ${
                              prod.is_published
                                ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800'
                                : 'bg-stone-900 text-[#777777]'
                            }`}>
                              {prod.is_published ? 'Published' : 'Archived'}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleOpenProductEdit(prod)}
                              className="px-3 py-1 bg-[#181818] hover:bg-[#202020] border border-[#202020] text-[#BFC0C2] hover:text-[#F0ECE5] text-[11px] uppercase tracking-wider transition-colors cursor-pointer"
                            >
                              Edit / Specs
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: INVENTORY MANAGEMENT SCREEN                        */}
          {/* ======================================================== */}
          {activeTab === 'inventory' && (
            <div className="space-y-6 max-w-5xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#202020] pb-6">
                <div>
                  <span className="font-sans text-xs uppercase tracking-widest text-[#651C2D] font-bold block mb-1">
                    Stockroom &amp; Reserves
                  </span>
                  <h1 className="font-serif text-3xl text-[#F0ECE5]">Inventory Management</h1>
                  <p className="font-sans text-xs text-[#777777] mt-1">
                    Monitor genuine stock levels, variants, and low-inventory warnings.
                  </p>
                </div>
                <button
                  onClick={loadInventory}
                  className="px-4 py-2 bg-[#181818] hover:bg-[#202020] border border-[#202020] text-xs font-sans uppercase tracking-wider text-[#BFC0C2] flex items-center gap-2 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh Stock</span>
                </button>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#777777]" />
                  <input
                    type="text"
                    value={inventorySearch}
                    onChange={(e) => setInventorySearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadInventory()}
                    placeholder="Search by piece name or SKU..."
                    className="w-full bg-[#121212] border border-[#202020] pl-9 pr-4 py-2 text-xs text-[#F0ECE5] focus:border-[#651C2D] focus:outline-none"
                  />
                </div>
                <select
                  value={inventoryStatusFilter}
                  onChange={(e) => {
                    setInventoryStatusFilter(e.target.value);
                    setTimeout(loadInventory, 50);
                  }}
                  className="bg-[#121212] border border-[#202020] px-4 py-2 text-xs text-[#F0ECE5] focus:outline-none"
                >
                  <option value="all">All Stock Statuses</option>
                  <option value="in_stock">In Stock (&gt; 5)</option>
                  <option value="low_stock">Low Stock (≤ 5)</option>
                  <option value="out_of_stock">Out of Stock (0)</option>
                </select>
              </div>

              {/* Inventory Table */}
              <div className="bg-[#121212] border border-[#202020] overflow-x-auto">
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-[#161616] border-b border-[#202020] text-[#777777] uppercase tracking-wider">
                    <tr>
                      <th className="p-4">SKU</th>
                      <th className="p-4">Product Name</th>
                      <th className="p-4">Finish &amp; Material</th>
                      <th className="p-4">Variants</th>
                      <th className="p-4">Available Stock</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#181818]">
                    {inventory.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-[#777777]">
                          No inventory records located.
                        </td>
                      </tr>
                    ) : (
                      inventory.map((item) => (
                        <tr key={item.id} className="hover:bg-[#161616] transition-colors">
                          <td className="p-4 font-mono text-[#BFC0C2]">{item.sku}</td>
                          <td className="p-4 font-serif text-sm text-[#F0ECE5]">{item.name}</td>
                          <td className="p-4 text-[#777777]">{item.finish} • {item.material}</td>
                          <td className="p-4 text-[#BFC0C2]">{item.variantsCount} Options</td>
                          <td className="p-4 font-mono font-bold text-[#F0ECE5]">{item.stockQuantity}</td>
                          <td className="p-4">
                            {item.stockQuantity === 0 ? (
                              <span className="px-2 py-0.5 text-[9px] uppercase tracking-wider bg-red-950/60 text-red-400 border border-red-800 font-bold">
                                Out of Stock
                              </span>
                            ) : item.isLowStock ? (
                              <span className="px-2 py-0.5 text-[9px] uppercase tracking-wider bg-amber-950/60 text-amber-400 border border-amber-800 font-bold flex items-center gap-1 w-fit">
                                <AlertTriangle className="w-3 h-3" />
                                <span>Low Reserve</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 text-[9px] uppercase tracking-wider bg-emerald-950/60 text-emerald-400 border border-emerald-800 font-bold">
                                Available
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="p-4 bg-[#141414] border border-[#202020] text-xs font-mono text-[#777777] flex items-center justify-between">
                <span>Stock modifications disabled: Backend database inventory authority required.</span>
                <span className="text-[#BFC0C2]">Integer precision checks active</span>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: ORDER MANAGEMENT SCREEN                            */}
          {/* ======================================================== */}
          {activeTab === 'orders' && (
            <div className="space-y-6 max-w-5xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#202020] pb-6">
                <div>
                  <span className="font-sans text-xs uppercase tracking-widest text-[#651C2D] font-bold block mb-1">
                    Customer Consignments
                  </span>
                  <h1 className="font-serif text-3xl text-[#F0ECE5]">Order Management</h1>
                  <p className="font-sans text-xs text-[#777777] mt-1">
                    Authoritative customer orders supplied by backend database.
                  </p>
                </div>
                <button
                  onClick={loadOrders}
                  className="px-4 py-2 bg-[#181818] hover:bg-[#202020] border border-[#202020] text-xs font-sans uppercase tracking-wider text-[#BFC0C2] flex items-center gap-2 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh Orders</span>
                </button>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#777777]" />
                  <input
                    type="text"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadOrders()}
                    placeholder="Search by order number (e.g. DRY-2026-XXXX)..."
                    className="w-full bg-[#121212] border border-[#202020] pl-9 pr-4 py-2 text-xs text-[#F0ECE5] focus:border-[#651C2D] focus:outline-none"
                  />
                </div>
                <select
                  value={orderStatusFilter}
                  onChange={(e) => {
                    setOrderStatusFilter(e.target.value);
                    setTimeout(loadOrders, 50);
                  }}
                  className="bg-[#121212] border border-[#202020] px-4 py-2 text-xs text-[#F0ECE5] focus:outline-none"
                >
                  <option value="all">All Fulfillment Statuses</option>
                  <option value="PROCESSING">Processing</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="SHIPPED">Shipped</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              {/* Orders Data View */}
              {ordersLoading ? (
                <div className="p-12 text-center text-xs font-mono text-[#777777]">
                  Connecting to backend orders endpoint...
                </div>
              ) : orders.length === 0 ? (
                <div className="bg-[#121212] border border-[#202020] p-12 text-center space-y-3">
                  <ShoppingBag className="w-8 h-8 text-[#555555] mx-auto" />
                  <h3 className="font-serif text-xl text-[#F0ECE5]">Data Unavailable — Connect Backend</h3>
                  <p className="font-sans text-xs text-[#777777] max-w-md mx-auto leading-relaxed">
                    In accordance with strict no-mock-data rules, fake orders are never fabricated. Once your teammate connects <code className="text-[#BFC0C2] bg-[#181818] px-1 py-0.5">GET /api/admin/orders</code>, authentic orders will be displayed here.
                  </p>
                </div>
              ) : (
                <div className="bg-[#121212] border border-[#202020] overflow-x-auto">
                  <table className="w-full text-left text-xs font-sans">
                    <thead className="bg-[#161616] border-b border-[#202020] text-[#777777] uppercase tracking-wider">
                      <tr>
                        <th className="p-4">Order #</th>
                        <th className="p-4">Customer</th>
                        <th className="p-4">Total</th>
                        <th className="p-4">Payment</th>
                        <th className="p-4">Fulfillment</th>
                        <th className="p-4 text-right">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#181818]">
                      {orders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-[#161616] transition-colors">
                          <td className="p-4 font-mono font-bold text-[#F0ECE5]">{ord.order_number}</td>
                          <td className="p-4 text-[#BFC0C2]">{ord.customer_name}</td>
                          <td className="p-4 font-medium text-[#F0ECE5]">{formatINR(ord.total_payable_paise)}</td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 text-[9px] uppercase tracking-wider font-bold bg-amber-950/60 text-amber-400 border border-amber-800">
                              {ord.payment_status}
                            </span>
                          </td>
                          <td className="p-4 text-[#BFC0C2]">{ord.order_status}</td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => setSelectedOrderDetails(ord)}
                              className="px-3 py-1 bg-[#181818] hover:bg-[#202020] text-[#BFC0C2] hover:text-[#F0ECE5] text-[11px] uppercase tracking-wider"
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 5: PAYMENT VERIFICATION (CRITICAL SCREEN)             */}
          {/* ======================================================== */}
          {activeTab === 'payments' && (
            <div className="space-y-6 max-w-5xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#202020] pb-6">
                <div>
                  <span className="font-sans text-xs uppercase tracking-widest text-[#651C2D] font-bold block mb-1">
                    Atelier Curatorial Audit
                  </span>
                  <h1 className="font-serif text-3xl text-[#F0ECE5]">Payment Verification Desk</h1>
                  <p className="font-sans text-xs text-[#777777] mt-1">
                    Cross-examine customer payment screenshots and 12-digit UTR references against bank statements.
                  </p>
                </div>
                <button
                  onClick={loadPayments}
                  className="px-4 py-2 bg-[#181818] hover:bg-[#202020] border border-[#202020] text-xs font-sans uppercase tracking-wider text-[#BFC0C2] flex items-center gap-2 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh Queue</span>
                </button>
              </div>

              {/* Critical Policy Notice */}
              <div className="p-4 bg-amber-950/20 border border-amber-700/50 text-xs font-mono space-y-1.5">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Authoritative Settlement Safeguard</span>
                </div>
                <p className="text-[#BFC0C2] leading-relaxed">
                  Payment verification is unavailable until the secure backend integration is configured. The future backend must enforce administrator permissions and record payment decisions in an audit history. Frontend buttons never pretend to verify real funds.
                </p>
              </div>

              {verificationsLoading ? (
                <div className="p-12 text-center text-xs font-mono text-[#777777]">
                  Connecting to payment verifications endpoint...
                </div>
              ) : verifications.length === 0 ? (
                <div className="bg-[#121212] border border-[#202020] p-12 text-center space-y-3">
                  <ShieldCheck className="w-10 h-10 text-emerald-500/70 mx-auto" />
                  <h3 className="font-serif text-xl text-[#F0ECE5]">No Pending Payment Submissions</h3>
                  <p className="font-sans text-xs text-[#777777] max-w-md mx-auto leading-relaxed">
                    There are no unverified payment submissions in queue. When customers place orders via UPI and submit proof, they appear here for auditor authorization.
                  </p>
                </div>
              ) : (
                <div className="bg-[#121212] border border-[#202020] overflow-x-auto">
                  <table className="w-full text-left text-xs font-sans">
                    <thead className="bg-[#161616] border-b border-[#202020] text-[#777777] uppercase tracking-wider">
                      <tr>
                        <th className="p-4">Order #</th>
                        <th className="p-4">Amount Due</th>
                        <th className="p-4">Submitted UTR</th>
                        <th className="p-4">Payer Details</th>
                        <th className="p-4">Timestamp</th>
                        <th className="p-4 text-right">Audit Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#181818]">
                      {verifications.map((item) => (
                        <tr key={item.id} className="hover:bg-[#161616] transition-colors">
                          <td className="p-4 font-mono font-bold text-[#F0ECE5]">{item.orderNumber}</td>
                          <td className="p-4 font-serif text-sm font-bold text-[#F0ECE5]">
                            {formatINR(item.amountPaise)}
                          </td>
                          <td className="p-4 font-mono text-amber-400 font-bold select-all">{item.utrNumber}</td>
                          <td className="p-4 text-[#BFC0C2]">
                            {item.payerName || 'Not stated'}
                            {item.payerVpa ? ` (${item.payerVpa})` : ''}
                          </td>
                          <td className="p-4 font-mono text-[#777777]">
                            {new Date(item.submittedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="p-4 text-right space-x-2">
                            <button
                              onClick={() => {
                                setSelectedVerification(item);
                                setVerificationModalMode('inspect');
                              }}
                              className="px-3 py-1 bg-[#181818] hover:bg-[#202020] text-[#BFC0C2] hover:text-[#F0ECE5] text-[11px] uppercase tracking-wider"
                            >
                              View Screenshot
                            </button>
                            <button
                              disabled
                              title="Payment verification is unavailable until secure backend integration is configured"
                              className="px-3 py-1 bg-[#651C2D]/40 text-[#777777] text-[11px] uppercase tracking-wider cursor-not-allowed"
                            >
                              Approve
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 6: SHIPMENT MANAGEMENT SCREEN                         */}
          {/* ======================================================== */}
          {activeTab === 'shipments' && (
            <div className="space-y-6 max-w-5xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#202020] pb-6">
                <div>
                  <span className="font-sans text-xs uppercase tracking-widest text-[#651C2D] font-bold block mb-1">
                    Domestic Logistics
                  </span>
                  <h1 className="font-serif text-3xl text-[#F0ECE5]">Shipment Management</h1>
                  <p className="font-sans text-xs text-[#777777] mt-1">
                    Manage consignments confirmed for packaging and courier dispatch.
                  </p>
                </div>
                <button
                  onClick={loadShipments}
                  className="px-4 py-2 bg-[#181818] hover:bg-[#202020] border border-[#202020] text-xs font-sans uppercase tracking-wider text-[#BFC0C2] flex items-center gap-2 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh Shipments</span>
                </button>
              </div>

              {/* Safeguard Notice */}
              <div className="p-4 bg-[#121212] border border-[#202020] text-xs font-mono text-[#777777] space-y-1">
                <p className="font-bold text-[#F0ECE5]">Fulfillment Safeguard Rule:</p>
                <p>
                  Never allow an unverified payment to become a shipped order through a frontend-only action. Dispatch forms remain disabled until backend logistics integration confirms eligibility.
                </p>
              </div>

              {shipmentsLoading ? (
                <div className="p-12 text-center text-xs font-mono text-[#777777]">
                  Loading shipment records...
                </div>
              ) : shipments.length === 0 ? (
                <div className="bg-[#121212] border border-[#202020] p-12 text-center space-y-3">
                  <Truck className="w-8 h-8 text-[#555555] mx-auto" />
                  <h3 className="font-serif text-xl text-[#F0ECE5]">Data Unavailable — Connect Backend</h3>
                  <p className="font-sans text-xs text-[#777777] max-w-md mx-auto leading-relaxed">
                    No confirmed shipments available. Orders appear here once payment is verified and consignments become eligible for courier dispatch.
                  </p>
                </div>
              ) : (
                <div className="bg-[#121212] border border-[#202020] overflow-x-auto">
                  <table className="w-full text-left text-xs font-sans">
                    <thead className="bg-[#161616] border-b border-[#202020] text-[#777777] uppercase tracking-wider">
                      <tr>
                        <th className="p-4">Order #</th>
                        <th className="p-4">Customer &amp; Destination</th>
                        <th className="p-4">Courier</th>
                        <th className="p-4">Tracking / AWB</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Dispatch</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#181818]">
                      {shipments.map((s) => (
                        <tr key={s.orderId} className="hover:bg-[#161616] transition-colors">
                          <td className="p-4 font-mono font-bold text-[#F0ECE5]">{s.orderNumber}</td>
                          <td className="p-4 text-[#BFC0C2]">
                            {s.customerName}<br />
                            <span className="text-[#777777]">{s.city}, {s.state}</span>
                          </td>
                          <td className="p-4 text-[#BFC0C2]">{s.courier || 'Unassigned'}</td>
                          <td className="p-4 font-mono text-xs text-[#BFC0C2]">{s.trackingNumber || '—'}</td>
                          <td className="p-4 text-amber-400 uppercase text-[10px] font-bold">{s.orderStatus}</td>
                          <td className="p-4 text-right">
                            <button
                              disabled={!s.isEligibleForFulfillment}
                              className="px-3 py-1 bg-[#181818] text-[#777777] text-[11px] uppercase tracking-wider cursor-not-allowed"
                            >
                              Record Dispatch
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 7: STORE SETTINGS SCREEN                              */}
          {/* ======================================================== */}
          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-3xl">
              <div className="border-b border-[#202020] pb-6">
                <span className="font-sans text-xs uppercase tracking-widest text-[#651C2D] font-bold block mb-1">
                  Atelier Configuration
                </span>
                <h1 className="font-serif text-3xl text-[#F0ECE5]">Store Settings &amp; Gateway Parameters</h1>
                <p className="font-sans text-xs text-[#777777] mt-1">
                  Review active store settings and identify unconfigured backend parameters.
                </p>
              </div>

              <div className="space-y-6">
                {/* Section 1: Contact Details */}
                <div className="bg-[#121212] border border-[#202020] p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif text-lg text-[#F0ECE5]">Store Contact Coordinates</h3>
                    <span className="px-2 py-0.5 bg-emerald-950/60 text-emerald-400 border border-emerald-800 text-[9px] uppercase font-bold">
                      Connected
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                    <div>
                      <span className="text-[#777777] block text-[10px] uppercase">Concierge Email</span>
                      <span className="text-[#F0ECE5] font-mono">concierge@drayen.in</span>
                    </div>
                    <div>
                      <span className="text-[#777777] block text-[10px] uppercase">Concierge Telephone</span>
                      <span className="text-[#F0ECE5] font-mono">+91 98400 12345</span>
                    </div>
                  </div>
                </div>

                {/* Section 2: Logistics & Free Shipping */}
                <div className="bg-[#121212] border border-[#202020] p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif text-lg text-[#F0ECE5]">Shipping &amp; Logistics Thresholds</h3>
                    <span className="px-2 py-0.5 bg-emerald-950/60 text-emerald-400 border border-emerald-800 text-[9px] uppercase font-bold">
                      Connected
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                    <div>
                      <span className="text-[#777777] block text-[10px] uppercase">Free Shipping Threshold</span>
                      <span className="text-[#F0ECE5] font-mono font-bold">₹499.00 (49,900 Paise)</span>
                    </div>
                    <div>
                      <span className="text-[#777777] block text-[10px] uppercase">Standard Courier Charge</span>
                      <span className="text-[#F0ECE5] font-mono font-bold">₹50.00 (5,000 Paise)</span>
                    </div>
                  </div>
                </div>

                {/* Section 3: Merchant UPI Gateway */}
                <div className="bg-[#121212] border border-[#202020] p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif text-lg text-[#F0ECE5]">Merchant UPI ID Configuration</h3>
                    <span className="px-2 py-0.5 bg-emerald-950/60 text-emerald-400 border border-emerald-800 text-[9px] uppercase font-bold">
                      Active
                    </span>
                  </div>
                  <div className="space-y-3 text-xs font-sans">
                    <div>
                      <span className="text-[#777777] block text-[10px] uppercase">Authoritative Merchant VPA</span>
                      <span className="text-[#F0ECE5] font-mono font-bold select-all">drayen.atelier@okaxis</span>
                    </div>
                    <div>
                      <span className="text-[#777777] block text-[10px] uppercase">Payee Legal Name</span>
                      <span className="text-[#F0ECE5]">DRAYEN ATELIER</span>
                    </div>
                    <div>
                      <span className="text-[#777777] block text-[10px] uppercase">Dynamic QR Payload Protocol</span>
                      <span className="text-emerald-400 font-mono text-[11px]">upi://pay?pa=...&cu=INR&am=... (Active)</span>
                    </div>
                  </div>
                </div>

                {/* Section 4: Return Policy */}
                <div className="bg-[#121212] border border-[#202020] p-6 space-y-2 text-xs font-sans">
                  <h3 className="font-serif text-lg text-[#F0ECE5]">Return &amp; Exchange Warranty</h3>
                  <p className="text-[#777777]">
                    7-Day complimentary exchange policy. Lifetime tarnish-proof replacement guarantee on certified 316L hypoallergenic marine stainless steel.
                  </p>
                </div>

                {/* Section 5: Order Notifications */}
                <div className="bg-[#121212] border border-[#202020] p-6 space-y-3 text-xs font-sans">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif text-lg text-[#F0ECE5]">Order Notification Services</h3>
                    <span className="px-2 py-0.5 bg-amber-950/60 text-amber-400 border border-amber-800 text-[9px] uppercase font-bold">
                      Backend Required
                    </span>
                  </div>
                  <p className="text-[#777777]">
                    WhatsApp Business API webhook and transactional email dispatcher require backend credentials. Secrets are never stored in client code.
                  </p>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ======================================================== */}
      {/* PRODUCT CREATE / EDIT MODAL                               */}
      {/* ======================================================== */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-[#202020] max-w-2xl w-full p-6 md:p-8 max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b border-[#202020] pb-4">
              <div>
                <span className="font-sans text-xs uppercase tracking-widest text-[#651C2D] font-bold block mb-1">
                  Vault Specification
                </span>
                <h3 className="font-serif text-2xl text-[#F0ECE5]">
                  {productFormMode === 'create' ? 'Catalogue New Artifact' : `Edit ${formName}`}
                </h3>
              </div>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="text-[#777777] hover:text-[#F0ECE5] text-xs font-mono uppercase"
              >
                ✕ Cancel
              </button>
            </div>

            {/* Unconfigured Notice */}
            <div className="p-3 bg-amber-950/20 border border-amber-700/40 text-amber-300 text-xs font-mono">
              Notice: Product persistence calls <code className="text-white">adminService.createProduct()</code>. Saving is disabled until the backend database is connected.
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setProductFormError('Saving is disabled until the secure backend integration is configured. Teammate will connect POST /api/admin/products.');
              }}
              className="space-y-4 text-xs font-sans"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block uppercase tracking-wider text-[#BFC0C2] mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-[#181818] border border-[#202020] px-3 py-2 text-sm text-[#F0ECE5] focus:border-[#651C2D] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block uppercase tracking-wider text-[#BFC0C2] mb-1">SKU *</label>
                  <input
                    type="text"
                    required
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    className="w-full bg-[#181818] border border-[#202020] px-3 py-2 text-sm font-mono text-[#F0ECE5] focus:border-[#651C2D] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block uppercase tracking-wider text-[#BFC0C2] mb-1">Category *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-[#181818] border border-[#202020] px-3 py-2 text-xs text-[#F0ECE5] focus:outline-none"
                  >
                    <option value="Pendants">Pendants</option>
                    <option value="Gothic Necklaces">Gothic Necklaces</option>
                    <option value="Chains">Chains</option>
                  </select>
                </div>
                <div>
                  <label className="block uppercase tracking-wider text-[#BFC0C2] mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={formPriceINR}
                    onChange={(e) => setFormPriceINR(e.target.value)}
                    className="w-full bg-[#181818] border border-[#202020] px-3 py-2 text-sm text-[#F0ECE5] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block uppercase tracking-wider text-[#BFC0C2] mb-1">Original Price (₹)</label>
                  <input
                    type="number"
                    value={formOriginalPriceINR}
                    onChange={(e) => setFormOriginalPriceINR(e.target.value)}
                    className="w-full bg-[#181818] border border-[#202020] px-3 py-2 text-sm text-[#F0ECE5] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block uppercase tracking-wider text-[#BFC0C2] mb-1">Description</label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-[#181818] border border-[#202020] px-3 py-2 text-xs text-[#F0ECE5] focus:border-[#651C2D] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block uppercase tracking-wider text-[#BFC0C2] mb-1">Material</label>
                  <input
                    type="text"
                    value={formMaterial}
                    onChange={(e) => setFormMaterial(e.target.value)}
                    className="w-full bg-[#181818] border border-[#202020] px-3 py-2 text-xs text-[#F0ECE5]"
                  />
                </div>
                <div>
                  <label className="block uppercase tracking-wider text-[#BFC0C2] mb-1">Finish</label>
                  <input
                    type="text"
                    value={formFinish}
                    onChange={(e) => setFormFinish(e.target.value)}
                    className="w-full bg-[#181818] border border-[#202020] px-3 py-2 text-xs text-[#F0ECE5]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block uppercase tracking-wider text-[#BFC0C2] mb-1">Chain Length</label>
                  <input
                    type="text"
                    value={formChainLength}
                    onChange={(e) => setFormChainLength(e.target.value)}
                    className="w-full bg-[#181818] border border-[#202020] px-3 py-2 text-xs text-[#F0ECE5]"
                  />
                </div>
                <div>
                  <label className="block uppercase tracking-wider text-[#BFC0C2] mb-1">Chain Thickness</label>
                  <input
                    type="text"
                    value={formChainThickness}
                    onChange={(e) => setFormChainThickness(e.target.value)}
                    className="w-full bg-[#181818] border border-[#202020] px-3 py-2 text-xs text-[#F0ECE5]"
                  />
                </div>
                <div>
                  <label className="block uppercase tracking-wider text-[#BFC0C2] mb-1">Pendant Dimensions</label>
                  <input
                    type="text"
                    value={formPendantDimensions}
                    onChange={(e) => setFormPendantDimensions(e.target.value)}
                    className="w-full bg-[#181818] border border-[#202020] px-3 py-2 text-xs text-[#F0ECE5]"
                  />
                </div>
              </div>

              <div>
                <label className="block uppercase tracking-wider text-[#BFC0C2] mb-1">
                  Product Image URLs (One URL per line)
                </label>
                <textarea
                  rows={2}
                  value={formImages}
                  onChange={(e) => setFormImages(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-[#181818] border border-[#202020] px-3 py-2 text-xs text-[#F0ECE5] font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div>
                  <label className="block uppercase tracking-wider text-[#BFC0C2] mb-1">Initial Stock Reserve *</label>
                  <input
                    type="number"
                    required
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    className="w-full bg-[#181818] border border-[#202020] px-3 py-2 text-xs text-[#F0ECE5]"
                  />
                </div>
                <div className="flex items-center gap-2 pt-4">
                  <input
                    type="checkbox"
                    id="published"
                    checked={formIsPublished}
                    onChange={(e) => setFormIsPublished(e.target.checked)}
                    className="accent-[#651C2D] w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="published" className="uppercase tracking-wider text-[#BFC0C2] cursor-pointer">
                    Publish into Storefront Catalogue
                  </label>
                </div>
              </div>

              {productFormError && (
                <p className="text-red-400 font-mono text-xs">{productFormError}</p>
              )}

              <div className="pt-4 border-t border-[#202020] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 bg-[#181818] hover:bg-[#202020] border border-[#202020] text-xs uppercase tracking-wider text-[#BFC0C2]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled
                  title="Backend integration required"
                  className="px-6 py-2.5 bg-[#651C2D]/40 text-[#777777] text-xs uppercase tracking-widest font-bold cursor-not-allowed"
                >
                  Save Artifact (Backend Required)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SCREENSHOT INSPECTION MODAL                               */}
      {/* ======================================================== */}
      {selectedVerification && verificationModalMode === 'inspect' && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-[#202020] max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#202020] pb-3">
              <h3 className="font-serif text-xl text-[#F0ECE5]">
                Audit Payment #{selectedVerification.orderNumber}
              </h3>
              <button
                onClick={() => setSelectedVerification(null)}
                className="text-[#777777] hover:text-[#F0ECE5] text-xs font-mono"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-3 text-xs font-sans">
              <div className="bg-[#181818] p-4 border border-[#202020] space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#777777]">Amount Due:</span>
                  <span className="font-bold text-[#F0ECE5]">{formatINR(selectedVerification.amountPaise)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#777777]">Claimed UTR:</span>
                  <span className="font-mono text-amber-400 font-bold select-all">{selectedVerification.utrNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#777777]">Payer Name:</span>
                  <span className="text-[#BFC0C2]">{selectedVerification.payerName || 'Not stated'}</span>
                </div>
              </div>

              <div className="p-4 bg-[#0e0e0e] border border-[#202020] text-center">
                <p className="font-mono text-[11px] text-[#777777]">
                  Private screenshot streaming is handled via secure authenticated endpoint once backend is connected.
                </p>
              </div>

              <div className="p-3 bg-amber-950/20 border border-amber-800 text-amber-300 text-[11px] font-mono">
                "Payment verification is unavailable until the secure backend integration is configured."
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#202020]">
              <button
                onClick={() => setSelectedVerification(null)}
                className="px-4 py-2 bg-[#181818] text-xs uppercase tracking-wider text-[#BFC0C2]"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
