import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  TextInput,
  RefreshControl
} from 'react-native';
import { mobileApi } from '../services/api';
import { translations } from '../i18n/translations';
import { voiceAssistant } from '../utils/speech';
import VoiceSpeechButton from '../components/VoiceSpeechButton';

export default function FarmerHomeScreen({ user, token, lang = 'hi', onOpenGateScanner }) {
  const t = translations[lang];
  const [batches, setBatches] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Harvest Form
  const [newCrop, setNewCrop] = useState('');
  const [newCropHi, setNewCropHi] = useState('');
  const [newQty, setNewQty] = useState('');
  const [newMandi, setNewMandi] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [bRes, oRes] = await Promise.all([
        mobileApi.getMyBatches(token),
        mobileApi.getFarmerOrders(token)
      ]);
      if (bRes.success) setBatches(bRes.data);
      if (oRes.success) setOrders(oRes.data);
    } catch (err) {
      console.warn('Error loading farmer home:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateHarvest = async () => {
    if (!newCrop || !newQty || !newMandi || !newPrice) {
      alert(lang === 'hi' ? 'कृपया सभी विवरण भरें' : 'Please fill all fields');
      return;
    }
    try {
      setSubmitting(true);
      const res = await mobileApi.createBatch(
        {
          crop_name: newCrop,
          crop_name_hi: newCropHi || newCrop,
          total_qty_kg: newQty,
          mandi_rate_per_kg: newMandi,
          farmer_price_per_kg: newPrice
        },
        token
      );
      if (res.success) {
        setShowAddModal(false);
        setNewCrop('');
        setNewCropHi('');
        setNewQty('');
        setNewMandi('');
        setNewPrice('');
        loadData();
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const walletSpeechText = voiceAssistant.getWalletVoiceText(
    user?.name || 'रामेश',
    user?.wallet_balance || 14500
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scroll}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
    >
      {/* Kisan Welcome Card */}
      <View style={styles.welcomeBox}>
        <View style={styles.welcomeRow}>
          <View>
            <Text style={styles.kisanGreeting}>
              {lang === 'hi' ? 'राम राम,' : 'Welcome,'} {user?.name}
            </Text>
            <Text style={styles.villageText}>📍 {user?.village_or_society}</Text>
          </View>
          <TouchableOpacity style={styles.scannerPill} onPress={onOpenGateScanner}>
            <Text style={styles.scannerPillText}>📷 {t.gateScanTab}</Text>
          </TouchableOpacity>
        </View>

        {/* Live Wallet Card with Voice Assistant Readout */}
        <View style={styles.walletCard}>
          <View>
            <Text style={styles.walletLabel}>{t.walletBalance}</Text>
            <Text style={styles.walletAmount}>
              ₹{parseFloat(user?.wallet_balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </Text>
          </View>

          {/* Voice Readout for Wallet */}
          <VoiceSpeechButton
            speechText={walletSpeechText}
            label={lang === 'hi' ? 'वॉलेट सुनें' : 'Listen Wallet'}
            lang={lang}
          />
        </View>
      </View>

      {/* Action: Publish Fresh Crop */}
      <View style={styles.actionRow}>
        <Text style={styles.sectionHeader}>{t.activeBatches}</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowAddModal(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.addBtnText}>+ {t.publishNewHarvest}</Text>
        </TouchableOpacity>
      </View>

      {/* Harvest Batches List with Voice Readouts */}
      {loading ? (
        <ActivityIndicator color="#059669" style={{ marginVertical: 20 }} />
      ) : batches.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            {lang === 'hi' ? 'कोई फसल प्रकाशित नहीं है।' : 'No active harvests published yet.'}
          </Text>
        </View>
      ) : (
        batches.map((batch) => {
          const avail = parseFloat(batch.available_qty_kg);
          const total = parseFloat(batch.total_qty_kg);
          const isSoldOut = avail <= 0;
          const speechText = voiceAssistant.getBatchVoiceText(batch, user?.name);

          return (
            <View key={batch.id} style={[styles.batchCard, isSoldOut && styles.soldOutCard]}>
              <View style={styles.batchTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cropTitle}>
                    {lang === 'hi' ? batch.crop_name_hi : batch.crop_name}
                  </Text>
                  <Text style={styles.cropSub}>
                    {lang === 'hi' ? batch.crop_name : batch.crop_name_hi} •{' '}
                    <Text style={{ fontFamily: 'monospace' }}>{batch.qr_batch_code}</Text>
                  </Text>
                </View>

                {/* Voice speech readout for low-literacy farmers */}
                <VoiceSpeechButton speechText={speechText} lang={lang} />
              </View>

              {/* Price & Mandi Comparison */}
              <View style={styles.priceGrid}>
                <View style={styles.priceCol}>
                  <Text style={styles.priceLabel}>APMC Mandi</Text>
                  <Text style={styles.mandiPrice}>₹{batch.mandi_rate_per_kg}</Text>
                </View>
                <View style={[styles.priceCol, styles.myPriceCol]}>
                  <Text style={styles.myPriceLabel}>{lang === 'hi' ? 'मेरा भाव' : 'My Price'}</Text>
                  <Text style={styles.myPriceVal}>₹{batch.farmer_price_per_kg}/kg</Text>
                </View>
                <View style={styles.priceCol}>
                  <Text style={styles.priceLabel}>{lang === 'hi' ? 'मुनाफा' : 'Extra'}</Text>
                  <Text style={styles.profitGain}>+{batch.farmer_extra_profit_pct}%</Text>
                </View>
              </View>

              {/* Stock Bar */}
              <View style={styles.stockBox}>
                <View style={styles.stockRow}>
                  <Text style={styles.stockLabel}>{t.availableStock}:</Text>
                  <Text style={styles.stockVal}>
                    {avail} kg / {total} kg
                  </Text>
                </View>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${Math.min(100, (avail / total) * 100)}%` },
                      isSoldOut && { backgroundColor: '#ef4444' }
                    ]}
                  />
                </View>
              </View>
            </View>
          );
        })
      )}

      {/* Received Society Orders */}
      <View style={[styles.actionRow, { marginTop: 24 }]}>
        <Text style={styles.sectionHeader}>{t.societyGateOrders}</Text>
      </View>

      {orders.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            {lang === 'hi' ? 'अभी कोई ऑर्डर प्राप्त नहीं हुआ है।' : 'No orders received yet.'}
          </Text>
        </View>
      ) : (
        orders.map((ord) => {
          const isReleased = ord.escrow_status === 'VERIFIED_RELEASED';
          const orderSpeech = voiceAssistant.getOrderVoiceText(ord, user?.name);

          return (
            <View key={ord.id} style={styles.orderCard}>
              <View style={styles.orderTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.orderCrop}>
                    {lang === 'hi' ? ord.crop_name_hi : ord.crop_name}
                  </Text>
                  <Text style={styles.orderBuyer}>
                    {ord.buyer_name} • {ord.cluster_name}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusPill,
                    isReleased ? styles.statusReleased : styles.statusHeld
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      isReleased ? styles.textReleased : styles.textHeld
                    ]}
                  >
                    {isReleased ? t.verifiedReleased : t.heldInEscrow}
                  </Text>
                </View>
              </View>

              <View style={styles.orderBottom}>
                <Text style={styles.orderSum}>
                  {ord.ordered_qty_kg} kg •{' '}
                  <Text style={{ fontWeight: '800', color: '#059669' }}>
                    ₹{ord.total_amount}
                  </Text>
                </Text>

                <VoiceSpeechButton
                  speechText={orderSpeech}
                  label={lang === 'hi' ? 'ऑर्डर सुनें' : 'Listen'}
                  lang={lang}
                />
              </View>
            </View>
          );
        })
      )}

      {/* Publish Batch Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t.publishNewHarvest}</Text>

            <TextInput
              placeholder="Crop Name (English e.g. Cauliflower)"
              value={newCrop}
              onChangeText={setNewCrop}
              style={styles.modalInput}
            />
            <TextInput
              placeholder="स्थानीय / हिंदी नाम (उदा. फूलगोभी)"
              value={newCropHi}
              onChangeText={setNewCropHi}
              style={styles.modalInput}
            />
            <TextInput
              placeholder="Total Quantity (kg e.g. 250)"
              value={newQty}
              onChangeText={setNewQty}
              keyboardType="numeric"
              style={styles.modalInput}
            />
            <TextInput
              placeholder="APMC Mandi Rate (₹/kg e.g. 18.00)"
              value={newMandi}
              onChangeText={setNewMandi}
              keyboardType="numeric"
              style={styles.modalInput}
            />
            <TextInput
              placeholder="My Direct Price (₹/kg e.g. 26.00)"
              value={newPrice}
              onChangeText={setNewPrice}
              keyboardType="numeric"
              style={[styles.modalInput, { borderColor: '#10b981', backgroundColor: '#f0fdf4' }]}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelText}>{lang === 'hi' ? 'रद्द करें' : 'Cancel'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalSubmit, submitting && { opacity: 0.6 }]}
                onPress={handleCreateHarvest}
                disabled={submitting}
              >
                <Text style={styles.submitModalText}>
                  {submitting ? '...' : t.publishBtn}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  scroll: {
    padding: 16,
    paddingBottom: 60
  },
  welcomeBox: {
    backgroundColor: '#064e3b',
    padding: 16,
    borderRadius: 20,
    marginBottom: 16
  },
  welcomeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  kisanGreeting: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff'
  },
  villageText: {
    fontSize: 12,
    color: '#a7f3d0',
    marginTop: 2
  },
  scannerPill: {
    backgroundColor: '#059669',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8
  },
  scannerPillText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700'
  },
  walletCard: {
    backgroundColor: '#022c22',
    padding: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#047857'
  },
  walletLabel: {
    fontSize: 10,
    color: '#a7f3d0',
    fontWeight: '700',
    textTransform: 'uppercase'
  },
  walletAmount: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 2
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a'
  },
  addBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8
  },
  addBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700'
  },
  batchCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6
  },
  soldOutCard: {
    opacity: 0.7
  },
  batchTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  cropTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a'
  },
  cropSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1
  },
  priceGrid: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 8,
    marginBottom: 12
  },
  priceCol: {
    flex: 1,
    alignItems: 'center'
  },
  myPriceCol: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#e2e8f0'
  },
  priceLabel: {
    fontSize: 9,
    color: '#94a3b8',
    fontWeight: '700',
    textTransform: 'uppercase'
  },
  mandiPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    textDecorationLine: 'line-through'
  },
  myPriceLabel: {
    fontSize: 9,
    color: '#059669',
    fontWeight: '800',
    textTransform: 'uppercase'
  },
  myPriceVal: {
    fontSize: 14,
    fontWeight: '900',
    color: '#059669'
  },
  profitGain: {
    fontSize: 13,
    fontWeight: '800',
    color: '#047857'
  },
  stockBox: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 8
  },
  stockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  stockLabel: {
    fontSize: 11,
    color: '#64748b'
  },
  stockVal: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f172a'
  },
  progressBar: {
    height: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 3,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#059669',
    borderRadius: 3
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 14,
    alignItems: 'center'
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 12
  },
  orderCard: {
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  orderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  orderCrop: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a'
  },
  orderBuyer: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  statusHeld: {
    backgroundColor: '#fef3c7'
  },
  statusReleased: {
    backgroundColor: '#d1fae5'
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: '800'
  },
  textHeld: {
    color: '#b45309'
  },
  textReleased: {
    color: '#065f46'
  },
  orderBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
    paddingTop: 8
  },
  orderSum: {
    fontSize: 12,
    color: '#334155'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    padding: 16
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 14
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    marginBottom: 10,
    backgroundColor: '#f8fafc'
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8
  },
  modalCancel: {
    paddingHorizontal: 14,
    paddingVertical: 8
  },
  cancelText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600'
  },
  modalSubmit: {
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8
  },
  submitModalText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700'
  }
});
