export const formatPrice = (amount, currency = 'UZS') => {
  const num = Number(amount) || 0;
  switch (currency) {
    case 'UZS': {
      const rounded = Math.round(num);
      return `${rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} so'm`;
    }
    case 'USD':
      return `$${num.toFixed(2)}`;
    case 'RUB':
      return `${num.toFixed(2).replace('.', ',')} ₽`;
    default:
      return `${num.toFixed(2)}`;
  }
};
