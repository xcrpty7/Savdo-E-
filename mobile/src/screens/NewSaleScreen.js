import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
  SafeAreaView
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../store/ThemeContext';
import { generateId } from '../utils/uuid';
import { SIZES, FONTS, COLORS } from '../constants/theme';
import { formatPrice } from '../utils/formatPrice';
import { getSettings } from '../store/settingsStore';
import { getAllProducts, searchProducts, updateProductQuantity } from '../database/productQueries';
import { createSale } from '../database/saleQueries';
import { addToSyncQueue } from '../database/syncQueries';
import { isOnline } from '../services/syncService';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

export default function NewSaleScreen({ navigation }) {
  const { t } = useTranslation();
  const { colors, themeId } = useTheme();
  
  const isDark = themeId === 'pos-dark'; 

  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState('1');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [currency, setCurrency] = useState('UZS');

  useEffect(() => {
    const load = async () => {
      const s = await getSettings();
      setCurrency(s.currency || 'UZS');
    };
    load();
  }, []);

  const loadProducts = useCallback(async (query = '') => {
    try {
      const data = query.trim()
        ? await searchProducts(query.trim())
        : await getAllProducts();
      setProducts(data);
    } catch (error) {
      console.error('loadProducts error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      setSelectedProduct(null);
      setQuantity('1');
      setNote('');
      setSearchQuery('');
      loadProducts('');
    }, [loadProducts])
  );

  const handleSearch = (text) => {
    setSearchQuery(text);
    loadProducts(text);
  };

  const selectProduct = (product) => {
    setSelectedProduct(product);
    setQuantity('1');
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const clearSelection = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setSelectedProduct(null);
      setQuantity('1');
      setNote('');
    });
  };

  const qty = parseFloat(quantity) || 0;
  const revenue = selectedProduct ? qty * Number(selectedProduct.sellPrice) : 0;
  const cost = selectedProduct ? qty * Number(selectedProduct.buyPrice) : 0;
  const profit = revenue - cost;

  const handleConfirmSale = async () => {
    if (!selectedProduct) return;
    if (qty <= 0) {
      Alert.alert('Xatolik', 'Miqdorni to\'g\'ri kiriting');
      return;
    }

    const online = await isOnline();
    if (!online) {
      Alert.alert('Internet yo\'q', 'Sotuvni amalga oshirish uchun internet tarmog\'iga ulaning. (Offline rejim vaqtincha o\'chirilgan)');
      return;
    }

    if (qty > Number(selectedProduct.quantity)) {
      Alert.alert(
        'Omborda yetarli emas',
        `${t('products.stock')}: ${Number(selectedProduct.quantity).toFixed(0)} ${selectedProduct.unit}`
      );
      return;
    }

    setSaving(true);
    try {
      const saleId = generateId();
      const now = new Date().toISOString();
      const newQty = Number(selectedProduct.quantity) - qty;

      const sale = {
        id: saleId,
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        quantity: qty,
        sellPrice: Number(selectedProduct.sellPrice),
        buyPrice: Number(selectedProduct.buyPrice),
        totalRevenue: revenue,
        totalCost: cost,
        profit,
        note: note.trim(),
        createdAt: now,
        synced: 0,
      };

      await createSale(sale);
      await updateProductQuantity(selectedProduct.id, newQty);
      await addToSyncQueue('create', 'sale', saleId, sale);
      
      Alert.alert(
        t('sale.saleSuccess'),
        `${selectedProduct.name}\n${qty} x ${formatPrice(Number(selectedProduct.sellPrice), currency)}`,
        [
          { text: 'Yangi sotuv', onPress: clearSelection },
          { text: 'Dashboard', onPress: () => navigation.navigate('Dashboard') }
        ]
      );
    } catch (error) {
      Alert.alert('Xatolik', 'Sotuvni saqlab bo\'lmadi');
    } finally {
      setSaving(false);
    }
  };

  const renderProduct = ({ item }) => {
    const outOfStock = Number(item.quantity) <= 0;
    return (
      <TouchableOpacity
        style={[styles.productCard, { backgroundColor: colors.card, borderColor: colors.border }, outOfStock && { opacity: 0.5 }]}
        onPress={() => !outOfStock && selectProduct(item)}
        disabled={outOfStock}
      >
        <View style={styles.productInfo}>
          <Text style={[styles.productName, { color: colors.text }]} numberOfLines={2}>{item.name}</Text>
          <Text style={[styles.productPrice, { color: colors.accent }]}>{formatPrice(item.sellPrice, currency)}</Text>
        </View>
        <View style={styles.productFooter}>
          <Text style={[styles.productStock, { color: outOfStock ? colors.danger : colors.accent }]}>
            {Number(item.quantity).toFixed(0)} {item.unit}
          </Text>
          <Ionicons name="add-circle" size={24} color={colors.accent} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.background }]}>
          <Ionicons name="search" size={20} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Mahsulot qidirish..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={renderProduct}
          numColumns={2}
          contentContainerStyle={styles.productList}
          columnWrapperStyle={styles.productRow}
          showsVerticalScrollIndicator={false}
        />
      )}

      {selectedProduct && (
        <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>{selectedProduct.name}</Text>
                <Text style={[styles.modalSubTitle, { color: colors.textMuted }]}>{formatPrice(selectedProduct.sellPrice, currency)} / {selectedProduct.unit}</Text>
              </View>
              <TouchableOpacity onPress={clearSelection}>
                <Ionicons name="close-circle" size={32} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.qtyContainer}>
              <Text style={[styles.label, { color: colors.textMuted }]}>Miqdori</Text>
              <View style={styles.qtyControls}>
                <TouchableOpacity 
                  style={[styles.qtyBtn, { backgroundColor: colors.border }]} 
                  onPress={() => setQuantity(v => String(Math.max(1, (parseFloat(v) || 1) - 1)))}
                >
                  <Ionicons name="remove" size={28} color={colors.text} />
                </TouchableOpacity>
                <TextInput
                  style={[styles.qtyInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="decimal-pad"
                  textAlign="center"
                />
                <TouchableOpacity 
                  style={[styles.qtyBtn, { backgroundColor: colors.border }]} 
                  onPress={() => setQuantity(v => String((parseFloat(v) || 0) + 1))}
                >
                  <Ionicons name="add" size={28} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.summaryCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Jami summa:</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>{formatPrice(revenue, currency)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Foyda:</Text>
                <Text style={[styles.summaryValue, { color: colors.accent }]}>+{formatPrice(profit, currency)}</Text>
              </View>
            </View>

            <TextInput
              style={[styles.noteInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="Izoh (ixtiyoriy)..."
              placeholderTextColor={colors.textMuted}
              value={note}
              onChangeText={setNote}
            />

            <Button
              title="Sotuvni tasdiqlash"
              onPress={handleConfirmSale}
              loading={saving}
              variant={isDark ? "pos" : "primary"}
              style={{ height: 56, borderRadius: 16 }}
            />
          </View>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.pos.bg,
  },
  header: {
    padding: 16,
    backgroundColor: COLORS.pos.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.pos.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.pos.bg,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    color: '#fff',
    fontSize: 16,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productList: {
    padding: 12,
    paddingBottom: 100,
  },
  productRow: {
    justifyContent: 'space-between',
  },
  productCard: {
    backgroundColor: COLORS.pos.card,
    borderRadius: 16,
    padding: 12,
    width: '48%',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.pos.border,
    justifyContent: 'space-between',
    minHeight: 120,
  },
  productInfo: {
    marginBottom: 8,
  },
  productName: {
    color: '#fff',
    fontSize: 14,
    ...FONTS.semibold,
  },
  productPrice: {
    color: COLORS.pos.accent,
    fontSize: 15,
    ...FONTS.bold,
    marginTop: 4,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productStock: {
    fontSize: 12,
    ...FONTS.medium,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.pos.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    ...FONTS.bold,
  },
  modalSubTitle: {
    color: COLORS.pos.muted,
    fontSize: 14,
    marginTop: 4,
  },
  qtyContainer: {
    marginBottom: 24,
  },
  label: {
    color: COLORS.pos.muted,
    fontSize: 14,
    marginBottom: 12,
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  qtyBtn: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.pos.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyInput: {
    flex: 1,
    height: 56,
    backgroundColor: COLORS.pos.bg,
    borderRadius: 16,
    color: '#fff',
    fontSize: 24,
    ...FONTS.bold,
    borderWidth: 1,
    borderColor: COLORS.pos.border,
  },
  summaryCard: {
    backgroundColor: COLORS.pos.bg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.pos.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    color: COLORS.pos.muted,
    fontSize: 14,
  },
  summaryValue: {
    color: '#fff',
    fontSize: 16,
    ...FONTS.bold,
  },
  noteInput: {
    backgroundColor: COLORS.pos.bg,
    borderRadius: 12,
    padding: 12,
    color: '#fff',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.pos.border,
  }
});
