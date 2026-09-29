// GST maths shared by the New Bill screen. Mirrors BE/models/Bill.model.js exactly so the preview equals the saved bill.
//  - product.gstIncluded === false (default): the 5% is added on top of price x qty
//  - product.gstIncluded === true: the price already contains GST, nothing is added; the GST portion is split out
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

// items: [{ subtotal (line as priced), item: { gstIncluded } }]
export const billTotals = (items) => {
  let taxable = 0;
  let gst = 0;
  items.forEach((b) => {
    const s = splitLine(Number(b.subtotal) || 0, !!b.item?.gstIncluded);
    taxable += s.taxable;
    gst += s.gst;
  });
  const subTotal = r2(taxable);
  const gstAmount = r2(gst);
  return { subTotal, gstAmount, total: r2(subTotal + gstAmount) };
};
