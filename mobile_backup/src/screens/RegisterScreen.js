import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../store/ThemeContext';
import { SIZES } from '../constants/theme';
import apiClient from '../services/api';
import { setToken, setUser } from '../store/authStore';

export default function RegisterScreen({ navigation }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
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

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="light" backgroundColor={colors.background} />
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoSection}>
          <View style={[styles.logoCircle, { backgroundColor: colors.accent }]}>
            <Text style={styles.logoLetter}>S</Text>
          </View>
          <Text style={[styles.appName, { color: colors.accent }]}>SAVDO</Text>
          <Text style={styles.appSubtitle}>{t('app.subtitle')}</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={styles.cardTitle}>{t('auth.signUp')}</Text>
          <Text style={styles.cardSubtitle}>{t('auth.signUpSubtitle')}</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('auth.name')}</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Ionicons name="person-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={t('auth.namePlaceholder')}
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('auth.phone')}</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Ionicons name="call-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={t('auth.phonePlaceholder')}
                placeholderTextColor={colors.textMuted}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                autoCapitalize="none"
                returnKeyType="next"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('auth.password')}</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={t('auth.passwordPlaceholder')}
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleRegister}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(v => !v)}
              >
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={18}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.registerButton, { backgroundColor: colors.accent }, loading && styles.registerButtonDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.registerButtonText}>{t('auth.signUp')}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => navigation.navigate('Login')}
            disabled={loading}
            activeOpacity={0.7}
          >
            <Text style={styles.loginLinkText}>
              {t('auth.alreadyHaveAccount')} <Text style={[styles.loginLinkHighlight, { color: colors.accent }]}>{t('auth.signIn')}</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>{t('app.version')}</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    flexGrow: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 24, paddingVertical: 40,
  },
  logoSection: { alignItems: 'center', marginBottom: 40 },
  logoCircle: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  logoLetter: { fontSize: 36, fontWeight: '700', color: '#fff' },
  appName: { fontSize: SIZES.xxxl, fontWeight: '700', letterSpacing: 4 },
  appSubtitle: { fontSize: SIZES.base, color: colors.textMuted, marginTop: 4, letterSpacing: 1 },
  card: { width: '100%', borderRadius: 16, borderWidth: 1, padding: 24 },
  cardTitle: { fontSize: SIZES.xxl, fontWeight: '700', color: colors.text, marginBottom: 4 },
  cardSubtitle: { fontSize: SIZES.md, color: colors.textMuted, marginBottom: 24 },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: SIZES.sm, color: colors.textMuted, marginBottom: 6, fontWeight: '500' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 8, paddingHorizontal: 12 },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, height: 48, color: colors.text, fontSize: SIZES.base },
  eyeButton: { padding: 4 },
  registerButton: { borderRadius: 10, height: 52, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  registerButtonDisabled: { opacity: 0.6 },
  registerButtonText: { color: '#fff', fontSize: SIZES.base, fontWeight: '700', letterSpacing: 0.5 },
  loginLink: { marginTop: 16, alignItems: 'center', padding: 8 },
  loginLinkText: { color: colors.textMuted, fontSize: SIZES.sm },
  loginLinkHighlight: { fontWeight: '700' },
  footer: { marginTop: 32, color: colors.textMuted, fontSize: SIZES.xs },
});
