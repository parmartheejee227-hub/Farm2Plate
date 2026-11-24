import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { X, Lock, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

export default function OrderCheckoutModal({ batch, onClose, onOrderSuccess }) {
  const [clusters, setClusters] = useState([]);
  const [selectedCluster, setSelectedCluster] = useState('');
  const [qty, setQty] = useState(10);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadClusters() {
      try {
        const res = await api.getClusters();
        if (res.success && res.data.length > 0) {
          setClusters(res.data);
          setSelectedCluster(res.data[0].id);
        }
      } catch (err) {
        console.error('Error loading clusters:', err);
      }
    }
    loadClusters();
  }, []);

  if (!batch) return null;

  const available = parseFloat(batch.available_qty_kg);
  const farmerPrice = parseFloat(batch.farmer_price_per_kg);
  const numericQty = parseFloat(qty) || 0;
  const totalAmount = (numericQty * farmerPrice).toFixed(2);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (numericQty <= 0) {
      setError('Please enter a valid quantity in kg');
      return;
    }
    if (numericQty > available) {
      setError(`Cannot exceed available stock of ${available} kg`);
      return;
    }
    if (!selectedCluster) {
      setError('Please select a Society Gate delivery hub');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.placeOrder({
        batch_id: batch.id,
        cluster_id: selectedCluster,
        ordered_qty_kg: numericQty
      });

      if (res.success) {
        if (onOrderSuccess) onOrderSuccess(res.data);
        onClose();
      } else {
        setError(res.error || 'Failed to place order');
      }
    } catch (err) {
      setError(err.message || 'Order failed during ACID stock lock transaction');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 to-emerald-600 px-6 py-5 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 bg-white/10 rounded-md">
                <Lock className="w-4 h-4 text-emerald-200" />
              </span>
              <h3 className="font-bold text-lg">Hyperlocal Society Order</h3>
            </div>
            <p className="text-xs text-emerald-100 mt-0.5">
              PostgreSQL ACID Stock Allocation & Escrow Guarantee
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-emerald-200 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Selected Harvest Summary */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-slate-900">{batch.crop_name}</div>
              <div className="text-xs text-slate-500 font-hindi">
                {batch.crop_name_hi} • Harvested by {batch.farmer_name}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400">Direct Price</div>
              <div className="text-base font-extrabold text-emerald-700">₹{farmerPrice} / kg</div>
            </div>
          </div>

          {/* Quantity Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Order Quantity (KG)
              </label>
              <span className="text-xs text-emerald-700 font-semibold">
                Available: {available} kg
              </span>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                max={available}
                step="0.5"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                className="w-32 px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-base"
                required
              />

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-1.5">
                {[5, 10, 25, 50].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setQty(Math.min(preset, available))}
                    disabled={preset > available}
                    className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                      qty == preset
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
                    }`}
                  >
                    {preset}kg
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Society Delivery Gate Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Delivery Cluster Hub (Society Gate)
            </label>
            <select
              value={selectedCluster}
              onChange={(e) => setSelectedCluster(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
              required
            >
              {clusters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.cluster_name} ({c.drop_time_window})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              Consolidated pickup saves 65% in logistics overhead for your entire society.
            </p>
          </div>

          {/* ACID & Escrow Information Note */}
          <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-3.5 text-xs text-amber-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span>Anti-Rejection ACID Escrow Protection</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              When you click Confirm, PostgreSQL executes a pessimistic row lock (<code>SELECT FOR UPDATE</code>)
              to guarantee zero overselling. Payment is safely held in escrow (<code>HELD_IN_ESCROW</code>) and
              only released to the farmer after Society Gate QR verification.
            </p>
          </div>

          {/* Order Summary & Confirm Button */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block">Total Escrow Amount</span>
              <span className="text-xl font-extrabold text-slate-900">₹{totalAmount}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || numericQty <= 0 || numericQty > available}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/25 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{submitting ? 'Locking Stock in Escrow...' : 'Confirm & Hold in Escrow'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
