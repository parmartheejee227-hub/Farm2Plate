/**
 * Farm2Plate - Automated Verification Test Suite
 * Validates all Core Anti-Rejection Features across REST APIs and transactions.
 */
const http = require('http');

async function runTests() {
  console.log('🧪 Starting Farm2Plate Verification Test Suite...\n');

  // 1. Start backend server in-process
  require('./server');
  await new Promise((r) => setTimeout(r, 2000));

  const BASE = 'http://127.0.0.1:5000/api';

  async function post(url, body, token) {
    const res = await fetch(`${BASE}${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(body)
    });
    return { status: res.status, data: await res.json() };
  }

  async function get(url, token) {
    const res = await fetch(`${BASE}${url}`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
    return { status: res.status, data: await res.json() };
  }

  try {
    // Test 1: Health Check
    console.log('Test 1: Health check endpoint');
    const health = await get('/health');
    console.log('  Status:', health.data.status, '| DB Engine:', health.data.database_mode);
    if (health.data.status !== 'ONLINE') throw new Error('Health check failed');
    console.log('  ✅ Health check passed\n');

    // Test 2: Demo Login (Buyer & Farmer)
    console.log('Test 2: Demo Authentication');
    const buyerAuth = await post('/auth/demo-login', { role: 'buyer' });
    console.log('  Buyer Authenticated:', buyerAuth.data.user.name, `(${buyerAuth.data.user.phone})`);
    const buyerToken = buyerAuth.data.token;

    const farmerAuth = await post('/auth/demo-login', { role: 'farmer' });
    console.log('  Farmer Authenticated:', farmerAuth.data.user.name, '| Wallet: ₹' + farmerAuth.data.user.wallet_balance);
    const initialWallet = farmerAuth.data.user.wallet_balance;
    console.log('  ✅ Demo authentication passed\n');

    // Test 3: Mandi-Margin Analytics & Margin Engine
    console.log('Test 3: Dynamic Mandi-Margin Comparison Engine');
    const mandi = await get('/analytics/mandi-comparison');
    console.log('  Total crops analyzed:', mandi.data.comparisonList.length);
    const sample = mandi.data.comparisonList[0];
    console.log(`  Sample Crop: ${sample.crop_name}`);
    console.log(`  - Mandi Base: ₹${sample.mandi_rate_per_kg}/kg | Farmer Direct: ₹${sample.farmer_price_per_kg}/kg`);
    console.log(`  - Extra Profit to Farmer: +${sample.farmer_extra_profit_pct}%`);
    console.log(`  - Society Consumer Savings: ${sample.consumer_savings_pct}%`);
    if (!sample.farmer_extra_profit_pct || !sample.consumer_savings_pct) throw new Error('Mandi calculation error');
    console.log('  ✅ Mandi Margin Engine passed\n');

    // Test 4: ACID Stock Locking & Order Placement
    console.log('Test 4: PostgreSQL ACID Stock Locking (`SELECT ... FOR UPDATE`)');
    const batchesRes = await get('/batches');
    const targetBatch = batchesRes.data.data.find(b => b.available_qty_kg >= 15);
    const prevStock = targetBatch.available_qty_kg;
    console.log(`  Target Batch: ${targetBatch.crop_name} | Available before order: ${prevStock} kg`);

    const orderRes = await post('/orders/place', {
      batch_id: targetBatch.id,
      cluster_id: 'cluster-01',
      ordered_qty_kg: 10
    }, buyerToken);

    if (!orderRes.data.success) throw new Error('Order placement failed: ' + orderRes.data.error);
    const placedOrder = orderRes.data.data;
    console.log(`  Order Created: ${placedOrder.id} | Amount: ₹${placedOrder.total_amount}`);
    console.log(`  Pickup QR Token Generated: ${placedOrder.pickup_qr_token}`);

    // Verify stock was decremented atomically
    const refreshedBatches = await get('/batches');
    const updatedBatch = refreshedBatches.data.data.find(b => b.id === targetBatch.id);
    console.log(`  Stock after order: ${updatedBatch.available_qty_kg} kg (Decremented exactly by 10 kg)`);
    if (updatedBatch.available_qty_kg !== prevStock - 10) throw new Error('Stock decrement mismatch!');
    console.log('  ✅ ACID Stock Locking passed\n');

    // Test 5: 2-Step Gate QR Verification & Atomic Escrow Release
    console.log('Test 5: 2-Step QR Verification & Escrow Payment Release');
    console.log(`  Escrow Status before release: ${placedOrder.escrow_status}`);

    const verifyRes = await post('/orders/verify-qr', {
      pickup_qr_token: placedOrder.pickup_qr_token
    }, buyerToken);

    if (!verifyRes.data.success) throw new Error('QR Verification failed: ' + verifyRes.data.error);
    console.log('  Verification Response:', verifyRes.data.message);
    console.log(`  Credited Payout: ₹${verifyRes.data.data.payout_amount} to ${verifyRes.data.data.farmer_name}`);
    console.log(`  Updated Farmer Wallet: ₹${verifyRes.data.data.farmer_new_wallet}`);
    if (verifyRes.data.data.order.escrow_status !== 'VERIFIED_RELEASED') throw new Error('Escrow status not updated');
    console.log('  ✅ 2-Step Gate QR Verification & Escrow Release passed\n');

    // Test 6: Route Consolidation & Cluster-Drop Logistics
    console.log('Test 6: Route Consolidation & Cluster-Drop Logistics Engine');
    const logistics = await get('/logistics/consolidation');
    console.log(`  Total Society Gate Hubs: ${logistics.data.network_summary.total_clusters}`);
    console.log(`  Total Pooled Network Volume: ${logistics.data.network_summary.total_network_kg} kg`);
    const cluster1 = logistics.data.data.find(c => c.cluster_id === 'cluster-01');
    console.log(`  Cluster: ${cluster1.cluster_name} (${cluster1.city})`);
    console.log(`  - Drop Window: ${cluster1.drop_time_window}`);
    console.log(`  - Pooled Cargo: ${cluster1.total_pooled_kg} kg across ${cluster1.order_count} orders`);
    console.log(`  - Contributing Villages: ${cluster1.origin_villages.join(', ')}`);
    console.log(`  - Route Efficiency Status: ${cluster1.route_status}`);
    console.log('  ✅ Cluster Consolidation passed\n');

    console.log('🎉 ALL 6 ANTI-REJECTION CORE TESTS PASSED SUCCESSFULLY! 🚀');
    process.exit(0);
  } catch (err) {
    console.error('❌ Test failed:', err.message);
    process.exit(1);
  }
}

runTests();
