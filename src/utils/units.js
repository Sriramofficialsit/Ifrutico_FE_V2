// Measurement units a product can be stocked/sold in. Price is always "per 1 unit".
export const UNITS = [
  { value: 'pcs', label: 'Pieces (pcs)', step: 1, initial: 1, lowStock: 10 },
  { value: 'kg', label: 'Kilograms (kg)', step: 0.5, initial: 1, lowStock: 5 },
  { value: 'g', label: 'Grams (g)', step: 100, initial: 100, lowStock: 500 },
  { value: 'ltr', label: 'Litres (ltr)', step: 0.5, initial: 1, lowStock: 5 },
  { value: 'ml', label: 'Millilitres (ml)', step: 100, initial: 100, lowStock: 500 },
];

const byValue = Object.fromEntries(UNITS.map((u) => [u.value, u]));

export const unitOf = (item) => (item?.unit && byValue[item.unit] ? item.unit : 'pcs');
export const unitStep = (item) => byValue[unitOf(item)].step;
export const unitInitial = (item) => byValue[unitOf(item)].initial;
export const isLowStock = (item) => Number(item?.stock) < byValue[unitOf(item)].lowStock;

// 12 -> "12", 0.5 + kg -> "0.5 kg" (the "pcs" suffix is omitted to keep counts clean)
export const formatQty = (qty, unit) => {
  const n = Number(qty);
  const num = Number.isInteger(n) ? String(n) : String(Number(n.toFixed(3)));
  return unit && unit !== 'pcs' ? `${num} ${unit}` : num;
};
