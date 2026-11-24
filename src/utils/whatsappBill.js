import { DEFAULT_GSTIN } from './shop';
const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

// Small units are shown in their larger unit so rates read per litre / per kg: 500 g -> 0.5 kg
const BIG_UNIT = { g: 'kg', ml: 'ltr' };
const fmtNum = (n) => (Number.isInteger(n) ? String(n) : String(Number(n.toFixed(3))));

// "16 ltr × ₹255/ltr" or "2 × ₹50": quantity sold × price of one unit
const qtyRate = ({ quantity, unit, price, priceQty, boxes, boxSize, scoops, scoopGrams, soldQty, soldUnit, total }) => {
  if (soldQty > 0 && soldUnit) return `${fmtNum(Number(soldQty))} ${soldUnit === 'scoop' ? 'scoops' : soldUnit} × ${inr(Number(total) / soldQty)}/${soldUnit === 'pcs' ? 'pc' : soldUnit}`;
  if (boxes > 0) return `${boxes} box${boxes === 1 ? '' : 'es'} of ${fmtNum(Number(boxSize))} L × ${inr(Number(total) / boxes)}`;
  if (scoops > 0) return `${scoops} scoop${scoops === 1 ? '' : 's'} of ${fmtNum(Number(scoopGrams))} g × ${inr(Number(total) / scoops)}`;
  let u = unit || 'pcs';
  let qty = Number(quantity) || 0;
  let rate = (Number(price) || 0) / (Number(priceQty) || 1);
  if (BIG_UNIT[u]) { qty /= 1000; rate *= 1000; u = BIG_UNIT[u]; }
  return u === 'pcs' ? `${fmtNum(qty)} × ${inr(rate)}` : `${fmtNum(qty)} ${u} × ${inr(rate)}/${u}`;
};

// items: [{ name, quantity, unit, price, priceQty, total }]
// Plain text only: emojis get corrupted by wa.me links on some WhatsApp clients.
export const buildBillMessage = ({ customerName, invoice, items, subTotal, gstAmount, total, paymentMethod, gstNumber, gross, itemDiscountAmount, discountLabel, discountAmount }) => {
  const hasItemDiscount = Number(itemDiscountAmount) > 0;
  const hasBillDiscount = Number(discountAmount) > 0;
  const hasDiscount = hasItemDiscount || hasBillDiscount;
  const line = '━━━━━━━━━━━━━━━━━━';
  const rows = items.map((it, i) =>
    `${i + 1}. *${it.name}*\n    ${qtyRate(it)}  =  ${inr(it.total)}` +
    (Number(it.discountAmount) > 0 ? `\n    ${it.discountLabel || 'Discount'}  -${inr(it.discountAmount)}` : '')
  );

  return [
    `*IFRUTICO*`,
    `_Pure Fruit Ice Cream_`,
    line,
    ``,
    `Hello *${customerName}*,`,
    `Thank you for choosing *Ifrutico*!`,
    ``,
    `*Invoice:* ${invoice}`,
    `*GSTIN:* ${gstNumber || DEFAULT_GSTIN}`,
    ``,
    `*YOUR ORDER*`,
    line,
    ...rows,
    line,
    ...(hasDiscount ? [`Items total       ${inr(gross)}`] : []),
    ...(hasItemDiscount ? [`Item discounts    -${inr(itemDiscountAmount)}`] : []),
    ...(hasBillDiscount ? [`${discountLabel || 'Discount'}    -${inr(discountAmount)}`] : []),
    `${hasDiscount ? 'Taxable value' : 'Subtotal'}     ${inr(subTotal)}`,
    `GST (5%)          ${inr(gstAmount)}`,
    `*TOTAL PAID    ${inr(total)}*`,
    line,
    `Payment: *${paymentMethod || 'Cash'}*`,
    ``,
    `We hope you loved every scoop!`,
    `See you again soon.`,
    `_- Team Ifrutico_`,
  ].join('\n');
};
