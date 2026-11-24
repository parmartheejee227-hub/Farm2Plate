const API_BASE = '/api';

function getAuthHeader() {
  const token = localStorage.getItem('f2p_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `HTTP error ${res.status}`);
  }
  return data;
}

export const api = {
  // Auth
  login: async (phone, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password })
    });
    return handleResponse(res);
  },

  demoLogin: async (role) => {
    const res = await fetch(`${API_BASE}/auth/demo-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role })
    });
    return handleResponse(res);
  },

  getMe: async () => {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  // Harvest Batches
  getBatches: async () => {
    const res = await fetch(`${API_BASE}/batches`);
    return handleResponse(res);
  },

  getMyBatches: async () => {
    const res = await fetch(`${API_BASE}/batches/my-batches`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  createBatch: async (batchData) => {
    const res = await fetch(`${API_BASE}/batches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(batchData)
    });
    return handleResponse(res);
  },

  // Orders & ACID Locking
  placeOrder: async (orderData) => {
    const res = await fetch(`${API_BASE}/orders/place`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(orderData)
    });
    return handleResponse(res);
  },

  // QR Verification & Escrow Payout
  verifyQr: async (pickup_qr_token) => {
    const res = await fetch(`${API_BASE}/orders/verify-qr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ pickup_qr_token })
    });
    return handleResponse(res);
  },

  getMyOrders: async () => {
    const res = await fetch(`${API_BASE}/orders/my-orders`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  getFarmerOrders: async () => {
    const res = await fetch(`${API_BASE}/orders/farmer-orders`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  getAllOrders: async () => {
    const res = await fetch(`${API_BASE}/orders/all`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  // Logistics & Consolidation
  getClusters: async () => {
    const res = await fetch(`${API_BASE}/logistics/clusters`);
    return handleResponse(res);
  },

  getConsolidation: async () => {
    const res = await fetch(`${API_BASE}/logistics/consolidation`);
    return handleResponse(res);
  },

  // Analytics & Mandi Engine
  getMandiComparison: async () => {
    const res = await fetch(`${API_BASE}/analytics/mandi-comparison`);
    return handleResponse(res);
  },

  getKpis: async () => {
    const res = await fetch(`${API_BASE}/analytics/kpis`);
    return handleResponse(res);
  }
};
