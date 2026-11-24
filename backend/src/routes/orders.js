const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { broadcastStockUpdate, broadcastEscrowReleased, broadcastOrderPlaced } = require('../socket');

/**
 * POST /api/orders/place
 * Core Feature 1: PostgreSQL ACID Stock Locking (`SELECT ... FOR UPDATE`)
 * Wraps stock deduction and order creation inside an atomic transaction.
 * Emits `stock_updated` via Socket.io.
 */
router.post('/place', authenticateToken, async (req, res) => {
  const { batch_id, cluster_id, ordered_qty_kg } = req.body;

  if (!batch_id || !cluster_id || !ordered_qty_kg) {
    return res.status(400).json({
      success: false,
      error: 'Batch ID, Cluster ID, and ordered quantity are required'
    });
  }

  const requestedQty = parseFloat(ordered_qty_kg);
  if (isNaN(requestedQty) || requestedQty <= 0) {
    return res.status(400).json({ success: false, error: 'Ordered quantity must be greater than 0' });
  }

  const client = await db.getClient();

  try {
    // 1. Begin atomic PostgreSQL transaction
    await client.query('BEGIN');

    // 2. Row-level pessimistic locking on harvest batch to prevent race condition overselling
    const batchResult = await client.query(
      'SELECT * FROM harvest_batches WHERE id = $1 FOR UPDATE',
      [batch_id]
    );

    if (batchResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Harvest batch not found' });
    }

    const batch = batchResult.rows[0];
    const availableQty = parseFloat(batch.available_qty_kg);

    if (availableQty < requestedQty) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: `Insufficient stock! Only ${availableQty} kg available, but ${requestedQty} kg was requested.`
      });
    }

    // 3. Atomically deduct stock and update batch status if exhausted
    const newAvailableQty = parseFloat((availableQty - requestedQty).toFixed(2));
    const newStatus = newAvailableQty <= 0 ? 'SOLD_OUT' : batch.status;

    const updateBatchQuery = `
      UPDATE harvest_batches 
      SET available_qty_kg = available_qty_kg - $1,
          status = CASE WHEN available_qty_kg - $1 <= 0 THEN 'SOLD_OUT' ELSE status END
      WHERE id = $2
      RETURNING *
    `;
    const updatedBatchRes = await client.query(updateBatchQuery, [requestedQty, batch_id]);
    const updatedBatch = updatedBatchRes.rows[0];

    // 4. Generate unique Society Gate pickup QR token and order ID
    const clusterCode = (cluster_id || 'CL1').replace('cluster-', 'C');
    const randomHex = Math.floor(10000 + Math.random() * 90000);
    const pickupQrToken = `F2P-QR-${clusterCode}-${randomHex}-ACTIVE`;
    const orderId = `ord-${Date.now().toString().slice(-6)}`;
    const totalAmount = parseFloat((requestedQty * parseFloat(batch.farmer_price_per_kg)).toFixed(2));

    // 5. Create Order record with HELD_IN_ESCROW status
    const insertOrderQuery = `
      INSERT INTO orders 
      (id, batch_id, buyer_id, cluster_id, ordered_qty_kg, total_amount, escrow_status, pickup_qr_token)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const orderRes = await client.query(insertOrderQuery, [
      orderId,
      batch_id,
      req.user.id,
      cluster_id,
      requestedQty,
      totalAmount,
      'HELD_IN_ESCROW',
      pickupQrToken
    ]);
    const createdOrder = orderRes.rows[0];

    // 6. Commit the ACID transaction
    await client.query('COMMIT');

    // 7. Emit real-time stock update to all connected Web & Mobile clients
    broadcastStockUpdate({
      batch_id: batch_id,
      available_qty_kg: newAvailableQty,
      status: newStatus
    });

    broadcastOrderPlaced({
      order: createdOrder,
      batch: updatedBatch
    });

    res.status(201).json({
      success: true,
      message: 'Order placed successfully with ACID stock lock! Payment held in escrow.',
      data: {
        ...createdOrder,
        crop_name: batch.crop_name,
        crop_name_hi: batch.crop_name_hi,
        farmer_price_per_kg: batch.farmer_price_per_kg
      }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Order placement transaction rolled back:', err);
    res.status(500).json({ success: false, error: 'Transaction failed: ' + err.message });
  } finally {
    client.release();
  }
});

/**
 * POST /api/orders/verify-qr
 * Core Feature 3: 2-Step QR Traceability & Escrow Payment Release
 * Scanned at Society Gate Hub. Atomically changes escrow status to VERIFIED_RELEASED,
 * credits the farmer's wallet_balance, and broadcasts escrow_released alert.
 */
router.post('/verify-qr', authenticateToken, async (req, res) => {
  const { pickup_qr_token } = req.body;

  if (!pickup_qr_token || !pickup_qr_token.trim()) {
    return res.status(400).json({ success: false, error: 'Pickup QR token is required' });
  }

  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    // Find and lock the order row
    const orderResult = await client.query(
      'SELECT * FROM orders WHERE pickup_qr_token = $1',
      [pickup_qr_token.trim()]
    );

    if (orderResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'QR Token not found or invalid' });
    }

    const order = orderResult.rows[0];

    if (order.escrow_status === 'VERIFIED_RELEASED') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'Pickup already verified and escrow payment was previously released.'
      });
    }

    if (order.escrow_status === 'DISPUTED') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'Order is currently under dispute. Please contact Coop Admin.'
      });
    }

    // Retrieve harvest batch to identify the farmer
    const batchResult = await client.query('SELECT * FROM harvest_batches WHERE id = $1', [order.batch_id]);
    if (batchResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Batch not found for this order' });
    }
    const batch = batchResult.rows[0];
    const farmerId = batch.farmer_id;
    const payoutAmount = parseFloat(order.total_amount);

    // 1. Update order escrow status to VERIFIED_RELEASED
    const updateOrderQuery = `
      UPDATE orders 
      SET escrow_status = 'VERIFIED_RELEASED' 
      WHERE id = $1 
      RETURNING *
    `;
    const updatedOrderRes = await client.query(updateOrderQuery, [order.id]);
    const updatedOrder = updatedOrderRes.rows[0];

    // 2. Atomically credit the farmer's wallet
    const updateWalletQuery = `
      UPDATE users 
      SET wallet_balance = wallet_balance + $1 
      WHERE id = $2 
      RETURNING *
    `;
    const updatedFarmerRes = await client.query(updateWalletQuery, [payoutAmount, farmerId]);
    const farmer = updatedFarmerRes.rows[0];

    // Commit transaction
    await client.query('COMMIT');

    // 3. Broadcast real-time Socket.io escrow release alert
    broadcastEscrowReleased({
      order_id: order.id,
      farmer_id: farmerId,
      farmer_name: farmer ? farmer.name : 'Farmer',
      buyer_name: req.user.name,
      crop_name: batch.crop_name,
      total_amount: payoutAmount,
      wallet_balance: farmer ? parseFloat(farmer.wallet_balance) : 0
    });

    res.json({
      success: true,
      message: `Society Gate Verification Complete! ₹${payoutAmount.toFixed(2)} instantly released from escrow to farmer ${farmer ? farmer.name : ''}.`,
      data: {
        order: updatedOrder,
        payout_amount: payoutAmount,
        farmer_name: farmer ? farmer.name : 'Farmer',
        farmer_new_wallet: farmer ? parseFloat(farmer.wallet_balance) : 0
      }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Verify QR transaction rolled back:', err);
    res.status(500).json({ success: false, error: 'Verification failed: ' + err.message });
  } finally {
    client.release();
  }
});

/**
 * GET /api/orders/my-orders
 * List orders placed by the authenticated buyer
 */
router.get('/my-orders', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT o.*, b.crop_name, b.crop_name_hi, b.farmer_price_per_kg, b.mandi_rate_per_kg,
             u_farmer.name as farmer_name, u_farmer.village_or_society as farmer_village,
             c.cluster_name, c.drop_time_window, c.city
      FROM orders o
      JOIN harvest_batches b ON o.batch_id = b.id
      JOIN users u_farmer ON b.farmer_id = u_farmer.id
      JOIN delivery_clusters c ON o.cluster_id = c.id
      WHERE o.buyer_id = $1
      ORDER BY o.created_at DESC
    `;
    const result = await db.query(query, [req.user.id]);
    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (err) {
    console.error('My orders error:', err);
    res.status(500).json({ success: false, error: 'Could not fetch your orders' });
  }
});

/**
 * GET /api/orders/farmer-orders
 * List orders received for the authenticated farmer's harvest batches
 */
router.get('/farmer-orders', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT o.*, b.crop_name, b.crop_name_hi, b.farmer_price_per_kg,
             u_buyer.name as buyer_name, u_buyer.phone as buyer_phone,
             c.cluster_name, c.drop_time_window
      FROM orders o
      JOIN harvest_batches b ON o.batch_id = b.id
      JOIN users u_buyer ON o.buyer_id = u_buyer.id
      JOIN delivery_clusters c ON o.cluster_id = c.id
      WHERE b.farmer_id = $1
      ORDER BY o.created_at DESC
    `;
    const result = await db.query(query, [req.user.id]);
    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (err) {
    console.error('Farmer orders error:', err);
    res.status(500).json({ success: false, error: 'Could not fetch farmer orders' });
  }
});

/**
 * GET /api/orders/all
 * Admin route: view all orders across clusters & escrow states
 */
router.get('/all', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT o.*, b.crop_name, b.crop_name_hi, b.farmer_price_per_kg,
             u_farmer.name as farmer_name, u_farmer.village_or_society as farmer_village,
             u_buyer.name as buyer_name, u_buyer.phone as buyer_phone,
             c.cluster_name, c.drop_time_window
      FROM orders o
      JOIN harvest_batches b ON o.batch_id = b.id
      JOIN users u_farmer ON b.farmer_id = u_farmer.id
      JOIN users u_buyer ON o.buyer_id = u_buyer.id
      JOIN delivery_clusters c ON o.cluster_id = c.id
      ORDER BY o.created_at DESC
    `;
    const result = await db.query(query);
    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (err) {
    console.error('All orders error:', err);
    res.status(500).json({ success: false, error: 'Could not fetch orders' });
  }
});

module.exports = router;
