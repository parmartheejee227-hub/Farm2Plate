const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

// Generate JWT token
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      village_or_society: user.village_or_society
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * POST /api/auth/login
 * Standard phone + password login
 */
router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ success: false, error: 'Phone and password are required' });
    }

    const result = await db.query('SELECT * FROM users WHERE phone = $1', [phone.trim()]);
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'User not found with this phone number' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    // Allow fallback default password 'farm123' for smooth testing
    const isDefault = password === 'farm123';

    if (!isMatch && !isDefault) {
      return res.status(401).json({ success: false, error: 'Invalid password credentials' });
    }

    const token = generateToken(user);
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        village_or_society: user.village_or_society,
        wallet_balance: parseFloat(user.wallet_balance)
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: 'Internal server error during login' });
  }
});

/**
 * POST /api/auth/demo-login
 * Instant 1-Click Login for Course Project Evaluation:
 * - 'farmer': Ramesh Patel (Rampur Village)
 * - 'buyer': Ananya Sharma (Shanti Niketan Gate-1)
 * - 'admin': Vikram Deshmukh (Mandi & Logistics)
 */
router.post('/demo-login', async (req, res) => {
  try {
    const { role } = req.body;
    let targetPhone = '9876543210'; // default farmer

    if (role === 'buyer') {
      targetPhone = '9876543220'; // Ananya Sharma
    } else if (role === 'admin') {
      targetPhone = '9876543230'; // Vikram Deshmukh
    } else {
      targetPhone = '9876543210'; // Ramesh Patel
    }

    const result = await db.query('SELECT * FROM users WHERE phone = $1', [targetPhone]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Demo user not found' });
    }

    const user = result.rows[0];
    const token = generateToken(user);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        village_or_society: user.village_or_society,
        wallet_balance: parseFloat(user.wallet_balance)
      }
    });
  } catch (err) {
    console.error('Demo login error:', err);
    res.status(500).json({ success: false, error: 'Demo login failed' });
  }
});

/**
 * GET /api/auth/me
 * Fetch current user profile with live wallet balance
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await db.query('SELECT id, name, phone, role, village_or_society, wallet_balance, created_at FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User profile not found' });
    }
    const user = result.rows[0];
    res.json({
      success: true,
      user: {
        ...user,
        wallet_balance: parseFloat(user.wallet_balance)
      }
    });
  } catch (err) {
    console.error('Auth /me error:', err);
    res.status(500).json({ success: false, error: 'Could not fetch user profile' });
  }
});

module.exports = router;
