// Measurement units a product can be stocked/sold in. Price is always "per 1 unit".
// `group` drives the paired picker in Add/Edit Product: Pieces/Scoops, Weight (kg/g), Volume (ltr/ml).
export const UNITS = [
  { value: 'pcs', label: 'Pieces (pcs)', short: 'pcs', group: 'count', step: 1, initial: 1, lowStock: 10 },
  { value: 'scoop', label: 'Scoops', short: 'scoop', group: 'count', step: 1, initial: 1, lowStock: 20 },
  { value: 'kg', label: 'Kilograms (kg)', short: 'kg', group: 'weight', step: 0.5, initial: 1, lowStock: 5 },
  { value: 'g', label: 'Grams (g)', short: 'g', group: 'weight', step: 100, initial: 100, lowStock: 500 },
  { value: 'ltr', label: 'Litres (ltr)', short: 'ltr', group: 'volume', step: 0.5, initial: 1, lowStock: 5 },
  { value: 'ml', label: 'Millilitres (ml)', short: 'ml', group: 'volume', step: 100, initial: 100, lowStock: 500 },
];

export const UNIT_GROUPS = [
  { key: 'count', label: 'Pieces / Scoops', hint: 'pcs (set a piece weight to use at Events) and scoops' },
  { key: 'weight', label: 'Weight', hint: 'kg / g — sells at Retail, Events (litres) & Stalls (scoops)' },
  { key: 'volume', label: 'Volume', hint: 'ltr / ml — sells at Retail, Events (litres) & Stalls (scoops)' },
];

// Quick-pick pack sizes for the "price is for this quantity" field (any custom value can still be typed)
export const PACK_SUGGESTIONS = {
  pcs: [1, 6, 12],
  scoop: [1, 2, 3],
  kg: [0.5, 1, 2, 5],
  g: [100, 250, 500, 1000],
  ltr: [0.5, 1, 2, 5],
  ml: [100, 250, 500, 1000],
};

const byValue = Object.fromEntries(UNITS.map((u) => [u.value, u]));
// Whole-number quantities only (pcs). Scoops may be fractional in stock since Events convert litres into scoops.
export const isWholeUnit = (unit) => unit === 'pcs';

export const unitOf = (item) => (item?.unit && byValue[item.unit] ? item.unit : 'pcs');
export const unitStep = (item) => byValue[unitOf(item)].step;
export const unitInitial = (item) => byValue[unitOf(item)].initial;
// Packed products (priceQty > 1) are low below 5 packs; others use the unit's own threshold
export const isLowStock = (item) => {
  const per = priceQtyOf(item);
  return Number(item?.stock) < (per === 1 ? byValue[unitOf(item)].lowStock : 5 * per);
};

// 12 -> "12", 0.5 + kg -> "0.5 kg", 3 + scoop -> "3 scoops" (the "pcs" suffix is omitted to keep counts clean)
export const formatQty = (qty, unit) => {
  const n = Number(qty);
  const num = Number.isInteger(n) ? String(n) : String(Number(n.toFixed(3)));
  if (unit === 'scoop') return `${num} scoop${n === 1 ? '' : 's'}`;
  return unit && unit !== 'pcs' ? `${num} ${unit}` : num;
};

// Price is for `priceQty` units (e.g. ₹120 per 500 g); older products have no priceQty and mean "per 1 unit"
export const priceQtyOf = (item) => Number(item?.priceQty) > 0 ? Number(item.priceQty) : 1;

// Stock is entered and shown as a count of packs of priceQty units (₹750 per 1000 g, stock 5 = 5 × 1000 g),
// but the API stores it in base units (5000 g) so any weight can be billed without rounding drift.
const r3 = (n) => Math.round(n * 1000) / 1000;
export const toPacks = (qty, item) => r3(Number(qty || 0) / priceQtyOf(item));
export const fromPacks = (packs, item) => r3(Number(packs || 0) * priceQtyOf(item));

// "5 × 1000 g" for packed products, otherwise the plain quantity ("12", "2.5 kg")
export const formatStock = (qty, item) => {
  const per = priceQtyOf(item);
  return per === 1 ? formatQty(qty, unitOf(item)) : `${formatQty(toPacks(qty, item))} × ${formatQty(per, unitOf(item))}`;
};

// What a stock count is measured in: "g", or "packs of 1000 g"
export const stockUnitLabel = (item) => {
  const per = priceQtyOf(item);
  return per === 1 ? unitOf(item) : `packs of ${formatQty(per, unitOf(item))}`;
};

// Price of a single unit (1 g, 1 kg, 1 pc...), used to bill any custom quantity
export const unitPrice = (item) => Number(item?.price || 0) / priceQtyOf(item);

// "/kg", "/500 g", or "" for single pieces — appended after the ₹ price
export const perLabel = (item) => {
  const unit = item?.unit || 'pcs';
  const per = priceQtyOf(item);
  if (per === 1) return unit === 'pcs' ? '' : `/${unit}`;
  return `/${formatQty(per, unit)}${unit === 'pcs' ? ' pcs' : ''}`;
};
