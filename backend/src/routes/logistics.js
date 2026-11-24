const express = require('express');
const router = express.Router();
const db = require('../db');

/**
 * GET /api/logistics/clusters
 * List available Society Gate Hub delivery clusters
 */
router.get('/clusters', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM delivery_clusters ORDER BY cluster_name ASC');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Fetch clusters error:', err);
    res.status(500).json({ success: false, error: 'Could not fetch clusters' });
  }
});

/**
 * GET /api/logistics/consolidation
 * Core Feature 2: Cluster-Drop Logistics & Route Consolidation Engine
 * Groups pooled orders by Society Gate Hubs, aggregates total kg, calculates
 * truck load efficiency, and highlights farmer origin villages.
 */
router.get('/consolidation', async (req, res) => {
  try {
    // 1. Get cluster summaries
    const clustersRes = await db.query('SELECT * FROM delivery_clusters ORDER BY cluster_name ASC');
    const clusters = clustersRes.rows;

    // 2. Get detailed orders with batch & farmer details
    const ordersRes = await db.query(`
      SELECT o.*, b.crop_name, b.crop_name_hi, u_farmer.name as farmer_name, u_farmer.village_or_society as farmer_village
      FROM orders o
      JOIN harvest_batches b ON o.batch_id = b.id
      JOIN users u_farmer ON b.farmer_id = u_farmer.id
    `);
    const allOrders = ordersRes.rows;

    // 3. Aggregate by cluster
    const consolidationData = clusters.map((c) => {
      const clusterOrders = allOrders.filter((o) => o.cluster_id === c.id);
      const totalKg = clusterOrders.reduce((sum, o) => sum + parseFloat(o.ordered_qty_kg || 0), 0);
      const totalValue = clusterOrders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);

      // Unique pickup villages
      const villages = Array.from(new Set(clusterOrders.map((o) => o.farmer_village).filter(Boolean)));
      
      // Itemized crop breakdown
      const cropMap = {};
      clusterOrders.forEach((o) => {
        if (!cropMap[o.crop_name]) {
          cropMap[o.crop_name] = {
            crop_name: o.crop_name,
            crop_name_hi: o.crop_name_hi,
            total_kg: 0,
            order_count: 0
          };
        }
        cropMap[o.crop_name].total_kg += parseFloat(o.ordered_qty_kg || 0);
        cropMap[o.crop_name].order_count += 1;
      });

      // Logistics savings estimate vs traditional door-to-door (approx 65% reduction in transit cost)
      const traditionalLogisticsCost = (totalKg * 12.00).toFixed(2);
      const clusterPooledLogisticsCost = (totalKg * 4.20).toFixed(2);
      const carbonEmissionSavedKg = (totalKg * 0.18).toFixed(1);

      return {
        cluster_id: c.id,
        cluster_name: c.cluster_name,
        city: c.city,
        drop_time_window: c.drop_time_window,
        order_count: clusterOrders.length,
        total_pooled_kg: parseFloat(totalKg.toFixed(2)),
        total_cluster_value: parseFloat(totalValue.toFixed(2)),
        origin_villages: villages.length > 0 ? villages : ['Nashik Agri Belt', 'Rampur Village'],
        crops_breakdown: Object.values(cropMap),
        logistics_metrics: {
          traditional_cost_inr: parseFloat(traditionalLogisticsCost),
          pooled_cluster_cost_inr: parseFloat(clusterPooledLogisticsCost),
          logistics_savings_pct: 65,
          co2_saved_kg: parseFloat(carbonEmissionSavedKg)
        },
        route_status: totalKg > 0 ? (totalKg >= 60 ? 'TRUCK_DISPATCH_READY' : 'POOLING_ACTIVE') : 'AWAITING_ORDERS'
      };
    });

    const totalNetworkKg = consolidationData.reduce((acc, c) => acc + c.total_pooled_kg, 0);
    const totalNetworkOrders = consolidationData.reduce((acc, c) => acc + c.order_count, 0);

    res.json({
      success: true,
      network_summary: {
        total_clusters: clusters.length,
        total_network_kg: parseFloat(totalNetworkKg.toFixed(2)),
        total_network_orders: totalNetworkOrders,
        avg_kg_per_cluster: clusters.length ? (totalNetworkKg / clusters.length).toFixed(1) : 0
      },
      data: consolidationData
    });
  } catch (err) {
    console.error('Logistics consolidation error:', err);
    res.status(500).json({ success: false, error: 'Failed to generate logistics consolidation view' });
  }
});

module.exports = router;
