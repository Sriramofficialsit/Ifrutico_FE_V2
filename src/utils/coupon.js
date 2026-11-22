// Coupon maths for the New Bill preview. KEEP IN SYNC with BE/utils/coupon.js (the server re-checks every bill).
const r2 = (n) => Number(Number(n).toFixed(2));

export const couponDiscount = (coupon, gross) => {
  if (!coupon || !(gross > 0)) return 0;
  let d = coupon.type === 'percent' ? (gross * Math.min(coupon.value, 100)) / 100 : coupon.value;
  if (coupon.type === 'percent' && coupon.maxDiscount > 0) d = Math.min(d, coupon.maxDiscount);
  return r2(Math.min(d, gross));
};

// "20% OFF (up to ₹100)" / "₹50 OFF"
export const offerText = (c) =>
  c.type === 'percent' ? `${c.value}% OFF${c.maxDiscount > 0 ? ` (up to ₹${c.maxDiscount})` : ''}` : `₹${c.value} OFF`;
