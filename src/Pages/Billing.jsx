import { useState, useEffect, useRef } from 'react';
import { Plus, Minus, Trash2, Send, ChevronDown, Search, AlertCircle, Printer, X, User, Shield, Calendar, Banknote, Smartphone } from 'lucide-react';
import { apiFetch, assetUrl } from '../utils/api';
import { useAuth } from '../Context/AuthContext';
import toast from 'react-hot-toast';
import { buildBillMessage } from '../utils/whatsappBill';
import { unitOf, unitStep, unitInitial, isLowStock, formatQty } from '../utils/units';
import { billTotals } from '../utils/gst';
import { createPortal } from 'react-dom';

// Suggestion list under the name / mobile inputs. onMouseDown (not onClick) so the input's blur doesn't close it first.
function CustomerSuggestions({ items, onPick }) {
  return (
    <ul className="absolute z-30 left-0 right-0 mt-1 max-h-64 overflow-auto rounded-xl border border-gray-200 bg-white shadow-xl">
      {items.map((c) => (
        <li key={c._id}>
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); onPick(c); }}
            className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 transition-colors border-b border-gray-50 last:border-0"
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
  const [showDropdown, setShowDropdown] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [showPaymentDropdown, setShowPaymentDropdown] = useState(false);
  const paymentDropdownRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);
  const [lastBill, setLastBill] = useState(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const printRef = useRef(null);

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
  const [settings, setSettings] = useState(null);
  const dropdownRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
      if (paymentDropdownRef.current && !paymentDropdownRef.current.contains(e.target)) {
        setShowPaymentDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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

  const filteredProducts = products.filter((p) =>
    p.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addItem = (product) => {
    if (product.stock <= 0) {
      toast.error(`Sorry, ${product.itemName} is out of stock!`);
      return;
    }

    const existingItem = billItems.find((b) => b.item._id === product._id);
    if (existingItem && existingItem.quantity >= product.stock) {
      toast.error(`Only ${formatQty(product.stock, unitOf(product))} available!`);
      return;
    }
    
    if (existingItem) {
      changeQuantity(product._id, 1);
    } else {
      const qty = Math.min(unitInitial(product), product.stock);
      setBillItems([...billItems, { item: product, quantity: qty, subtotal: money(qty * product.price) }]);
    }
    setSearchTerm('');
    setShowDropdown(false);
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
          return { ...b, quantity: newQty, subtotal: money(newQty * b.item.price) };
        })
        .filter((b) => b.quantity > 0)
    );
  };

  // Typed quantity (e.g. 0.75 kg). Empty is allowed while typing; it is validated on submit.
  const setQuantity = (id, raw) => {
    setBillItems(
      billItems.map((b) => {
        if (b.item._id !== id) return b;
        if (raw === '') return { ...b, quantity: '', subtotal: 0 };
        let q = parseFloat(raw);
        if (Number.isNaN(q) || q < 0) return b;
        q = unitOf(b.item) === 'pcs' ? Math.floor(q) : round3(q);
        if (q > b.item.stock) {
          toast.error(`Only ${formatQty(b.item.stock, unitOf(b.item))} available!`);
          q = b.item.stock;
        }
        return { ...b, quantity: q, subtotal: money(q * b.item.price) };
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
    setPaymentMethod('Cash');
    setPaymentMethod('Cash');
    setLastBill(null);
  };

  const handleGenerateBill = async () => {
    if (!customerName.trim()) { toast.error('Customer name is required.'); return; }
    if (!/^[0-9]{10}$/.test(customerMobile)) { toast.error('Enter a valid 10-digit mobile number.'); return; }
    const gst = customerGst.trim().toUpperCase();
    if (billItems.length === 0) { toast.error('Add at least one product.'); return; }
    if (billItems.some((b) => !(Number(b.quantity) > 0))) { toast.error('Enter a quantity greater than 0 for every product.'); return; }

    setSubmitting(true);
    try {
      const payload = {
        customerName: customerName.trim(),
        mobileNumber: customerMobile,
        customerEmail: customerEmail.trim(),
        customerGstNumber: gst,
        paymentMethod,
        products: billItems.map((b) => ({ productId: b.item._id, quantity: Number(b.quantity) })),
      };
      const res = await apiFetch('/bill/add', { method: 'POST', body: payload });
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
        date: new Date().toLocaleDateString(),
        items: billItems.map(b => ({ name: b.item.itemName, qty: formatQty(b.quantity, unitOf(b.item)), price: b.item.price, total: b.subtotal }))
      });
      setShowPrintModal(true);
      // Clear form but keep WhatsApp state
      setBillItems([]);
      setCustomerName('');
      setCustomerMobile('');
      setCustomerGst('');
      const emailSent = customerEmail.trim() !== "";
      setCustomerEmail('');
      toast.success(emailSent 
        ? `Bill created! Invoice sent to ${customerEmail.trim()}`
        : `Bill created successfully! (Invoice: ${res.data?.invoiceNumber})`
      );
      // Refresh products to reflect updated stock
      apiFetch('/product/fetch?limit=100').then((d) => setProducts(d.data || []));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
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

  return (
    <div className="animate-fade-in-up">
      <div className="mx-auto max-w-screen-2xl space-y-8 md:space-y-10">
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-gray-900">New Bill</h1>
          <p className="text-base sm:text-lg text-gray-600">Create a new order for your customer</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Left – Product Selector */}
          <div className="space-y-6 animate-fade-in-up opacity-0 stagger-1 relative z-20">
            <div className="relative" ref={dropdownRef}>
              <div
                className="w-full h-12 px-4 pr-10 rounded-xl border border-white/70 bg-white/60 backdrop-blur-xl flex items-center justify-between cursor-pointer focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-100"
                onClick={() => setShowDropdown(true)}
              >
                <input
                  type="text"
                  placeholder={loadingProducts ? 'Loading products...' : 'Search product by name or SKU...'}
                  value={searchTerm}
                  disabled={loadingProducts}
                  onChange={(e) => { setSearchTerm(e.target.value); setShowDropdown(true); }}
                  onFocus={() => setShowDropdown(true)}
                  className="w-full bg-transparent outline-none text-gray-900 placeholder-gray-500"
                />
                <Search className="text-gray-400" size={18} />
              </div>

              {showDropdown && !loadingProducts && (
                <div className="absolute z-10 w-full mt-1 bg-white/90 backdrop-blur-xl border border-white/60 rounded-xl shadow-xl max-h-80 overflow-y-auto">
                  {filteredProducts.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">No products found</div>
                  ) : (
                    filteredProducts.map((p) => (
                      <button
                        key={p._id}
                        onClick={() => addItem(p)}
                        disabled={p.stock <= 0}
                        className={`w-full flex items-center gap-4 px-5 py-3 hover:bg-emerald-50 transition-colors text-left border-b border-gray-100 last:border-b-0 ${p.stock <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {/* Product Image Thumbnail */}
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                          {p.images && p.images.length > 0 ? (
                            <img 
                              src={assetUrl(p.images[0])} 
                              alt={p.itemName} 
                              className="w-full h-full object-cover"
                              onError={(e) => { e.target.src = 'https://placehold.co/100x100?text=Product'; }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-[10px] font-bold">IFRU</div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">{p.itemName}</div>
                          <div className="text-xs text-gray-400">{p.sku} • {p.category}</div>
                        </div>
                        <div className="text-sm text-emerald-600 font-semibold">₹{p.price}{unitOf(p) !== 'pcs' && <span className="text-xs font-normal text-gray-400">/{unitOf(p)}</span>}</div>
                        <div className={`text-xs font-medium ${isLowStock(p) ? 'text-amber-600' : 'text-gray-500'}`}>
                          {formatQty(p.stock, unitOf(p))} left
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Added Items */}
            {billItems.length > 0 && (
              <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/70 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-white/60">
                  <h2 className="text-xl font-semibold text-gray-900">Added to Bill ({billItems.length})</h2>
                </div>
                <div className="p-6 space-y-4">
                  {billItems.map((bi) => (
                    <div key={bi.item._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white/50 border border-white/60">
                      
                      {/* Left: Image & Name */}
                      <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-white border border-gray-100 flex-shrink-0 shadow-sm">
                          {bi.item.images && bi.item.images.length > 0 ? (
                            <img 
                              src={assetUrl(bi.item.images[0])} 
                              alt={bi.item.itemName} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300 text-[10px] font-bold">IFRU</div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">{bi.item.itemName}</div>
                          <div className="text-sm text-gray-600">₹{bi.item.price}{unitOf(bi.item) !== 'pcs' && `/${unitOf(bi.item)}`} × {formatQty(bi.quantity || 0, unitOf(bi.item))}{bi.item.gstIncluded && <span className="ml-2 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] font-semibold uppercase">incl. GST</span>}</div>
                        </div>
                      </div>

                      {/* Right: Controls & Total */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-0.5 shadow-sm">
                          <button onClick={() => changeQuantity(bi.item._id, -1)} className="w-8 h-8 rounded-md hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors active:scale-95">
                            <Minus size={16} />
                          </button>
                          <input
                            type="number"
                            inputMode="decimal"
                            min="0"
                            step={unitStep(bi.item)}
                            value={bi.quantity}
                            onChange={(e) => setQuantity(bi.item._id, e.target.value)}
                            aria-label={`Quantity in ${unitOf(bi.item)}`}
                            className="w-16 text-center font-medium text-sm text-gray-900 bg-transparent outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                          />
                          {unitOf(bi.item) !== 'pcs' && <span className="text-xs text-gray-400 pr-1">{unitOf(bi.item)}</span>}
                          <button onClick={() => changeQuantity(bi.item._id, 1)} className="w-8 h-8 rounded-md hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors active:scale-95">
                            <Plus size={16} />
                          </button>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="font-semibold text-gray-900 text-right sm:min-w-[70px]">₹{bi.subtotal}</div>
                          <button onClick={() => removeItem(bi.item._id)} className="p-2 -mr-2 rounded-xl hover:bg-red-50 text-red-500 transition-colors active:scale-95">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right – Customer & Summary */}
          <div className="space-y-6 animate-fade-in-up opacity-0 stagger-2 relative z-10">
            <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/70 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-white/60">
                <h2 className="text-xl font-semibold text-gray-900">Customer Details</h2>
              </div>
              <div className="p-6 space-y-5">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Customer Name</label>
                  <input
                    type="text"
                    placeholder="Enter customer name"
                    value={customerName}
                    autoComplete="off"
                    onFocus={() => canAutofill && setSuggestField('name')}
                    onBlur={() => setSuggestField(null)}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-white/50 bg-white/50 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                  />
                  {suggestField === 'name' && visibleSuggestions.length > 0 && <CustomerSuggestions items={visibleSuggestions} onPick={pickCustomer} />}
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Mobile Number</label>
                  <input
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={customerMobile}
                    maxLength={10}
                    autoComplete="off"
                    onFocus={() => canAutofill && setSuggestField('mobile')}
                    onBlur={() => setSuggestField(null)}
                    onChange={(e) => setCustomerMobile(e.target.value.replace(/\D/g, ''))}
                    className="w-full h-11 px-4 rounded-xl border border-white/50 bg-white/50 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                  />
                  {suggestField === 'mobile' && visibleSuggestions.length > 0 && <CustomerSuggestions items={visibleSuggestions} onPick={pickCustomer} />}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Customer Email <span className="text-gray-400 font-normal">(optional — invoice is emailed only if filled)</span>
                  </label>
                  <input
                    type="email"
                    placeholder="customer@example.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-white/50 bg-white/50 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    GST Number <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 33ABCDE1234F1Z5"
                    value={customerGst}
                    maxLength={30}
                    autoCapitalize="characters"
                    onChange={(e) => setCustomerGst(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                    className="w-full h-11 px-4 rounded-xl border border-white/50 bg-white/50 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all uppercase tracking-wider"
                  />
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/70 shadow-sm flex flex-col overflow-visible">
              <div className="px-6 py-5 border-b border-white/60">
                <h2 className="text-xl font-semibold text-gray-900">Bill Summary</h2>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                {billItems.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                    Add items to generate a bill
                  </div>
                ) : (
                  <>
                    <div className="flex-1 overflow-auto space-y-3 mb-6">
                      {billItems.map((bi) => (
                        <div key={bi.item._id} className="flex justify-between items-center gap-4 p-3 rounded-lg bg-white/50 border border-white/50 text-sm">
                          <div>
                            <div className="font-medium text-gray-900">{bi.item.itemName}</div>
                            <div className="text-gray-500">₹{bi.item.price} × {formatQty(bi.quantity || 0, unitOf(bi.item))}{bi.item.gstIncluded && <span className="ml-2 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] font-semibold uppercase">incl. GST</span>}</div>
                          </div>
                          <div className="font-semibold text-gray-900">₹{bi.subtotal}</div>
                        </div>
                      ))}
                    </div>
                    <div className="pt-6 border-t border-white/60 space-y-2">
                      <div className="flex justify-between items-center text-sm text-gray-600">
                        <span>Subtotal</span>
                        <span>₹{subTotal.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm text-gray-600">
                        <span>GST (5%)</span>
                        <span>₹{gstAmount.toLocaleString('en-IN')}</span>
                      </div>
                      {hasInclusive && (
                        <p className="text-xs text-gray-500 -mt-1">Items marked "incl. GST" already contain their GST, so nothing extra is added for them.</p>
                      )}
                      <div className="flex justify-between items-center pt-2 border-t border-white/50">
                        <span className="text-lg font-semibold text-gray-900">Total Amount</span>
                        <span className="text-3xl font-bold text-emerald-600">₹{total.toLocaleString('en-IN')}</span>
                      </div>

                      {/* Payment Method */}
                      <div className="pt-4 relative" ref={paymentDropdownRef}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setShowPaymentDropdown(!showPaymentDropdown)}
                            className="w-full h-11 pl-4 pr-10 rounded-xl border border-white/50 bg-white/50 text-gray-900 font-medium flex items-center gap-3 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                          >
                            {paymentMethod === 'Cash' ? (
                              <Banknote size={18} className="text-emerald-600" />
                            ) : (
                              <Smartphone size={18} className="text-emerald-600" />
                            )}
                            {paymentMethod}
                          </button>
                          <ChevronDown size={16} className={`absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none transition-transform ${showPaymentDropdown ? 'rotate-180' : ''}`} />
                        </div>
                        
                        {showPaymentDropdown && (
                          <div className="absolute z-20 w-full mt-2 bg-white/90 backdrop-blur-xl border border-white/60 rounded-xl shadow-xl overflow-hidden bottom-full mb-2 sm:bottom-auto sm:mb-0">
                            <button
                              type="button"
                              onClick={() => { setPaymentMethod('Cash'); setShowPaymentDropdown(false); }}
                              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 transition-colors text-left border-b border-gray-100"
                            >
                              <Banknote size={18} className="text-emerald-600" />
                              <span className="font-medium text-gray-900">Cash</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => { setPaymentMethod('UPI'); setShowPaymentDropdown(false); }}
                              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 transition-colors text-left"
                            >
                              <Smartphone size={18} className="text-emerald-600" />
                              <span className="font-medium text-gray-900">UPI</span>
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="mb-6" />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          onClick={handleGenerateBill}
                          disabled={submitting}
                          className="w-full h-11 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-60 text-white font-semibold rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                        >
                          {submitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                          Generate Bill
                        </button>
                        <button
                          onClick={clearBill}
                          className="w-full h-11 border border-gray-300 text-gray-700 hover:bg-gray-100 font-medium rounded-lg transition-colors"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showPrintModal && lastBill && createPortal(
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/60 max-w-lg w-full flex flex-col overflow-hidden animate-zoom-in max-h-[90vh]">
            <div className="px-6 py-5 border-b border-white/60 flex justify-between items-center bg-white/40">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Invoice Generated</h3>
                <p className="text-sm text-emerald-600 font-mono mt-0.5">{lastBill.invoice}</p>
              </div>
              <button onClick={() => setShowPrintModal(false)} className="p-2 rounded-xl hover:bg-gray-200 text-gray-400 hover:text-gray-900 transition-all">
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl border border-emerald-200 text-center font-medium">
                The bill was successfully created. You can now print the invoice or send it via WhatsApp.
              </div>
              
              <div className="bg-gray-900 rounded-3xl p-6 text-white space-y-4 shadow-xl shadow-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-emerald-400 block mb-1">Grand Total</span>
                    <span className="text-3xl font-bold tracking-tight">₹{lastBill.total?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="bg-emerald-500/20 p-3 rounded-2xl">
                    <Printer size={24} className="text-emerald-400" />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white/60 backdrop-blur-sm border-t border-white/60 flex gap-3">
              <button 
                onClick={sendWhatsApp}
                className="flex-[1] h-12 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <Send size={18} />
                WhatsApp
              </button>
              <button 
                onClick={handlePrint}
                className="flex-[2] h-12 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
              >
                <Printer size={18} />
                Print Invoice
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
