/**
 * Farm2Plate Backend Server
 * Monorepo Backend: Node.js, Express, Socket.io, PostgreSQL (pg)
 */
require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const db = require('./db');
const { initSocket } = require('./socket');

// Import routes
const authRoutes = require('./routes/auth');
const batchRoutes = require('./routes/batches');
const orderRoutes = require('./routes/orders');
const logisticsRoutes = require('./routes/logistics');
const analyticsRoutes = require('./routes/analytics');

const app = express();
const server = http.createServer(app);

// Configure Socket.io with permissive CORS for Vite web portal & Expo mobile client
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: false
  }
});

// Initialize Socket.io broadcast hub
initSocket(io);

// Express Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`[${req.method}] ${req.originalUrl} - ${res.statusCode} (${Date.now() - start}ms)`);
  });
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'Farm2Plate Hyperlocal Cluster Ecosystem',
    version: '1.0.0',
    database_mode: db.isPgConnected() ? 'Native PostgreSQL Pool' : 'ACID Transactional In-Memory Store',
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/logistics', logisticsRoutes);
app.use('/api/analytics', analyticsRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: err.message
  });
});

// 404 Route
app.use('*', (req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`
🌾 ==============================================================
   Farm2Plate Backend Running on http://127.0.0.1:${PORT}
   Real-Time Socket.io: ws://127.0.0.1:${PORT}
   Database Engine: ${db.isPgConnected() ? 'Native PostgreSQL' : 'ACID In-Memory Fallback Active'}
🌾 ==============================================================
  `);
});
