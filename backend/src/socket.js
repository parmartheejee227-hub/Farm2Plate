/**
 * Farm2Plate - Socket.io Real-time Hub
 * Handles real-time stock sync, escrow release notifications, and cluster pool activity.
 */
let ioInstance = null;

function initSocket(io) {
  ioInstance = io;

  io.on('connection', (socket) => {
    console.log(`🔌 [Socket.io] Client connected: ${socket.id}`);

    // Join room based on user role or cluster if provided
    socket.on('join_room', (room) => {
      socket.join(room);
      console.log(`📡 [Socket.io] ${socket.id} joined room: ${room}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 [Socket.io] Client disconnected: ${socket.id}`);
    });
  });

  return ioInstance;
}

function getIO() {
  if (!ioInstance) {
    throw new Error('Socket.io has not been initialized yet!');
  }
  return ioInstance;
}

// Broadcast helper functions
function broadcastStockUpdate(data) {
  if (ioInstance) {
    console.log(`📢 [Socket.io] Broadcasting stock_updated: Batch ${data.batch_id}, remaining: ${data.available_qty_kg} kg`);
    ioInstance.emit('stock_updated', {
      batch_id: data.batch_id,
      available_qty_kg: data.available_qty_kg,
      status: data.status,
      timestamp: new Date().toISOString()
    });
  }
}

function broadcastEscrowReleased(data) {
  if (ioInstance) {
    console.log(`📢 [Socket.io] Broadcasting escrow_released: Order ${data.order_id}, amount: ₹${data.total_amount}`);
    ioInstance.emit('escrow_released', {
      order_id: data.order_id,
      farmer_id: data.farmer_id,
      farmer_name: data.farmer_name,
      buyer_name: data.buyer_name,
      crop_name: data.crop_name,
      total_amount: data.total_amount,
      wallet_balance: data.wallet_balance,
      timestamp: new Date().toISOString()
    });
  }
}

function broadcastOrderPlaced(data) {
  if (ioInstance) {
    console.log(`📢 [Socket.io] Broadcasting order_placed: Order ${data.order.id}`);
    ioInstance.emit('order_placed', {
      order: data.order,
      batch: data.batch,
      timestamp: new Date().toISOString()
    });
  }
}

function broadcastBatchCreated(data) {
  if (ioInstance) {
    console.log(`📢 [Socket.io] Broadcasting batch_created: ${data.batch.crop_name}`);
    ioInstance.emit('batch_created', {
      batch: data.batch,
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = {
  initSocket,
  getIO,
  broadcastStockUpdate,
  broadcastEscrowReleased,
  broadcastOrderPlaced,
  broadcastBatchCreated
};
