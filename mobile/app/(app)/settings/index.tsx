import { View, Text, TouchableOpacity, ScrollView, Alert, Switch } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/authStore";
import { useLangStore } from "@/store/langStore";
import { useThemeStore } from "@/store/themeStore";
import { useRoleStore } from "@/store/roleStore";
import { useTheme } from "@/hooks/useTheme";
import { useT } from "@/hooks/useT";
import { Lang } from "@/i18n";

const LANGS: { code: Lang; label: string; native: string; flag: string }[] = [
  { code: "uz", label: "UZ", native: "O'zbek",  flag: "🇺🇿" },
  { code: "ru", label: "RU", native: "Русский", flag: "🇷🇺" },
  { code: "en", label: "EN", native: "English",  flag: "🇬🇧" },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { c } = useTheme();
  return (
    <View style={{ paddingHorizontal: 20, marginBottom: 8 }}>
      <Text style={{ color: c.textMuted, fontSize: 11, fontWeight: "700", letterSpacing: 1.5, marginBottom: 8, marginLeft: 4 }}>
        {title.toUpperCase()}
      </Text>
      <View style={{ backgroundColor: c.bgCard, borderRadius: 18, overflow: "hidden", borderWidth: 1, borderColor: c.border }}>
        {children}
      </View>
    </View>
  );
}

function Row({ iconName, label, sub, right, onPress, danger }: {
  iconName: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  sub?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  danger?: boolean;
}) {
  const { c } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14 }}
    >
      <View style={{ width: 38, height: 38, backgroundColor: danger ? "#FEE2E2" : c.bgMuted, borderRadius: 12, alignItems: "center", justifyContent: "center", marginRight: 12 }}>
        <Ionicons name={iconName} size={20} color={danger ? c.danger : c.textSub} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: danger ? c.danger : c.text, fontWeight: "700", fontSize: 14 }}>{label}</Text>
        {sub && <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 1 }}>{sub}</Text>}
      </View>
      {right}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const clearToken = useAuthStore((s) => s.clearToken);
  const { lang, setLang } = useLangStore();
  const { isDark, toggleTheme } = useThemeStore();
  const { role, setRole } = useRoleStore();
  const { c } = useTheme();
  const t = useT();

  function handleLogout() {
    Alert.alert(t.settings.logout, t.settings.logoutConfirm, [
      { text: t.products.cancel, style: "cancel" },
      { text: t.settings.logout, style: "destructive", onPress: () => clearToken() },
    ]);
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={{ backgroundColor: c.primary, paddingHorizontal: 20, paddingTop: 56, paddingBottom: 28, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, marginBottom: 24 }}>
        <Text style={{ color: "#fff", fontSize: 28, fontWeight: "800" }}>{t.settings.title}</Text>
        <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, marginTop: 4 }}>Savdo App v1.0.0</Text>
      </View>

      {/* Appearance */}
      <Section title={t.settings.appearance}>
        <Row
          iconName={isDark ? "moon" : "sunny"}
          label={isDark ? t.settings.dark : t.settings.light}
          sub={t.settings.themeToggle}
          right={
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: c.border, true: c.primary }}
              thumbColor="#fff"
            />
          }
        />
      </Section>

      {/* Language */}
      <Section title={t.settings.language}>
        {LANGS.map((l, idx) => (
          <View key={l.code}>
            <TouchableOpacity
              style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14 }}
              onPress={() => setLang(l.code)}
            >
              <View style={{ width: 38, height: 38, backgroundColor: c.bgMuted, borderRadius: 12, alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                <Text style={{ fontSize: 20 }}>{l.flag}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.text, fontWeight: "700", fontSize: 14 }}>{l.native}</Text>
                <Text style={{ color: c.textMuted, fontSize: 12 }}>{l.label}</Text>
              </View>
              {lang === l.code && (
                <View style={{ backgroundColor: c.primary, borderRadius: 10, padding: 4 }}>
                  <Ionicons name="checkmark" size={13} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
            {idx < LANGS.length - 1 && <View style={{ height: 1, backgroundColor: c.border, marginLeft: 66 }} />}
          </View>
        ))}
      </Section>

      {/* Analytics */}
      <Section title={t.reports.title}>
        <Row
          iconName="bar-chart"
          label={t.reports.title}
          sub={t.reports.totalRevenue}
          right={<Ionicons name="chevron-forward" size={18} color={c.textMuted} />}
          onPress={() => router.push("/(app)/reports")}
        />
      </Section>

      {/* Subscription */}
      <Section title={t.settings.subscription}>
        <Row
          iconName="card"
          label={t.settings.subscription}
          sub={`${t.subscription.free} — ${t.subscription.active}`}
          right={<Ionicons name="chevron-forward" size={18} color={c.textMuted} />}
          onPress={() => router.push("/(app)/settings/subscription")}
        />
      </Section>

      {/* Employees — vaqtincha yashirilgan, PIN flow + backend tayyor bo'lganda ochish */}
      {/* <Section title={t.employees.title}>
        <Row
          iconName="people"
          label={t.employees.title}
          sub={t.employees.currentRole + ": " + (role === "admin" ? t.employees.admin : t.employees.cashier)}
          right={<Ionicons name="chevron-forward" size={18} color={c.textMuted} />}
          onPress={() => router.push("/(app)/settings/employees")}
        />
        <View style={{ height: 1, backgroundColor: c.border, marginLeft: 66 }} />
        <Row
          iconName={role === "admin" ? "person" : "shield-checkmark"}
          label={role === "admin" ? t.employees.switchToCashier : t.employees.switchToAdmin}
          onPress={() => setRole(role === "admin" ? "cashier" : "admin")}
        />
      </Section> */}

      {/* Account */}
      <Section title={t.settings.account}>
        <Row iconName="log-out" label={t.settings.logout} danger onPress={handleLogout} />
      </Section>

      <Text style={{ color: c.textMuted, textAlign: "center", fontSize: 12, marginTop: 16, marginBottom: 40, opacity: 0.6 }}>
        Savdo App © 2024
      </Text>
    </ScrollView>
  );
}
