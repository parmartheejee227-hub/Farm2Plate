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

export default function BuyerHomeScreen({ user, token, lang = 'hi', onOpenGateScanner }) {
  const t = translations[lang];
  const [batches, setBatches] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [activeTab, setActiveTab] = useState('marketplace'); // 'marketplace' | 'orders'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Order modal
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [orderQty, setOrderQty] = useState('10');
  const [selectedCluster, setSelectedCluster] = useState('cluster-01');
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [orderError, setOrderError] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [bRes, oRes, cRes] = await Promise.all([
        mobileApi.getBatches(),
        mobileApi.getMyOrders(token),
        mobileApi.getClusters()
      ]);
      if (bRes.success) setBatches(bRes.data);
      if (oRes.success) setMyOrders(oRes.data);
      if (cRes.success) {
        setClusters(cRes.data);
        if (cRes.data.length > 0) setSelectedCluster(cRes.data[0].id);
      }
    } catch (err) {
      console.warn('Error loading buyer home:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePlaceOrder = async () => {
    if (!selectedBatch) return;
    const qty = parseFloat(orderQty);
    const avail = parseFloat(selectedBatch.available_qty_kg);

    if (isNaN(qty) || qty <= 0) {
      setOrderError('Please enter a valid quantity');
      return;
    }
    if (qty > avail) {
      setOrderError(`Only ${avail} kg available`);
      return;
    }

    try {
      setSubmittingOrder(true);
      setOrderError(null);
      const res = await mobileApi.placeOrder(
        {
          batch_id: selectedBatch.id,
          cluster_id: selectedCluster,
          ordered_qty_kg: qty
        },
        token
      );
      if (res.success) {
        setSelectedBatch(null);
        alert(t.orderPlacedSuccess);
        loadData();
      } else {
        setOrderError(res.error || 'Failed to place order');
      }
    } catch (err) {
      setOrderError(err.message || 'Order failed');
    } finally {
      setSubmittingOrder(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scroll}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
    >
      {/* Welcome & Tabs */}
      <View style={styles.topCard}>
        <View style={styles.topRow}>
          <View>
            <Text style={styles.buyerName}>
              {lang === 'hi' ? 'नमस्ते,' : 'Hello,'} {user?.name}
            </Text>
            <Text style={styles.buyerSub}>🏢 {user?.village_or_society}</Text>
          </View>
          <TouchableOpacity style={styles.gateVerifyPill} onPress={onOpenGateScanner}>
            <Text style={styles.gatePillText}>📷 {t.scanQrBtn}</Text>
          </TouchableOpacity>
        </View>

        {/* Tab switch */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'marketplace' && styles.tabBtnActive]}
            onPress={() => setActiveTab('marketplace')}
          >
            <Text style={[styles.tabText, activeTab === 'marketplace' && styles.tabTextActive]}>
              🛒 {t.ordersPoolTab}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'orders' && styles.tabBtnActive]}
            onPress={() => setActiveTab('orders')}
          >
            <Text style={[styles.tabText, activeTab === 'orders' && styles.tabTextActive]}>
              📦 {t.myOrdersTab} ({myOrders.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content depending on tab */}
      {loading ? (
        <ActivityIndicator color="#059669" style={{ marginVertical: 20 }} />
      ) : activeTab === 'orders' ? (
        /* My Orders with Pickup QR Tokens */
        <View>
          <Text style={styles.heading}>{t.societyGateOrders}</Text>
          {myOrders.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                {lang === 'hi' ? 'कोई सक्रिय ऑर्डर नहीं है।' : 'No society orders found.'}
              </Text>
            </View>
          ) : (
            myOrders.map((ord) => {
              const isHeld = ord.escrow_status === 'HELD_IN_ESCROW';
              return (
                <View key={ord.id} style={styles.orderCard}>
                  <View style={styles.orderTop}>
                    <View>
                      <Text style={styles.cropTitle}>
                        {lang === 'hi' ? ord.crop_name_hi : ord.crop_name}
                      </Text>
                      <Text style={styles.farmerSub}>
                        {ord.farmer_name} • {ord.cluster_name}
                      </Text>
                    </View>
                    <View style={[styles.statusPill, isHeld ? styles.statusHeld : styles.statusReleased]}>
                      <Text style={[styles.statusText, isHeld ? styles.textHeld : styles.textReleased]}>
                        {isHeld ? t.heldInEscrow : t.verifiedReleased}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.orderRow}>
                    <Text style={styles.infoLabel}>Quantity:</Text>
                    <Text style={styles.infoVal}>{ord.ordered_qty_kg} kg</Text>
                  </View>
                  <View style={styles.orderRow}>
                    <Text style={styles.infoLabel}>Total Escrow Sum:</Text>
                    <Text style={styles.escrowVal}>₹{parseFloat(ord.total_amount).toFixed(2)}</Text>
                  </View>

                  {/* Pickup QR Token Box */}
                  <View style={styles.qrTokenBox}>
                    <Text style={styles.qrTokenTitle}>🔑 {t.pickupToken}</Text>
                    <Text style={styles.qrTokenCode}>{ord.pickup_qr_token}</Text>
                    <Text style={styles.qrHint}>
                      {lang === 'hi'
                        ? 'गेट पर डिलीवरी लेते समय यह टोकन स्कैन कराएं'
                        : 'Present this token at Society Gate Hub'}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      ) : (
        /* Marketplace */
        <View>
          <Text style={styles.heading}>{t.ordersPoolTab}</Text>
          {batches.map((b) => {
            const avail = parseFloat(b.available_qty_kg);
            const isSoldOut = avail <= 0;

            return (
              <View key={b.id} style={[styles.marketCard, isSoldOut && { opacity: 0.6 }]}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.cropTitle}>
                      {lang === 'hi' ? b.crop_name_hi : b.crop_name}
                    </Text>
                    <Text style={styles.farmerSub}>
                      {b.farmer_name} • {b.farmer_village}
                    </Text>
                  </View>
                  <View style={styles.savingsPill}>
                    <Text style={styles.savingsPillText}>
                      Save {b.consumer_savings_pct}%
                    </Text>
                  </View>
                </View>

                {/* Rates */}
                <View style={styles.ratesBox}>
                  <View style={styles.rateCol}>
                    <Text style={styles.rateLabel}>APMC Base</Text>
                    <Text style={styles.strikeRate}>₹{b.mandi_rate_per_kg}</Text>
                  </View>
                  <View style={styles.rateCol}>
                    <Text style={styles.rateLabel}>{lang === 'hi' ? 'सीधा भाव' : 'Direct Rate'}</Text>
                    <Text style={styles.directRate}>₹{b.farmer_price_per_kg}/kg</Text>
                  </View>
                  <View style={styles.rateCol}>
                    <Text style={styles.rateLabel}>Retail Middlemen</Text>
                    <Text style={styles.retailRate}>₹{b.estimated_retail_price}</Text>
                  </View>
                </View>

                {/* Stock & Action */}
                <View style={styles.bottomRow}>
                  <Text style={styles.stockText}>
                    {lang === 'hi' ? 'उपलब्ध:' : 'Available:'}{' '}
                    <Text style={{ fontWeight: '800', color: '#0f172a' }}>{avail} kg</Text>
                  </Text>

                  <TouchableOpacity
                    style={[styles.poolBtn, isSoldOut && styles.disabledBtn]}
                    onPress={() => setSelectedBatch(b)}
                    disabled={isSoldOut}
                  >
                    <Text style={styles.poolBtnText}>
                      {isSoldOut ? 'Sold Out' : t.poolProduceBtn}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Place Order Modal */}
      {selectedBatch && (
        <Modal visible={!!selectedBatch} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>
                {lang === 'hi' ? 'सोसाइटी गेट ऑर्डर' : 'Place Society Gate Order'}
              </Text>
              <Text style={styles.modalSub}>
                {selectedBatch.crop_name} ({selectedBatch.crop_name_hi}) • ₹{selectedBatch.farmer_price_per_kg}/kg
              </Text>

              {orderError && <Text style={styles.errorText}>⚠️ {orderError}</Text>}

              <Text style={styles.inputLabel}>
                {lang === 'hi' ? 'मात्रा (किलो):' : 'Quantity (KG):'}
              </Text>
              <TextInput
                value={orderQty}
                onChangeText={setOrderQty}
                keyboardType="numeric"
                style={styles.modalInput}
              />

              <Text style={styles.inputLabel}>{t.societyGateHub}:</Text>
              <View style={styles.clusterPillBox}>
                {clusters.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[
                      styles.clusterPill,
                      selectedCluster === c.id && styles.clusterPillActive
                    ]}
                    onPress={() => setSelectedCluster(c.id)}
                  >
                    <Text
                      style={[
                        styles.clusterText,
                        selectedCluster === c.id && styles.clusterTextActive
                      ]}
                    >
                      {c.cluster_name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.escrowNotice}>
                <Text style={styles.escrowNoticeText}>
                  🛡️ {lang === 'hi'
                    ? 'पोस्टग्रेएसक्यूएल एसिड लॉकिंग द्वारा स्टॉक सुरक्षित किया जाएगा। राशि गेट सत्यापन तक एस्क्रो में सुरक्षित रहेगी।'
                    : 'Stock is atomically locked via PostgreSQL SELECT FOR UPDATE. Payment is held in Escrow until Society Gate verification.'}
                </Text>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setSelectedBatch(null)}
                >
                  <Text style={styles.cancelText}>{lang === 'hi' ? 'रद्द करें' : 'Cancel'}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.confirmBtn, submittingOrder && { opacity: 0.6 }]}
                  onPress={handlePlaceOrder}
                  disabled={submittingOrder}
                >
                  <Text style={styles.confirmText}>
                    {submittingOrder ? 'Locking...' : `${lang === 'hi' ? 'पुष्टि करें' : 'Confirm'} (₹${(parseFloat(orderQty || 0) * parseFloat(selectedBatch.farmer_price_per_kg)).toFixed(2)})`}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
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
  topCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  buyerName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a'
  },
  buyerSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2
  },
  gateVerifyPill: {
    backgroundColor: '#059669',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8
  },
  gatePillText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700'
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    padding: 3
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8
  },
  tabBtnActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 }
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b'
  },
  tabTextActive: {
    color: '#059669',
    fontWeight: '800'
  },
  heading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 12
  },
  marketCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10
  },
  cropTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a'
  },
  farmerSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1
  },
  savingsPill: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  savingsPillText: {
    color: '#b45309',
    fontSize: 10,
    fontWeight: '800'
  },
  ratesBox: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 10,
    marginBottom: 12
  },
  rateCol: {
    flex: 1,
    alignItems: 'center'
  },
  rateLabel: {
    fontSize: 9,
    color: '#94a3b8',
    fontWeight: '700'
  },
  strikeRate: {
    fontSize: 12,
    color: '#94a3b8',
    textDecorationLine: 'line-through'
  },
  directRate: {
    fontSize: 14,
    fontWeight: '900',
    color: '#059669'
  },
  retailRate: {
    fontSize: 12,
    color: '#d97706',
    fontWeight: '700'
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  stockText: {
    fontSize: 11,
    color: '#64748b'
  },
  poolBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8
  },
  disabledBtn: {
    backgroundColor: '#cbd5e1'
  },
  poolBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700'
  },
  orderCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  orderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10
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
  statusText: {
    fontSize: 9,
    fontWeight: '800'
  },
  textHeld: {
    color: '#b45309'
  },
  textReleased: {
    color: '#065f46'
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  infoLabel: {
    fontSize: 11,
    color: '#64748b'
  },
  infoVal: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f172a'
  },
  escrowVal: {
    fontSize: 13,
    fontWeight: '900',
    color: '#059669'
  },
  qrTokenBox: {
    backgroundColor: '#0f172a',
    padding: 10,
    borderRadius: 10,
    marginTop: 8,
    alignItems: 'center'
  },
  qrTokenTitle: {
    color: '#34d399',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase'
  },
  qrTokenCode: {
    color: '#ffffff',
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    marginVertical: 2
  },
  qrHint: {
    color: '#94a3b8',
    fontSize: 9
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
    color: '#0f172a'
  },
  modalSub: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 14
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
    backgroundColor: '#f8fafc'
  },
  clusterPillBox: {
    gap: 6,
    marginBottom: 12
  },
  clusterPill: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  clusterPillActive: {
    backgroundColor: '#ecfdf5',
    borderColor: '#059669'
  },
  clusterText: {
    fontSize: 11,
    color: '#334155'
  },
  clusterTextActive: {
    color: '#065f46',
    fontWeight: '700'
  },
  escrowNotice: {
    backgroundColor: '#fef3c7',
    padding: 10,
    borderRadius: 8,
    marginBottom: 14
  },
  escrowNoticeText: {
    fontSize: 10,
    color: '#92400e',
    lineHeight: 14
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8
  },
  cancelText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600'
  },
  confirmBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8
  },
  confirmText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700'
  },
  errorText: {
    color: '#dc2626',
    fontSize: 11,
    marginBottom: 8
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
  }
});
