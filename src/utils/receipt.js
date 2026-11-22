// Printed bill: an 80 mm thermal-style tax invoice (store header, bill details, items, GST summary, savings, footer).
// Shared by the New Bill screen and the Billing List so every printout looks the same.
import DOMPurify from 'dompurify';
import logoAsset from '../LandingApp/images/logo.webp';

// Absolute URL so the logo also loads inside the print window (about:blank)
const logoSrc = () => (typeof window !== 'undefined' ? new URL(logoAsset, window.location.origin).href : logoAsset);

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const r2 = (n) => Number(Number(n || 0).toFixed(2));
const money = (n) => r2(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const num = (n) => { const x = Number(n); return Number.isInteger(x) ? String(x) : String(Number(x.toFixed(3))); };
const BIG = { g: 'kg', ml: 'ltr' };
const PAY = { cash: 'Cash', upi: 'UPI', card: 'Card' };
const TYPE = { retail: 'Retail', event: 'Events & Functions', stall: 'Stall' };

// Paper sizes offered in Settings → Bill printing (width in mm)
export const PRINT_PAPERS = [
  { value: '58mm', label: '58 mm roll', hint: 'Small thermal printer', width: 58 },
  { value: '80mm', label: '80 mm roll', hint: 'Standard thermal printer', width: 80 },
  { value: '104mm', label: '4 inch roll', hint: 'Wide thermal printer', width: 104 },
  { value: 'a4', label: 'A4 page', hint: 'Normal office printer', width: 210 },
];
export const DEFAULT_PRINT = { printPaper: '80mm', printScale: 100, printMargin: 3 };
const clamp = (n, lo, hi, d) => (Number.isFinite(Number(n)) ? Math.min(hi, Math.max(lo, Number(n))) : d);

// Page + bill size from the branch's print settings
const pageCss = (shop) => {
  const paper = PRINT_PAPERS.find((p) => p.value === shop.printPaper) || PRINT_PAPERS[1];
  const scale = clamp(shop.printScale, 60, 160, 100) / 100;
  const margin = clamp(shop.printMargin, 0, 15, 3);
  const a4 = paper.value === 'a4';
  // On A4 the bill stays a readable column instead of stretching across the page
  const content = a4 ? Math.min(paper.width - 2 * margin, 150) : Math.max(30, paper.width - 2 * margin);
  // zoom scales everything, so the width is divided by it to still fill exactly `content` mm
  const w = (content / scale).toFixed(2);
  return `
  @page { size: ${a4 ? 'A4' : `${paper.width}mm auto`}; margin: ${margin}mm; }
  .paper { zoom: ${scale}; width: calc(${w}mm + ${(2 * margin / scale).toFixed(2)}mm); padding: ${(margin / scale).toFixed(2)}mm; }
  @media print { .paper { width: ${w}mm; padding: 0; ${a4 ? 'margin: 0 auto !important;' : ''} } }`;
};

// Amount in words, Indian numbering
const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
const b100 = (n) => (n < 20 ? ONES[n] : `${TENS[Math.floor(n / 10)]}${n % 10 ? ' ' + ONES[n % 10] : ''}`);
const b1000 = (n) => (n >= 100 ? `${ONES[Math.floor(n / 100)]} Hundred${n % 100 ? ' ' + b100(n % 100) : ''}` : b100(n));
const words = (amount) => {
  let n = Math.floor(amount);
  const paise = Math.round((amount - n) * 100);
  if (n === 0 && !paise) return 'Zero Rupees Only';
  const parts = [];
  const cr = Math.floor(n / 1e7); n %= 1e7;
  const lk = Math.floor(n / 1e5); n %= 1e5;
  const th = Math.floor(n / 1e3); n %= 1e3;
  if (cr) parts.push(`${b1000(cr)} Crore`);
  if (lk) parts.push(`${b100(lk)} Lakh`);
  if (th) parts.push(`${b100(th)} Thousand`);
  if (n) parts.push(b1000(n));
  return `${parts.join(' ') || 'Zero'} Rupees${paise ? ` and ${b100(paise)} Paise` : ''} Only`;
};

// One printed line: { name, qty, rate, amount, note }
const lineOf = (p) => {
  const total = Number(p.total) || 0;
  if (p.boxes > 0) return { qty: `${p.boxes}×${num(p.boxSize)}L`, rate: total / p.boxes, note: `${p.boxes} box${p.boxes === 1 ? '' : 'es'} of ${num(p.boxSize)} L` };
  if (p.scoops > 0) return { qty: `${p.scoops}`, rate: total / p.scoops, note: `${p.scoops} scoop${p.scoops === 1 ? '' : 's'} × ${num(p.scoopGrams)} g` };
  let unit = p.unit || 'pcs';
  let qty = Number(p.quantity) || 0;
  let rate = (Number(p.price) || 0) / (Number(p.priceQty) || 1);
  if (BIG[unit]) { qty /= 1000; rate *= 1000; unit = BIG[unit]; }
  return { qty: unit === 'pcs' ? num(qty) : `${num(qty)}${unit === 'ltr' ? 'L' : unit}`, rate, note: unit === 'pcs' ? '' : `₹${money(rate)} / ${unit}` };
};

/**
 * bill: { invoice, date, customerName, mobile, customerGst, billedBy, billType, paymentMethod,
 *         items: [{ name, quantity, unit, price, priceQty, total, boxes, boxSize, scoops, scoopGrams, gstIncluded }],
 *                  discountAmount, discountLabel (per-line discount) }],
 *         gross, itemDiscountAmount, discountLabel, discountAmount, subTotal, gstAmount, total }
 * shop: settings ({ shopName, address, phoneNumber, gstNumber, openingHours })
 */
export function buildReceiptHtml(bill, shop = {}) {
  const name = shop.shopName || 'Ifrutico';
  const when = bill.date ? new Date(bill.date) : new Date();
  const date = when.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const time = when.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const items = bill.items || [];
  const gst = r2(bill.gstAmount);
  const cgst = r2(gst / 2);
  const sgst = r2(gst - cgst);
  const units = items.reduce((s, p) => s + (p.boxes || p.scoops || (p.unit === 'pcs' || !p.unit ? Number(p.quantity) || 0 : 1)), 0);
  const itemSaved = r2(bill.itemDiscountAmount);
  const billSaved = r2(bill.discountAmount);
  const saved = r2(itemSaved + billSaved);
  const pay = PAY[String(bill.paymentMethod || '').toLowerCase()] || bill.paymentMethod || 'Cash';

  const meta = [
    ['Bill No', bill.invoice],
    ['Date', `${date}  ${time}`],
    bill.billedBy ? ['Cashier', bill.billedBy] : null,
    bill.billType && bill.billType !== 'retail' ? ['Type', TYPE[bill.billType] || bill.billType] : null,
  ].filter(Boolean);
  const cust = [
    ['Customer', bill.customerName],
    bill.mobile ? ['Mobile', `+91 ${String(bill.mobile).replace(/(\d{5})(\d{5})/, '$1 $2')}`] : null,
    bill.customerGst ? ['GSTIN', bill.customerGst] : null,
  ].filter(Boolean);
  const kv = (rows) => rows.map(([k, v]) => `<div class="kv"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('');

  const rows = items.map((p, i) => {
    const l = lineOf(p);
    return `<tr>
      <td class="it"><div class="nm">${i + 1}. ${esc(p.name)}</div>${l.note || p.gstIncluded ? `<div class="sub">${esc(l.note)}${l.note && p.gstIncluded ? ' · ' : ''}${p.gstIncluded ? 'incl. GST' : ''}</div>` : ''}${Number(p.discountAmount) > 0 ? `<div class="sub disc">${esc(p.discountLabel || 'Discount')} − ₹${money(p.discountAmount)}</div>` : ''}</td>
      <td class="c">${esc(l.qty)}</td>
      <td class="r">${money(l.rate)}</td>
      <td class="r b">${money(p.total)}</td>
    </tr>`;
  }).join('');

  const sumRow = (k, v, cls = '') => `<div class="sr ${cls}"><span>${esc(k)}</span><span>${v}</span></div>`;

  return `<!doctype html><html><head><meta charset="utf-8"><title>Invoice ${esc(bill.invoice)}</title>
<style>
  * { box-sizing: border-box; }
  :root { --ink:#2b3431; --soft:#6f7a75; --faint:#9aa39f; --line:#d9d6ce; --tint:#f2f7f1; --accent:#17704a; }
  html, body { margin:0; padding:0; background:#eceae4; }
  body { font-family: 'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif; color:var(--ink); font-size:11px; line-height:1.4;
         -webkit-print-color-adjust:exact; print-color-adjust:exact; font-variant-numeric: tabular-nums; }
  .paper { margin:16px auto; background:#fff; box-shadow:0 6px 24px rgba(0,0,0,.08); border-radius:4px; }
  .center { text-align:center; }
  .logo { display:block; margin:0 auto 4px; width:62%; max-width:190px; height:auto; }
  .brand { font-size:12px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:var(--ink); }
  .tag { font-size:9px; letter-spacing:2.5px; text-transform:uppercase; color:var(--accent); margin-top:2px; }
  .addr { color:var(--soft); font-size:10px; margin-top:6px; }
  .title { margin:10px 0 8px; display:flex; align-items:center; gap:8px; font-size:10px; font-weight:700; letter-spacing:3px; color:var(--soft); }
  .title:before, .title:after { content:''; flex:1; border-top:1px dashed var(--line); }
  .kv { display:flex; justify-content:space-between; gap:8px; padding:1.5px 0; }
  .kv span { color:var(--soft); }
  .kv b { font-weight:600; text-align:right; word-break:break-word; }
  .box { background:var(--tint); border-radius:6px; padding:6px 8px; margin-top:6px; }
  .dash { border-top:1px dashed var(--line); margin:8px 0; }
  table { width:100%; border-collapse:collapse; }
  th { font-size:9px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:var(--soft); padding:0 0 5px; border-bottom:1px solid var(--line); }
  td { padding:5px 0; vertical-align:top; border-bottom:1px dotted #e6e3dc; }
  tr:last-child td { border-bottom:0; }
  .it { padding-right:4px; } .nm { font-weight:600; } .sub { color:var(--faint); font-size:9.5px; margin-top:1px; }
  .c { text-align:center; white-space:nowrap; padding:5px 4px; } .r { text-align:right; white-space:nowrap; padding-left:8px; } .b { font-weight:700; }
  th.c { text-align:center; padding-left:4px; padding-right:4px; } th.r { text-align:right; padding-left:8px; } th:first-child { text-align:left; }
  .sr { display:flex; justify-content:space-between; padding:2px 0; color:var(--soft); }
  .sr span:last-child { color:var(--ink); font-weight:600; }
  .sr.save span { color:var(--accent); }
  .sub.disc { color:var(--accent); }
  .total { display:flex; justify-content:space-between; align-items:baseline; margin-top:6px; padding:8px 10px; border:1px solid var(--line); border-radius:6px; background:var(--tint); }
  .total span { font-size:10px; font-weight:700; letter-spacing:2px; color:var(--soft); }
  .total b { font-size:18px; font-weight:800; }
  .words { font-size:9.5px; color:var(--soft); margin-top:5px; font-style:italic; }
  .gst th, .gst td { font-size:9.5px; text-align:right; padding:3px 0; border:0; }
  .gst th:first-child, .gst td:first-child { text-align:left; }
  .gst thead th { border-bottom:1px solid var(--line); }
  .saved { margin-top:8px; border:1px dashed var(--accent); border-radius:6px; padding:7px; text-align:center; color:var(--accent); font-weight:700; font-size:11.5px; }
  .foot { text-align:center; margin-top:10px; }
  .thanks { font-size:13px; font-weight:700; }
  .small { color:var(--faint); font-size:9px; margin-top:3px; }
  .inv { margin-top:8px; font-family: 'SFMono-Regular',Menlo,Consolas,monospace; font-size:10px; letter-spacing:1.5px; color:var(--soft); }
  @media print { html, body { background:#fff; } .paper { margin:0; box-shadow:none; border-radius:0; } }
  ${pageCss(shop)}
</style></head>
<body><div class="paper">
  <div class="center">
    <img class="logo" src="${esc(logoSrc())}" alt="${esc(name)}">
    <div class="brand">${esc(name)}</div>
    <div class="addr">${[shop.address, shop.phoneNumber ? `Ph: ${shop.phoneNumber}` : '', shop.gstNumber ? `GSTIN: ${shop.gstNumber}` : ''].filter(Boolean).map(esc).join('<br>')}</div>
  </div>

  <div class="title">TAX INVOICE</div>
  ${kv(meta)}
  <div class="box">${kv(cust)}</div>

  <div class="dash"></div>
  <table>
    <thead><tr><th>Item</th><th class="c">Qty</th><th class="r">Rate</th><th class="r">Amount</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="dash"></div>

  ${sumRow(`Items: ${items.length}`, `Qty: ${num(units)}`)}
  ${saved > 0 ? sumRow('Items total', `₹${money(bill.gross)}`) : ''}
  ${itemSaved > 0 ? sumRow('Item discounts', `− ₹${money(itemSaved)}`, 'save') : ''}
  ${billSaved > 0 ? sumRow(bill.discountLabel || 'Discount', `− ₹${money(billSaved)}`, 'save') : ''}
  ${sumRow(saved > 0 ? 'Taxable value' : 'Subtotal', `₹${money(bill.subTotal)}`)}
  ${sumRow('CGST @ 2.5%', `₹${money(cgst)}`)}
  ${sumRow('SGST @ 2.5%', `₹${money(sgst)}`)}
  <div class="total"><span>TOTAL</span><b>₹${money(bill.total)}</b></div>
  <div class="words">${esc(words(r2(bill.total)))}</div>

  <div class="dash"></div>
  ${kv([['Paid by', pay], ['Amount paid', `₹${money(bill.total)}`]])}

  <div class="dash"></div>
  <table class="gst">
    <thead><tr><th>GST summary</th><th>Taxable</th><th>CGST</th><th>SGST</th></tr></thead>
    <tbody><tr><td>5% (2.5 + 2.5)</td><td>${money(bill.subTotal)}</td><td>${money(cgst)}</td><td>${money(sgst)}</td></tr></tbody>
  </table>

  ${saved > 0 ? `<div class="saved">You saved ₹${money(saved)} on this bill!</div>` : ''}

  <div class="foot">
    <div class="thanks">Thank you for visiting!</div>
    <div class="small">Made fresh with real fruit. Please check your order before leaving.</div>
    ${shop.openingHours ? `<div class="small">Open ${esc(shop.openingHours)}</div>` : ''}
    <div class="small">ifrutico.com</div>
    <div class="inv">${esc(bill.invoice)}</div>
  </div>
</div></body></html>`;
}

// Opens the receipt in a new window and prints it. Returns false if pop-ups are blocked.
export function printReceipt(bill, shop) {
  const win = window.open('', '_blank');
  if (!win) return false;
  const html = DOMPurify.sanitize(buildReceiptHtml(bill, shop), { WHOLE_DOCUMENT: true, ADD_TAGS: ['style'] });
  win.document.write(`<!doctype html>${html}`);
  win.document.close();
  // Print once the logo has loaded (fallback in case the load event never fires)
  let printed = false;
  const go = () => { if (!printed) { printed = true; win.print(); } };
  win.onload = go;
  setTimeout(go, 1200);
  return true;
}
