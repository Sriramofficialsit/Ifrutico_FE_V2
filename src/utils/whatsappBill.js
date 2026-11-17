const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

// Small units are shown in their larger unit so rates read per litre / per kg: 500 g -> 0.5 kg
const BIG_UNIT = { g: 'kg', ml: 'ltr' };
const fmtNum = (n) => (Number.isInteger(n) ? String(n) : String(Number(n.toFixed(3))));

// "16 ltr × ₹255/ltr" or "2 × ₹50": quantity sold × price of one unit
const qtyRate = ({ quantity, unit, price, priceQty }) => {
  let u = unit || 'pcs';
  let qty = Number(quantity) || 0;
  let rate = (Number(price) || 0) / (Number(priceQty) || 1);
  if (BIG_UNIT[u]) { qty /= 1000; rate *= 1000; u = BIG_UNIT[u]; }
  return u === 'pcs' ? `${fmtNum(qty)} × ${inr(rate)}` : `${fmtNum(qty)} ${u} × ${inr(rate)}/${u}`;
};

// items: [{ name, quantity, unit, price, priceQty, total }]
// Plain text only: emojis get corrupted by wa.me links on some WhatsApp clients.
export const buildBillMessage = ({ customerName, invoice, items, subTotal, gstAmount, total, paymentMethod, gstNumber }) => {
  const line = '━━━━━━━━━━━━━━━━━━';
  const rows = items.map((it, i) =>
    `${i + 1}. *${it.name}*\n    ${qtyRate(it)}  =  ${inr(it.total)}`
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
    ...(gstNumber ? [`*GSTIN:* ${gstNumber}`] : []),
    ``,
    `*YOUR ORDER*`,
    line,
    ...rows,
    line,
    `Subtotal          ${inr(subTotal)}`,
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
