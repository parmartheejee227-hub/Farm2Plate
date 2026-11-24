const express = require('express');
const router = express.Router();
const db = require('../db');

/**
 * GET /api/analytics/mandi-comparison
 * Core Feature 4: Dynamic Mandi-Margin Comparison Engine
 * Computes comparative pricing data (APMC Mandi Rate vs Farmer Direct Price vs Middlemen Retail Price)
 * for Chart.js visualizations and real-time farmer surplus analytics.
 */
router.get('/mandi-comparison', async (req, res) => {
  try {
    const batchesRes = await db.query(`
      SELECT b.*, u.name as farmer_name 
      FROM harvest_batches b
      JOIN users u ON b.farmer_id = u.id
      ORDER BY b.crop_name ASC
    `);

    const comparisonList = batchesRes.rows.map((b) => {
      const mandiRate = parseFloat(b.mandi_rate_per_kg);
      const farmerPrice = parseFloat(b.farmer_price_per_kg);
      const retailPrice = parseFloat((farmerPrice * 1.35).toFixed(2));
      const farmerGainPct = mandiRate > 0 ? (((farmerPrice - mandiRate) / mandiRate) * 100).toFixed(1) : 0;
      const buyerSavingsPct = (((retailPrice - farmerPrice) / retailPrice) * 100).toFixed(1);

      return {
        id: b.id,
        crop_name: b.crop_name,
        crop_name_hi: b.crop_name_hi,
        mandi_rate_per_kg: mandiRate,
        farmer_price_per_kg: farmerPrice,
        retail_price_per_kg: retailPrice,
        farmer_extra_profit_pct: parseFloat(farmerGainPct),
        consumer_savings_pct: parseFloat(buyerSavingsPct),
        farmer_gain_per_kg: parseFloat((farmerPrice - mandiRate).toFixed(2)),
        consumer_saving_per_kg: parseFloat((retailPrice - farmerPrice).toFixed(2))
      };
    });

    // Chart.js friendly payload
    const chartData = {
      labels: comparisonList.map((c) => c.crop_name),
      labels_hi: comparisonList.map((c) => c.crop_name_hi),
      datasets: [
        {
          label: 'APMC Mandi Rate (₹/kg)',
          backgroundColor: '#94A3B8', // slate-400
          borderColor: '#64748B',
          data: comparisonList.map((c) => c.mandi_rate_per_kg)
        },
        {
          label: 'Farmer Direct Price (₹/kg)',
          backgroundColor: '#059669', // emerald-600
          borderColor: '#047857',
          data: comparisonList.map((c) => c.farmer_price_per_kg)
        },
        {
          label: 'Traditional Retail Price (₹/kg)',
          backgroundColor: '#F59E0B', // amber-500
          borderColor: '#D97706',
          data: comparisonList.map((c) => c.retail_price_per_kg)
        }
      ]
    };

    res.json({
      success: true,
      chartData,
      comparisonList
    });
  } catch (err) {
    console.error('Mandi comparison error:', err);
    res.status(500).json({ success: false, error: 'Could not fetch mandi comparison data' });
  }
});

/**
 * GET /api/analytics/kpis
 * High level dashboard KPI indicators
 */
router.get('/kpis', async (req, res) => {
  try {
    const ordersRes = await db.query('SELECT * FROM orders');
    const batchesRes = await db.query('SELECT * FROM harvest_batches');
    const usersRes = await db.query('SELECT id, role, wallet_balance FROM users');

    const orders = ordersRes.rows;
    const batches = batchesRes.rows;
    const users = usersRes.rows;

    const escrowHeld = orders
      .filter((o) => o.escrow_status === 'HELD_IN_ESCROW')
      .reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);

    const escrowReleased = orders
      .filter((o) => o.escrow_status === 'VERIFIED_RELEASED')
      .reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);

    const activeHarvestKg = batches
      .filter((b) => b.status === 'ACTIVE')
      .reduce((sum, b) => sum + parseFloat(b.available_qty_kg || 0), 0);

    const farmerCount = users.filter((u) => u.role === 'farmer').length;
    const buyerCount = users.filter((u) => u.role === 'buyer').length;

    res.json({
      success: true,
      data: {
        total_escrow_held: parseFloat(escrowHeld.toFixed(2)),
        total_escrow_released: parseFloat(escrowReleased.toFixed(2)),
        active_harvest_kg: parseFloat(activeHarvestKg.toFixed(2)),
        active_batches_count: batches.filter((b) => b.status === 'ACTIVE').length,
        total_orders_count: orders.length,
        registered_farmers: farmerCount,
        registered_buyers: buyerCount
      }
    });
  } catch (err) {
    console.error('KPI error:', err);
    res.status(500).json({ success: false, error: 'Could not fetch KPIs' });
  }
});

module.exports = router;
