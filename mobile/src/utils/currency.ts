export const formatCurrency = (value: number, symbol: string = "USD") => {
  const symbolMap: { [key: string]: string } = {
    USD: "$",
    EUR: "€",
    VES: "Bs.",
  };

  const currencySymbol = symbolMap[symbol] || symbol;

  return `${value.toFixed(2)}${currencySymbol}`;
};
