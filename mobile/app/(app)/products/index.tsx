import { View, Text, FlatList, TouchableOpacity, TextInput, Alert } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { useProducts } from "@/hooks/useProducts";
import { useT } from "@/hooks/useT";
import { useTheme } from "@/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { database } from "@/db";
import { Product } from "@/db/models/Product";

function stockInfo(qty: number, c: any): { color: string; label: string; bg: string } {
  if (qty === 0) return { color: c.danger, label: "Tugadi", bg: c.danger + "18" };
  if (qty <= 5)  return { color: c.warn,   label: `${qty} ta`, bg: c.warn + "18" };
  return             { color: c.primary, label: `${qty} ta`, bg: c.primary + "14" };
}

function handleProductOptions(item: Product, t: any, c: any) {
  Alert.alert(item.name, undefined, [
    {
      text: "Tahrirlash",
      onPress: () => router.push(`/(app)/products/${item.id}`),
    },
    {
      text: "O'chirish",
      style: "destructive",
      onPress: () =>
        Alert.alert(t.products.delete, "Bu tovarni butunlay o'chirmoqchimisiz?", [
          { text: t.products.cancel, style: "cancel" },
          {
            text: t.products.delete,
            style: "destructive",
            onPress: async () => {
              try {
                await database.write(async () => {
                  await item.destroyPermanently();
                });
              } catch {
                Alert.alert(t.common.error, "O'chirishda xato");
              }
            },
          },
        ]),
    },
    { text: t.products.cancel, style: "cancel" },
  ]);
}

export default function ProductsScreen() {
  const [search, setSearch] = useState("");
  const products = useProducts(search);
  const t = useT();
  const { c } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      {/* Header */}
      <View style={{ backgroundColor: c.bg, paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12 }}>
        <Text style={{ color: c.text, fontSize: 28, fontWeight: "800", marginBottom: 14 }}>{t.products.title}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: c.bgCard, borderRadius: 14, paddingHorizontal: 14, borderWidth: 1, borderColor: c.border }}>
          <Ionicons name="search" size={17} color={c.textMuted} />
          <TextInput
            style={{ flex: 1, height: 46, marginLeft: 10, fontSize: 15, color: c.text }}
            placeholder={t.products.search}
            placeholderTextColor={c.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <FlatList
        data={products}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100, paddingTop: 8 }}
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingTop: 80 }}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>📦</Text>
            <Text style={{ color: c.textMuted, fontSize: 16, fontWeight: "600" }}>{t.products.noProducts}</Text>
          </View>
        }
        renderItem={({ item }) => {
          const stock = stockInfo(item.stockQty, c);
          return (
            <TouchableOpacity
              style={{ backgroundColor: c.bgCard, borderRadius: 18, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: c.border }}
              onPress={() => router.push(`/(app)/products/${item.id}`)}
              onLongPress={() => handleProductOptions(item, t, c)}
              delayLongPress={400}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={{ color: c.text, fontWeight: "800", fontSize: 16 }}>{item.name}</Text>
                  {/* Stock badge */}
                  <View style={{ flexDirection: "row", alignItems: "center", marginTop: 5, gap: 5 }}>
                    <View style={{ backgroundColor: stock.bg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: stock.color }} />
                      <Text style={{ color: stock.color, fontSize: 12, fontWeight: "700" }}>
                        {item.stockQty === 0 ? "Tugadi" : stock.label} {item.stockQty > 0 ? item.unit : ""}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={{ alignItems: "flex-end", gap: 4 }}>
                  <View style={{ backgroundColor: c.bgMuted, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 }}>
                    <Text style={{ color: c.primary, fontWeight: "800", fontSize: 13 }}>
                      {item.sellPrice.toLocaleString()} so'm
                    </Text>
                  </View>
                  {/* Options button */}
                  <TouchableOpacity
                    onPress={() => handleProductOptions(item, t, c)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="ellipsis-horizontal" size={18} color={c.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={{ height: 1, backgroundColor: c.border, marginVertical: 12 }} />

              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <View>
                  <Text style={{ color: c.textMuted, fontSize: 11, fontWeight: "600" }}>{t.products.buyLabel.toUpperCase()}</Text>
                  <Text style={{ color: c.text, fontWeight: "700", fontSize: 13 }}>{item.buyPrice.toLocaleString()}</Text>
                </View>
                <View style={{ alignItems: "center" }}>
                  <Text style={{ color: c.textMuted, fontSize: 11, fontWeight: "600" }}>{t.products.sellLabel.toUpperCase()}</Text>
                  <Text style={{ color: c.text, fontWeight: "700", fontSize: 13 }}>{item.sellPrice.toLocaleString()}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                    <Ionicons name="trending-up" size={11} color={c.primary} />
                    <Text style={{ color: c.textMuted, fontSize: 11, fontWeight: "600" }}>{t.products.profitLabel.toUpperCase()}</Text>
                  </View>
                  <Text style={{ color: c.primary, fontWeight: "800", fontSize: 14 }}>+{item.profit.toLocaleString()}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      <TouchableOpacity
        style={{ position: "absolute", bottom: 28, right: 20, backgroundColor: c.primary, width: 58, height: 58, borderRadius: 29, alignItems: "center", justifyContent: "center", shadowColor: c.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8 }}
        onPress={() => router.push("/(app)/products/add")}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}
