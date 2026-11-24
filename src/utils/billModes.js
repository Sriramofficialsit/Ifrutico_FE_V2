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
    short: 'Events',
    title: 'Events & Functions',
    blurb: 'Bulk orders billed by the litre — any size',
    icon: PartyPopper,
  },
  stall: {
    key: 'stall',
    path: '/billing/stalls',
    label: 'Stalls',
    title: 'Stall Bill',
    blurb: 'Billed by the scoop or the piece',
    icon: IceCreamCone,
  },
};
export const BILL_MODE_LIST = Object.values(BILL_MODES);

export const DEFAULT_BILLING_CONFIG = { scoopGrams: 75, boxSizes: [0.5, 1, 2, 5], gramsPerLitre: 1000, retailUnit: '' };

// Retail: the measure a new line starts in — the admin's default when this product can be sold in it, else its own unit
export const retailStartUnit = (p, cfg) => (cfg?.retailUnit && retailUnits(p, cfg).includes(cfg.retailUnit) ? cfg.retailUnit : unitOf(p));

// ---- One conversion engine for all three bill types (KEEP IN SYNC with BE/utils/billUnits.js) ----
// Everything converts through grams: g/kg exact, ml/ltr via grams per litre (product density, else global),
// scoop via the global scoop size, pcs via the product's weight per piece. 6-decimal precision.
const r6 = (n) => Math.round(n * 1e6) / 1e6;
// Box contents (packWeight g, packVolume ml, packCount pcs|scoops) are the most accurate links and win;
// otherwise the older per-product fields and the global config are used.
export const linksOf = (p, cfg) => {
  const W = Number(p?.packWeight) || 0;
  const V = Number(p?.packVolume) || 0;
  const N = Number(p?.packCount) || 0;
  const gpl = W > 0 && V > 0 ? W / (V / 1000)
    : Number(p?.gramsPerLitre) > 0 ? Number(p.gramsPerLitre) : Number(cfg.gramsPerLitre) || 1000;
  const boxGrams = W > 0 ? W : V > 0 ? (V / 1000) * gpl : 0;
  const each = N > 0 && boxGrams > 0 ? boxGrams / N : null;
  const countUnit = p?.packCountUnit === 'scoop' ? 'scoop' : 'pcs';
  return {
    gpl,
    pieceGrams: countUnit === 'pcs' && each ? each : Number(p?.pieceGrams) > 0 ? Number(p.pieceGrams) : null,
    scoopGrams: countUnit === 'scoop' && each ? each : Number(cfg.scoopGrams) > 0 ? Number(cfg.scoopGrams) : null,
    ownScoop: countUnit === 'scoop' && !!each,
  };
};
export const hasOwnScoop = (p, cfg) => linksOf(p, cfg).ownScoop || (p?.unit === 'scoop' && p?.packCountUnit === 'scoop' && Number(p?.packCount) > 0);
export const ownScoopGrams = (p, cfg) => linksOf(p, cfg).scoopGrams;
const gramsPer = (unit, p, cfg) => {
  const l = linksOf(p, cfg);
  switch (unit) {
    case 'g': return 1;
    case 'kg': return 1000;
    case 'ml': return l.gpl / 1000;
    case 'ltr': return l.gpl;
    case 'scoop': return l.scoopGrams;
    case 'pcs': return l.pieceGrams;
    default: return null;
  }
};
const SAME_FAMILY = { 'g>kg': 1 / 1000, 'kg>g': 1000, 'ml>ltr': 1 / 1000, 'ltr>ml': 1000 };
export const convert = (qty, from, to, p, cfg) => {
  if (from === to) return r6(qty);
  const exact = SAME_FAMILY[`${from}>${to}`];
  if (exact) return r6(qty * exact);
  const a = gramsPer(from, p, cfg);
  const b = gramsPer(to, p, cfg);
  return a && b ? r6((qty * a) / b) : null;
};
export const canConvert = (from, to, p, cfg) => convert(1, from, to, p, cfg) !== null;
// Stock taken for selling qty of sellUnit; pcs-stocked products only lose whole pieces (rounded up)
export const toStock = (qty, sellUnit, p, cfg) => {
  const q = convert(qty, sellUnit, unitOf(p), p, cfg);
  if (q === null) return null;
  return unitOf(p) === 'pcs' ? Math.ceil(q - 1e-6) : q;
};
// How much of `unit` the current stock is worth
export const stockIn = (unit, p, cfg) => convert(Number(p.stock) || 0, unitOf(p), unit, p, cfg) ?? 0;
// ₹ for one of `unit` (null if not convertible)
export const pricePer = (unit, p, cfg) => {
  const q = convert(1, unit, unitOf(p), p, cfg);
  return q === null ? null : unitPrice(p) * q;
};

// Units a Retail line can be sold in for this product (its own unit first)
export const SELL_UNITS = ['pcs', 'scoop', 'g', 'kg', 'ml', 'ltr'];
export const retailUnits = (p, cfg) => [unitOf(p), ...SELL_UNITS.filter((u) => u !== unitOf(p) && canConvert(u, unitOf(p), p, cfg))];

export const sellsByLitre = (p, cfg) => canConvert('ltr', unitOf(p), p, cfg);
export const sellsByScoop = (p, cfg) => hasOwnScoop(p, cfg) || canConvert('g', unitOf(p), p, cfg);
export const sellsByPiece = (p, cfg) => unitOf(p) === 'pcs' || canConvert('pcs', unitOf(p), p, cfg);
// Stall lines: scoops or pieces (both offered when the product links pcs and weight)
export const stallUnits = (p, cfg) => [...(sellsByScoop(p, cfg) ? ['scoop'] : []), ...(sellsByPiece(p, cfg) ? ['pcs'] : [])];
export const canSellIn = (mode, p, cfg) =>
  mode === 'event' ? sellsByLitre(p, cfg) : mode === 'stall' ? stallUnits(p, cfg).length > 0 : true;

// "0.5 L", "2 L"
export const fmtLitres = (n) => `${formatQty(Number(n))} L`;

// Stall line unit: line.stallUnit if chosen, else scoop when possible, else pcs
export const stallUnitOf = (line, cfg) => {
  const opts = stallUnits(line.item, cfg);
  return opts.includes(line.stallUnit) ? line.stallUnit : opts[0];
};
export const stallCountField = (line, cfg) => (stallUnitOf(line, cfg) === 'pcs' ? 'pieces' : 'scoops');

// Retail line unit (defaults to the product's stock unit)
export const sellUnitOf = (line) => line.sellUnit || unitOf(line.item);

// Amount the customer is buying on a Retail line, in its sell unit. Billing keeps the typed amount in `qty`
// (`quantity` on a priced line is the stock it uses, in the product's own unit, so it must not be read here).
const retailQty = (line) => (line.qty !== undefined ? line.qty : line.quantity);

// Quantity a line takes out of stock, in the product's unit (0 if it can't be converted)
export const lineQuantity = (mode, line, cfg, scoopGrams) => {
  let q;
  if (mode === 'event') q = toStock((Number(line.boxSize) || 0) * (Number(line.boxes) || 0), 'ltr', line.item, cfg);
  else if (mode === 'stall') {
    q = stallUnitOf(line, cfg) === 'pcs'
      ? toStock(Number(line.pieces) || 0, 'pcs', line.item, cfg)
      : hasOwnScoop(line.item, cfg)
        ? toStock(Number(line.scoops) || 0, 'scoop', line.item, cfg) // the box says how many scoops it gives
        : toStock((Number(scoopGrams) || 0) * (Number(line.scoops) || 0), 'g', line.item, cfg);
  } else q = toStock(Number(retailQty(line)) || 0, sellUnitOf(line), line.item, cfg);
  return q ?? 0;
};

// Short description of what a line sells: "3 × 2 L", "4 scoops", "2 pcs", "0.5 kg"
export const lineCountLabel = (mode, line, cfg) => {
  if (mode === 'event') return `${line.boxes} × ${fmtLitres(line.boxSize)}`;
  if (mode === 'stall') {
    if (stallUnitOf(line, cfg) === 'pcs') return `${line.pieces} pc${Number(line.pieces) === 1 ? '' : 's'}`;
    return `${line.scoops} scoop${Number(line.scoops) === 1 ? '' : 's'}`;
  }
  const u = sellUnitOf(line);
  return `${formatQty(retailQty(line), u)}${u === 'pcs' ? ' pcs' : ''}`;
};
