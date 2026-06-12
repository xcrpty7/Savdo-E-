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
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../store/ThemeContext';
import { generateId } from '../utils/uuid';
import { format } from 'date-fns';
import { SIZES } from '../constants/theme';
import { formatPrice } from '../utils/formatPrice';
import { getSettings } from '../store/settingsStore';
import { getAllProducts, searchProducts, updateProductQuantity } from '../database/productQueries';
import { createSale } from '../database/saleQueries';
import { addToSyncQueue } from '../database/syncQueries';

export default function NewSaleScreen({ navigation }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
      return () => {};
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
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const clearSelection = () => {
    setSelectedProduct(null);
    setQuantity('1');
    setNote('');
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  const qty = parseFloat(quantity) || 0;
  const revenue = selectedProduct ? qty * Number(selectedProduct.sellPrice) : 0;
  const cost = selectedProduct ? qty * Number(selectedProduct.buyPrice) : 0;
  const profit = revenue - cost;

  const handleConfirmSale = async () => {
    if (!selectedProduct) return;
    if (qty <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid quantity greater than 0.');
      return;
    }
    if (qty > Number(selectedProduct.quantity)) {
      Alert.alert(
        'Insufficient Stock',
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
        serverId: null,
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
      await addToSyncQueue('update', 'product', selectedProduct.id, {
        ...selectedProduct,
        quantity: newQty,
        updatedAt: now,
      });

      Alert.alert(
        t('sale.saleSuccess'),
        `${selectedProduct.name}\n${qty} x ${formatPrice(Number(selectedProduct.sellPrice), currency)}\n${t('dashboard.profit')}: ${formatPrice(profit, currency)}`,
        [
          {
            text: t('dashboard.newSale'),
            onPress: () => {
              clearSelection();
              setSearchQuery('');
              loadProducts('');
            },
          },
          {
            text: t('dashboard.title'),
            onPress: () => navigation.navigate('Dashboard'),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to record sale. Please try again.');
      console.error('handleConfirmSale error:', error);
    } finally {
      setSaving(false);
    }
  };

  const getStockColor = (qty) => {
    if (qty <= 0) return colors.danger;
    if (qty <= 5) return colors.warning;
    return colors.accent;
  };

  const renderProduct = ({ item }) => {
    const isSelected = selectedProduct?.id === item.id;
    const outOfStock = Number(item.quantity) <= 0;
    return (
      <TouchableOpacity
        style={[
          styles.productItem,
          { backgroundColor: colors.card, borderColor: colors.border },
          isSelected && { borderColor: colors.accent, backgroundColor: colors.background },
          outOfStock && styles.productItemDisabled,
        ]}
        onPress={() => !outOfStock && selectProduct(item)}
        disabled={outOfStock}
        activeOpacity={0.7}
      >
        <View style={styles.productItemLeft}>
          <View style={[styles.productDot, { backgroundColor: getStockColor(item.quantity) }]} />
          <View>
            <Text style={styles.productItemName} numberOfLines={1}>{item.name}</Text>
            <Text style={[styles.productItemPrice, { color: colors.accent }]}>{formatPrice(item.sellPrice, currency)}</Text>
          </View>
        </View>
        <View style={styles.productItemRight}>
          <Text style={[styles.productItemStock, { color: getStockColor(item.quantity) }]}>
            {Number(item.quantity).toFixed(0)} {item.unit}
          </Text>
          {isSelected && (
            <Ionicons name="checkmark-circle" size={18} color={colors.accent} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.searchSection}>
        <View style={[styles.searchWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="search-outline" size={20} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('sale.selectProduct')}
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={handleSearch}
            autoFocus={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {!selectedProduct ? (
        loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.accent} size="large" />
          </View>
        ) : products.length === 0 ? (
          <View style={styles.centered}>
            <Ionicons name="cube-outline" size={56} color={colors.border} />
            <Text style={styles.emptyText}>{t('dashboard.noProductsSearch')}</Text>
            <Text style={styles.emptySubText}>Add products first from the Products screen</Text>
          </View>
        ) : (
          <FlatList
            data={products}
            keyExtractor={(item) => item.id}
            renderItem={renderProduct}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
        )
      ) : (
        <Animated.View style={[styles.salePanel, { opacity: fadeAnim }]}>
          <View style={[styles.selectedHeader, { backgroundColor: colors.card, borderColor: colors.accent }]}>
            <View style={styles.selectedInfo}>
              <View style={[styles.selectedIconBg, { backgroundColor: colors.background }]}>
                <Ionicons name="cube" size={22} color={colors.accent} />
              </View>
              <View>
                <Text style={styles.selectedName}>{selectedProduct.name}</Text>
                <Text style={styles.selectedStock}>
                  {t('products.stock')}: {Number(selectedProduct.quantity).toFixed(0)} {selectedProduct.unit}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={clearSelection} style={[styles.changeBtn, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={styles.changeBtnText}>{t('common.edit')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.qtySection}>
            <Text style={styles.qtyLabel}>{t('sale.quantity')}</Text>
            <View style={styles.qtyRow}>
              <TouchableOpacity
                style={[styles.qtyBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => setQuantity(v => String(Math.max(1, (parseFloat(v) || 1) - 1)))}
              >
                <Ionicons name="remove" size={22} color={colors.text} />
              </TouchableOpacity>
              <TextInput
                style={[styles.qtyInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="decimal-pad"
                textAlign="center"
                selectTextOnFocus
              />
              <TouchableOpacity
                style={[styles.qtyBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => {
                  const max = Number(selectedProduct.quantity);
                  setQuantity(v => String(Math.min(max, (parseFloat(v) || 0) + 1)));
                }}
              >
                <Ionicons name="add" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.calcCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>{t('products.sellPrice')}</Text>
              <Text style={styles.calcValue}>{formatPrice(selectedProduct.sellPrice, currency)}</Text>
            </View>
            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>{t('sale.total')}</Text>
              <Text style={styles.calcValue}>{formatPrice(revenue, currency)}</Text>
            </View>
            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>{t('products.buyPrice')}</Text>
              <Text style={styles.calcValue}>{formatPrice(cost, currency)}</Text>
            </View>
            <View style={[styles.calcRow, styles.calcRowAccent, { borderTopColor: colors.border }]}>
              <Text style={styles.calcLabelBig}>{t('dashboard.profit')}</Text>
              <Text style={[styles.calcProfit, { color: colors.accent }]}>{formatPrice(profit, currency)}</Text>
            </View>
          </View>

          <TextInput
            style={[styles.noteInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
            placeholder={t('sale.note')}
            placeholderTextColor={colors.textMuted}
            value={note}
            onChangeText={setNote}
            maxLength={120}
          />

          <TouchableOpacity
            style={[styles.confirmButton, { backgroundColor: colors.accent }, saving && styles.confirmButtonDisabled]}
            onPress={handleConfirmSale}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={22} color="#fff" />
                <Text style={styles.confirmButtonText}>{t('sale.complete')}</Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
      )}
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchSection: {
    padding: 16,
    paddingBottom: 8,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 52,
    color: colors.text,
    fontSize: SIZES.base,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: SIZES.base,
    fontWeight: '600',
  },
  emptySubText: {
    color: colors.textMuted,
    fontSize: SIZES.sm,
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  productItem: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  productItemDisabled: {
    opacity: 0.4,
  },
  productItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  productDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  productItemName: {
    color: colors.text,
    fontSize: SIZES.base,
    fontWeight: '600',
    maxWidth: 180,
  },
  productItemPrice: {
    fontSize: SIZES.sm,
    fontWeight: '500',
    marginTop: 2,
  },
  productItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  productItemStock: {
    fontSize: SIZES.sm,
    fontWeight: '600',
  },
  salePanel: {
    flex: 1,
    padding: 16,
  },
  selectedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  selectedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  selectedIconBg: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedName: {
    color: colors.text,
    fontSize: SIZES.base,
    fontWeight: '700',
    maxWidth: 200,
  },
  selectedStock: {
    color: colors.textMuted,
    fontSize: SIZES.sm,
    marginTop: 2,
  },
  changeBtn: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
  },
  changeBtnText: {
    color: colors.textMuted,
    fontSize: SIZES.sm,
    fontWeight: '600',
  },
  qtySection: {
    marginBottom: 16,
  },
  qtyLabel: {
    color: colors.textMuted,
    fontSize: SIZES.sm,
    fontWeight: '500',
    marginBottom: 8,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  qtyBtn: {
    width: 48,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyInput: {
    flex: 1,
    height: 52,
    borderWidth: 1,
    borderRadius: 10,
    fontSize: SIZES.xxl,
    fontWeight: '700',
    textAlign: 'center',
  },
  calcCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  calcRowAccent: {
    borderTopWidth: 1,
    marginTop: 6,
    paddingTop: 12,
  },
  calcLabel: {
    color: colors.textMuted,
    fontSize: SIZES.md,
  },
  calcValue: {
    color: colors.text,
    fontSize: SIZES.md,
    fontWeight: '600',
  },
  calcLabelBig: {
    color: colors.text,
    fontSize: SIZES.base,
    fontWeight: '700',
  },
  calcProfit: {
    fontSize: SIZES.xl,
    fontWeight: '700',
  },
  noteInput: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 46,
    fontSize: SIZES.md,
    marginBottom: 16,
  },
  confirmButton: {
    borderRadius: 14,
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: SIZES.lg,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
