const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

// items: [{ name, qty (already formatted, e.g. "0.5 kg"), price, per (e.g. "/500 g", optional), total }]
// Plain text only: emojis get corrupted by wa.me links on some WhatsApp clients.
export const buildBillMessage = ({ customerName, invoice, items, subTotal, gstAmount, total, paymentMethod, gstNumber }) => {
  const line = '━━━━━━━━━━━━━━━━━━';
  const rows = items.map((it, i) =>
    `${i + 1}. *${it.name}*\n    ${it.qty} × ${inr(it.price)}${it.per || ''}  =  ${inr(it.total)}`
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
