import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { translations } from '../i18n/translations';
import DemoLoginBar from '../components/DemoLoginBar';

export default function LoginScreen({ onLogin, lang = 'hi' }) {
  const t = translations[lang];
  const [phone, setPhone] = useState('9876543210'); // Default farmer Ramesh
  const [password, setPassword] = useState('farm123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    if (!phone || !password) {
      setError(lang === 'hi' ? 'कृपया मोबाइल नंबर और पासवर्ड दर्ज करें' : 'Phone and password required');
      return;
    }
    setError(null);
    try {
      setLoading(true);
      await onLogin({ phone, password });
    } catch (err) {
      setError(err.message || 'Login error');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (role) => {
    setError(null);
    try {
      setLoading(true);
      await onLogin({ role, isDemo: true });
    } catch (err) {
      setError(err.message || 'Demo login error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Hero Card */}
        <View style={styles.heroBox}>
          <Text style={styles.heroBadge}>🌾 Hyperlocal Agri-Tech</Text>
          <Text style={styles.heroTitle}>Farm2Plate</Text>
          <Text style={styles.heroSubtitle}>{t.appSubtitle}</Text>
        </View>

        {/* 1-Click Demo Login Bar */}
        <DemoLoginBar onQuickLogin={handleQuickDemo} lang={lang} />

        {/* Manual Login Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t.loginHeader}</Text>

          {error && <Text style={styles.errorText}>⚠️ {error}</Text>}

          <View style={styles.field}>
            <Text style={styles.label}>{t.phoneLabel}</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="e.g. 9876543210"
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{t.passwordLabel}</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••"
              style={styles.input}
            />
            <Text style={styles.hint}>Default seed: farm123</Text>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.submitText}>{t.loginAction}</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a'
  },
  scroll: {
    padding: 16,
    paddingBottom: 40
  },
  heroBox: {
    backgroundColor: '#064e3b',
    padding: 20,
    borderRadius: 20,
    marginTop: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#047857'
  },
  heroBadge: {
    backgroundColor: '#047857',
    color: '#a7f3d0',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 6
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.5
  },
  heroSubtitle: {
    fontSize: 12,
    color: '#d1fae5',
    textAlign: 'center',
    marginTop: 4
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 20,
    marginTop: 10
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 16
  },
  field: {
    marginBottom: 12
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    textTransform: 'uppercase',
    marginBottom: 4
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
    backgroundColor: '#f8fafc'
  },
  hint: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2
  },
  submitBtn: {
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8
  },
  btnDisabled: {
    opacity: 0.6
  },
  submitText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700'
  },
  errorText: {
    color: '#dc2626',
    fontSize: 11,
    marginBottom: 10
  }
});
