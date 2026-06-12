import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  CURRENCY: '@savdo_currency',
  TAX_ENABLED: '@savdo_tax_enabled',
  TAX_RATE: '@savdo_tax_rate',
  RECEIPT_TITLE: '@savdo_receipt_title',
  RECEIPT_HEADER: '@savdo_receipt_header',
  RECEIPT_FOOTER: '@savdo_receipt_footer',
};

export const getSettings = async () => {
  try {
    const [
      currency,
      taxEnabled,
      taxRate,
      receiptTitle,
      receiptHeader,
      receiptFooter,
    ] = await Promise.all([
      AsyncStorage.getItem(KEYS.CURRENCY),
      AsyncStorage.getItem(KEYS.TAX_ENABLED),
      AsyncStorage.getItem(KEYS.TAX_RATE),
      AsyncStorage.getItem(KEYS.RECEIPT_TITLE),
      AsyncStorage.getItem(KEYS.RECEIPT_HEADER),
      AsyncStorage.getItem(KEYS.RECEIPT_FOOTER),
    ]);

    return {
      currency: currency || 'UZS',
      taxEnabled: taxEnabled === 'true',
      taxRate: taxRate ? parseFloat(taxRate) : 0,
      receiptTitle: receiptTitle || '',
      receiptHeader: receiptHeader || '',
      receiptFooter: receiptFooter || '',
    };
  } catch {
    return {
      currency: 'UZS',
      taxEnabled: false,
      taxRate: 0,
      receiptTitle: '',
      receiptHeader: '',
      receiptFooter: '',
    };
  }
};

export const setCurrency = async (currency) => {
  await AsyncStorage.setItem(KEYS.CURRENCY, currency);
};

export const setTaxEnabled = async (enabled) => {
  await AsyncStorage.setItem(KEYS.TAX_ENABLED, String(enabled));
};

export const setTaxRate = async (rate) => {
  await AsyncStorage.setItem(KEYS.TAX_RATE, String(rate));
};

export const setReceiptTitle = async (title) => {
  await AsyncStorage.setItem(KEYS.RECEIPT_TITLE, title);
};

export const setReceiptHeader = async (header) => {
  await AsyncStorage.setItem(KEYS.RECEIPT_HEADER, header);
};

export const setReceiptFooter = async (footer) => {
  await AsyncStorage.setItem(KEYS.RECEIPT_FOOTER, footer);
};

export const clearAllSettings = async () => {
  await AsyncStorage.multiRemove(Object.values(KEYS));
};
