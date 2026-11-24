const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { broadcastBatchCreated } = require('../socket');

/**
 * Helper to calculate Mandi-Margin & Consumer Savings
 */
function enrichBatchWithMargins(batch) {
  const mandiRate = parseFloat(batch.mandi_rate_per_kg);
  const farmerPrice = parseFloat(batch.farmer_price_per_kg);
  
  // Extra profit for the farmer over APMC Mandi rate
  const farmerExtraProfitPct = mandiRate > 0
    ? (((farmerPrice - mandiRate) / mandiRate) * 100).toFixed(1)
    : '0.0';

  // Middlemen retail price typically 35-45% higher than farmer direct
  const estimatedRetailPrice = (farmerPrice * 1.35).toFixed(2);

  // Society consumer savings vs open market retail
  const consumerSavingsPct = (
    ((parseFloat(estimatedRetailPrice) - farmerPrice) / parseFloat(estimatedRetailPrice)) * 100
  ).toFixed(1);

  return {
    ...batch,
    total_qty_kg: parseFloat(batch.total_qty_kg),
    available_qty_kg: parseFloat(batch.available_qty_kg),
    mandi_rate_per_kg: mandiRate,
    farmer_price_per_kg: farmerPrice,
    estimated_retail_price: parseFloat(estimatedRetailPrice),
    farmer_extra_profit_pct: parseFloat(farmerExtraProfitPct),
    consumer_savings_pct: parseFloat(consumerSavingsPct)
  };
}

/**
 * GET /api/batches
 * List all active/all harvest batches with farmer details and margin metrics
 */
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT b.*, u.name as farmer_name, u.village_or_society as farmer_village, u.phone as farmer_phone
      FROM harvest_batches b
      JOIN users u ON b.farmer_id = u.id
      ORDER BY b.harvest_timestamp DESC
    `;
    const result = await db.query(query);
    const enriched = result.rows.map(enrichBatchWithMargins);
    res.json({ success: true, count: enriched.length, data: enriched });
  } catch (err) {
    console.error('Fetch batches error:', err);
    res.status(500).json({ success: false, error: 'Could not fetch harvest batches' });
  }
});

/**
 * GET /api/batches/my-batches
 * Get batches for currently logged in farmer
 */
router.get('/my-batches', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT b.*, u.name as farmer_name, u.village_or_society as farmer_village
      FROM harvest_batches b
      JOIN users u ON b.farmer_id = u.id
      WHERE b.farmer_id = $1
      ORDER BY b.harvest_timestamp DESC
    `;
    const result = await db.query(query, [req.user.id]);
    const enriched = result.rows.map(enrichBatchWithMargins);
    res.json({ success: true, count: enriched.length, data: enriched });
  } catch (err) {
    console.error('My batches error:', err);
    res.status(500).json({ success: false, error: 'Could not fetch your harvest batches' });
  }
});

/**
 * POST /api/batches
 * Farmer publishes a new fresh harvest batch
 */
router.post('/', authenticateToken, requireRole('farmer', 'admin'), async (req, res) => {
  try {
    const {
      crop_name,
      crop_name_hi,
      total_qty_kg,
      mandi_rate_per_kg,
      farmer_price_per_kg
    } = req.body;

    if (!crop_name || !total_qty_kg || !mandi_rate_per_kg || !farmer_price_per_kg) {
      return res.status(400).json({
        success: false,
        error: 'Crop name, total quantity, mandi rate, and farmer price are required'
      });
    }

    const batchId = `batch-${Date.now().toString().slice(-6)}`;
    const cropPrefix = crop_name.slice(0, 3).toUpperCase();
    const qrBatchCode = `BATCH-${cropPrefix}-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const qty = parseFloat(total_qty_kg);
    const mandiRate = parseFloat(mandi_rate_per_kg);
    const farmerPrice = parseFloat(farmer_price_per_kg);
    const cropNameHi = crop_name_hi || crop_name;

    const insertQuery = `
      INSERT INTO harvest_batches 
      (id, farmer_id, crop_name, crop_name_hi, total_qty_kg, available_qty_kg, mandi_rate_per_kg, farmer_price_per_kg, qr_batch_code, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const result = await db.query(insertQuery, [
      batchId,
      req.user.id,
      crop_name,
      cropNameHi,
      qty,
      qty, // available initially equals total
      mandiRate,
      farmerPrice,
      qrBatchCode,
      'ACTIVE'
    ]);

    const created = enrichBatchWithMargins(result.rows[0]);
    created.farmer_name = req.user.name;
    created.farmer_village = req.user.village_or_society;

    // Real-time broadcast
    broadcastBatchCreated({ batch: created });

    res.status(201).json({
      success: true,
      message: 'Harvest batch published successfully to hyperlocal marketplace',
      data: created
    });
  } catch (err) {
    console.error('Create batch error:', err);
    res.status(500).json({ success: false, error: 'Failed to publish harvest batch' });
  }
});

module.exports = router;
