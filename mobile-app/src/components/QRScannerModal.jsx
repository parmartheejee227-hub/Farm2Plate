import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { mobileApi } from '../services/api';
import { voiceAssistant } from '../utils/speech';

export default function QRScannerModal({ visible, onClose, token, onVerified, lang = 'hi' }) {
  const [inputToken, setInputToken] = useState('F2P-QR-SN1-98741-ACTIVE');
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleVerify = async () => {
    if (!inputToken || !inputToken.trim()) {
      setError('Please provide a valid QR Token');
      return;
    }
    setError(null);
    try {
      setVerifying(true);
      const res = await mobileApi.verifyQr(inputToken.trim(), token);
      if (res.success) {
        setResult(res);
        // Voice speech announcement in Hindi for low-literacy gatekeepers/farmers
        const voiceMsg = `गेट सत्यापन सफल रहा। किसान ${res.data.farmer_name} को ${res.data.payout_amount} रुपये का भुगतान एस्क्रो से जारी कर दिया गया है।`;
        voiceAssistant.speakInHindi(voiceMsg);
        if (onVerified) onVerified(res);
      } else {
        setError(res.error || 'Verification failed');
      }
    } catch (err) {
      setError(err.message || 'QR Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const handleResetAndClose = () => {
    setResult(null);
    setError(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {lang === 'hi' ? 'सोसाइटी गेट क्यूआर स्कैनर' : 'Society Gate QR Scanner'}
            </Text>
            <TouchableOpacity onPress={handleResetAndClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.body}>
            {result ? (
              /* Success Result View */
              <View style={styles.successBox}>
                <Text style={styles.successIcon}>🎉</Text>
                <Text style={styles.successTitle}>
                  {lang === 'hi' ? 'सत्यापन पूर्ण • भुगतान जारी' : 'Verified & Escrow Released!'}
                </Text>
                <Text style={styles.amount}>₹{result.data.payout_amount.toFixed(2)}</Text>
                <Text style={styles.successSub}>
                  {lang === 'hi'
                    ? `राशि सीधे किसान ${result.data.farmer_name} के वॉलेट में क्रेडिट की गई।`
                    : `Payment credited directly to farmer ${result.data.farmer_name}.`}
                </Text>

                <TouchableOpacity style={styles.doneBtn} onPress={handleResetAndClose}>
                  <Text style={styles.doneText}>
                    {lang === 'hi' ? 'समाप्त करें' : 'Done & Return'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* Scanner Viewfinder Simulation */
              <View style={styles.scannerContainer}>
                {/* Simulated Camera Viewfinder */}
                <View style={styles.viewfinder}>
                  <View style={[styles.corner, styles.tl]} />
                  <View style={[styles.corner, styles.tr]} />
                  <View style={[styles.corner, styles.bl]} />
                  <View style={[styles.corner, styles.br]} />
                  <View style={styles.scanLine} />
                  <Text style={styles.viewfinderText}>
                    {lang === 'hi'
                      ? 'क्रॉप क्रेट / टोकन क्यूआर को फ्रेम में रखें'
                      : 'Align Cargo QR Token in Frame'}
                  </Text>
                </View>

                {error && <Text style={styles.errorText}>⚠️ {error}</Text>}

                <Text style={styles.label}>
                  {lang === 'hi' ? 'पिकअप क्यूआर टोकन कोड:' : 'Pickup QR Token Code:'}
                </Text>
                <TextInput
                  value={inputToken}
                  onChangeText={setInputToken}
                  placeholder="e.g. F2P-QR-SN1-98741-ACTIVE"
                  style={styles.input}
                  autoCapitalize="characters"
                />

                {/* Simulated Quick Tokens */}
                <View style={styles.presetRow}>
                  <TouchableOpacity
                    style={styles.presetPill}
                    onPress={() => setInputToken('F2P-QR-SN1-98741-ACTIVE')}
                  >
                    <Text style={styles.presetText}>Token 1 (Wheat)</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.presetPill}
                    onPress={() => setInputToken('F2P-QR-SN1-98742-ACTIVE')}
                  >
                    <Text style={styles.presetText}>Token 2 (Tomatoes)</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.verifyBtn, verifying && styles.btnDisabled]}
                  onPress={handleVerify}
                  disabled={verifying}
                >
                  {verifying ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.verifyBtnText}>
                      {lang === 'hi'
                        ? 'गुणवत्ता जांचें व एस्क्रो जारी करें'
                        : 'Verify Quality & Release Escrow'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    padding: 16
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    overflow: 'hidden',
    maxHeight: '90%'
  },
  header: {
    backgroundColor: '#064e3b',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700'
  },
  closeBtn: {
    padding: 4
  },
  closeText: {
    color: '#a7f3d0',
    fontSize: 18,
    fontWeight: 'bold'
  },
  body: {
    padding: 16
  },
  scannerContainer: {
    alignItems: 'center'
  },
  viewfinder: {
    width: 220,
    height: 180,
    backgroundColor: '#0f172a',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155'
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#10b981'
  },
  tl: { top: 10, left: 10, borderTopWidth: 3, borderLeftWidth: 3 },
  tr: { top: 10, right: 10, borderTopWidth: 3, borderRightWidth: 3 },
  bl: { bottom: 10, left: 10, borderBottomWidth: 3, borderLeftWidth: 3 },
  br: { bottom: 10, right: 10, borderBottomWidth: 3, borderRightWidth: 3 },
  scanLine: {
    width: '80%',
    height: 2,
    backgroundColor: '#34d399',
    opacity: 0.8
  },
  viewfinderText: {
    color: '#94a3b8',
    fontSize: 10,
    marginTop: 12,
    textAlign: 'center'
  },
  label: {
    alignSelf: 'flex-start',
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    fontFamily: 'monospace',
    color: '#0f172a',
    backgroundColor: '#f8fafc',
    marginBottom: 8
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    width: '100%'
  },
  presetPill: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  presetText: {
    fontSize: 10,
    color: '#334155',
    fontWeight: '600'
  },
  verifyBtn: {
    backgroundColor: '#059669',
    width: '100%',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center'
  },
  btnDisabled: {
    opacity: 0.6
  },
  verifyBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700'
  },
  errorText: {
    color: '#dc2626',
    fontSize: 11,
    marginBottom: 8
  },
  successBox: {
    alignItems: 'center',
    paddingVertical: 20
  },
  successIcon: {
    fontSize: 48,
    marginBottom: 8
  },
  successTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#065f46',
    textAlign: 'center'
  },
  amount: {
    fontSize: 32,
    fontWeight: '900',
    color: '#059669',
    marginVertical: 8
  },
  successSub: {
    fontSize: 12,
    color: '#334155',
    textAlign: 'center',
    marginBottom: 20
  },
  doneBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10
  },
  doneText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13
  }
});
