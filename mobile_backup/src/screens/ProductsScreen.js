import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../store/ThemeContext';
import { generateId } from '../utils/uuid';
import { SIZES } from '../constants/theme';
import { formatPrice } from '../utils/formatPrice';
import { getSettings } from '../store/settingsStore';
import { getAllProducts, upsertProduct, deleteProduct, searchProducts } from '../database/productQueries';
import { addToSyncQueue } from '../database/syncQueries';

const UNITS = ['pcs', 'kg', 'L', 'box'];

const emptyForm = {
  name: '',
  buyPrice: '',
  sellPrice: '',
  quantity: '',
  unit: 'pcs',
};

export default function ProductsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [detailModal, setDetailModal] = useState(null);
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
      loadProducts(searchQuery);
    }, [loadProducts])
  );

  const handleSearch = (text) => {
    setSearchQuery(text);
    loadProducts(text);
  };

  const openAddModal = () => {
    setEditProduct(null);
    setForm(emptyForm);
    setModalVisible(true);
  };

  const openEditModal = (product) => {
    setDetailModal(null);
    setEditProduct(product);
    setForm({
      name: product.name,
      buyPrice: String(product.buyPrice),
      sellPrice: String(product.sellPrice),
      quantity: String(product.quantity),
      unit: product.unit || 'pcs',
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.buyPrice || !form.sellPrice || !form.quantity) {
      Alert.alert(t('common.error'), 'Please fill in all required fields.');
      return;
    }
    setSaving(true);
    try {
      const now = new Date().toISOString();
      const product = {
        id: editProduct ? editProduct.id : generateId(),
        serverId: editProduct?.serverId || null,
        name: form.name.trim(),
        buyPrice: parseFloat(form.buyPrice),
        sellPrice: parseFloat(form.sellPrice),
        quantity: parseFloat(form.quantity),
        unit: form.unit,
        updatedAt: now,
        synced: 0,
      };

      await upsertProduct(product);
      await addToSyncQueue(
        editProduct ? 'update' : 'create',
        'product',
        product.id,
        product
      );

      setModalVisible(false);
      await loadProducts(searchQuery);
    } catch (error) {
      Alert.alert(t('common.error'), 'Failed to save product.');
      console.error('handleSave error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product) => {
    Alert.alert(
      t('common.delete'),
      t('products.deleteConfirm', { name: product.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProduct(product.id);
              await addToSyncQueue('delete', 'product', product.id, { id: product.id });
              setDetailModal(null);
              await loadProducts(searchQuery);
            } catch (error) {
              Alert.alert(t('common.error'), 'Failed to delete product.');
            }
          },
        },
      ]
    );
  };

  const getStockColor = (qty) => {
    if (qty <= 0) return colors.danger;
    if (qty <= 5) return colors.warning;
    return colors.accent;
  };

  const renderProduct = ({ item }) => (
    <TouchableOpacity
      style={[styles.productCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => setDetailModal(item)}
      activeOpacity={0.7}
    >
      <View style={styles.productLeft}>
        <View style={[styles.productIconBg, { borderColor: getStockColor(item.quantity), backgroundColor: colors.background }]}>
          <Ionicons name="cube-outline" size={18} color={getStockColor(item.quantity)} />
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.productMeta}>
            {t('products.buyPrice')}: {formatPrice(item.buyPrice, currency)} · {t('products.sellPrice')}: {formatPrice(item.sellPrice, currency)}
          </Text>
        </View>
      </View>
      <View style={styles.productRight}>
        <Text style={[styles.productQty, { color: getStockColor(item.quantity) }]}>
          {Number(item.quantity).toFixed(0)}
        </Text>
        <Text style={styles.productUnit}>{item.unit}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.searchWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="search-outline" size={18} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('common.search')}
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      ) : products.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="cube-outline" size={56} color={colors.border} />
          <Text style={styles.emptyText}>
            {searchQuery ? t('dashboard.noProductsSearch') : t('dashboard.noProducts')}
          </Text>
          <Text style={styles.emptySubText}>
            {searchQuery ? t('dashboard.noProductsSearchSub') : t('dashboard.noProductsSub')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={renderProduct}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        />
      )}

      <TouchableOpacity style={[styles.fab, { backgroundColor: colors.accent }]} onPress={openAddModal} activeOpacity={0.8}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <Modal
        visible={!!detailModal}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailModal(null)}
      >
        <View style={styles.overlay}>
          <View style={[styles.detailSheet, { backgroundColor: colors.card }]}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            {detailModal && (
              <>
                <Text style={styles.detailName}>{detailModal.name}</Text>
                <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                  <Text style={styles.detailLabel}>{t('products.buyPrice')}</Text>
                  <Text style={styles.detailValue}>{formatPrice(detailModal.buyPrice, currency)}</Text>
                </View>
                <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                  <Text style={styles.detailLabel}>{t('products.sellPrice')}</Text>
                  <Text style={styles.detailValue}>{formatPrice(detailModal.sellPrice, currency)}</Text>
                </View>
                <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                  <Text style={styles.detailLabel}>{t('products.stock')}</Text>
                  <Text style={[styles.detailValue, { color: getStockColor(detailModal.quantity) }]}>
                    {Number(detailModal.quantity).toFixed(0)} {detailModal.unit}
                  </Text>
                </View>
                <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                  <Text style={styles.detailLabel}>{t('products.margin')}</Text>
                  <Text style={[styles.detailValue, { color: colors.accent }]}>
                    {formatPrice(Number(detailModal.sellPrice) - Number(detailModal.buyPrice), currency)}
                  </Text>
                </View>
                <View style={styles.detailActions}>
                  <TouchableOpacity
                    style={[styles.detailBtn, { backgroundColor: colors.info }]}
                    onPress={() => openEditModal(detailModal)}
                  >
                    <Ionicons name="create-outline" size={18} color="#fff" />
                    <Text style={styles.detailBtnText}>{t('common.edit')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.detailBtn, { backgroundColor: colors.danger }]}
                    onPress={() => handleDelete(detailModal)}
                  >
                    <Ionicons name="trash-outline" size={18} color="#fff" />
                    <Text style={styles.detailBtnText}>{t('common.delete')}</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setDetailModal(null)}>
                  <Text style={styles.cancelText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.formSheet, { backgroundColor: colors.card }]}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.formTitle}>{editProduct ? t('products.editProduct') : t('products.addProduct')}</Text>

              <Text style={styles.fieldLabel}>{t('products.productName')} *</Text>
              <TextInput
                style={[styles.fieldInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                placeholder={t('products.productNamePlaceholder')}
                placeholderTextColor={colors.textMuted}
                value={form.name}
                onChangeText={(v) => setForm(f => ({ ...f, name: v }))}
              />

              <View style={styles.fieldRow}>
                <View style={styles.fieldHalf}>
                  <Text style={styles.fieldLabel}>{t('products.buyPrice')} *</Text>
                  <TextInput
                    style={[styles.fieldInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                    placeholder="0.00"
                    placeholderTextColor={colors.textMuted}
                    value={form.buyPrice}
                    onChangeText={(v) => setForm(f => ({ ...f, buyPrice: v }))}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={styles.fieldHalf}>
                  <Text style={styles.fieldLabel}>{t('products.sellPrice')} *</Text>
                  <TextInput
                    style={[styles.fieldInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                    placeholder="0.00"
                    placeholderTextColor={colors.textMuted}
                    value={form.sellPrice}
                    onChangeText={(v) => setForm(f => ({ ...f, sellPrice: v }))}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              <View style={styles.fieldRow}>
                <View style={styles.fieldHalf}>
                  <Text style={styles.fieldLabel}>{t('products.stock')} *</Text>
                  <TextInput
                    style={[styles.fieldInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    value={form.quantity}
                    onChangeText={(v) => setForm(f => ({ ...f, quantity: v }))}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={styles.fieldHalf}>
                  <Text style={styles.fieldLabel}>{t('products.unit')}</Text>
                  <View style={styles.unitRow}>
                    {UNITS.map(u => (
                      <TouchableOpacity
                        key={u}
                        style={[styles.unitChip, { backgroundColor: colors.background, borderColor: colors.border }, form.unit === u && { backgroundColor: colors.accent, borderColor: colors.accent }]}
                        onPress={() => setForm(f => ({ ...f, unit: u }))}
                      >
                        <Text style={[styles.unitChipText, form.unit === u && { color: '#fff', fontWeight: '700' }]}>
                          {u}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              {form.buyPrice && form.sellPrice && (
                <View style={[styles.marginPreview, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Text style={styles.marginLabel}>{t('products.margin')} {t('products.perUnit')}:</Text>
                  <Text style={[styles.marginValue, { color: colors.accent }]}>
                    {formatPrice(parseFloat(form.sellPrice || 0) - parseFloat(form.buyPrice || 0), currency)}
                  </Text>
                </View>
              )}

              <View style={styles.formActions}>
                <TouchableOpacity
                  style={[styles.saveButton, { backgroundColor: colors.accent }]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.saveButtonText}>{editProduct ? t('products.saveChanges') : t('products.addProductBtn')}</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)} disabled={saving}>
                  <Text style={styles.cancelText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 46,
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
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  productCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  productLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  productIconBg: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    color: colors.text,
    fontSize: SIZES.base,
    fontWeight: '600',
  },
  productMeta: {
    color: colors.textMuted,
    fontSize: SIZES.xs,
    marginTop: 2,
  },
  productRight: {
    alignItems: 'flex-end',
  },
  productQty: {
    fontSize: SIZES.xl,
    fontWeight: '700',
  },
  productUnit: {
    color: colors.textMuted,
    fontSize: SIZES.xs,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  detailSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
  },
  formSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
    maxHeight: '90%',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  detailName: {
    fontSize: SIZES.xl,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  detailLabel: {
    color: colors.textMuted,
    fontSize: SIZES.base,
  },
  detailValue: {
    color: colors.text,
    fontSize: SIZES.base,
    fontWeight: '600',
  },
  detailActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  detailBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 10,
    gap: 6,
  },
  detailBtnText: {
    color: '#fff',
    fontSize: SIZES.base,
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: 12,
    alignItems: 'center',
    padding: 12,
  },
  cancelText: {
    color: colors.textMuted,
    fontSize: SIZES.base,
  },
  formTitle: {
    fontSize: SIZES.xl,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 20,
  },
  fieldLabel: {
    color: colors.textMuted,
    fontSize: SIZES.sm,
    marginBottom: 6,
    fontWeight: '500',
  },
  fieldInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 46,
    fontSize: SIZES.base,
    marginBottom: 14,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 12,
  },
  fieldHalf: {
    flex: 1,
  },
  unitRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  unitChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  unitChipText: {
    color: colors.textMuted,
    fontSize: SIZES.sm,
    fontWeight: '500',
  },
  marginPreview: {
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    borderWidth: 1,
  },
  marginLabel: {
    color: colors.textMuted,
    fontSize: SIZES.sm,
  },
  marginValue: {
    fontSize: SIZES.sm,
    fontWeight: '700',
  },
  formActions: {
    marginTop: 4,
  },
  saveButton: {
    borderRadius: 10,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: SIZES.base,
    fontWeight: '700',
  },
});
