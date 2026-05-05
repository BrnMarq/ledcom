export const formatCurrency = (value: number, symbol: string = 'USD') => {
  const symbolMap: { [key: string]: string } = {
    USD: '$',
    EUR: '€',
    VES: 'Bs.',
    COP: 'Bs.',
  };

  const currencySymbol = symbolMap[symbol] || symbol;

  return `${currencySymbol}${value.toFixed(2)}`;
};
