import React, { useState, useEffect } from 'react';
import { StyleSheet, View, SafeAreaView, StatusBar, Text } from 'react-native';
import { io } from 'socket.io-client';
import LanguageHeader from './src/components/LanguageHeader';
import QRScannerModal from './src/components/QRScannerModal';
import LoginScreen from './src/screens/LoginScreen';
import FarmerHomeScreen from './src/screens/FarmerHomeScreen';
import BuyerHomeScreen from './src/screens/BuyerHomeScreen';
import { mobileApi } from './src/services/api';

export default function App() {
  const [lang, setLang] = useState('hi'); // Default Hindi for low-literacy farmers
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);

  // Initialize Socket.io sync for mobile
  useEffect(() => {
    try {
      const socket = io('http://192.168.176.1:5000', {
        transports: ['websocket', 'polling']
      });

      socket.on('connect', () => {
        console.log('[Mobile Socket] Connected');
        setSocketConnected(true);
      });

      socket.on('disconnect', () => {
        setSocketConnected(false);
      });

      socket.on('stock_updated', (data) => {
        console.log('[Mobile Socket] Stock Updated:', data);
      });

      socket.on('escrow_released', (data) => {
        console.log('[Mobile Socket] Escrow Released:', data);
        // Refresh user profile for updated wallet
        if (token) {
          mobileApi.getMe(token).then((res) => {
            if (res.success) setUser(res.user);
          }).catch(() => {});
        }
      });

      return () => socket.disconnect();
    } catch (err) {
      console.warn('Socket connection error in mobile app:', err);
    }
  }, [token]);

  // Login handler (both manual phone/pass and 1-click demo buttons)
  const handleLogin = async ({ phone, password, role, isDemo }) => {
    let res;
    if (isDemo) {
      res = await mobileApi.demoLogin(role);
    } else {
      res = await mobileApi.login(phone, password);
    }

    if (res.success) {
      setToken(res.token);
      setUser(res.user);
    } else {
      throw new Error(res.error || 'Authentication failed');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#064e3b" />

      {/* Prominent One-Tap Language Header with हिंदी / English Toggle */}
      <LanguageHeader
        lang={lang}
        setLang={setLang}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Body */}
      <View style={styles.container}>
        {!user ? (
          <LoginScreen onLogin={handleLogin} lang={lang} />
        ) : user.role === 'farmer' ? (
          <FarmerHomeScreen
            user={user}
            token={token}
            lang={lang}
            onOpenGateScanner={() => setScannerVisible(true)}
          />
        ) : (
          /* Buyer or Admin screen */
          <BuyerHomeScreen
            user={user}
            token={token}
            lang={lang}
            onOpenGateScanner={() => setScannerVisible(true)}
          />
        )}
      </View>

      {/* QR Scanner / Society Gate Verification Modal */}
      <QRScannerModal
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        token={token}
        lang={lang}
        onVerified={() => {
          if (token) {
            mobileApi.getMe(token).then((res) => {
              if (res.success) setUser(res.user);
            }).catch(() => {});
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#064e3b'
  },
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  }
});
