// The three billing screens. All of them sell from the same inventory: Events (litre boxes) and Stalls (scoops)
// are converted into the product's own stock unit before stock is checked or deducted.
// Conversions KEEP IN SYNC with BE/utils/billUnits.js (the server recomputes them; this is only the preview).
import { Store, PartyPopper, IceCreamCone } from 'lucide-react';
import { unitOf, unitPrice, formatQty } from './units';

export const BILL_MODES = {
  retail: {
    key: 'retail',
    path: '/billing',
    label: 'Retail',
    title: 'Retail Bill',
    blurb: 'Counter sales by piece, weight or volume',
    icon: Store,
  },
  event: {
    key: 'event',
    path: '/billing/events',
    label: 'Events & Functions',
    title: 'Events & Functions',
    blurb: 'Bulk orders billed by litre boxes',
    icon: PartyPopper,
  },
  stall: {
    key: 'stall',
    path: '/billing/stalls',
    label: 'Stalls',
    title: 'Stall Bill',
    blurb: 'Billed by the scoop',
    icon: IceCreamCone,
  },
};
export const BILL_MODE_LIST = Object.values(BILL_MODES);

export const DEFAULT_BILLING_CONFIG = { scoopGrams: 75, boxSizes: [0.5, 1, 2, 5], gramsPerLitre: 1000 };

const r3 = (n) => Math.round(n * 1000) / 1000;

// Only products stocked by weight or volume can be sold in litres or scoops
export const MEASURABLE = ['g', 'kg', 'ml', 'ltr'];
export const isMeasurable = (p) => MEASURABLE.includes(unitOf(p));

export const litresToUnits = (litres, product, gramsPerLitre) => {
  switch (unitOf(product)) {
    case 'ltr': return r3(litres);
    case 'ml': return r3(litres * 1000);
    case 'kg': return r3((litres * gramsPerLitre) / 1000);
    case 'g': return r3(litres * gramsPerLitre);
    default: return 0;
  }
};

export const gramsToUnits = (grams, product, gramsPerLitre) => {
  switch (unitOf(product)) {
    case 'g': return r3(grams);
    case 'kg': return r3(grams / 1000);
    case 'ml': return r3((grams / gramsPerLitre) * 1000);
    case 'ltr': return r3(grams / gramsPerLitre);
    default: return 0;
  }
};

// Inverse: how many litres / scoops a stock quantity (in product units) is worth
const unitsPerLitre = (p, gpl) => litresToUnits(1, p, gpl) || 1;
export const stockInLitres = (p, gpl) => Math.floor((Number(p.stock) / unitsPerLitre(p, gpl)) * 10) / 10;
export const stockInScoops = (p, gpl, scoopGrams) => {
  const per = gramsToUnits(scoopGrams, p, gpl);
  return per > 0 ? Math.floor(Number(p.stock) / per + 1e-9) : 0;
};

// Rupees for one litre / one scoop of a product
export const pricePerLitre = (p, gpl) => unitPrice(p) * litresToUnits(1, p, gpl);
export const pricePerScoop = (p, gpl, scoopGrams) => unitPrice(p) * gramsToUnits(scoopGrams, p, gpl);

// "0.5 L", "2 L"
export const fmtLitres = (n) => `${formatQty(Number(n))} L`;

// Quantity a line takes out of stock, in the product's unit
export const lineQuantity = (mode, line, cfg, scoopGrams) => {
  if (mode === 'event') return litresToUnits((Number(line.boxSize) || 0) * (Number(line.boxes) || 0), line.item, cfg.gramsPerLitre);
  if (mode === 'stall') return gramsToUnits((Number(scoopGrams) || 0) * (Number(line.scoops) || 0), line.item, cfg.gramsPerLitre);
  return Number(line.quantity) || 0;
};

// Short description of what a line sells: "3 × 2 L", "4 scoops", or the plain quantity
export const lineCountLabel = (mode, line) => {
  if (mode === 'event') return `${line.boxes} × ${fmtLitres(line.boxSize)}`;
  if (mode === 'stall') return `${line.scoops} scoop${Number(line.scoops) === 1 ? '' : 's'}`;
  return formatQty(line.quantity, unitOf(line.item));
};
