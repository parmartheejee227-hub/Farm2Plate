import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { translations } from '../i18n/translations';

export default function DemoLoginBar({ onQuickLogin, lang = 'hi' }) {
  const t = translations[lang];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>⚡ {t.demoBarTitle}</Text>
      <View style={styles.btnRow}>
        <TouchableOpacity
          style={[styles.btn, styles.farmerBtn]}
          onPress={() => onQuickLogin('farmer')}
          activeOpacity={0.8}
        >
          <Text style={styles.btnText}>🌾 {t.farmerBtn}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.buyerBtn]}
          onPress={() => onQuickLogin('buyer')}
          activeOpacity={0.8}
        >
          <Text style={styles.btnText}>🛒 {t.buyerBtn}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.adminBtn]}
          onPress={() => onQuickLogin('admin')}
          activeOpacity={0.8}
        >
          <Text style={styles.btnText}>🛡️ {t.adminBtn}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0f172a',
    padding: 12,
    borderRadius: 12,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#334155'
  },
  title: {
    fontSize: 11,
    fontWeight: '800',
    color: '#34d399',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8
  },
  btnRow: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'space-between'
  },
  btn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  farmerBtn: {
    backgroundColor: '#059669'
  },
  buyerBtn: {
    backgroundColor: '#d97706'
  },
  adminBtn: {
    backgroundColor: '#4f46e5'
  },
  btnText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center'
  }
});
