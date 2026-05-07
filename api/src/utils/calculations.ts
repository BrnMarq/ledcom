export interface ItemInput {
  quantity: number;
  totalPrice: number;
}

export const calculateUnitPrice = (totalPrice: number, quantity: number): number => {
  if (quantity === 0) return 0;
  return totalPrice / quantity;
};

export const calculateTransactionTotal = (items: ItemInput[]): number => {
  return items.reduce((sum, item) => sum + item.totalPrice, 0);
};
