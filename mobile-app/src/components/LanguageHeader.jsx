import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { translations } from '../i18n/translations';

export default function LanguageHeader({ lang, setLang, user, onLogout }) {
  const t = translations[lang];

  return (
    <View style={styles.container}>
      <View style={styles.leftRow}>
        <Text style={styles.logo}>
          Farm<Text style={styles.logoAccent}>2</Text>Plate
        </Text>
        <Text style={styles.badge}>{lang === 'hi' ? 'किसान ऐप' : 'Mobile App'}</Text>
      </View>

      <View style={styles.rightRow}>
        {/* Prominent One-Tap Language Toggle Button */}
        <TouchableOpacity
          style={styles.langBtn}
          onPress={() => setLang(lang === 'en' ? 'hi' : 'en')}
          activeOpacity={0.8}
        >
          <Text style={styles.langBtnText}>
            🌐 {lang === 'en' ? 'हिंदी में देखें' : 'In English'}
          </Text>
        </TouchableOpacity>

        {user && (
          <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
            <Text style={styles.logoutText}>{t.logout}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#064e3b',
    borderBottomWidth: 1,
    borderBottomColor: '#047857'
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  logo: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5
  },
  logoAccent: {
    color: '#34d399'
  },
  badge: {
    backgroundColor: '#047857',
    color: '#a7f3d0',
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  langBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#34d399'
  },
  langBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700'
  },
  logoutBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#0f172a',
    borderRadius: 8
  },
  logoutText: {
    color: '#fca5a5',
    fontSize: 11,
    fontWeight: '600'
  }
});
