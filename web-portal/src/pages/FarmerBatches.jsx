import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import {
  Sprout,
  PlusCircle,
  TrendingUp,
  Wallet,
  Clock,
  CheckCircle2,
  Package,
  Sparkles,
  QrCode
} from 'lucide-react';

export default function FarmerBatches({ activeTab }) {
  const { user, refreshUser } = useAuth();
  const { lastStockUpdate, lastEscrowRelease } = useSocket();
  const [batches, setBatches] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // New batch form
  const [formData, setFormData] = useState({
    crop_name: '',
    crop_name_hi: '',
    total_qty_kg: '',
    mandi_rate_per_kg: '',
    farmer_price_per_kg: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const loadFarmerData = async () => {
    try {
      setLoading(true);
      const [batchRes, orderRes] = await Promise.all([
        api.getMyBatches(),
        api.getFarmerOrders()
      ]);
      if (batchRes.success) setBatches(batchRes.data);
      if (orderRes.success) setOrders(orderRes.data);
      if (refreshUser) refreshUser();
    } catch (err) {
      console.error('Error loading farmer data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFarmerData();
  }, []);

  // Socket updates
  useEffect(() => {
    if (lastStockUpdate || lastEscrowRelease) {
      loadFarmerData();
    }
  }, [lastStockUpdate, lastEscrowRelease]);

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    setFormError(null);
    try {
      setSubmitting(true);
      const res = await api.createBatch(formData);
      if (res.success) {
        setShowAddModal(false);
        setFormData({
          crop_name: '',
          crop_name_hi: '',
          total_qty_kg: '',
          mandi_rate_per_kg: '',
          farmer_price_per_kg: ''
        });
        loadFarmerData();
      } else {
        setFormError(res.error || 'Failed to publish harvest');
      }
    } catch (err) {
      setFormError(err.message || 'Creation error');
    } finally {
      setSubmitting(false);
    }
  };

  // Farmer metrics
  const totalVolumeKg = batches.reduce((sum, b) => sum + parseFloat(b.total_qty_kg || 0), 0);
  const availableVolumeKg = batches.reduce((sum, b) => sum + parseFloat(b.available_qty_kg || 0), 0);
  const totalEarned = orders
    .filter((o) => o.escrow_status === 'VERIFIED_RELEASED')
    .reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);

  return (
    <div className="space-y-8 pb-12">
      {/* Top Kisan Welcome & Wallet Card */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-semibold mb-2">
              <Sprout className="w-3.5 h-3.5" />
              <span>Kisan Direct Dashboard</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Ram Ram, {user?.name || 'Kisan Bandhu'}
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 font-hindi">
              रामपुर विलेज • आपकी कुल वॉलेट कमाई सीधे बैंक खाते में ट्रान्सफर योग्य है।
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-emerald-500 rounded-xl text-white">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider text-emerald-200 font-bold block">
                Direct Wallet Balance
              </span>
              <span className="text-2xl font-black text-white">
                ₹{parseFloat(user?.wallet_balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-400 block mb-1">Active Harvests</span>
          <div className="text-2xl font-black text-slate-900">{batches.length} Batches</div>
          <span className="text-[11px] text-slate-500">{totalVolumeKg} kg total yield published</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-400 block mb-1">Available Stock</span>
          <div className="text-2xl font-black text-emerald-700">{availableVolumeKg} kg</div>
          <span className="text-[11px] text-emerald-600 font-semibold">Remaining across society pools</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-400 block mb-1">Total Society Orders</span>
          <div className="text-2xl font-black text-slate-900">{orders.length}</div>
          <span className="text-[11px] text-slate-500">From connected society gates</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-400 block mb-1">Released Payouts</span>
          <div className="text-2xl font-black text-emerald-700">₹{totalEarned.toFixed(2)}</div>
          <span className="text-[11px] text-emerald-600 font-semibold">Zero middlemen commission</span>
        </div>
      </div>

      {/* Main Section */}
      {activeTab === 'farmer-orders' ? (
        /* Farmer Orders & Escrow Payouts List */
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-lg text-slate-900">Received Society Orders & Escrow Payouts</h3>
              <p className="text-xs text-slate-500">Live order allocation and instant wallet release logs.</p>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {orders.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No orders received yet for your crops.
              </div>
            ) : (
              orders.map((o) => {
                const isReleased = o.escrow_status === 'VERIFIED_RELEASED';
                return (
                  <div key={o.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{o.crop_name}</span>
                        <span className="font-hindi text-xs text-slate-500">({o.crop_name_hi})</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isReleased
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isReleased ? 'Paid & Released' : 'Held in Escrow'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Buyer: <strong>{o.buyer_name}</strong> • Gate: {o.cluster_name} ({o.drop_time_window})
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <span className="text-xs text-slate-400 block">Quantity</span>
                        <span className="font-bold text-slate-800 text-sm">{o.ordered_qty_kg} kg</span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 block">Total Payout</span>
                        <span className="font-black text-emerald-700 text-base">₹{o.total_amount}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        /* Harvest Batches List with Publish Button */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">My Active Harvest Batches</h2>
              <p className="text-xs text-slate-500">
                Manage your available cargo and trace live stock deductions.
              </p>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Publish New Harvest</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {batches.map((batch) => {
              const mandiRate = parseFloat(batch.mandi_rate_per_kg);
              const farmerPrice = parseFloat(batch.farmer_price_per_kg);
              const gainPct = mandiRate > 0 ? (((farmerPrice - mandiRate) / mandiRate) * 100).toFixed(1) : 0;
              const isSoldOut = parseFloat(batch.available_qty_kg) <= 0;

              return (
                <div
                  key={batch.id}
                  className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col justify-between ${
                    isSoldOut ? 'border-slate-200 opacity-80' : 'border-slate-200 hover:border-emerald-300'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="font-bold text-base text-slate-900">{batch.crop_name}</h3>
                        <p className="font-hindi text-xs text-slate-500">{batch.crop_name_hi}</p>
                      </div>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isSoldOut
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {isSoldOut ? 'Sold Out' : 'Active Batch'}
                      </span>
                    </div>

                    <div className="my-3 bg-slate-50 p-3 rounded-xl border border-slate-100 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">APMC Base</span>
                        <span className="font-semibold text-slate-500">₹{mandiRate}/kg</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-emerald-700 block">My Price</span>
                        <span className="font-black text-emerald-700 text-sm">₹{farmerPrice}/kg</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs py-1">
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                        +{gainPct}% Extra Profit
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">{batch.qr_batch_code}</span>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 text-xs">
                      <div className="flex justify-between mb-1">
                        <span className="text-slate-500">Stock Availability:</span>
                        <span className="font-bold text-slate-900">
                          {batch.available_qty_kg} kg / {batch.total_qty_kg} kg
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                          style={{
                            width: `${Math.min(100, (parseFloat(batch.available_qty_kg) / parseFloat(batch.total_qty_kg)) * 100)}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Publish New Harvest Batch Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-emerald-700 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">Publish Fresh Harvest Batch</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-emerald-200 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Crop Name (English)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Organic Cauliflower"
                  value={formData.crop_name}
                  onChange={(e) => setFormData({ ...formData, crop_name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Crop Name (Hindi / स्थानीय नाम)
                </label>
                <input
                  type="text"
                  placeholder="उदा. फूलगोभी"
                  value={formData.crop_name_hi}
                  onChange={(e) => setFormData({ ...formData, crop_name_hi: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-hindi focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Total Harvest Quantity (KG)
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="e.g. 300"
                  value={formData.total_qty_kg}
                  onChange={(e) => setFormData({ ...formData, total_qty_kg: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    APMC Mandi Rate (₹/kg)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    placeholder="e.g. 15.00"
                    value={formData.mandi_rate_per_kg}
                    onChange={(e) => setFormData({ ...formData, mandi_rate_per_kg: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
                    My Direct Price (₹/kg)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    placeholder="e.g. 22.00"
                    value={formData.farmer_price_per_kg}
                    onChange={(e) => setFormData({ ...formData, farmer_price_per_kg: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-emerald-300 text-xs font-bold text-emerald-900 focus:ring-2 focus:ring-emerald-500 bg-emerald-50/50"
                    required
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs"
                >
                  {submitting ? 'Publishing...' : 'Publish to Market'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
