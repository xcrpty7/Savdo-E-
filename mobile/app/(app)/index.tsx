import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useT } from "@/hooks/useT";
import { useTodayStats } from "@/hooks/useSales";
import { useLowStockProducts } from "@/hooks/useProducts";
import { useTheme } from "@/hooks/useTheme";
import { useAuthStore } from "@/store/authStore";
import { SaleCard } from "@/components/SaleCard";
import { SyncStatus } from "@/components/SyncStatus";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

function decodeName(token: string | null): string {
  if (!token || token === "demo-token") return "";
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload?.name || payload?.email?.split("@")[0] || "";
  } catch {
    return "";
  }
}

const DAYS = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];
const MONTHS = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"];

function formatDate(d: Date) {
  return `${DAYS[d.getDay()]}, ${d.getDate()}-${MONTHS[d.getMonth()]}`;
}

export default function HomeScreen() {
  const t = useT();
  const { revenue, profit, count, sales } = useTodayStats();
  const lowStockProducts = useLowStockProducts();
  const { c } = useTheme();
  const token = useAuthStore((s) => s.token);
  const margin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;
  const userName = decodeName(token) || "Savdogar";
  const today = new Date();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} showsVerticalScrollIndicator={false}>

      {/* HEADER */}
      <View style={{
        backgroundColor: c.primary,
        paddingHorizontal: 20,
        paddingTop: 56,
        paddingBottom: 28,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Decorative wave blobs */}
        <View style={{ position: "absolute", top: -40, right: -30, width: 160, height: 160, borderRadius: 80, backgroundColor: "rgba(255,255,255,0.06)" }} />
        <View style={{ position: "absolute", bottom: 20, left: -20, width: 100, height: 100, borderRadius: 50, backgroundColor: "rgba(255,255,255,0.04)" }} />

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View>
            <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: "600", letterSpacing: 0.3 }}>
              {formatDate(today)}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
              <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="person" size={18} color="#fff" />
              </View>
              <Text style={{ color: "#fff", fontSize: 20, fontWeight: "700" }}>{userName}</Text>
            </View>
          </View>
          <SyncStatus />
        </View>

        <View style={{ marginTop: 20, alignItems: "center" }}>
          <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, letterSpacing: 1.5, fontWeight: "700" }}>
            {t.home.todayRevenue.toUpperCase()}
          </Text>
          <Text style={{ color: "#fff", fontSize: 40, fontWeight: "800", marginTop: 4, letterSpacing: -1 }}>
            {(revenue || 0).toLocaleString()}
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, marginTop: -2 }}>so'm</Text>
        </View>

        {/* Stats row */}
        <View style={{ flexDirection: "row", marginTop: 18, gap: 8 }}>
          <TouchableOpacity onPress={() => router.push("/reports")} style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 14, padding: 10, alignItems: "center", gap: 3 }}>
            <View style={{ width: 28, height: 28, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="trending-up" size={15} color="#fff" />
            </View>
            <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 9, fontWeight: "600" }}>{t.home.todayProfit.toUpperCase()}</Text>
            <Text style={{ color: "#fff", fontSize: 14, fontWeight: "800" }}>{(profit || 0).toLocaleString()}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/sales")} style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 14, padding: 10, alignItems: "center", gap: 3 }}>
            <View style={{ width: 28, height: 28, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="cart" size={15} color="#fff" />
            </View>
            <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 9, fontWeight: "600" }}>{t.nav.sales.toUpperCase()}</Text>
            <Text style={{ color: "#fff", fontSize: 14, fontWeight: "800" }}>{count}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/reports")} style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 14, padding: 10, alignItems: "center", gap: 3 }}>
            <View style={{ width: 28, height: 28, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="analytics" size={15} color="#fff" />
            </View>
            <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 9, fontWeight: "600" }}>{t.home.margin.toUpperCase()}</Text>
            <Text style={{ color: "#fff", fontSize: 14, fontWeight: "800" }}>{margin}%</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* QUICK ACTIONS */}
      <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
        <Text style={{ color: c.text, fontSize: 16, fontWeight: "800", marginBottom: 14 }}>{t.home.quickActions}</Text>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <TouchableOpacity
            onPress={() => router.push("/sales/add")}
            style={{
              flex: 1, backgroundColor: c.primary, borderRadius: 18, padding: 18, alignItems: "center",
              shadowColor: c.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
            }}
          >
            <View style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="cart" size={24} color="#fff" />
            </View>
            <Text style={{ color: "#fff", fontWeight: "700", marginTop: 10, fontSize: 13 }}>{t.home.addSale}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/products/add")}
            style={{
              flex: 1, backgroundColor: c.bgCard, borderRadius: 18, padding: 18, alignItems: "center",
              borderWidth: 1.5, borderColor: c.border,
              shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
            }}
          >
            <View style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: c.primary + "15", alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="cube" size={24} color={c.primary} />
            </View>
            <Text style={{ color: c.text, fontWeight: "700", marginTop: 10, fontSize: 13 }}>{t.home.addProduct}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* BUSINESS TOOLS */}
      <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
        <Text style={{ color: c.text, fontSize: 16, fontWeight: "800", marginBottom: 14 }}>{t.home.businessTools}</Text>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <TouchableOpacity
            onPress={() => router.push("/suppliers")}
            style={{ flex: 1, backgroundColor: c.bgCard, borderRadius: 18, padding: 16, alignItems: "center", borderWidth: 1, borderColor: c.border }}
          >
            <View style={{ width: 48, height: 48, backgroundColor: "#FEF3C7", borderRadius: 14, alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
              <Ionicons name="business" size={24} color={c.warn} />
            </View>
            <Text style={{ color: c.text, fontWeight: "700", fontSize: 13, textAlign: "center" }}>{t.suppliers.title}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/customers")}
            style={{ flex: 1, backgroundColor: c.bgCard, borderRadius: 18, padding: 16, alignItems: "center", borderWidth: 1, borderColor: c.border }}
          >
            <View style={{ width: 48, height: 48, backgroundColor: "#FEE2E2", borderRadius: 14, alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
              <Ionicons name="people" size={24} color={c.danger} />
            </View>
            <Text style={{ color: c.text, fontWeight: "700", fontSize: 13, textAlign: "center" }}>{t.customers.title}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* LOW STOCK ALERT */}
      {lowStockProducts.length > 0 && (
        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <View style={{ backgroundColor: c.bgCard, borderRadius: 18, overflow: "hidden", borderWidth: 1.5, borderColor: c.warn + "50" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: c.warn + "15", borderBottomWidth: 1, borderBottomColor: c.warn + "25" }}>
              <Ionicons name="warning" size={18} color={c.warn} />
              <Text style={{ color: c.warn, fontWeight: "800", fontSize: 14, flex: 1 }}>Kam qolgan tovarlar</Text>
              <View style={{ backgroundColor: c.warn, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 }}>
                <Text style={{ color: "#fff", fontSize: 11, fontWeight: "800" }}>{lowStockProducts.length}</Text>
              </View>
            </View>
            {lowStockProducts.slice(0, 5).map((p, idx) => (
              <TouchableOpacity
                key={p.id}
                onPress={() => router.push(`/products/${p.id}`)}
                style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: idx < Math.min(lowStockProducts.length, 5) - 1 ? 1 : 0, borderBottomColor: c.border }}
              >
                <Text style={{ color: c.text, fontWeight: "600", fontSize: 14, flex: 1 }} numberOfLines={1}>{p.name}</Text>
                <View style={{
                  borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
                  backgroundColor: p.stockQty === 0 ? c.danger + "18" : c.warn + "18",
                }}>
                  <Text style={{ color: p.stockQty === 0 ? c.danger : c.warn, fontWeight: "800", fontSize: 12 }}>
                    {p.stockQty === 0 ? "Tugadi" : `${p.stockQty} ${p.unit}`}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* RECENT SALES */}
      <View style={{ paddingHorizontal: 20, marginTop: 28, marginBottom: 40 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <Text style={{ color: c.text, fontSize: 16, fontWeight: "800" }}>{t.home.recentSales}</Text>
          <TouchableOpacity onPress={() => router.push("/sales")} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Text style={{ color: c.primary, fontSize: 13, fontWeight: "600" }}>{t.home.allSales}</Text>
            <Ionicons name="chevron-forward" size={14} color={c.primary} />
          </TouchableOpacity>
        </View>

        {sales.length === 0 ? (
          <View style={{ backgroundColor: c.bgCard, borderRadius: 18, padding: 36, alignItems: "center", borderWidth: 1, borderColor: c.border }}>
            <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: c.primary + "12", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
              <Ionicons name="cart" size={28} color={c.primary} />
            </View>
            <Text style={{ color: c.textMuted, fontSize: 15, fontWeight: "600" }}>{t.home.noSales}</Text>
            <Text style={{ color: c.textMuted, fontSize: 13, marginTop: 4, opacity: 0.7 }}>{t.home.firstSale}</Text>
          </View>
        ) : (
          sales.slice(0, 8).map((s) => <SaleCard key={s.id} sale={s} />)
        )}
      </View>
    </ScrollView>
  );
}
