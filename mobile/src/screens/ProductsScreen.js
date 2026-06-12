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
  SafeAreaView
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../store/ThemeContext';
import { generateId } from '../utils/uuid';
import { SIZES, FONTS } from '../constants/theme';
import { formatPrice } from '../utils/formatPrice';
import { getSettings } from '../store/settingsStore';
import { getAllProducts, upsertProduct, deleteProduct, searchProducts } from '../database/productQueries';
import { addToSyncQueue } from '../database/syncQueries';
import { isOnline } from '../services/syncService';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

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
    }, [loadProducts, searchQuery])
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
      Alert.alert(t('common.error'), 'Barcha maydonlarni to\'ldiring');
      return;
    }

    const online = await isOnline();
    if (!online) {
      Alert.alert('Internet yo\'q', 'Mahsulot qo\'shish yoki tahrirlash uchun internet tarmog\'iga ulaning. (Offline rejim vaqtincha o\'chirilgan)');
      return;
    }

    setSaving(true);
    try {
      const now = new Date().toISOString();
      const product = {
        id: editProduct ? editProduct.id : generateId(),
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
      Alert.alert(t('common.error'), 'Saqlashda xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product) => {
    Alert.alert(
      t('common.delete'),
      `${product.name} mahsulotini o'chirib tashlamoqchimisiz?`,
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
              Alert.alert(t('common.error'), 'O\'chirishda xatolik');
            }
          },
        },
      ]
    );
  };

  const getStockColor = (qty) => {
    if (qty <= 0) return '#ef4444';
    if (qty <= 5) return '#f59e0b';
    return '#10b981';
  };

  const renderProduct = ({ item }) => (
    <Card 
      onPress={() => setDetailModal(item)}
      style={styles.productCard}
    >
      <View style={styles.productMain}>
        <View style={[styles.productIconBg, { backgroundColor: colors.primary + '10' }]}>
          <Ionicons name="cube" size={20} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.productName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
          <Text style={[styles.productPrice, { color: colors.primary }]}>{formatPrice(item.sellPrice, currency)}</Text>
        </View>
      </View>
      <View style={styles.productStatus}>
        <View style={[styles.stockBadge, { backgroundColor: getStockColor(item.quantity) + '15' }]}>
          <Text style={[styles.stockText, { color: getStockColor(item.quantity) }]}>
            {Number(item.quantity).toFixed(0)} {item.unit}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </View>
    </Card>
  );

  return (
    <>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <View style={[styles.searchBar, { backgroundColor: colors.white, borderColor: colors.border }]}>
            <Ionicons name="search" size={20} color={colors.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder={t('common.search')}
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={handleSearch}
            />
          </View>
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : products.length === 0 ? (
          <View style={styles.centered}>
            <Ionicons name="cube-outline" size={64} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              Mahsulotlar topilmadi
            </Text>
          </View>
        ) : (
          <FlatList
            data={products}
            keyExtractor={(item) => item.id}
            renderItem={renderProduct}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}

        <TouchableOpacity 
          style={[styles.fab, { backgroundColor: colors.primary }]} 
          onPress={openAddModal}
        >
          <Ionicons name="add" size={32} color="#fff" />
        </TouchableOpacity>
      </SafeAreaView>

      {/* Product Detail Modal */}
      <Modal
        visible={!!detailModal}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.white }]}>
            <View style={styles.sheetHandle} />
            {detailModal && (
              <>
                <View style={styles.detailHeader}>
                  <Text style={[styles.detailName, { color: colors.text }]}>{detailModal.name}</Text>
                  <TouchableOpacity onPress={() => setDetailModal(null)}>
                    <Ionicons name="close-circle" size={28} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>

                <View style={styles.detailGrid}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Sotish narxi</Text>
                    <Text style={[styles.detailValue, { color: colors.primary }]}>{formatPrice(detailModal.sellPrice, currency)}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Sotib olish</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>{formatPrice(detailModal.buyPrice, currency)}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Omborda</Text>
                    <Text style={[styles.detailValue, { color: getStockColor(detailModal.quantity) }]}>
                      {Number(detailModal.quantity).toFixed(0)} {detailModal.unit}
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Foyda (har biridan)</Text>
                    <Text style={[styles.detailValue, { color: '#10b981' }]}>
                      {formatPrice(detailModal.sellPrice - detailModal.buyPrice, currency)}
                    </Text>
                  </View>
                </View>

                <View style={styles.modalActions}>
                  <Button
                    title="Tahrirlash"
                    variant="primary"
                    onPress={() => openEditModal(detailModal)}
                    style={{ flex: 1 }}
                    icon={<Ionicons name="create" size={18} color="#fff" />}
                  />
                  <Button
                    title="O'chirish"
                    variant="danger"
                    onPress={() => handleDelete(detailModal)}
                    style={{ flex: 1 }}
                    icon={<Ionicons name="trash" size={18} color="#fff" />}
                  />
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Add/Edit Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.formContainer, { backgroundColor: colors.white }]}>
            <View style={styles.formHeader}>
              <Text style={[styles.formTitle, { color: colors.text }]}>
                {editProduct ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Input
                label="Mahsulot nomi"
                placeholder="Masalan: Olma"
                value={form.name}
                onChangeText={(v) => setForm(f => ({ ...f, name: v }))}
              />

              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Input
                    label="Sotib olish narxi"
                    placeholder="0.00"
                    value={form.buyPrice}
                    onChangeText={(v) => setForm(f => ({ ...f, buyPrice: v }))}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={{ width: 12 }} />
                <View style={{ flex: 1 }}>
                  <Input
                    label="Sotish narxi"
                    placeholder="0.00"
                    value={form.sellPrice}
                    onChangeText={(v) => setForm(f => ({ ...f, sellPrice: v }))}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Input
                    label="Miqdori"
                    placeholder="0"
                    value={form.quantity}
                    onChangeText={(v) => setForm(f => ({ ...f, quantity: v }))}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={{ width: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.unitLabel}>Birlik</Text>
                  <View style={styles.unitSelector}>
                    {UNITS.map(u => (
                      <TouchableOpacity
                        key={u}
                        style={[
                          styles.unitChip,
                          { borderColor: colors.border },
                          form.unit === u && { backgroundColor: colors.primary, borderColor: colors.primary }
                        ]}
                        onPress={() => setForm(f => ({ ...f, unit: u }))}
                      >
                        <Text style={[styles.unitText, form.unit === u && { color: '#fff' }]}>{u}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <Button
                title={editProduct ? "Saqlash" : "Qo'shish"}
                onPress={handleSave}
                loading={saving}
                style={{ marginTop: 20, height: 52 }}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    ...FONTS.medium,
    marginTop: 12,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    marginBottom: 10,
  },
  productMain: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  productIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productName: {
    fontSize: 15,
    ...FONTS.semibold,
  },
  productPrice: {
    fontSize: 14,
    ...FONTS.bold,
    marginTop: 2,
  },
  productStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stockText: {
    fontSize: 12,
    ...FONTS.bold,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  detailName: {
    fontSize: 22,
    ...FONTS.bold,
    flex: 1,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 32,
  },
  detailItem: {
    width: '50%',
    marginBottom: 20,
  },
  detailLabel: {
    color: '#6b7280',
    fontSize: 12,
    ...FONTS.medium,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    ...FONTS.bold,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  formContainer: {
    padding: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '80%',
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 20,
    ...FONTS.bold,
  },
  row: {
    flexDirection: 'row',
  },
  unitLabel: {
    fontSize: 12,
    ...FONTS.medium,
    color: '#374151',
    marginBottom: 6,
  },
  unitSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  unitChip: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  unitText: {
    fontSize: 12,
    ...FONTS.medium,
  }
});
