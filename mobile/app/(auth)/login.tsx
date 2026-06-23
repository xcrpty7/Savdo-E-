import { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin";
import { useLangStore } from "@/store/langStore";
import { useAuthStore } from "@/store/authStore";
import { useT } from "@/hooks/useT";
import { api } from "@/services/api";
import { useTheme } from "@/hooks/useTheme";
import { light } from "@/theme/colors";
import { Lang } from "@/i18n";

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? "",
  offlineAccess: true,
});

const LANGS: { code: Lang; label: string; flag: string }[] = [
  { code: "uz", label: "UZ", flag: "🇺🇿" },
  { code: "ru", label: "RU", flag: "🇷🇺" },
  { code: "en", label: "EN", flag: "🇬🇧" },
];

type EmailMode = "signin" | "register";
type LoginTab = "email" | "phone";

function Field({
  icon, placeholder, value, onChangeText, secure, onToggleSecure, showSecure, keyboardType, autoCapitalize, c,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  secure?: boolean;
  onToggleSecure?: () => void;
  showSecure?: boolean;
  keyboardType?: any;
  autoCapitalize?: any;
  c: typeof light;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: c.bg, borderRadius: 14, paddingHorizontal: 14, marginBottom: 12, borderWidth: 1.5, borderColor: c.border, height: 54 }}>
      <Ionicons name={icon} size={17} color={c.textMuted} style={{ marginRight: 10 }} />
      <TextInput
        style={{ flex: 1, fontSize: 15, color: c.text }}
        placeholder={placeholder}
        placeholderTextColor={c.textMuted}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secure && !showSecure}
        keyboardType={keyboardType ?? "default"}
        autoCapitalize={autoCapitalize ?? "none"}
        autoCorrect={false}
      />
      {secure && (
        <TouchableOpacity onPress={onToggleSecure}>
          <Ionicons name={showSecure ? "eye-off" : "eye"} size={18} color={c.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function LoginScreen() {
  const [tab, setTab] = useState<LoginTab>("email");
  const [emailMode, setEmailMode] = useState<EmailMode>("signin");

  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const { lang, setLang } = useLangStore();
  const { setToken, saveEmailCredentials, verifyEmailOffline } = useAuthStore();
  const t = useT();
  const { c } = useTheme();

  async function handleGoogleSignIn() {
    setLoading(true);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const res = await GoogleSignin.signIn();
      if (res.type === "cancelled") return;
      const user = res.data;
      const code = user.serverAuthCode || user.idToken;
      if (!code) { Alert.alert("Xatolik", "Google kodi olinmadi"); setLoading(false); return; }
      const apiRes = await api.post("/auth/google", { credential: code });
      const data = apiRes.data?.data ?? apiRes.data;
      await setToken(data.accessToken, data.refreshToken);
    } catch (e: any) {
      if (e?.code === statusCodes.SIGN_IN_CANCELLED) return;
      if (e?.code === statusCodes.IN_PROGRESS) return;
      const msg = e?.response?.data?.message || "Google bilan kirish xatolik";
      Alert.alert("Xatolik", msg);
    } finally {
      setLoading(false);
    }
  }

  const isPhoneValid    = phone.length >= 9;
  const isSignInValid   = email.includes("@") && password.length >= 1;
  const isRegisterValid = name.trim().length >= 2 && email.includes("@") && password.length >= 1 && confirmPwd === password;

  function submitBg() {
    const valid = emailMode === "signin" ? isSignInValid : isRegisterValid;
    if (loading) return c.bgMuted;
    if (valid) return c.primary;
    return c.bgMuted;
  }
  function submitTextColor() {
    const valid = emailMode === "signin" ? isSignInValid : isRegisterValid;
    return valid && !loading ? "#fff" : c.textMuted;
  }

  async function handlePhoneNext() {
    if (!isPhoneValid) return;
    setLoading(true);
    try {
      await api.post("/auth/send-otp", { phone: `+998${phone}` });
    } catch {
      // demo mode on verify screen (000000)
    } finally {
      setLoading(false);
    }
    router.push({ pathname: "/verify", params: { phone } });
  }

  async function handleSignIn() {
    if (!isSignInValid) return;
    setLoading(true);
    try {
      if (password === "demo") {
        await setToken("demo-token", "demo-refresh");
        return;
      }
      const res = await api.post("/auth/login", { email: email.toLowerCase(), password });
      const data = res.data?.data ?? res.data;
      await saveEmailCredentials(email.toLowerCase(), password, data.accessToken, data.refreshToken);
    } catch (e: any) {
      if (!e?.response) {
        const cached = await verifyEmailOffline(email, password);
        if (cached) { await setToken(cached, ""); return; }
        Alert.alert(t.common.error, t.auth.noNetworkLogin);
      } else {
        Alert.alert(t.common.error, t.auth.wrongPassword);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister() {
    if (!isRegisterValid) return;
    setLoading(true);
    try {
      const res = await api.post("/auth/register", {
        name: name.trim(),
        email: email.toLowerCase(),
        password,
      });
      const data = res.data?.data ?? res.data;
      await saveEmailCredentials(email.toLowerCase(), password, data.accessToken, data.refreshToken);
    } catch (e: any) {
      if (e?.response?.status === 409) {
        Alert.alert(t.common.error, t.auth.emailExists);
      } else {
        const msg = e?.response?.data?.message || "Ro'yxatdan o'tishda xatolik";
        Alert.alert(t.common.error, msg);
      }
    } finally {
      setLoading(false);
    }
  }

  async function enterDemo() {
    await setToken("demo-token", "demo-refresh");
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        style={{ flex: 1, backgroundColor: c.bg }}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Logo area ── */}
        <View style={{ alignItems: "center", justifyContent: "center", paddingTop: 64, paddingBottom: 28, paddingHorizontal: 24 }}>
          <View style={{ width: 88, height: 88, backgroundColor: c.primary, borderRadius: 28, alignItems: "center", justifyContent: "center", marginBottom: 14, shadowColor: c.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.45, shadowRadius: 16, elevation: 10 }}>
            <Ionicons name="stats-chart" size={42} color="#fff" />
          </View>
          <Text style={{ color: c.text, fontSize: 32, fontWeight: "800", letterSpacing: -1 }}>Savdo</Text>
          <Text style={{ color: c.textSub, fontSize: 13, marginTop: 4, marginBottom: 20 }}>{t.auth.appDesc}</Text>

          {/* Lang picker — full-width pill */}
          <View style={{ flexDirection: "row", backgroundColor: c.bgMuted, borderRadius: 14, padding: 3, width: "100%" }}>
            {LANGS.map((l) => (
              <TouchableOpacity
                key={l.code}
                onPress={() => setLang(l.code)}
                style={{
                  flex: 1, paddingVertical: 10, borderRadius: 11,
                  backgroundColor: lang === l.code ? c.primary : "transparent",
                  alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 5,
                }}
              >
                <Text style={{ fontSize: 15 }}>{l.flag}</Text>
                <Text style={{ color: lang === l.code ? "#fff" : c.textSub, fontWeight: "700", fontSize: 13 }}>
                  {l.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Bottom card ── */}
        <View style={{ backgroundColor: c.bgCard, borderTopLeftRadius: 34, borderTopRightRadius: 34, paddingHorizontal: 22, paddingTop: 26, paddingBottom: 48, flex: 1 }}>

          {/* Phone tab removed — email-only, no OTP */}

          {/* ─── PHONE TAB ─── */}
          {tab === "phone" && (
            <>
              <Text style={{ color: c.primary, fontSize: 12, fontWeight: "600", marginBottom: 8 }}>{t.auth.phone}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: c.bg, borderRadius: 14, paddingHorizontal: 14, marginBottom: 16, borderWidth: 1.5, borderColor: c.border, height: 54 }}>
                <View style={{ marginRight: 10, paddingRight: 10, borderRightWidth: 1, borderRightColor: c.border }}>
                  <Text style={{ color: c.primary, fontSize: 15, fontWeight: "700" }}>+998</Text>
                </View>
                <TextInput
                  style={{ flex: 1, fontSize: 19, color: c.text, fontWeight: "600", letterSpacing: 1 }}
                  placeholder="90 123 45 67"
                  placeholderTextColor={c.textMuted}
                  keyboardType="number-pad"
                  maxLength={9}
                  value={phone}
                  onChangeText={setPhone}
                />
                {phone.length > 0 && (
                  <TouchableOpacity onPress={() => setPhone("")}>
                    <Ionicons name="close-circle" size={18} color={c.textMuted} />
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                style={{ backgroundColor: isPhoneValid && !loading ? c.primary : c.bgMuted, borderRadius: 14, height: 54, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, shadowColor: c.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: isPhoneValid && !loading ? 0.35 : 0, shadowRadius: 8, elevation: isPhoneValid && !loading ? 5 : 0 }}
                onPress={handlePhoneNext}
                disabled={!isPhoneValid || loading}
              >
                {loading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Ionicons name="arrow-forward" size={17} color={isPhoneValid ? "#fff" : c.textMuted} />
                }
                <Text style={{ color: isPhoneValid && !loading ? "#fff" : c.textMuted, fontWeight: "800", fontSize: 16 }}>
                  {loading ? t.auth.checking : t.auth.enter}
                </Text>
              </TouchableOpacity>
              <Text style={{ color: c.textSub, textAlign: "center", fontSize: 11, marginTop: 14 }}>{t.auth.demoNote}</Text>
            </>
          )}

          {/* ─── EMAIL TAB ─── */}
          {tab === "email" && (
            <>
              {/* Sign In / Register toggle */}
              <View style={{ flexDirection: "row", backgroundColor: c.bgMuted, borderRadius: 11, padding: 3, marginBottom: 20 }}>
                {(["signin", "register"] as EmailMode[]).map((m) => (
                  <TouchableOpacity
                    key={m}
                    onPress={() => setEmailMode(m)}
                    style={{ flex: 1, paddingVertical: 8, borderRadius: 9, backgroundColor: emailMode === m ? c.bgCard : "transparent", alignItems: "center" }}
                  >
                    <Text style={{ color: emailMode === m ? c.primary : c.textMuted, fontWeight: "700", fontSize: 13 }}>
                      {m === "signin" ? t.auth.signIn : t.auth.register}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Register — name */}
              {emailMode === "register" && (
                <Field
                  icon="person-outline"
                  placeholder={t.auth.namePlaceholder}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  c={c}
                />
              )}

              {/* Email (shared) */}
              <Field icon="mail-outline" placeholder={t.auth.emailPlaceholder} value={email} onChangeText={setEmail} keyboardType="email-address" c={c} />

              {/* Password (shared) */}
              <Field
                icon="lock-closed-outline"
                placeholder={t.auth.passwordPlaceholder}
                value={password}
                onChangeText={setPassword}
                secure
                showSecure={showPass}
                onToggleSecure={() => setShowPass(!showPass)}
                c={c}
              />

              {/* Sign-in: forgot password */}
              {emailMode === "signin" && (
                <TouchableOpacity
                  style={{ alignSelf: "flex-end", marginTop: -6, marginBottom: 10 }}
                  onPress={() => router.push("/(auth)/forgot-password")}
                >
                  <Text style={{ color: c.primary, fontSize: 12, fontWeight: "600" }}>Parolni unutdingizmi?</Text>
                </TouchableOpacity>
              )}

              {/* Register — confirm password */}
              {emailMode === "register" && (
                <>
                  <Field
                    icon="shield-checkmark-outline"
                    placeholder={t.auth.confirmPasswordPlaceholder}
                    value={confirmPwd}
                    onChangeText={setConfirmPwd}
                    secure
                    showSecure={showConfirm}
                    onToggleSecure={() => setShowConfirm(!showConfirm)}
                    c={c}
                  />
                  {confirmPwd.length > 0 && confirmPwd !== password && (
                    <Text style={{ color: c.danger, fontSize: 12, marginTop: -6, marginBottom: 8 }}>
                      Parollar mos kelmayapti
                    </Text>
                  )}
                </>
              )}

              {/* Submit button */}
              <TouchableOpacity
                style={{
                  backgroundColor: submitBg(),
                  borderRadius: 14, height: 54,
                  alignItems: "center", justifyContent: "center",
                  flexDirection: "row", gap: 8,
                  marginTop: 4, marginBottom: 14,
                  shadowColor: submitBg(),
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 4,
                }}
                onPress={emailMode === "signin" ? handleSignIn : handleRegister}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Ionicons
                      name={emailMode === "signin" ? "arrow-forward" : "person-add"}
                      size={17}
                      color={submitTextColor()}
                    />
                }
                <Text style={{ color: submitTextColor(), fontWeight: "800", fontSize: 16 }}>
                  {loading ? t.auth.checking : emailMode === "signin" ? t.auth.signIn : t.auth.register}
                </Text>
              </TouchableOpacity>

              {/* Divider */}
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                <View style={{ flex: 1, height: 1, backgroundColor: c.border }} />
                <Text style={{ color: c.textMuted, marginHorizontal: 12, fontSize: 12 }}>{t.auth.or}</Text>
                <View style={{ flex: 1, height: 1, backgroundColor: c.border }} />
              </View>

              {/* Google button */}
              <TouchableOpacity
                style={{ backgroundColor: c.bg, borderRadius: 14, height: 50, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, borderWidth: 1.5, borderColor: c.border, marginBottom: 10 }}
                onPress={handleGoogleSignIn}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={c.primary} />
                ) : (
                  <Ionicons name="logo-google" size={18} color={c.text} />
                )}
                <Text style={{ color: c.text, fontWeight: "700", fontSize: 14 }}>
                  {loading ? t.auth.checking : "Google orqali kirish"}
                </Text>
              </TouchableOpacity>

              {/* Demo button */}
              <TouchableOpacity
                style={{ backgroundColor: c.bg, borderRadius: 14, height: 50, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, borderWidth: 1.5, borderColor: c.border }}
                onPress={enterDemo}
              >
                <Ionicons name="rocket" size={17} color={c.primaryDark} />
                <Text style={{ color: c.primaryDark, fontWeight: "700", fontSize: 14 }}>{t.auth.enterDemo}</Text>
              </TouchableOpacity>

              <Text style={{ color: c.textMuted, textAlign: "center", fontSize: 11, marginTop: 10 }}>
                {emailMode === "signin" ? t.auth.emailDemoHint : t.auth.registerDemoHint}
              </Text>

              {/* Trust badges */}
              <View style={{ marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: c.border, gap: 8 }}>
                {["Ma'lumotlaringiz xavfsiz", "Bepul foydalanish", "O'rnatish shart emas"].map((text) => (
                  <View key={text} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Ionicons name="checkmark-circle" size={14} color={c.primary} />
                    <Text style={{ color: c.textMuted, fontSize: 12 }}>{text}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
