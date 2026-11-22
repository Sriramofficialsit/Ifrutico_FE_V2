// GST maths shared by the New Bill screen. Mirrors BE/models/Bill.model.js exactly so the preview equals the saved bill.
//  - product.gstIncluded === false (default): the 5% is added on top of price x qty
//  - product.gstIncluded === true: the price already contains GST, nothing is added; the GST portion is split out
//  - discount: taken off the lines as priced (split across lines by value), BEFORE GST
export const GST_RATE = 0.05;
const r2 = (n) => Number(Number(n).toFixed(2));

// `lineTotal` = price x quantity as priced
export const splitLine = (lineTotal, included) => {
  if (included) {
    const gst = r2((lineTotal * GST_RATE) / (1 + GST_RATE));
    return { taxable: lineTotal - gst, gst };
  }
  return { taxable: lineTotal, gst: r2(lineTotal * GST_RATE) };
};

// ₹ off for a bill whose lines add up to `gross`. type: 'amount' | 'percent'. Never more than gross.
export const discountOf = (gross, type, value) => {
  const v = Number(value) || 0;
  if (!(v > 0) || !(gross > 0)) return 0;
  if (type === 'percent') return r2((gross * Math.min(v, 100)) / 100);
  if (type === 'amount') return r2(Math.min(v, gross));
  return 0;
};

// items: [{ subtotal (line as priced), item: { gstIncluded }, discount?: { type, value } (line discount) }]
// discount: bill-level { type, value } (optional), applied to the lines AFTER their own discounts.
// Returns gross (lines as priced), itemDiscount (sum of line discounts), net (gross - itemDiscount, what the
// bill discount / coupon applies to), lineDiscounts (₹ per line), discountAmount (bill-level), subTotal, gstAmount, total.
export const billTotals = (items, discount) => {
  const lines = items.map((b) => r2(Number(b.subtotal) || 0));
  const gross = r2(lines.reduce((s, n) => s + n, 0));
  const lineDiscounts = items.map((b, i) => discountOf(lines[i], b.discount?.type, b.discount?.value));
  const nets = lines.map((n, i) => r2(n - lineDiscounts[i]));
  const itemDiscount = r2(lineDiscounts.reduce((s, n) => s + n, 0));
  const net = r2(nets.reduce((s, n) => s + n, 0));
  const discountAmount = discountOf(net, discount?.type, discount?.value);

  let taxable = 0;
  let gst = 0;
  let remaining = discountAmount;
  items.forEach((b, i) => {
    const share = i === items.length - 1 ? remaining : net ? r2((nets[i] * discountAmount) / net) : 0;
    remaining = r2(remaining - share);
    const s = splitLine(Math.max(0, r2(nets[i] - share)), !!b.item?.gstIncluded);
    taxable += s.taxable;
    gst += s.gst;
  });
  const subTotal = r2(taxable);
  const gstAmount = r2(gst);
  return { gross, itemDiscount, net, lineDiscounts, discountAmount, subTotal, gstAmount, total: r2(subTotal + gstAmount) };
};

// "10% off" / "₹20 off" for a line discount; null when none
export const lineDiscountLabel = ({ discountAmount, discountType, discountValue }) =>
  Number(discountAmount) > 0 ? (discountType === 'percent' ? `${Number(discountValue)}% off` : 'Discount') : null;

// "Discount (10%)" / "Discount" for a saved bill or preview; null when there is no discount
export const discountLabel = ({ discountAmount, discountType, discountValue, couponCode }) =>
  Number(discountAmount) > 0
    ? couponCode ? `Coupon ${couponCode}` : discountType === 'percent' ? `Discount (${Number(discountValue)}%)` : 'Discount'
    : null;

// Items' value as priced (before any discount) for a saved bill
export const itemsTotal = (bill) => r2((bill.products || []).reduce((s, p) => s + (Number(p.total) || 0), 0));
