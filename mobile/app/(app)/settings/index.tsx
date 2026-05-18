import { View, Text, TouchableOpacity, ScrollView, Alert, Switch } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/authStore";
import { useLangStore } from "@/store/langStore";
import { useThemeStore } from "@/store/themeStore";
import { useTheme } from "@/hooks/useTheme";
import { useT } from "@/hooks/useT";
import { useRoleStore } from "@/store/roleStore";
import { Lang } from "@/i18n";

const LANGS: { code: Lang; label: string; flag: string }[] = [
  { code: "uz", label: "O'zbek", flag: "🇺🇿" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "en", label: "English", flag: "🇬🇧" },
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

function Row({ iconName, iconBg, label, sub, right, onPress, danger }: {
  iconName: React.ComponentProps<typeof Ionicons>["name"];
  iconBg?: string;
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
      <View style={{ width: 38, height: 38, backgroundColor: danger ? "#FEE2E2" : (iconBg || c.bgMuted), borderRadius: 12, alignItems: "center", justifyContent: "center", marginRight: 12 }}>
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

function Divider() {
  const { c } = useTheme();
  return <View style={{ height: 1, backgroundColor: c.border, marginLeft: 66 }} />;
}

export default function ProfileScreen() {
  const clearToken = useAuthStore((s) => s.clearToken);
  const { lang, setLang } = useLangStore();
  const { isDark, toggleTheme } = useThemeStore();
  const { c } = useTheme();
  const t = useT();
  const { isAdmin } = useRoleStore();

  function handleLogout() {
    Alert.alert(t.settings.logout, t.settings.logoutConfirm, [
      { text: t.products.cancel, style: "cancel" },
      { text: t.settings.logout, style: "destructive", onPress: () => clearToken() },
    ]);
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} showsVerticalScrollIndicator={false}>

      {/* Profile Header */}
      <View style={{ backgroundColor: c.bg, paddingHorizontal: 20, paddingTop: 56, paddingBottom: 24 }}>
        <Text style={{ color: c.text, fontSize: 28, fontWeight: "800", marginBottom: 20 }}>{t.nav.profile}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 16, backgroundColor: c.bgCard, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: c.border }}>
          <View style={{ width: 64, height: 64, backgroundColor: c.primary + "20", borderRadius: 32, alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="person" size={30} color={c.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.text, fontWeight: "800", fontSize: 17 }}>Savdogar</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
              <View style={{ backgroundColor: c.primary + "18", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                <Text style={{ color: c.primary, fontSize: 11, fontWeight: "800" }}>
                  {isAdmin() ? "ADMIN" : "FREE"}
                </Text>
              </View>
              <Text style={{ color: c.textMuted, fontSize: 12 }}>v1.0.0</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={c.border} />
        </View>
      </View>

      {/* Appearance */}
      <Section title={t.settings.appearance}>
        <Row
          iconName={isDark ? "moon" : "sunny"}
          iconBg={isDark ? "#1E293B" : "#FEF9C3"}
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
              <Text style={{ flex: 1, color: c.text, fontWeight: "700", fontSize: 14 }}>{l.label}</Text>
              {lang === l.code && (
                <View style={{ backgroundColor: c.primary, borderRadius: 10, padding: 4 }}>
                  <Ionicons name="checkmark" size={13} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
            {idx < LANGS.length - 1 && <Divider />}
          </View>
        ))}
      </Section>

      {/* Business */}
      <Section title="Biznes">
        <Row
          iconName="bar-chart"
          iconBg="#EDE9FE"
          label={t.reports.title}
          sub={t.reports.totalRevenue}
          right={<Ionicons name="chevron-forward" size={18} color={c.textMuted} />}
          onPress={() => router.push("/reports")}
        />
        <Divider />
        <Row
          iconName="card"
          iconBg="#DBEAFE"
          label={t.settings.subscription}
          sub={`${t.subscription.free} — ${t.subscription.active}`}
          right={<Ionicons name="chevron-forward" size={18} color={c.textMuted} />}
          onPress={() => router.push("/settings/subscription")}
        />
      </Section>

      {/* Team */}
      <Section title={t.employees.title}>
        <Row
          iconName="people"
          iconBg="#D1FAE5"
          label={t.employees.title}
          sub={t.employees.add}
          right={<Ionicons name="chevron-forward" size={18} color={c.textMuted} />}
          onPress={() => router.push("/settings/employees")}
        />
      </Section>

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
