import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useT } from "@/hooks/useT";
import { useTodayStats } from "@/hooks/useSales";
import { useLowStockProducts } from "@/hooks/useProducts";
import { useTheme } from "@/hooks/useTheme";
import { SaleCard } from "@/components/SaleCard";
import { SyncStatus } from "@/components/SyncStatus";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function HomeScreen() {
  const t = useT();
  const { revenue, profit, count, sales } = useTodayStats();
  const lowStockProducts = useLowStockProducts();
  const { c } = useTheme();
  const margin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} showsVerticalScrollIndicator={false}>

      {/* HEADER */}
      <View style={{ backgroundColor: c.primary, paddingHorizontal: 20, paddingTop: 56, paddingBottom: 32, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View>
            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: "600" }}>
              {new Date().toLocaleDateString("uz", { weekday: "long", day: "numeric", month: "long" })}
            </Text>
            <Text style={{ color: "#fff", fontSize: 24, fontWeight: "800", marginTop: 2 }}>{t.home.greeting}</Text>
          </View>
          <SyncStatus />
        </View>

        <View style={{ marginTop: 24, alignItems: "center" }}>
          <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, letterSpacing: 2, fontWeight: "700" }}>{t.home.todayRevenue.toUpperCase()}</Text>
          <Text style={{ color: "#fff", fontSize: 44, fontWeight: "800", marginTop: 4, letterSpacing: -1 }}>
            {revenue.toLocaleString()}
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 14 }}>so'm</Text>
        </View>

        <View style={{ flexDirection: "row", marginTop: 20, gap: 10 }}>
          <View style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 14, padding: 12, alignItems: "center" }}>
            <Ionicons name="trending-up" size={20} color="#fff" />
            <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 10, marginTop: 4, fontWeight: "600" }}>{t.home.todayProfit.toUpperCase()}</Text>
            <Text style={{ color: "#fff", fontSize: 15, fontWeight: "800" }}>{profit.toLocaleString()}</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 14, padding: 12, alignItems: "center" }}>
            <Ionicons name="cart" size={20} color="#fff" />
            <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 10, marginTop: 4, fontWeight: "600" }}>{t.nav.sales.toUpperCase()}</Text>
            <Text style={{ color: "#fff", fontSize: 15, fontWeight: "800" }}>{count}</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 14, padding: 12, alignItems: "center" }}>
            <Ionicons name="analytics" size={20} color="#fff" />
            <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 10, marginTop: 4, fontWeight: "600" }}>{t.home.margin.toUpperCase()}</Text>
            <Text style={{ color: "#fff", fontSize: 15, fontWeight: "800" }}>{margin}%</Text>
          </View>
        </View>
      </View>

      {/* QUICK ACTIONS */}
      <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
        <Text style={{ color: c.text, fontSize: 16, fontWeight: "800", marginBottom: 12 }}>{t.home.quickActions}</Text>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <TouchableOpacity
            onPress={() => router.push("/sales/add")}
            style={{ flex: 1, backgroundColor: c.primary, borderRadius: 18, padding: 18, alignItems: "center" }}
          >
            <Ionicons name="cart" size={30} color="#fff" />
            <Text style={{ color: "#fff", fontWeight: "700", marginTop: 8, fontSize: 13 }}>{t.home.addSale}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/products/add")}
            style={{ flex: 1, backgroundColor: c.bgCard, borderRadius: 18, padding: 18, alignItems: "center", borderWidth: 1.5, borderColor: c.border }}
          >
            <Ionicons name="cube" size={30} color={c.primary} />
            <Text style={{ color: c.text, fontWeight: "700", marginTop: 8, fontSize: 13 }}>{t.home.addProduct}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* BUSINESS TOOLS */}
      <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
        <Text style={{ color: c.text, fontSize: 16, fontWeight: "800", marginBottom: 12 }}>{t.home.businessTools}</Text>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <TouchableOpacity
            onPress={() => router.push("/suppliers")}
            style={{ flex: 1, backgroundColor: c.bgCard, borderRadius: 18, padding: 16, alignItems: "center", borderWidth: 1, borderColor: c.border }}
          >
            <View style={{ width: 48, height: 48, backgroundColor: "#FEF3C7", borderRadius: 14, alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
              <Ionicons name="business" size={24} color={c.warn} />
            </View>
            <Text style={{ color: c.text, fontWeight: "700", fontSize: 13, textAlign: "center" }}>{t.suppliers.title}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/customers")}
            style={{ flex: 1, backgroundColor: c.bgCard, borderRadius: 18, padding: 16, alignItems: "center", borderWidth: 1, borderColor: c.border }}
          >
            <View style={{ width: 48, height: 48, backgroundColor: "#FEE2E2", borderRadius: 14, alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
              <Ionicons name="people" size={24} color={c.danger} />
            </View>
            <Text style={{ color: c.text, fontWeight: "700", fontSize: 13, textAlign: "center" }}>{t.customers.title}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* LOW STOCK ALERT */}
      {lowStockProducts.length > 0 && (
        <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
          <View style={{ backgroundColor: c.bgCard, borderRadius: 18, overflow: "hidden", borderWidth: 1.5, borderColor: c.warn + "50" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: c.warn + "15", borderBottomWidth: 1, borderBottomColor: c.warn + "30" }}>
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
      <View style={{ paddingHorizontal: 20, marginTop: 28, marginBottom: 32 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <Text style={{ color: c.text, fontSize: 16, fontWeight: "800" }}>{t.home.recentSales}</Text>
          <TouchableOpacity onPress={() => router.push("/sales")} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Text style={{ color: c.primary, fontSize: 13, fontWeight: "600" }}>{t.home.allSales}</Text>
            <Ionicons name="chevron-forward" size={14} color={c.primary} />
          </TouchableOpacity>
        </View>

        {sales.length === 0 ? (
          <View style={{ backgroundColor: c.bgCard, borderRadius: 18, padding: 36, alignItems: "center", borderWidth: 1, borderColor: c.border }}>
            <Ionicons name="cart" size={40} color={c.border} style={{ marginBottom: 10 }} />
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
