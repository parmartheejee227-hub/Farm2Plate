import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import confetti from 'canvas-confetti';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [liveAlerts, setLiveAlerts] = useState([]);
  const [lastStockUpdate, setLastStockUpdate] = useState(null);
  const [lastEscrowRelease, setLastEscrowRelease] = useState(null);

  // Play subtle web audio notification chime
  const playChime = useCallback((type = 'info') => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'escrow') {
        // Cheerful success chord for payment release
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
        osc.start();
        osc.stop(ctx.currentTime + 0.6);
      } else {
        // Subtle ping for stock update
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch {
      // Audio autoplay policy can safely ignore
    }
  }, []);

  const addAlert = useCallback((alert) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    const newAlert = { ...alert, id, timestamp: new Date() };
    setLiveAlerts((prev) => [newAlert, ...prev.slice(0, 4)]);

    // Auto dismiss after 6 seconds
    setTimeout(() => {
      setLiveAlerts((prev) => prev.filter((a) => a.id !== id));
    }, 6000);
  }, []);

  useEffect(() => {
    // Connect to server (either via Vite proxy or direct)
    const socketInstance = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5
    });

    socketInstance.on('connect', () => {
      console.log('✅ [Socket.io Web] Connected with id:', socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('❌ [Socket.io Web] Disconnected');
      setIsConnected(false);
    });

    // Real-time stock update
    socketInstance.on('stock_updated', (data) => {
      console.log('📡 [Socket.io Web] stock_updated:', data);
      setLastStockUpdate(data);
      playChime('info');
      addAlert({
        type: 'stock',
        title: 'Live Stock Updated',
        message: `Harvest batch ${data.batch_id} remaining stock: ${data.available_qty_kg} kg (${data.status})`
      });
    });

    // Escrow payout release alert
    socketInstance.on('escrow_released', (data) => {
      console.log('🎉 [Socket.io Web] escrow_released:', data);
      setLastEscrowRelease(data);
      playChime('escrow');

      // Trigger celebratory confetti on screen
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {}

      addAlert({
        type: 'escrow',
        title: 'Escrow Payment Released! 💸',
        message: `₹${data.total_amount} credited directly to farmer ${data.farmer_name} for order ${data.order_id} (${data.crop_name}).`
      });
    });

    // Order placed alert
    socketInstance.on('order_placed', (data) => {
      addAlert({
        type: 'order',
        title: 'New Society Order Placed',
        message: `Order ${data.order.id} for ${data.order.ordered_qty_kg} kg placed. Stock locked in escrow.`
      });
    });

    // Batch created alert
    socketInstance.on('batch_created', (data) => {
      addAlert({
        type: 'batch',
        title: 'New Harvest Batch Published',
        message: `${data.batch.crop_name} (${data.batch.total_qty_kg} kg) freshly harvested by ${data.batch.farmer_name}.`
      });
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [addAlert, playChime]);

  const removeAlert = (id) => {
    setLiveAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        liveAlerts,
        removeAlert,
        lastStockUpdate,
        lastEscrowRelease,
        playChime
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
