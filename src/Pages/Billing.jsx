import { useState, useEffect, useRef, useMemo } from 'react';
import { Plus, Minus, Trash2, Send, Search, Printer, X, Banknote, Smartphone, IceCreamCone, ShoppingBag, ChevronRight, ChevronLeft, Calendar, UserRound, Check } from 'lucide-react';
import { apiFetch, assetUrl } from '../utils/api';
import { useAuth } from '../Context/AuthContext';
import toast from 'react-hot-toast';
import { buildBillMessage } from '../utils/whatsappBill';
import { unitOf, unitStep, unitInitial, isLowStock, formatQty, formatStock, unitPrice, perLabel } from '../utils/units';
import { billTotals } from '../utils/gst';
import { createPortal } from 'react-dom';

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const inputCls = 'w-full h-11 px-3.5 border border-gray-200 bg-white text-sm outline-none transition-all';
const labelCls = 'block text-sm font-medium text-gray-700 mb-1.5';
const MIN_ANIMATION_MS = 1400; // let the "printing" animation play even when the API answers instantly

// Fixed confetti burst (angle-spread pieces) so renders stay pure
const CONFETTI = Array.from({ length: 18 }, (_, i) => {
  const angle = (i / 18) * Math.PI * 2;
  const dist = 90 + (i % 3) * 30;
  return {
    x: `${Math.round(Math.cos(angle) * dist)}px`,
    y: `${Math.round(Math.sin(angle) * dist)}px`,
    r: `${(i % 2 ? 1 : -1) * (180 + i * 20)}deg`,
    color: ['#00754A', '#d4e9e2', '#f59e0b', '#ef4444', '#3b82f6', '#a855f7'][i % 6],
  };
});

// Suggestion list under the name / mobile inputs. onMouseDown (not onClick) so the input's blur doesn't close it first.
function CustomerSuggestions({ items, onPick }) {
  return (
    <ul className="absolute z-30 left-0 right-0 mt-1 max-h-56 overflow-auto rounded-xl border border-gray-200 bg-white shadow-xl">
      {items.map((c) => (
        <li key={c._id}>
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); onPick(c); }}
            className="sb-square w-full text-left px-4 py-2.5 hover:bg-emerald-50 transition-colors border-b border-gray-50 last:border-0"
          >
            <div className="font-medium text-gray-900 text-sm">{c.name}</div>
            <div className="text-xs text-gray-500">
              {c.mobile}{c.email ? ` · ${c.email}` : ''}{c.gstNumber ? ` · GST ${c.gstNumber}` : ''}
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}

function ProductThumb({ product, className }) {
  const [broken, setBroken] = useState(false);
  const src = product.images?.[0];
  return src && !broken ? (
    <img src={assetUrl(src)} alt={product.itemName} loading="lazy" onError={() => setBroken(true)} className={`object-cover ${className}`} />
  ) : (
    <div className={`flex items-center justify-center bg-emerald-50 text-emerald-700/40 ${className}`}>
      <IceCreamCone size={28} strokeWidth={1.5} />
    </div>
  );
}

// 1 Products -> 2 Customer -> 3 Done
function Steps({ current }) {
  const steps = ['Products', 'Customer', 'Done'];
  return (
    <ol className="flex items-center gap-2 text-xs font-medium">
      {steps.map((s, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;
        return (
          <li key={s} className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors ${done ? 'bg-emerald-700 text-white' : active ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-400'}`}>
              {done ? <Check size={13} strokeWidth={3} /> : n}
            </span>
            <span className={active ? 'text-gray-900' : 'text-gray-400'}>{s}</span>
            {n < steps.length && <span className={`w-6 h-px ${done ? 'bg-emerald-700' : 'bg-gray-200'}`} />}
          </li>
        );
      })}
    </ol>
  );
}

export default function Billing() {
  const { user } = useAuth();
  const canAutofill = user?.role === 'admin'; // saved-customer suggestions are admin-only
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [billItems, setBillItems] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerGst, setCustomerGst] = useState('');

  // Returning-customer autofill: typing a name or mobile suggests saved customers
  const [suggestField, setSuggestField] = useState(null); // 'name' | 'mobile' | null (which input is focused)
  const [suggestions, setSuggestions] = useState([]);
  const suggestQuery = (suggestField === 'mobile' ? customerMobile : customerName).trim();
  const visibleSuggestions = suggestField && suggestQuery.length >= 2 ? suggestions : [];

  useEffect(() => {
    if (!suggestField || suggestQuery.length < 2) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const res = await apiFetch(`/customers/search?q=${encodeURIComponent(suggestQuery)}`);
        if (cancelled) return;
        const list = res.data || [];
        setSuggestions(list);
        // A complete mobile number that matches a saved customer fills whatever is still empty
        if (suggestField === 'mobile' && suggestQuery.length === 10 && list[0]?.mobile === suggestQuery) {
          const c = list[0];
          setCustomerName((v) => v || c.name || '');
          setCustomerEmail((v) => v || c.email || '');
          setCustomerGst((v) => v || c.gstNumber || '');
        }
      } catch {
        if (!cancelled) setSuggestions([]);
      }
    }, 250);
    return () => { cancelled = true; clearTimeout(t); };
  }, [suggestField, suggestQuery]);

  const pickCustomer = (c) => {
    setCustomerName(c.name || '');
    setCustomerMobile(c.mobile || '');
    setCustomerEmail(c.email || '');
    setCustomerGst(c.gstNumber || '');
    setSuggestField(null);
    setSuggestions([]);
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('all');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  // Checkout popup: null (closed) | 'details' (step 2) | 'generating' (animation) | 'done' (step 3)
  const [checkout, setCheckout] = useState(null);
  const [lastBill, setLastBill] = useState(null);
  const [settings, setSettings] = useState(null);
  const searchRef = useRef(null);
  const nameRef = useRef(null);

  const handlePrint = () => {
    if (!lastBill) return;
    const escape = (str) => String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    const win = window.open('', '_blank');

    const shopName = settings?.shopName || 'Ifrutico';
    const shopAddress = settings?.address || '';
    const shopGst = settings?.gstNumber || '';
    const openingHours = settings?.openingHours || '';

    // Construct HTML safely using escaping
    const htmlContent = `
      <html><head><title>Invoice ${escape(lastBill.invoice)}</title>
      <style>body{font-family:sans-serif;padding:20px;max-width:400px;margin:auto}
      h2{text-align:center;margin-bottom:5px;}
      .shop-details{text-align:center;font-size:0.9em;color:#555;margin-bottom:15px;}
      .shop-details p{margin:2px 0;}
      hr{border:1px solid #ccc;border-top:1px dashed #ccc;}
      .row{display:flex;justify-content:space-between;padding:4px 0}
      .total{font-size:1.2em;font-weight:bold}</style></head>
      <body>
        <h2>${escape(shopName)}</h2>
        <div class="shop-details">
          ${shopAddress ? `<p>${escape(shopAddress)}</p>` : ''}
          ${shopGst ? `<p>GSTIN: ${escape(shopGst)}</p>` : ''}
          ${openingHours ? `<p>Hours: ${escape(openingHours)}</p>` : ''}
        </div>
        <hr/>
        <h3 style="text-align:center;margin:10px 0;">INVOICE</h3>
        <p style="text-align:center;margin-top:0;">${escape(lastBill.invoice)}</p>
        <hr/>
        <div class="row"><span>Customer:</span><span>${escape(lastBill.customerName)}</span></div>
        <div class="row"><span>Mobile:</span><span>${escape(lastBill.mobile)}</span></div>
        ${lastBill.customerGst ? `<div class="row"><span>Customer GSTIN:</span><span>${escape(lastBill.customerGst)}</span></div>` : ''}
        <div class="row"><span>Date:</span><span>${escape(lastBill.date)}</span></div>
        <hr/>
        ${lastBill.items.map((p) => `<div class="row"><span>${escape(p.name)} × ${escape(p.qty)}</span><span>₹${escape(p.total)}</span></div>`).join('')}
        <hr/>
        <div class="row" style="color:#555"><span>Subtotal</span><span>₹${escape((lastBill.subTotal || 0).toLocaleString('en-IN'))}</span></div>
        <div class="row" style="color:#555"><span>GST (5%)</span><span>₹${escape((lastBill.gstAmount || 0).toLocaleString('en-IN'))}</span></div>
        <div class="row" style="color:#555"><span>Payment</span><span>${escape(lastBill.paymentMethod)}</span></div>
        <hr/>
        <div class="row total"><span>TOTAL</span><span>₹${escape(lastBill.total.toLocaleString('en-IN'))}</span></div>
      </body></html>
    `;

    win.document.write(htmlContent);
    win.document.close();
    setTimeout(() => win.print(), 250);
  };

  // Fetch products and settings from backend
  useEffect(() => {
    apiFetch('/product/fetch?limit=100')
      .then((data) => setProducts(data.data || []))
      .catch(console.error)
      .finally(() => setLoadingProducts(false));

    apiFetch('/settings')
      .then(data => setSettings(data.data))
      .catch(() => {});
  }, []);

  // Step 2 opens with the name field focused; Escape closes it (but never mid-generation)
  useEffect(() => {
    if (checkout === 'details') setTimeout(() => nameRef.current?.focus(), 50);
    if (!checkout) return;
    const onKey = (e) => { if (e.key === 'Escape' && checkout === 'details') setCheckout(null); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [checkout]);

  const categories = useMemo(() => [...new Set(products.map((p) => p.category).filter(Boolean))].sort(), [products]);

  const term = searchTerm.trim().toLowerCase();
  const filteredProducts = products.filter((p) =>
    (category === 'all' || p.category === category) &&
    (!term || p.itemName.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term))
  );

  const qtyInBill = (id) => billItems.find((b) => b.item._id === id)?.quantity;

  const addItem = (product) => {
    if (product.stock <= 0) {
      toast.error(`Sorry, ${product.itemName} is out of stock!`);
      return;
    }

    const existingItem = billItems.find((b) => b.item._id === product._id);
    if (existingItem && existingItem.quantity >= product.stock) {
      toast.error(`Only ${formatStock(product.stock, product)} available!`);
      return;
    }

    if (existingItem) {
      changeQuantity(product._id, 1);
    } else {
      const qty = Math.min(unitInitial(product), product.stock);
      setBillItems([...billItems, { item: product, quantity: qty, subtotal: money(qty * unitPrice(product)) }]);
    }
  };

  // Enter in the search box adds the first in-stock match (fast keyboard / barcode-scanner flow)
  const handleSearchKey = (e) => {
    if (e.key !== 'Enter') return;
    const first = filteredProducts.find((p) => p.stock > 0);
    if (first) { addItem(first); setSearchTerm(''); }
  };

  // Keep decimals tidy (0.1 + 0.2 -> 0.3) for quantities in kg/ltr and for money
  const round3 = (n) => Number(Number(n).toFixed(3));
  const money = (n) => Number(Number(n).toFixed(2));

  // +/- buttons move by the unit's natural step (1 pcs, 0.5 kg/ltr, 100 g/ml), capped at available stock
  const changeQuantity = (id, direction) => {
    setBillItems(
      billItems
        .map((b) => {
          if (b.item._id !== id) return b;
          const newQty = Math.min(b.item.stock, Math.max(0, round3((Number(b.quantity) || 0) + direction * unitStep(b.item))));
          return { ...b, quantity: newQty, subtotal: money(newQty * unitPrice(b.item)) };
        })
        .filter((b) => b.quantity > 0)
    );
  };

  // Typed quantity (e.g. 0.75 kg). Empty is allowed while typing; it is validated on Continue.
  const setQuantity = (id, raw) => {
    setBillItems(
      billItems.map((b) => {
        if (b.item._id !== id) return b;
        if (raw === '') return { ...b, quantity: '', subtotal: 0 };
        let q = parseFloat(raw);
        if (Number.isNaN(q) || q < 0) return b;
        q = unitOf(b.item) === 'pcs' ? Math.floor(q) : round3(q);
        if (q > b.item.stock) {
          toast.error(`Only ${formatStock(b.item.stock, b.item)} available!`);
          q = b.item.stock;
        }
        return { ...b, quantity: q, subtotal: money(q * unitPrice(b.item)) };
      })
    );
  };

  const removeItem = (id) => setBillItems(billItems.filter((b) => b.item._id !== id));

  // Items priced "incl. GST" add nothing on top; others get +5% (same rule as the server)
  const { subTotal, gstAmount, total } = billTotals(billItems);
  const hasInclusive = billItems.some((b) => b.item.gstIncluded);

  const clearBill = () => {
    setBillItems([]);
    setCustomerName('');
    setCustomerMobile('');
    setCustomerEmail('');
    setCustomerGst('');
    setPaymentMethod('Cash');
  };

  // Step 1 -> 2
  const goToCustomer = () => {
    if (billItems.length === 0) { toast.error('Add at least one product.'); return; }
    if (billItems.some((b) => !(Number(b.quantity) > 0))) { toast.error('Enter a quantity greater than 0 for every product.'); return; }
    setCheckout('details');
  };

  // Step 2 -> animation -> 3
  const handleGenerateBill = async (e) => {
    e?.preventDefault();
    if (!customerName.trim()) { toast.error('Customer name is required.'); return; }
    if (!/^[0-9]{10}$/.test(customerMobile)) { toast.error('Enter a valid 10-digit mobile number.'); return; }
    const gst = customerGst.trim().toUpperCase();

    setCheckout('generating');
    try {
      const payload = {
        customerName: customerName.trim(),
        mobileNumber: customerMobile,
        customerEmail: customerEmail.trim(),
        customerGstNumber: gst,
        paymentMethod,
        products: billItems.map((b) => ({ productId: b.item._id, quantity: Number(b.quantity) })),
      };
      const [res] = await Promise.all([
        apiFetch('/bill/add', { method: 'POST', body: payload }),
        new Promise((r) => setTimeout(r, MIN_ANIMATION_MS)),
      ]);
      const emailSent = customerEmail.trim() !== '';
      setLastBill({
        customerName: customerName.trim(),
        mobile: customerMobile,
        email: customerEmail.trim(),
        customerGst: gst,
        invoice: res.data?.invoiceNumber,
        subTotal: res.data?.subTotal || subTotal,
        gstAmount: res.data?.gstAmount || gstAmount,
        total: res.data?.totalAmount || total,
        paymentMethod,
        emailSent,
        date: new Date().toLocaleDateString(),
        items: billItems.map(b => ({ name: b.item.itemName, qty: formatQty(b.quantity, unitOf(b.item)), price: b.item.price, per: perLabel(b.item), total: b.subtotal }))
      });
      setCheckout('done');
      clearBill();
      // Refresh products to reflect updated stock
      apiFetch('/product/fetch?limit=100').then((d) => setProducts(d.data || []));
    } catch (err) {
      toast.error(err.message);
      setCheckout('details'); // keep everything entered so it can be retried
    }
  };

  const sendWhatsApp = () => {
    if (!lastBill) return;

    const text = buildBillMessage({
      customerName: lastBill.customerName,
      invoice: lastBill.invoice,
      items: lastBill.items,
      subTotal: lastBill.subTotal,
      gstAmount: lastBill.gstAmount,
      total: lastBill.total,
      paymentMethod: lastBill.paymentMethod,
      gstNumber: settings?.gstNumber,
    });

    const url = `https://wa.me/91${lastBill.mobile}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const startNewBill = () => {
    setCheckout(null);
    setLastBill(null);
    setTimeout(() => searchRef.current?.focus(), 50);
  };

  const itemCount = billItems.length;
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <div className="animate-fade-in-up">
      <div className="mx-auto max-w-screen-2xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">New Bill</h1>
            <Steps current={1} />
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-medium">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-600"><Calendar size={14} /> {today}</span>
            {user?.name && <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-600"><UserRound size={14} /> {user.name}</span>}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px] gap-6 items-start">
          {/* Left – Product catalogue */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm min-w-0">
            <div className="p-4 sm:p-5 space-y-3 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder={loadingProducts ? 'Loading products...' : 'Search name or SKU (Enter adds first match)'}
                  value={searchTerm}
                  disabled={loadingProducts}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleSearchKey}
                  className="w-full h-12 pl-11 pr-10 border border-gray-200 bg-white outline-none text-gray-900 placeholder-gray-400"
                />
                {searchTerm && (
                  <button type="button" onClick={() => { setSearchTerm(''); searchRef.current?.focus(); }} aria-label="Clear search"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100">
                    <X size={16} />
                  </button>
                )}
              </div>

              {categories.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {['all', ...categories].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategory(c)}
                      className={`shrink-0 px-4 h-9 text-sm font-medium capitalize border transition-colors ${category === c ? 'bg-gray-900 border-gray-900 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'}`}
                    >
                      {c === 'all' ? 'All' : c}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 sm:p-5">
              {loadingProducts ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="rounded-xl border border-gray-100 overflow-hidden animate-pulse">
                      <div className="aspect-[4/3] bg-gray-100" />
                      <div className="p-3 space-y-2"><div className="h-3 bg-gray-100 rounded w-3/4" /><div className="h-3 bg-gray-100 rounded w-1/2" /></div>
                    </div>
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="py-16 text-center">
                  <IceCreamCone size={40} strokeWidth={1.25} className="mx-auto text-gray-300" />
                  <p className="mt-3 font-medium text-gray-700">No products found</p>
                  <p className="text-sm text-gray-500">{products.length ? 'Try another name, SKU or category.' : 'Add products on the Stock page first.'}</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                  {filteredProducts.map((p) => {
                    const out = p.stock <= 0;
                    const inBill = qtyInBill(p._id);
                    return (
                      <button
                        key={p._id}
                        type="button"
                        onClick={() => addItem(p)}
                        disabled={out}
                        className={`sb-square group relative text-left bg-white border overflow-hidden transition-all ${inBill ? 'border-emerald-600 ring-2 ring-emerald-600/20' : 'border-gray-200 hover:border-emerald-500 hover:-translate-y-0.5'} ${out ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="relative aspect-[4/3] bg-gray-50 overflow-hidden">
                          <ProductThumb product={p} className="w-full h-full transition-transform duration-300 group-hover:scale-105" />
                          {inBill && (
                            <span className="absolute top-2 right-2 min-w-[1.75rem] h-7 px-2 rounded-full bg-emerald-700 text-white text-xs font-bold flex items-center justify-center shadow">
                              {formatQty(inBill, unitOf(p))}
                            </span>
                          )}
                          {out && <span className="absolute inset-x-0 bottom-0 bg-gray-900/80 text-white text-[11px] font-semibold uppercase tracking-wider text-center py-1">Out of stock</span>}
                        </div>
                        <div className="p-3">
                          <div className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 min-h-[2.5rem]">{p.itemName}</div>
                          <div className="mt-1 font-bold text-emerald-700">₹{p.price}<span className="text-xs font-normal text-gray-500">{perLabel(p)}</span></div>
                          <div className={`mt-1 text-[11px] font-medium truncate ${isLowStock(p) && !out ? 'text-amber-600' : 'text-gray-500'}`}>
                            {out ? 'None left' : `${formatStock(p.stock, p)} left`}
                          </div>
                        </div>
                        {!out && (
                          <span className="absolute bottom-3 right-3 w-7 h-7 rounded-full bg-emerald-700 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Plus size={16} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* Right – Order (products + quantities) */}
          <aside className="lg:sticky lg:top-24 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col lg:max-h-[calc(100vh-8rem)]">
            <div className="px-5 py-4 bg-gray-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShoppingBag size={20} />
                <h2 className="text-lg font-semibold">Order</h2>
                {itemCount > 0 && <span className="px-2 py-0.5 rounded-full bg-white/15 text-xs font-semibold">{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>}
              </div>
              {itemCount > 0 && (
                <button type="button" onClick={clearBill} className="text-sm font-medium text-white/80 hover:text-white px-3 py-1 hover:bg-white/10">
                  Clear
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {itemCount === 0 ? (
                <div className="py-10 text-center">
                  <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center"><ShoppingBag size={24} /></div>
                  <p className="mt-3 font-medium text-gray-700">No items yet</p>
                  <p className="text-sm text-gray-500">Tap a product to add it, then set the quantity.</p>
                </div>
              ) : (
                <ul className="space-y-4">
                  {billItems.map((bi) => (
                    <li key={bi.item._id} className="flex gap-3 bill-rise">
                      <ProductThumb product={bi.item} className="w-12 h-12 rounded-lg shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="font-medium text-gray-900 text-sm truncate">{bi.item.itemName}</div>
                            <div className="text-xs text-gray-500">
                              ₹{bi.item.price}{perLabel(bi.item)}
                              {bi.item.gstIncluded && <span className="ml-1.5 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] font-semibold uppercase">incl. GST</span>}
                            </div>
                          </div>
                          <div className="font-semibold text-gray-900 text-sm whitespace-nowrap">{inr(bi.subtotal)}</div>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center border border-gray-200 rounded-full p-0.5">
                            <button type="button" onClick={() => changeQuantity(bi.item._id, -1)} aria-label={`Decrease ${bi.item.itemName}`}
                              className="w-8 h-8 hover:bg-gray-100 flex items-center justify-center text-gray-600">
                              <Minus size={14} />
                            </button>
                            <input
                              type="number"
                              inputMode="decimal"
                              min="0"
                              step={unitStep(bi.item)}
                              value={bi.quantity}
                              onChange={(e) => setQuantity(bi.item._id, e.target.value)}
                              aria-label={`Quantity in ${unitOf(bi.item)}`}
                              className="w-14 h-8 text-center font-semibold text-sm text-gray-900 bg-transparent !border-0 !shadow-none outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            />
                            {unitOf(bi.item) !== 'pcs' && <span className="text-xs text-gray-400 pr-1">{unitOf(bi.item)}</span>}
                            <button type="button" onClick={() => changeQuantity(bi.item._id, 1)} aria-label={`Increase ${bi.item.itemName}`}
                              className="w-8 h-8 hover:bg-gray-100 flex items-center justify-center text-gray-600">
                              <Plus size={14} />
                            </button>
                          </div>
                          <button type="button" onClick={() => removeItem(bi.item._id)} aria-label={`Remove ${bi.item.itemName}`}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="p-5 border-t border-gray-100 bg-gray-50/60 space-y-4">
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{inr(subTotal)}</span></div>
                <div className="flex justify-between text-gray-600"><span>GST (5%)</span><span>{inr(gstAmount)}</span></div>
                {hasInclusive && <p className="text-xs text-gray-500">Items marked "incl. GST" already contain their GST.</p>}
                <div className="flex justify-between items-baseline pt-2">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="text-3xl font-bold text-emerald-700 tracking-tight">{inr(total)}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={goToCustomer}
                disabled={itemCount === 0}
                className="w-full h-12 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold flex items-center justify-center gap-2 shadow-lg"
              >
                Continue to customer <ChevronRight size={18} />
              </button>
            </div>
          </aside>
        </div>

        {/* Mobile: total + Continue, stays at the bottom while browsing products */}
        {itemCount > 0 && (
          <div className="lg:hidden sticky bottom-3 z-20">
            <button
              type="button"
              onClick={goToCustomer}
              className="w-full h-14 px-5 bg-gray-900 text-white flex items-center justify-between shadow-xl sb-keep-shadow"
            >
              <span className="flex items-center gap-2 text-sm font-medium"><ShoppingBag size={18} /> {itemCount} {itemCount === 1 ? 'item' : 'items'} · {inr(total)}</span>
              <span className="flex items-center gap-1 font-semibold">Continue <ChevronRight size={18} /></span>
            </button>
          </div>
        )}
      </div>

      {checkout && createPortal(
        <div
          className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 sm:p-4 animate-fade-in"
          onClick={() => checkout === 'details' && setCheckout(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Checkout"
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-w-md w-full flex flex-col overflow-hidden animate-zoom-in max-h-[92vh]"
          >
            {/* Step 2: customer details */}
            {checkout === 'details' && (
              <form onSubmit={handleGenerateBill} className="flex flex-col min-h-0">
                <div className="px-6 pt-5 pb-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <Steps current={2} />
                    <button type="button" onClick={() => setCheckout(null)} aria-label="Close" className="p-2 -mr-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100">
                      <X size={20} />
                    </button>
                  </div>
                  <h3 className="mt-3 text-xl font-semibold text-gray-900">Customer details</h3>
                  <p className="text-sm text-gray-500">{itemCount} {itemCount === 1 ? 'item' : 'items'} · <span className="font-semibold text-emerald-700">{inr(total)}</span></p>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                  <div className="relative">
                    <label htmlFor="bill-name" className={labelCls}>Customer name <span className="text-red-500">*</span></label>
                    <input
                      ref={nameRef}
                      id="bill-name"
                      type="text"
                      placeholder="Enter customer name"
                      value={customerName}
                      autoComplete="off"
                      onFocus={() => canAutofill && setSuggestField('name')}
                      onBlur={() => setSuggestField(null)}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className={inputCls}
                    />
                    {suggestField === 'name' && visibleSuggestions.length > 0 && <CustomerSuggestions items={visibleSuggestions} onPick={pickCustomer} />}
                  </div>
                  <div className="relative">
                    <label htmlFor="bill-mobile" className={labelCls}>Mobile number <span className="text-red-500">*</span></label>
                    <input
                      id="bill-mobile"
                      type="tel"
                      inputMode="numeric"
                      placeholder="10-digit mobile number"
                      value={customerMobile}
                      maxLength={10}
                      autoComplete="off"
                      onFocus={() => canAutofill && setSuggestField('mobile')}
                      onBlur={() => setSuggestField(null)}
                      onChange={(e) => setCustomerMobile(e.target.value.replace(/\D/g, ''))}
                      className={inputCls}
                    />
                    {suggestField === 'mobile' && visibleSuggestions.length > 0 && <CustomerSuggestions items={visibleSuggestions} onPick={pickCustomer} />}
                  </div>
                  <div>
                    <label htmlFor="bill-email" className={labelCls}>Email <span className="font-normal text-gray-400">(optional, invoice is emailed if filled)</span></label>
                    <input id="bill-email" type="email" placeholder="customer@example.com" value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label htmlFor="bill-gst" className={labelCls}>GST number <span className="font-normal text-gray-400">(optional)</span></label>
                    <input id="bill-gst" type="text" placeholder="e.g. 33ABCDE1234F1Z5" value={customerGst} maxLength={30} autoCapitalize="characters"
                      onChange={(e) => setCustomerGst(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                      className={`${inputCls} uppercase tracking-wider placeholder:normal-case placeholder:tracking-normal`} />
                  </div>

                  <div>
                    <span className={labelCls}>Payment method</span>
                    <div role="radiogroup" aria-label="Payment method" className="grid grid-cols-2 gap-2">
                      {[['Cash', <Banknote key="i" size={18} />], ['UPI', <Smartphone key="i" size={18} />]].map(([m, icon]) => (
                        <button
                          key={m}
                          type="button"
                          role="radio"
                          aria-checked={paymentMethod === m}
                          onClick={() => setPaymentMethod(m)}
                          className={`h-11 flex items-center justify-center gap-2 text-sm font-semibold border transition-colors ${paymentMethod === m ? 'bg-emerald-50 border-emerald-600 text-emerald-800' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'}`}
                        >
                          {icon} {m}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-4 border-t border-gray-100 grid grid-cols-[auto_1fr] gap-3">
                  <button type="button" onClick={() => setCheckout(null)}
                    className="h-12 px-5 border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium flex items-center gap-1">
                    <ChevronLeft size={18} /> Back
                  </button>
                  <button type="submit"
                    className="h-12 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold flex items-center justify-center gap-2">
                    Generate bill · {inr(total)}
                  </button>
                </div>
              </form>
            )}

            {/* Generating: receipt printing animation */}
            {checkout === 'generating' && (
              <div className="px-6 py-12 flex flex-col items-center text-center" aria-live="polite">
                <div className="relative w-40">
                  <div className="relative z-10 h-10 rounded-xl bg-gray-900 flex items-center justify-end px-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <div className="mx-auto w-32 h-36 overflow-hidden -mt-2">
                    <div className="bill-print w-full h-full bg-white border border-gray-200 border-t-0 rounded-b-md shadow-sm px-3 pt-5 space-y-2">
                      <div className="h-2 w-2/3 mx-auto bg-gray-200 rounded" />
                      <div className="h-px bg-gray-200 my-2" />
                      {[80, 60, 70, 50].map((w, i) => (
                        <div key={i} className="flex justify-between gap-2">
                          <div className="h-1.5 bg-gray-200 rounded" style={{ width: `${w}%` }} />
                          <div className="h-1.5 w-4 bg-gray-200 rounded" />
                        </div>
                      ))}
                      <div className="h-px bg-gray-200 my-2" />
                      <div className="flex justify-between"><div className="h-2 w-8 bg-emerald-200 rounded" /><div className="h-2 w-6 bg-emerald-300 rounded" /></div>
                    </div>
                  </div>
                </div>
                <h3 className="mt-6 text-lg font-semibold text-gray-900">Generating bill…</h3>
                <p className="text-sm text-gray-500">Updating stock and creating the invoice</p>
              </div>
            )}

            {/* Step 3: success */}
            {checkout === 'done' && lastBill && (
              <>
                <div className="relative px-6 pt-6 pb-6 bg-gray-900 text-white text-center overflow-hidden">
                  <button type="button" onClick={startNewBill} aria-label="Close" className="absolute top-3 right-3 z-10 p-2 text-white/70 hover:text-white hover:bg-white/10">
                    <X size={20} />
                  </button>
                  <div className="flex justify-center"><div className="bg-white rounded-full px-3 py-1.5"><Steps current={4} /></div></div>

                  <div className="relative mx-auto mt-5 w-20 h-20">
                    {CONFETTI.map((c, i) => (
                      <span
                        key={i}
                        className="bill-confetti absolute left-1/2 top-1/2 w-2 h-3 -ml-1 -mt-1.5 rounded-sm"
                        style={{ background: c.color, '--x': c.x, '--y': c.y, '--r': c.r, animationDelay: '0.35s' }}
                      />
                    ))}
                    <svg viewBox="0 0 52 52" className="bill-pop relative w-20 h-20">
                      <circle cx="26" cy="26" r="24" fill="#00754A" />
                      <path d="M15 27 l7 7 l15 -16" fill="none" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"
                        pathLength="100" className="bill-draw" style={{ animationDelay: '0.3s' }} />
                    </svg>
                  </div>

                  <h3 className="bill-rise mt-4 text-xl font-semibold" style={{ animationDelay: '0.45s' }}>Bill generated!</h3>
                  <p className="bill-rise text-sm text-white/70 font-mono" style={{ animationDelay: '0.5s' }}>{lastBill.invoice}</p>
                  <div className="bill-rise mt-3 text-4xl font-bold tracking-tight" style={{ animationDelay: '0.55s' }}>{inr(lastBill.total)}</div>
                  <p className="bill-rise text-sm text-white/70" style={{ animationDelay: '0.6s' }}>
                    {lastBill.customerName} · {lastBill.paymentMethod}
                    {lastBill.emailSent && <><br />Invoice emailed to {lastBill.email}</>}
                  </p>
                </div>

                <div className="bill-rise flex-1 overflow-y-auto px-6 py-4" style={{ animationDelay: '0.7s' }}>
                  <ul className="divide-y divide-dashed divide-gray-200 text-sm">
                    {lastBill.items.map((it, i) => (
                      <li key={i} className="flex justify-between gap-3 py-2">
                        <span className="text-gray-700 truncate">{it.name} <span className="text-gray-400">× {it.qty}</span></span>
                        <span className="font-medium text-gray-900 whitespace-nowrap">{inr(it.total)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bill-rise p-4 border-t border-gray-100 grid grid-cols-2 gap-3" style={{ animationDelay: '0.8s' }}>
                  <button type="button" onClick={sendWhatsApp}
                    className="h-12 bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold flex items-center justify-center gap-2">
                    <Send size={18} /> WhatsApp
                  </button>
                  <button type="button" onClick={handlePrint}
                    className="h-12 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold flex items-center justify-center gap-2">
                    <Printer size={18} /> Print
                  </button>
                  <button type="button" onClick={startNewBill}
                    className="col-span-2 h-11 border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium">
                    Start new bill
                  </button>
                </div>
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
