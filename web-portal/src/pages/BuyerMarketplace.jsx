import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import MandiComparisonCard from '../components/MandiComparisonCard';
import OrderCheckoutModal from '../components/OrderCheckoutModal';
import {
  ShoppingBag,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  QrCode,
  MapPin,
  Sparkles
} from 'lucide-react';

export default function BuyerMarketplace({ activeTab, onOpenGateVerify }) {
  const { user } = useAuth();
  const { lastStockUpdate, lastEscrowRelease } = useSocket();
  const [batches, setBatches] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  const loadBatches = async () => {
    try {
      setLoading(true);
      const [batchRes, orderRes] = await Promise.all([
        api.getBatches(),
        api.getMyOrders()
      ]);
      if (batchRes.success) setBatches(batchRes.data);
      if (orderRes.success) setMyOrders(orderRes.data);
    } catch (err) {
      console.error('Error loading buyer marketplace:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBatches();
  }, []);

  // Update batch state when Socket.io emits stock update
  useEffect(() => {
    if (lastStockUpdate) {
      setBatches((prev) =>
        prev.map((b) =>
          b.id === lastStockUpdate.batch_id
            ? { ...b, available_qty_kg: lastStockUpdate.available_qty_kg, status: lastStockUpdate.status }
            : b
        )
      );
    }
  }, [lastStockUpdate]);

  // Update orders when escrow is released
  useEffect(() => {
    if (lastEscrowRelease) {
      loadBatches();
    }
  }, [lastEscrowRelease]);

  const filteredBatches = batches.filter((b) => {
    const matchesSearch =
      b.crop_name.toLowerCase().includes(search.toLowerCase()) ||
      b.crop_name_hi.includes(search) ||
      b.farmer_name.toLowerCase().includes(search.toLowerCase());

    if (filterType === 'ACTIVE') return matchesSearch && b.available_qty_kg > 0;
    if (filterType === 'SOLD_OUT') return matchesSearch && b.available_qty_kg <= 0;
    return matchesSearch;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* If viewing My Society Orders */}
      {activeTab === 'my-orders' ? (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                My Society Gate Orders
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Active cluster pickups, cryptographic QR tokens, and escrow release status.
              </p>
            </div>
            <button
              onClick={onOpenGateVerify}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Gate QR Verification</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {myOrders.length === 0 ? (
              <div className="col-span-full bg-white p-12 text-center rounded-3xl border border-slate-200 text-slate-500">
                You haven't placed any society orders yet. Browse the Hyperlocal Market to pool farm produce!
              </div>
            ) : (
              myOrders.map((o) => {
                const isHeld = o.escrow_status === 'HELD_IN_ESCROW';
                return (
                  <div
                    key={o.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                          {o.id}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            isHeld
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isHeld ? 'Held in Escrow' : 'Verified & Released'}
                        </span>
                      </div>

                      <h3 className="font-bold text-slate-900 text-base">{o.crop_name}</h3>
                      <p className="text-xs text-slate-500 font-hindi mb-3">
                        {o.crop_name_hi} • Kisan {o.farmer_name}
                      </p>

                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Order Quantity:</span>
                          <span className="font-bold text-slate-800">{o.ordered_qty_kg} kg</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Total Escrow Sum:</span>
                          <span className="font-extrabold text-emerald-700">₹{parseFloat(o.total_amount).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Pickup Hub:</span>
                          <span className="font-medium text-slate-700">{o.cluster_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Drop Window:</span>
                          <span className="font-medium text-slate-700">{o.drop_time_window}</span>
                        </div>
                      </div>

                      {/* Pickup QR Token Display */}
                      <div className="mt-4 p-3 bg-slate-900 text-white rounded-xl text-center space-y-1">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 block">
                          Pickup QR Token
                        </span>
                        <code className="text-xs font-mono font-bold tracking-wider block text-slate-200">
                          {o.pickup_qr_token}
                        </code>
                        <span className="text-[10px] text-slate-400 block">
                          Present at Society Gate for quality verification & escrow release
                        </span>
                      </div>
                    </div>

                    {isHeld && (
                      <button
                        onClick={() => onOpenGateVerify && onOpenGateVerify(o.pickup_qr_token)}
                        className="mt-4 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Simulate Gate Verification</span>
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        /* Hyperlocal Harvest Marketplace */
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl">
            <div className="relative z-10 max-w-2xl">
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/20 text-emerald-200">
                Direct Farm-To-Society Pool
              </span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-3">
                Hyperlocal Fresh Harvest Marketplace
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100/90 mt-2">
                Order directly from verified village farmers. Orders are pooled at your Society Gate Hub
                to eliminate middlemen markups and cut logistics emissions.
              </p>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search crops, Hindi name, or farmer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {['ALL', 'ACTIVE', 'SOLD_OUT'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilterType(tab)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    filterType === tab
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab === 'ALL' ? 'All Crops' : tab === 'ACTIVE' ? 'Available Stock' : 'Sold Out'}
                </button>
              ))}
            </div>
          </div>

          {/* Harvest Crop Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBatches.map((batch) => (
              <MandiComparisonCard
                key={batch.id}
                batch={batch}
                onOrderClick={(b) => setSelectedBatch(b)}
              />
            ))}
          </div>

          {/* ACID Checkout Modal */}
          {selectedBatch && (
            <OrderCheckoutModal
              batch={selectedBatch}
              onClose={() => setSelectedBatch(null)}
              onOrderSuccess={(order) => {
                loadBatches();
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
