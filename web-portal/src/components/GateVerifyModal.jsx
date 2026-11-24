import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useSocket } from '../context/SocketContext';
import {
  X,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Coins,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function GateVerifyModal({ onClose, onVerifySuccess }) {
  const { playChime } = useSocket();
  const [tokenInput, setTokenInput] = useState('');
  const [activeOrders, setActiveOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Quality parameters verified by Society Gate In-charge
  const [checks, setChecks] = useState({
    weightAccurate: true,
    produceFresh: true,
    batchMatched: true
  });

  useEffect(() => {
    async function loadHeldOrders() {
      try {
        setLoadingOrders(true);
        const res = await api.getAllOrders();
        if (res.success) {
          const held = res.data.filter((o) => o.escrow_status === 'HELD_IN_ESCROW');
          setActiveOrders(held);
          if (held.length > 0) {
            setTokenInput(held[0].pickup_qr_token);
          }
        }
      } catch (err) {
        console.error('Error fetching held orders:', err);
      } finally {
        setLoadingOrders(false);
      }
    }
    loadHeldOrders();
  }, []);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!tokenInput || !tokenInput.trim()) {
      setError('Please provide or select a valid Pickup QR Token');
      return;
    }

    try {
      setVerifying(true);
      const res = await api.verifyQr(tokenInput.trim());
      if (res.success) {
        setResult(res);
        playChime('escrow');
        if (onVerifySuccess) onVerifySuccess(res);
      } else {
        setError(res.error || 'Verification failed');
      }
    } catch (err) {
      setError(err.message || 'QR Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 px-6 py-5 text-white flex items-center justify-between border-b border-emerald-900/40">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 bg-emerald-500/20 text-emerald-400 rounded-md">
                <QrCode className="w-4 h-4" />
              </span>
              <h3 className="font-bold text-lg">Society Gate QR Verification</h3>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              2-Step Quality Check & Atomic Escrow Release
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {result ? (
            /* Success Payout Display */
            <div className="text-center py-4 space-y-4 animate-in fade-in zoom-in-95 duration-300">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/20">
                <Sparkles className="w-8 h-8" />
              </div>

              <div>
                <span className="text-xs uppercase font-extrabold tracking-widest text-emerald-600 block">
                  Escrow Payment Disbursed
                </span>
                <h4 className="text-2xl font-black text-slate-900 mt-1">
                  ₹{result.data.payout_amount.toFixed(2)} Credited!
                </h4>
                <p className="text-xs text-slate-600 mt-2 max-w-sm mx-auto">
                  {result.message}
                </p>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-left text-xs space-y-1.5 text-emerald-900">
                <div className="flex justify-between">
                  <span className="text-emerald-700">Beneficiary Kisan:</span>
                  <strong className="text-emerald-950">{result.data.farmer_name}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-700">Updated Farmer Wallet:</span>
                  <strong className="text-emerald-950">₹{result.data.farmer_new_wallet.toFixed(2)}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-700">Escrow Status:</span>
                  <strong className="text-emerald-800 uppercase font-mono">VERIFIED_RELEASED</strong>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-600/20 transition-colors"
              >
                Done & Return to Dashboard
              </button>
            </div>
          ) : (
            /* Verification Form */
            <form onSubmit={handleVerify} className="space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Quick Select for Active Held Orders */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Order In Escrow (Or Enter QR Token)
                </label>
                {activeOrders.length > 0 ? (
                  <div className="space-y-2 mb-3">
                    <select
                      value={tokenInput}
                      onChange={(e) => setTokenInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-slate-50"
                    >
                      {activeOrders.map((o) => (
                        <option key={o.id} value={o.pickup_qr_token}>
                          {o.pickup_qr_token} — {o.crop_name} ({o.ordered_qty_kg}kg, ₹{o.total_amount})
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-400">
                      💡 Active orders currently awaiting Gate pickup release.
                    </p>
                  </div>
                ) : (
                  <div className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-xl mb-3 border border-amber-200">
                    No orders currently waiting in escrow. You can place an order from the Hyperlocal Market tab!
                  </div>
                )}

                <div className="relative">
                  <input
                    type="text"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="e.g. F2P-QR-SN1-98741-ACTIVE"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white uppercase"
                    required
                  />
                </div>
              </div>

              {/* Quality Checklist */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2.5">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Mandatory Gate Physical Inspection</span>
                </div>

                <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checks.weightAccurate}
                    onChange={(e) => setChecks({ ...checks, weightAccurate: e.target.checked })}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span>Net physical cargo weight matches digital manifest</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checks.produceFresh}
                    onChange={(e) => setChecks({ ...checks, produceFresh: e.target.checked })}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span>Farm-freshness grade verified (no transit spoilage)</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checks.batchMatched}
                    onChange={(e) => setChecks({ ...checks, batchMatched: e.target.checked })}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span>Farmer traceability QR tag matches cargo crate</span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={verifying || !tokenInput.trim() || !checks.weightAccurate || !checks.produceFresh}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/25 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center gap-1.5"
                >
                  <Coins className="w-4 h-4" />
                  <span>{verifying ? 'Releasing Payout...' : 'Verify Quality & Release Escrow'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
