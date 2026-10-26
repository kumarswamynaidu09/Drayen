import React, { useState, useEffect } from 'react';
import { formatINR } from '../lib/money';
import { ordersService } from '../services/orders';
import { Order, OrderStatus } from '../types';
import { 
  Search, 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  ArrowRight,
  ChevronRight,
  HelpCircle,
  XCircle,
  FileText
} from 'lucide-react';

interface OrderTrackingViewProps {
  initialOrderNumber?: string;
  initialToken?: string;
  onNavigateToPayment: (orderNumber: string, token: string) => void;
  onNavigateHome: () => void;
  onNavigateShop?: () => void;
}

export const OrderTrackingView: React.FC<OrderTrackingViewProps> = ({
  initialOrderNumber = '',
  initialToken = '',
  onNavigateToPayment,
  onNavigateHome,
  onNavigateShop
}) => {
  const [activeTab, setActiveTab] = useState<'track' | 'my-orders'>('track');
  const [orderFilter, setOrderFilter] = useState<'all' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'>('all');

  // Tracking inputs
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber);
  const [phone, setPhone] = useState('');
  const [token, setToken] = useState(initialToken);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<any | null>(null);

  // My Orders list state
  const [ordersList, setOrdersList] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  useEffect(() => {
    if (initialOrderNumber) {
      handleLookup(initialOrderNumber, initialToken, '');
    }
  }, [initialOrderNumber, initialToken]);

  const handleLookup = async (lookupNumber: string, lookupToken: string, lookupPhone: string) => {
    if (!lookupNumber.trim()) {
      setError('Please provide your Order Reference Number.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await ordersService.getOrderById(lookupNumber.trim(), lookupToken || lookupPhone);
      if (res.order) {
        setOrderData(res.order);
      } else {
        setError(res.error || 'No active order found with the provided credentials.');
      }
    } catch (err: any) {
      setOrderData(null);
      setError(err.message || 'No active order found with the provided credentials.');
    } finally {
      setLoading(false);
    }
  };

  const loadMyOrders = async (phoneOrToken: string) => {
    try {
      setOrdersLoading(true);
      setOrdersError(null);
      const res = await ordersService.getMyOrders(phoneOrToken);
      if (res.orders.length > 0) {
        setOrdersList(res.orders);
      } else {
        setOrdersList([]);
        if (res.error) setOrdersError(res.error);
      }
    } finally {
      setOrdersLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase().replace(/-/g, '_');
    switch (s) {
      case 'awaiting_payment':
        return (
          <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-mono uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Awaiting Payment Transfer
          </span>
        );
      case 'awaiting_payment_verification':
      case 'pending review':
        return (
          <span className="px-3 py-1 bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 text-xs font-mono uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Awaiting Payment Verification
          </span>
        );
      case 'confirmed_processing':
      case 'confirmed':
        return (
          <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/30 text-xs font-mono uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" /> Payment Verified — Atelier Casting
          </span>
        );
      case 'ready_for_dispatch':
      case 'packed':
        return (
          <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 text-xs font-mono uppercase tracking-wider flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5" /> Packaged & Sealed
          </span>
        );
      case 'shipped':
      case 'dispatched':
        return (
          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-mono uppercase tracking-wider flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5" /> Dispatched in Transit
          </span>
        );
      case 'delivered':
        return (
          <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 text-xs font-mono uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Safely Delivered
          </span>
        );
      case 'payment_rejected':
      case 'rejected':
        return (
          <span className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/30 text-xs font-mono uppercase tracking-wider flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" /> Payment Rejected
          </span>
        );
      case 'payment_needs_correction':
      case 'needs correction':
        return (
          <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/50 text-xs font-mono uppercase tracking-wider flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" /> Details Need Correction
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-3 py-1 bg-stone-500/10 text-stone-400 border border-stone-500/30 text-xs font-mono uppercase tracking-wider">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-stone-500/10 text-stone-400 border border-stone-500/30 text-xs font-mono uppercase tracking-wider">
            {status}
          </span>
        );
    }
  };

  const verticalStages: { key: string; label: string; desc: string }[] = [
    { key: 'order_placed', label: 'Order Registered', desc: 'Consignment requisition logged in atelier queue.' },
    { key: 'verification', label: 'Payment Verification', desc: 'UTR and payment screenshot reviewed against bank records.' },
    { key: 'confirmed', label: 'Order Confirmed', desc: 'Payment approved. Talisman allocated for inspection & hand-finishing.' },
    { key: 'packed', label: 'Packed & Sealed', desc: 'Inspected and packaged in signature matte noir gift box with seal.' },
    { key: 'shipped', label: 'Shipped via Courier', desc: 'Handed to priority logistics partner with AWB tracking.' },
    { key: 'delivered', label: 'Delivered', desc: 'Package successfully delivered to customer destination.' },
  ];

  const getStageStatus = (stageIdx: number, ordStatus: string, payStatus: string) => {
    const s = (ordStatus || '').toLowerCase();
    const p = (payStatus || '').toLowerCase();

    let current = 0;
    if (s.includes('delivered')) current = 5;
    else if (s.includes('shipped') || s.includes('dispatch')) current = 4;
    else if (s.includes('ready') || s.includes('packed')) current = 3;
    else if (s.includes('confirmed') || p.includes('verified')) current = 2;
    else if (p.includes('submitted') || s.includes('verification')) current = 1;

    return {
      completed: stageIdx < current,
      isCurrent: stageIdx === current,
      pending: stageIdx > current,
    };
  };

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-[#e5e2e1] pt-24 pb-20 px-4 md:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Navigation Tabs (Myntra-style Orders & Tracking) */}
        <div className="flex border-b border-[#262424] gap-6 text-xs font-mono uppercase tracking-widest">
          <button
            onClick={() => setActiveTab('track')}
            className={`pb-3 transition-colors border-b-2 ${
              activeTab === 'track'
                ? 'border-[#651C2D] text-white font-bold'
                : 'border-transparent text-[#858281] hover:text-white'
            }`}
          >
            Track Consignment
          </button>
          <button
            onClick={() => {
              setActiveTab('my-orders');
              if (phone) loadMyOrders(phone);
            }}
            className={`pb-3 transition-colors border-b-2 ${
              activeTab === 'my-orders'
                ? 'border-[#651C2D] text-white font-bold'
                : 'border-transparent text-[#858281] hover:text-white'
            }`}
          >
            My Orders
          </button>
        </div>

        {/* TAB 1: TRACK CONSIGNMENT LOOKUP */}
        {activeTab === 'track' && (
          <>
            <div className="border border-[#262424] bg-[#141414] p-6 md:p-8">
              <span className="font-mono text-xs uppercase tracking-widest text-[#651C2D] font-bold block mb-1">
                Atelier Telemetry
              </span>
              <h1 className="font-serif text-3xl md:text-4xl tracking-wide text-white">Track Your Order</h1>
              <p className="text-xs text-[#858281] mt-2 max-w-xl font-mono">
                Enter your order number along with your mobile phone or security access token to review live dispatch status.
              </p>

              {/* Search Form */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleLookup(orderNumber, token, phone);
                }} 
                className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-3"
              >
                <div className="md:col-span-5">
                  <input
                    type="text"
                    required
                    placeholder="Order Number (e.g. DRY-2025-XXXX)"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                    className="w-full bg-[#1b1919] border border-[#2d2929] px-4 py-3 text-sm text-white placeholder-[#858281] font-mono focus:border-[#651C2D] focus:outline-none"
                  />
                </div>
                <div className="md:col-span-4">
                  <input
                    type="text"
                    placeholder="Phone (10 digits) or Token"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-[#1b1919] border border-[#2d2929] px-4 py-3 text-sm text-white placeholder-[#858281] font-mono focus:border-[#651C2D] focus:outline-none"
                  />
                </div>
                <div className="md:col-span-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-full min-h-[46px] bg-[#651C2D] hover:bg-[#85253b] text-white font-mono text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                    <span>Inspect Status</span>
                  </button>
                </div>
              </form>

              {error && (
                <div className="mt-4 p-4 bg-red-950/40 border border-red-800 text-red-300 text-xs font-mono flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Loaded Order Display */}
            {orderData && (
              <div className="space-y-6">
                {/* Status Summary Card */}
                <div className="bg-[#141414] border border-[#262424] p-6 md:p-8 space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#201f1f] pb-6">
                    <div>
                      <span className="font-mono text-xs text-[#858281] uppercase tracking-wider block">
                        Consignment Reference
                      </span>
                      <span className="font-mono text-2xl font-bold text-white tracking-wider">
                        {orderData.order_number || orderData.orderNumber}
                      </span>
                      <span className="block text-[11px] text-[#858281] mt-0.5 font-mono">
                        Placed on {new Date(orderData.created_at || orderData.createdAt || Date.now()).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div>{getStatusBadge(orderData.order_status || orderData.orderStatus)}</div>
                  </div>

                  {/* Vertical Tracking Timeline */}
                  <div className="py-4">
                    <h3 className="font-serif text-lg text-white mb-6">Fulfilment & Transit Timeline</h3>
                    <div className="space-y-6 relative border-l-2 border-[#2d2929] ml-4 pl-6">
                      {verticalStages.map((st, idx) => {
                        const status = getStageStatus(
                          idx,
                          orderData.order_status || orderData.orderStatus,
                          orderData.payment_status || orderData.paymentStatus
                        );

                        return (
                          <div key={st.key} className="relative">
                            <span
                              className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full border-2 ${
                                status.completed
                                  ? 'bg-emerald-500 border-emerald-400'
                                  : status.isCurrent
                                  ? 'bg-[#651C2D] border-red-400 ring-4 ring-[#651C2D]/30'
                                  : 'bg-[#1b1919] border-[#403e3d]'
                              }`}
                            />
                            <div>
                              <span
                                className={`font-mono text-xs uppercase tracking-wider block font-bold ${
                                  status.isCurrent
                                    ? 'text-[#c5a059]'
                                    : status.completed
                                    ? 'text-white'
                                    : 'text-[#605d5c]'
                                }`}
                              >
                                {st.label}
                              </span>
                              <p className="text-xs text-[#858281] mt-0.5">{st.desc}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Shipment Tracking details if available */}
                  {orderData.shipment ? (
                    <div className="bg-[#1b1919] border border-[#2d2929] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-mono">
                      <div>
                        <span className="text-[#858281] uppercase block text-[10px]">Courier Partner</span>
                        <span className="text-white font-bold">{orderData.shipment.carrier || 'Blue Dart Express'}</span>
                      </div>
                      <div>
                        <span className="text-[#858281] uppercase block text-[10px]">AWB Tracking Number</span>
                        <span className="text-white font-bold">{orderData.shipment.tracking_number || orderData.shipment.trackingNumber}</span>
                      </div>
                      {orderData.shipment.tracking_url && (
                        <a
                          href={orderData.shipment.tracking_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-[#651C2D] text-white flex items-center gap-1.5 uppercase tracking-wider"
                        >
                          <span>Live Courier Tracking</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 bg-[#181717] border border-[#262424] text-xs font-mono text-[#858281]">
                      Tracking information will appear here once the package is dispatched via our insured courier partner.
                    </div>
                  )}

                  {/* Action CTA if payment pending */}
                  {(orderData.payment_status === 'pending' || orderData.order_status === 'awaiting_payment') && (
                    <div className="bg-[#201518] border border-[#651C2D]/60 p-4 flex items-center justify-between">
                      <div>
                        <span className="font-serif text-sm text-white font-bold block">Payment Transfer Pending</span>
                        <span className="text-xs text-[#cac6bd] font-mono">
                          Please complete UPI transfer and submit your transaction screenshot & UTR.
                        </span>
                      </div>
                      <button
                        onClick={() =>
                          onNavigateToPayment(
                            orderData.order_number || orderData.orderNumber,
                            orderData.access_token || orderData.accessToken
                          )
                        }
                        className="px-4 py-2 bg-[#651C2D] hover:bg-[#85253b] text-white font-mono text-xs uppercase tracking-wider font-bold"
                      >
                        Complete Payment →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* TAB 2: MY ORDERS LIST (Myntra-style) */}
        {activeTab === 'my-orders' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#262424] pb-4">
              <div>
                <h2 className="font-serif text-3xl text-white">Order Consignments</h2>
                <p className="text-xs text-[#858281] mt-1 font-mono">
                  Review purchase history, delivery statuses, and download invoice receipts.
                </p>
              </div>

              {/* Status Filter Chips */}
              <div className="flex flex-wrap gap-2 text-xs font-mono">
                {(['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setOrderFilter(filter)}
                    className={`px-3 py-1.5 uppercase tracking-wider transition-colors border ${
                      orderFilter === filter
                        ? 'bg-[#651C2D] border-[#651C2D] text-white'
                        : 'bg-[#141414] border-[#262424] text-[#858281] hover:text-white'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders List Container */}
            {ordersLoading ? (
              <div className="bg-[#141414] border border-[#262424] p-12 text-center text-xs font-mono text-[#858281]">
                <div className="w-5 h-5 border-2 border-[#651C2D] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                Querying orders ledger...
              </div>
            ) : ordersList.length === 0 ? (
              <div className="bg-[#141414] border border-[#262424] p-16 text-center space-y-4">
                <Package className="w-10 h-10 text-[#403e3d] mx-auto" />
                <h3 className="font-serif text-2xl text-white">Your journey with DRAYEN starts here.</h3>
                <p className="text-xs text-[#858281] max-w-md mx-auto font-mono">
                  {ordersError ||
                    'No orders logged for this session. Explore our handcrafted gothic talismans and personal armor.'}
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      if (onNavigateShop) onNavigateShop();
                      else onNavigateHome();
                    }}
                    className="px-6 py-3 bg-[#651C2D] hover:bg-[#85253b] text-white font-mono text-xs uppercase tracking-widest font-bold transition-colors"
                  >
                    Explore The Collection
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {ordersList.map((ord) => (
                  <div key={ord.id} className="bg-[#141414] border border-[#262424] p-6 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#201f1f] pb-4">
                      <div>
                        <span className="font-mono text-xs text-[#858281]">Order #{ord.order_number}</span>
                        <div className="font-serif text-lg text-white font-bold mt-0.5">
                          {ord.totalPayableINR || formatINR(ord.total_payable_paise)}
                        </div>
                      </div>
                      <div>{getStatusBadge(ord.order_status)}</div>
                    </div>

                    {/* Order Items Summary */}
                    <div className="space-y-2">
                      {ord.items?.map((it, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs font-mono">
                          <span className="text-white">
                            {it.quantity} × {it.product_name}
                          </span>
                          <span className="text-[#858281]">{it.totalINR || formatINR(it.total_paise)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-end gap-3 pt-2 border-t border-[#201f1f]">
                      <button
                        onClick={() => {
                          setOrderNumber(ord.order_number);
                          setToken(ord.access_token);
                          setActiveTab('track');
                          handleLookup(ord.order_number, ord.access_token, '');
                        }}
                        className="px-4 py-2 bg-[#1b1919] hover:bg-[#252323] border border-[#2d2929] text-xs font-mono uppercase tracking-wider text-white"
                      >
                        View Timeline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
