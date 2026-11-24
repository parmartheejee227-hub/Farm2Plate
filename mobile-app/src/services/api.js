import { Platform } from 'react-native';

// Dynamically determine backend URL:
// - On Web: http://localhost:5000/api
// - On Android Emulator: http://10.0.2.2:5000/api
// - On Physical Phone: Host machine local LAN IP or localhost
const BACKEND_HOST = Platform.select({
  android: 'http://192.168.176.1:5000',
  default: 'http://localhost:5000'
});

const API_BASE = `${BACKEND_HOST}/api`;

async function request(endpoint, method = 'GET', body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const config = { method, headers };
  if (body) config.body = JSON.stringify(body);

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || `HTTP ${res.status}`);
    }
    return data;
  } catch (err) {
    console.warn(`[Mobile API] Error on ${endpoint}:`, err.message);
    throw err;
  }
}

export const mobileApi = {
  login: (phone, password) => request('/auth/login', 'POST', { phone, password }),
  demoLogin: (role) => request('/auth/demo-login', 'POST', { role }),
  getMe: (token) => request('/auth/me', 'GET', null, token),
  getBatches: () => request('/batches', 'GET'),
  getMyBatches: (token) => request('/batches/my-batches', 'GET', null, token),
  createBatch: (data, token) => request('/batches', 'POST', data, token),
  placeOrder: (data, token) => request('/orders/place', 'POST', data, token),
  verifyQr: (pickup_qr_token, token) => request('/orders/verify-qr', 'POST', { pickup_qr_token }, token),
  getMyOrders: (token) => request('/orders/my-orders', 'GET', null, token),
  getFarmerOrders: (token) => request('/orders/farmer-orders', 'GET', null, token),
  getClusters: () => request('/logistics/clusters', 'GET')
};
