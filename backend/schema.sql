-- ==============================================================================
-- Farm2Plate: Hyperlocal Cluster-Pooled Farm-to-Society Supply & Traceability
-- PostgreSQL Schema & Realistic Seed Data
-- ==============================================================================

-- Drop tables if they exist (clean slate)
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS harvest_batches CASCADE;
DROP TABLE IF EXISTS delivery_clusters CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. USERS TABLE
CREATE TABLE users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('farmer', 'buyer', 'admin')),
    village_or_society VARCHAR(150) NOT NULL,
    wallet_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. DELIVERY CLUSTERS TABLE (Society Gate Hubs)
CREATE TABLE delivery_clusters (
    id VARCHAR(64) PRIMARY KEY,
    cluster_name VARCHAR(150) NOT NULL,
    city VARCHAR(100) NOT NULL,
    drop_time_window VARCHAR(100) NOT NULL
);

-- 3. HARVEST BATCHES TABLE (With APMC Mandi Base Rates and Farmer Direct Pricing)
CREATE TABLE harvest_batches (
    id VARCHAR(64) PRIMARY KEY,
    farmer_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    crop_name VARCHAR(120) NOT NULL,
    crop_name_hi VARCHAR(120) NOT NULL,
    total_qty_kg NUMERIC(10, 2) NOT NULL CHECK (total_qty_kg > 0),
    available_qty_kg NUMERIC(10, 2) NOT NULL CHECK (available_qty_kg >= 0),
    mandi_rate_per_kg NUMERIC(10, 2) NOT NULL CHECK (mandi_rate_per_kg > 0),
    farmer_price_per_kg NUMERIC(10, 2) NOT NULL CHECK (farmer_price_per_kg > 0),
    harvest_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    qr_batch_code VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SOLD_OUT', 'EXPIRED'))
);

-- 4. ORDERS TABLE (With ACID Stock Allocation, Escrow & Unique Pickup QR Tokens)
CREATE TABLE orders (
    id VARCHAR(64) PRIMARY KEY,
    batch_id VARCHAR(64) NOT NULL REFERENCES harvest_batches(id) ON DELETE RESTRICT,
    buyer_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cluster_id VARCHAR(64) NOT NULL REFERENCES delivery_clusters(id) ON DELETE RESTRICT,
    ordered_qty_kg NUMERIC(10, 2) NOT NULL CHECK (ordered_qty_kg > 0),
    total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
    escrow_status VARCHAR(30) NOT NULL DEFAULT 'HELD_IN_ESCROW' CHECK (escrow_status IN ('HELD_IN_ESCROW', 'VERIFIED_RELEASED', 'DISPUTED')),
    pickup_qr_token VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indices for rapid querying and ACID row-level locking
CREATE INDEX idx_batches_farmer ON harvest_batches(farmer_id);
CREATE INDEX idx_batches_status ON harvest_batches(status);
CREATE INDEX idx_orders_batch ON orders(batch_id);
CREATE INDEX idx_orders_buyer ON orders(buyer_id);
CREATE INDEX idx_orders_cluster ON orders(cluster_id);
CREATE INDEX idx_orders_escrow ON orders(escrow_status);
CREATE INDEX idx_orders_qr ON orders(pickup_qr_token);

-- ==============================================================================
-- REALISTIC INDIAN SEED DATA
-- Passwords are bcrypt hash for: 'farm123'
-- Hash: $2a$10$wK1k6O7Rk9hZ4qC0gX8RMe9d1i0o1tT7R8r5uX4xHjZ3cR8h7pYKG
-- ==============================================================================

INSERT INTO users (id, name, phone, password_hash, role, village_or_society, wallet_balance, created_at) VALUES
('usr-farmer-01', 'Ramesh Patel', '9876543210', '$2a$10$wK1k6O7Rk9hZ4qC0gX8RMe9d1i0o1tT7R8r5uX4xHjZ3cR8h7pYKG', 'farmer', 'Rampur Village, Nashik Belt', 14500.00, NOW() - INTERVAL '10 days'),
('usr-farmer-02', 'Suresh Verma', '9876543211', '$2a$10$wK1k6O7Rk9hZ4qC0gX8RMe9d1i0o1tT7R8r5uX4xHjZ3cR8h7pYKG', 'farmer', 'Kalyanpur Farm Cluster', 9200.00, NOW() - INTERVAL '8 days'),
('usr-buyer-01', 'Ananya Sharma', '9876543220', '$2a$10$wK1k6O7Rk9hZ4qC0gX8RMe9d1i0o1tT7R8r5uX4xHjZ3cR8h7pYKG', 'buyer', 'Shanti Niketan Society Gate-1', 8500.00, NOW() - INTERVAL '5 days'),
('usr-buyer-02', 'Rohan Gupta', '9876543221', '$2a$10$wK1k6O7Rk9hZ4qC0gX8RMe9d1i0o1tT7R8r5uX4xHjZ3cR8h7pYKG', 'buyer', 'Greenwood Residency Hub', 6200.00, NOW() - INTERVAL '4 days'),
('usr-buyer-03', 'Priya Mehta', '9876543222', '$2a$10$wK1k6O7Rk9hZ4qC0gX8RMe9d1i0o1tT7R8r5uX4xHjZ3cR8h7pYKG', 'buyer', 'Palm Meadows Gate-2', 4100.00, NOW() - INTERVAL '2 days'),
('usr-admin-01', 'Vikram Deshmukh', '9876543230', '$2a$10$wK1k6O7Rk9hZ4qC0gX8RMe9d1i0o1tT7R8r5uX4xHjZ3cR8h7pYKG', 'admin', 'Central Agri Logistics Hub', 0.00, NOW() - INTERVAL '15 days');

INSERT INTO delivery_clusters (id, cluster_name, city, drop_time_window) VALUES
('cluster-01', 'Shanti Niketan Society Gate-1', 'Pune', '06:30 AM - 08:30 AM'),
('cluster-02', 'Greenwood Residency Hub', 'Pune', '07:00 AM - 09:00 AM'),
('cluster-03', 'Palm Meadows Gate-2', 'Pune', '06:00 AM - 08:00 AM'),
('cluster-04', 'Silver Oak Greens Wing-B', 'Pune', '07:30 AM - 09:30 AM');

INSERT INTO harvest_batches (id, farmer_id, crop_name, crop_name_hi, total_qty_kg, available_qty_kg, mandi_rate_per_kg, farmer_price_per_kg, harvest_timestamp, qr_batch_code, status) VALUES
('batch-01', 'usr-farmer-01', 'Sharbati Wheat', 'शरबती गेहूं', 500.00, 380.00, 24.50, 33.00, NOW() - INTERVAL '18 hours', 'BATCH-WHT-2026-001', 'ACTIVE'),
('batch-02', 'usr-farmer-01', 'Desi Tomatoes (Vine-Ripened)', 'देसी टमाटर', 350.00, 180.00, 18.00, 28.00, NOW() - INTERVAL '12 hours', 'BATCH-TOM-2026-002', 'ACTIVE'),
('batch-03', 'usr-farmer-02', 'Fresh Spinach (Palak)', 'ताज़ा पालक', 150.00, 75.00, 14.00, 24.00, NOW() - INTERVAL '6 hours', 'BATCH-PLK-2026-003', 'ACTIVE'),
('batch-04', 'usr-farmer-01', 'Nashik Red Onions', 'लाल प्याज', 600.00, 420.00, 22.00, 32.00, NOW() - INTERVAL '24 hours', 'BATCH-ONI-2026-004', 'ACTIVE'),
('batch-05', 'usr-farmer-02', 'Alphonso Mangoes (Early Harvest)', 'हापुस आम', 200.00, 90.00, 85.00, 130.00, NOW() - INTERVAL '8 hours', 'BATCH-MNG-2026-005', 'ACTIVE'),
('batch-06', 'usr-farmer-02', 'Basmati Paddy / Rice', 'बासमती धान', 400.00, 0.00, 42.00, 60.00, NOW() - INTERVAL '3 days', 'BATCH-RIC-2026-006', 'SOLD_OUT');

INSERT INTO orders (id, batch_id, buyer_id, cluster_id, ordered_qty_kg, total_amount, escrow_status, pickup_qr_token, created_at) VALUES
('ord-001', 'batch-01', 'usr-buyer-01', 'cluster-01', 50.00, 1650.00, 'HELD_IN_ESCROW', 'F2P-QR-SN1-98741-ACTIVE', NOW() - INTERVAL '3 hours'),
('ord-002', 'batch-02', 'usr-buyer-01', 'cluster-01', 25.00, 700.00, 'HELD_IN_ESCROW', 'F2P-QR-SN1-98742-ACTIVE', NOW() - INTERVAL '2 hours'),
('ord-003', 'batch-03', 'usr-buyer-02', 'cluster-02', 15.00, 360.00, 'VERIFIED_RELEASED', 'F2P-QR-GW2-14253-VERIFIED', NOW() - INTERVAL '28 hours'),
('ord-004', 'batch-01', 'usr-buyer-03', 'cluster-03', 70.00, 2310.00, 'HELD_IN_ESCROW', 'F2P-QR-PM2-55319-ACTIVE', NOW() - INTERVAL '1 hour');
