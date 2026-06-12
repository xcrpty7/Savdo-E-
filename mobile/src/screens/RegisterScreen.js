import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../store/ThemeContext';
import { SIZES, FONTS } from '../constants/theme';
import apiClient from '../services/api';
import { setToken, setUser } from '../store/authStore';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';

export default function RegisterScreen({ navigation }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !phone.trim() || !password.trim()) {
      Alert.alert(t('common.error'), t('auth.fillAllFields'));
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('/auth/register', {
        name: name.trim(),
        phone: phone.trim(),
        password: password.trim(),
      });

      const loginRes = await apiClient.post('/auth/login', {
        phone: phone.trim(),
        password: password.trim(),
      });

      const { user, accessToken, refreshToken } = loginRes.data.data;
      await setToken(accessToken, refreshToken);
      await setUser(user);

      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    } catch (error) {
      const message =
        error.response?.data?.message || t('auth.registerFailed');
      Alert.alert(t('common.error'), message);
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneChange = (text) => {
    if (/[a-zA-Z@]/.test(text)) {
      setPhone(text);
      return;
    }

    if (!text.startsWith('+998')) {
      if (text.startsWith('+')) {
        setPhone(text);
      } else if (text.length > 0) {
        let digits = text.replace(/[^\d]/g, '');
        if (digits) {
          setPhone('+998 ' + digits);
        } else {
          setPhone(text);
        }
      } else {
        setPhone('');
      }
      return;
    }

    let cleaned = text.replace(/[^\d]/g, '');
    let formatted = '+';
    if (cleaned.length > 0) formatted += cleaned.substring(0, 3);
    if (cleaned.length > 3) formatted += ' ' + cleaned.substring(3, 5);
    if (cleaned.length > 5) formatted += ' ' + cleaned.substring(5, 8);
    if (cleaned.length > 8) formatted += ' ' + cleaned.substring(8, 10);
    if (cleaned.length > 10) formatted += ' ' + cleaned.substring(10, 12);
    setPhone(formatted);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style={colors.background === '#0F172A' ? 'light' : 'dark'} backgroundColor={colors.background} />
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerSection}>
          <View style={[styles.logoCircle, { backgroundColor: colors.primary }]}>
            <Ionicons name="cart" size={40} color="#fff" />
          </View>
          <Text style={[styles.appName, { color: colors.primary }]}>SAVDO-E</Text>
          <Text style={[styles.appSubtitle, { color: colors.textMuted }]}>{t('app.subtitle') || 'Boshqaruv tizimi'}</Text>
        </View>

        <Card style={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{t('auth.signUp')}</Text>
          <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>{t('auth.signUpSubtitle')}</Text>

          <Input
            label={t('auth.name')}
            placeholder={t('auth.namePlaceholder')}
            value={name}
            onChangeText={setName}
            icon={<Ionicons name="person-outline" size={20} color={colors.textMuted} />}
          />

          <Input
            label={t('auth.phone')}
            placeholder="+998 90 123 45 67"
            value={phone}
            onChangeText={handlePhoneChange}
            keyboardType="phone-pad"
            icon={<Ionicons name="call-outline" size={20} color={colors.textMuted} />}
          />

          <Input
            label={t('auth.password')}
            placeholder={t('auth.passwordPlaceholder')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            icon={<Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} />}
            containerStyle={{ marginBottom: 24 }}
          />

          <Button
            title={t('auth.signUp')}
            onPress={handleRegister}
            loading={loading}
            variant="primary"
            style={{ height: 52 }}
          />

          <Button
            title={t('auth.signIn')}
            onPress={() => navigation.navigate('Login')}
            variant="outline"
            style={{ marginTop: 12, borderHeight: 0, borderColor: 'transparent' }}
            textStyle={{ color: colors.primary }}
          />
        </Card>

        <Text style={[styles.footer, { color: colors.textMuted }]}>{t('app.version')}</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  appName: {
    fontSize: 28,
    ...FONTS.bold,
    letterSpacing: 1,
  },
  appSubtitle: {
    fontSize: SIZES.md,
    marginTop: 4,
  },
  card: {
    width: '100%',
    padding: 24,
  },
  cardTitle: {
    fontSize: 24,
    ...FONTS.bold,
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: SIZES.base,
    marginBottom: 24,
  },
  footer: {
    marginTop: 40,
    fontSize: SIZES.xs,
  },
});
