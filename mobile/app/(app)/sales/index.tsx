import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { useSales } from "@/hooks/useSales";
import { useT } from "@/hooks/useT";
import { useTheme } from "@/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";

type Filter = "today" | "week" | "month";

export default function SalesScreen() {
  const [filter, setFilter] = useState<Filter>("today");
  const sales = useSales(filter);
  const t = useT();
  const { c } = useTheme();

  const totalRevenue = sales.reduce((s, x) => s + x.totalAmount, 0);
  const totalProfit = sales.reduce((s, x) => s + x.profit, 0);

  const FILTERS: { key: Filter; label: string }[] = [
    { key: "today", label: t.sales.filters.today },
    { key: "week", label: t.sales.filters.week },
    { key: "month", label: t.sales.filters.month },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ backgroundColor: c.bg, paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12 }}>
        <Text style={{ color: c.text, fontSize: 28, fontWeight: "800", marginBottom: 14 }}>{t.sales.title}</Text>

        {/* Filter */}
        <View style={{ flexDirection: "row", backgroundColor: c.bgMuted, borderRadius: 14, padding: 4 }}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={{ flex: 1, paddingVertical: 8, borderRadius: 11, backgroundColor: filter === f.key ? c.primary : "transparent", alignItems: "center" }}
            >
              <Text style={{ color: filter === f.key ? "#fff" : c.textSub, fontSize: 13, fontWeight: "700" }}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary */}
        {sales.length > 0 && (
          <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
            <View style={{ flex: 1, backgroundColor: c.bgCard, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: c.border }}>
              <Text style={{ color: c.textMuted, fontSize: 11, fontWeight: "600" }}>{t.sales.revenue.toUpperCase()}</Text>
              <Text style={{ color: c.text, fontWeight: "800", fontSize: 16, marginTop: 2 }}>{totalRevenue.toLocaleString()} so'm</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: c.primary, borderRadius: 14, padding: 14 }}>
              <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: "600" }}>{t.sales.netProfit.toUpperCase()}</Text>
              <Text style={{ color: "#fff", fontWeight: "800", fontSize: 16, marginTop: 2 }}>{totalProfit.toLocaleString()} so'm</Text>
            </View>
          </View>
        )}
      </View>

      <FlatList
        data={sales}
        keyExtractor={(s) => s.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100, paddingTop: 8 }}
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingTop: 80 }}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>🛒</Text>
            <Text style={{ color: c.textMuted, fontSize: 16, fontWeight: "600" }}>{t.sales.noSales}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={{ backgroundColor: c.bgCard, borderRadius: 16, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: c.border }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ color: c.text, fontWeight: "700", fontSize: 15, flex: 1 }}>{item.productName}</Text>
              <Text style={{ color: c.primary, fontWeight: "800", fontSize: 15 }}>+{item.profit.toLocaleString()} so'm</Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 6 }}>
              <Text style={{ color: c.textMuted, fontSize: 13 }}>{item.qty} × {item.sellPrice.toLocaleString()} so'm</Text>
              <Text style={{ color: c.textMuted, fontSize: 13 }}>
                {new Date(item.soldAt).toLocaleTimeString("uz", { hour: "2-digit", minute: "2-digit" })}
              </Text>
            </View>
            {!item.isSynced && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 }}>
                <Ionicons name="time" size={12} color={c.warn} />
                <Text style={{ color: c.warn, fontSize: 11 }}>{t.sales.syncing}</Text>
              </View>
            )}
          </View>
        )}
      />

      <TouchableOpacity
        style={{ position: "absolute", bottom: 28, right: 20, backgroundColor: c.primary, width: 58, height: 58, borderRadius: 29, alignItems: "center", justifyContent: "center", shadowColor: c.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8 }}
        onPress={() => router.push("/(app)/sales/add")}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}
