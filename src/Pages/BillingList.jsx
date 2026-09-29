import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import { buildBillMessage } from '../utils/whatsappBill';
import { formatQty } from '../utils/units';
import {
  Eye, Printer, Send, X, ChevronLeft, ChevronRight, Banknote, Smartphone, CreditCard, Mail, Phone,
  Download, Loader2, Search, Copy, Receipt, IndianRupee, TrendingUp, Store, SearchX,
} from 'lucide-react';
import DOMPurify from 'dompurify';
import { apiFetch, downloadInvoicePdf } from '../utils/api';
import { createPortal } from 'react-dom';

const LIMIT = 12;
const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const PAYMENTS = [
  { id: 'all', label: 'All' },
  { id: 'cash', label: 'Cash' },
  { id: 'upi', label: 'UPI' },
  { id: 'card', label: 'Card' },
];
const RANGES = [
  { id: 'all', label: 'All time' },
  { id: 'today', label: 'Today' },
  { id: '7d', label: '7 days' },
  { id: '30d', label: '30 days' },
];

const PAY_STYLE = {
  cash: { cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200', Icon: Banknote, text: 'Cash' },
  upi: { cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200', Icon: Smartphone, text: 'UPI' },
  card: { cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200', Icon: CreditCard, text: 'Card' },
};
const payOf = (m) => PAY_STYLE[String(m || 'cash').toLowerCase()] || PAY_STYLE.cash;

const rangeStart = (id) => {
  if (id === 'all') return null;
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (id === '7d') d.setDate(d.getDate() - 6);
  if (id === '30d') d.setDate(d.getDate() - 29);
  return d.toISOString();
};

const dayLabel = (iso) => {
  const d = new Date(iso);
  const t = new Date();
  const y = new Date();
  y.setDate(t.getDate() - 1);
  if (d.toDateString() === t.toDateString()) return 'Today';
  if (d.toDateString() === y.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};
const timeOf = (iso) => new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

const AVATAR_TONES = ['from-emerald-500 to-emerald-600', 'from-emerald-600 to-emerald-700', 'from-emerald-700 to-emerald-800', 'from-emerald-800 to-emerald-900', 'from-emerald-400 to-emerald-500'];
const toneOf = (str = '') => AVATAR_TONES[[...str].reduce((s, c) => s + c.charCodeAt(0), 0) % AVATAR_TONES.length];

function PayChip({ method, small }) {
  const { cls, Icon, text } = payOf(method);
  return (
    <span className={`inline-flex items-center gap-1 rounded-full ring-1 font-semibold ${cls} ${small ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'}`}>
      <Icon size={small ? 10 : 12} /> {text}
    </span>
  );
}

function IconBtn({ title, onClick, disabled, tone = 'text-gray-600 hover:bg-gray-100', children }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      disabled={disabled}
      className={`p-2 rounded-xl transition-all active:scale-90 disabled:opacity-50 ${tone}`}
    >
      {children}
    </button>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/60 border border-white/70 animate-pulse">
      <div className="w-11 h-11 rounded-full bg-gray-200" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-1/3 bg-gray-200 rounded" />
        <div className="h-3 w-1/2 bg-gray-100 rounded" />
      </div>
      <div className="h-5 w-16 bg-gray-200 rounded" />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone }) {
  return (
    <div className="relative overflow-hidden rounded-2xl p-5 bg-white/70 backdrop-blur-xl border border-white/70 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
      <div className={`absolute -right-5 -top-5 w-20 h-20 rounded-full opacity-20 ${tone}`} />
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shadow ${tone}`}><Icon size={18} /></div>
      <div className="mt-3 text-2xl md:text-3xl font-bold text-gray-900 tabular-nums">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  );
}

export default function BillingList() {
  const getPaymentText = (pm) => payOf(pm).text;

  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);   // first load -> skeletons
  const [fetching, setFetching] = useState(false); // subsequent loads -> dim the list, keep content
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [payment, setPayment] = useState('all');
  const [range, setRange] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [stats, setStats] = useState(null);
  const [viewBill, setViewBill] = useState(null);
  const [settings, setSettings] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const searchRef = useRef(null);
  const reqId = useRef(0);

  // Debounce typing so we hit the API once per pause, not per keystroke
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchBills = useCallback((p = 1) => {
    const id = ++reqId.current; // ignore out-of-order responses
    setFetching(true);
    const qs = new URLSearchParams({ page: p, limit: LIMIT });
    if (search) qs.set('search', search);
    if (payment !== 'all') qs.set('payment', payment);
    const from = rangeStart(range);
    if (from) qs.set('from', from);
    apiFetch(`/bill/fetch?${qs}`)
      .then((data) => {
        if (id !== reqId.current) return;
        setBills(data.data || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalRecords(data.pagination?.totalRecords || 0);
        setPage(p);
      })
      .catch((e) => id === reqId.current && toast.error(e.message))
      .finally(() => {
        if (id !== reqId.current) return;
        setLoading(false);
        setFetching(false);
      });
  }, [search, payment, range]);

  useEffect(() => { fetchBills(1); }, [fetchBills]);

  useEffect(() => {
    apiFetch('/settings').then((d) => setSettings(d.data)).catch(() => {});
    apiFetch('/bill/stats').then((d) => setStats(d.data)).catch(() => {});
  }, []);

  // Keyboard: "/" focuses search, Esc closes the drawer
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setViewBill(null);
      if (e.key === '/' && !/input|textarea|select/i.test(document.activeElement?.tagName)) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!viewBill) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [viewBill]);

  // Group the current page by day for scannable sections
  const groups = useMemo(() => {
    const map = new Map();
    bills.forEach((b) => {
      const k = dayLabel(b.createdAt);
      if (!map.has(k)) map.set(k, { items: [], total: 0 });
      const g = map.get(k);
      g.items.push(b);
      g.total += b.totalAmount || 0;
    });
    return [...map.entries()];
  }, [bills]);

  const hasFilters = search || payment !== 'all' || range !== 'all';
  const clearFilters = () => { setSearchInput(''); setSearch(''); setPayment('all'); setRange('all'); };

  const copyInvoice = (no) => {
    navigator.clipboard?.writeText(no).then(() => toast.success('Invoice number copied'), () => {});
  };

  const handleWhatsApp = (bill) => {
    const text = buildBillMessage({
      customerName: bill.customerName,
      invoice: bill.invoiceNumber,
      items: bill.products.map((p) => ({ name: p.itemName, qty: formatQty(p.quantity, p.unit), price: p.price, total: p.total })),
      subTotal: bill.subTotal,
      gstAmount: bill.gstAmount,
      total: bill.totalAmount,
      paymentMethod: getPaymentText(bill.paymentMethod),
      gstNumber: settings?.gstNumber,
    });

    const url = `https://wa.me/91${bill.mobileNumber}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleDownloadPdf = async (bill) => {
    if (downloadingId) return;
    setDownloadingId(bill._id);
    try {
      await downloadInvoicePdf(bill._id, bill.invoiceNumber);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePrint = (bill) => {
    const escape = (str) => String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    const win = window.open('', '_blank');

    const shopName = settings?.shopName || 'Ifrutico';
    const shopAddress = settings?.address || '';
    const shopGst = settings?.gstNumber || '';
    const openingHours = settings?.openingHours || '';

    // Construct HTML safely using escaping
    const htmlContent = `
      <html><head><title>Invoice ${escape(bill.invoiceNumber)}</title>
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
        <p style="text-align:center;margin-top:0;">${escape(bill.invoiceNumber)}</p>
        <hr/>
        <div class="row"><span>Customer:</span><span>${escape(bill.customerName)}</span></div>
        <div class="row"><span>Mobile:</span><span>${escape(bill.mobileNumber)}</span></div>
        ${bill.customerGstNumber ? `<div class="row"><span>Customer GSTIN:</span><span>${escape(bill.customerGstNumber)}</span></div>` : ''}
        <div class="row"><span>Date:</span><span>${escape(new Date(bill.createdAt).toLocaleString('en-IN'))}</span></div>
        <div class="row"><span>Billed By:</span><span>${escape(bill.billedBy?.name || 'N/A')}</span></div>
        <hr/>
        ${bill.products.map((p) => `<div class="row"><span>${escape(p.itemName)} × ${escape(formatQty(p.quantity, p.unit))}</span><span>₹${escape(p.total)}</span></div>`).join('')}
        <hr/>
        <div class="row" style="color:#555"><span>Subtotal</span><span>₹${escape((bill.subTotal || 0).toLocaleString('en-IN'))}</span></div>
        <div class="row" style="color:#555"><span>GST (5%)</span><span>₹${escape((bill.gstAmount || 0).toLocaleString('en-IN'))}</span></div>
        <div class="row" style="color:#555"><span>Payment</span><span>${escape(getPaymentText(bill.paymentMethod))}</span></div>
        <hr/>
        <div class="row total"><span>TOTAL</span><span>₹${escape(bill.totalAmount.toLocaleString('en-IN'))}</span></div>
      </body></html>
    `;

    // Purify explicitly using Snyk-approved sanitizer
    const cleanHTML = DOMPurify.sanitize(htmlContent, { WHOLE_DOCUMENT: true });

    win.document.write(cleanHTML);
    win.document.close();

    setTimeout(() => {
      win.print();
    }, 250);
  };


  return (
    <div className="animate-fade-in-up">
      <style>{`
        @keyframes bl-slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes bl-sheet-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes bl-row-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .bl-drawer { animation: bl-sheet-up .3s cubic-bezier(.2,.8,.2,1); }
        @media (min-width: 768px) { .bl-drawer { animation: bl-slide-in .3s cubic-bezier(.2,.8,.2,1); } }
        .bl-row { animation: bl-row-in .35s ease both; }
        @media (prefers-reduced-motion: reduce) { .bl-drawer, .bl-row { animation: none; } }
      `}</style>

      <div className="mx-auto max-w-screen-2xl space-y-6 md:space-y-8">
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900">Billing List</h1>
          <p className="text-base sm:text-lg text-gray-600">Every bill across all branches, searchable and filterable</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
          <StatCard icon={IndianRupee} label="Today's Sales" value={inr(stats?.today?.sales)} tone="bg-gradient-to-br from-emerald-500 to-teal-500" />
          <StatCard icon={Receipt} label="Bills Today" value={stats?.today?.bills ?? '—'} tone="bg-gradient-to-br from-emerald-700 to-emerald-800" />
          <StatCard icon={TrendingUp} label="All-time Revenue" value={inr(stats?.allTime?.revenue)} tone="bg-gradient-to-br from-emerald-600 to-emerald-700" />
          <StatCard icon={Store} label={hasFilters ? 'Matching Bills' : 'Total Bills'} value={totalRecords} tone="bg-gradient-to-br from-emerald-800 to-emerald-900" />
        </div>

        {/* Sticky filter bar */}
        <div className="sticky top-2 z-20 rounded-2xl bg-white/80 backdrop-blur-xl border border-white/70 shadow-sm p-3 md:p-4 space-y-3">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              ref={searchRef}
              type="text"
              inputMode="search"
              placeholder="Search invoice, customer or mobile…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full h-12 pl-11 pr-20 rounded-xl border border-gray-200 bg-white/70 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 outline-none transition-all"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {fetching && <Loader2 size={16} className="animate-spin text-emerald-500" />}
              {searchInput ? (
                <button onClick={() => { setSearchInput(''); setSearch(''); }} aria-label="Clear search" className="p-1 rounded-lg text-gray-400 hover:bg-gray-100"><X size={16} /></button>
              ) : (
                <kbd className="hidden md:block px-2 py-0.5 rounded-md border border-gray-200 bg-gray-50 text-[11px] text-gray-400">/</kbd>
              )}
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:justify-between">
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-1 px-1" role="tablist" aria-label="Date range">
              {RANGES.map((r) => (
                <button key={r.id} role="tab" aria-selected={range === r.id} onClick={() => setRange(r.id)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all active:scale-95 ${range === r.id ? 'bg-gray-900 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {r.label}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-1 px-1" role="tablist" aria-label="Payment method">
              {PAYMENTS.map((p) => (
                <button key={p.id} role="tab" aria-selected={payment === p.id} onClick={() => setPayment(p.id)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all active:scale-95 ${payment === p.id ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow shadow-emerald-500/20' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* List */}
        <div className={`space-y-6 transition-opacity duration-200 ${fetching && !loading ? 'opacity-60' : 'opacity-100'}`} aria-busy={fetching}>
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 6 }, (_, i) => <SkeletonRow key={i} />)}</div>
          ) : bills.length === 0 ? (
            <div className="py-20 text-center rounded-3xl bg-white/50 border border-dashed border-gray-200">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 mb-4"><SearchX size={28} /></div>
              <div className="font-semibold text-gray-900">No bills found</div>
              <p className="text-sm text-gray-500 mt-1">{hasFilters ? 'Try a different search or filter.' : 'Bills will appear here once created.'}</p>
              {hasFilters && <button onClick={clearFilters} className="mt-4 px-5 py-2 rounded-full bg-emerald-500 text-white text-sm font-semibold active:scale-95 transition">Clear filters</button>}
            </div>
          ) : groups.map(([label, g]) => (
            <section key={label}>
              <div className="flex items-baseline justify-between px-1 mb-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">{label}</h2>
                <span className="text-xs text-gray-400">{g.items.length} {g.items.length === 1 ? 'bill' : 'bills'} · <b className="text-gray-600 tabular-nums">{inr(g.total)}</b></span>
              </div>
              <div className="space-y-2">
                {g.items.map((bill, i) => (
                  <div
                    key={bill._id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setViewBill(bill)}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setViewBill(bill))}
                    style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}
                    className="bl-row group flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/70 shadow-sm hover:shadow-md hover:border-emerald-200 hover:-translate-y-0.5 focus-visible:ring-4 focus-visible:ring-emerald-100 outline-none cursor-pointer transition-all duration-200 active:scale-[0.99]"
                  >
                    <div className={`w-11 h-11 md:w-12 md:h-12 rounded-full bg-gradient-to-br ${toneOf(bill.customerName)} text-white font-bold flex items-center justify-center flex-shrink-0 shadow`}>
                      {bill.customerName?.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 truncate">{bill.customerName}</span>
                        <span className="hidden sm:inline"><PayChip method={bill.paymentMethod} small /></span>
                      </div>
                      <div className="text-xs md:text-sm text-gray-500 flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                        <span className="font-mono text-emerald-600">{bill.invoiceNumber}</span>
                        <span className="inline-flex items-center gap-1"><Phone size={11} />{bill.mobileNumber}</span>
                        <span className="hidden lg:inline">· {bill.billedBy?.name || '—'}</span>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="text-base md:text-lg font-bold text-gray-900 tabular-nums">{inr(bill.totalAmount)}</div>
                      <div className="text-xs text-gray-400">{timeOf(bill.createdAt)}</div>
                    </div>

                    {/* Desktop: quick actions revealed on hover / focus */}
                    <div className="hidden md:flex items-center gap-0.5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                      <IconBtn title="Download invoice" onClick={() => handleDownloadPdf(bill)} disabled={downloadingId === bill._id} tone="text-emerald-600 hover:bg-emerald-50">
                        {downloadingId === bill._id ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                      </IconBtn>
                      <IconBtn title="Print" onClick={() => handlePrint(bill)}><Printer size={18} /></IconBtn>
                      <IconBtn title="Send on WhatsApp" onClick={() => handleWhatsApp(bill)} tone="text-[#25D366] hover:bg-[#25D366]/10"><Send size={18} /></IconBtn>
                    </div>
                    <ChevronRight size={18} className="text-gray-300 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all flex-shrink-0 md:hidden" />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between rounded-2xl bg-white/60 backdrop-blur-xl border border-white/70 px-4 py-3">
            <span className="text-sm text-gray-500">Page <b className="text-gray-900">{page}</b> of {totalPages}</span>
            <div className="flex items-center gap-2">
              <button onClick={() => fetchBills(page - 1)} disabled={page <= 1 || fetching} aria-label="Previous page" className="h-10 w-10 flex items-center justify-center rounded-xl border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 active:scale-90 transition"><ChevronLeft size={18} /></button>
              <button onClick={() => fetchBills(page + 1)} disabled={page >= totalPages || fetching} aria-label="Next page" className="h-10 w-10 flex items-center justify-center rounded-xl border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 active:scale-90 transition"><ChevronRight size={18} /></button>
            </div>
          </div>
        )}
      </div>

      {/* Bill detail: side drawer on desktop, bottom sheet on mobile */}
      {viewBill && createPortal(
        <div className="fixed inset-0 z-50 flex items-end md:items-stretch md:justify-end bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setViewBill(null)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Invoice ${viewBill.invoiceNumber}`}
            onClick={(e) => e.stopPropagation()}
            className="bl-drawer w-full md:max-w-md max-h-[92vh] md:max-h-none md:h-full bg-white rounded-t-3xl md:rounded-none md:rounded-l-3xl shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="md:hidden pt-3"><div className="mx-auto h-1.5 w-10 rounded-full bg-gray-300" /></div>

            <div className="relative bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-600 text-white p-6 overflow-hidden">
              <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10" />
              <div className="relative flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[11px] uppercase tracking-widest text-white/70">Invoice</div>
                  <button onClick={() => copyInvoice(viewBill.invoiceNumber)} className="mt-0.5 flex items-center gap-2 font-mono text-sm font-semibold break-all text-left hover:text-white/80" title="Copy invoice number">
                    {viewBill.invoiceNumber} <Copy size={13} className="flex-shrink-0" />
                  </button>
                </div>
                <button onClick={() => setViewBill(null)} aria-label="Close" className="p-2 -m-1 rounded-xl hover:bg-white/20 active:scale-90 transition"><X size={20} /></button>
              </div>
              <div className="relative mt-4 flex items-end justify-between">
                <div className="text-4xl font-bold tracking-tight tabular-nums">{inr(viewBill.totalAmount)}</div>
                <PayChip method={viewBill.paymentMethod} />
              </div>
              <div className="relative text-sm text-white/80 mt-1">{new Date(viewBill.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${toneOf(viewBill.customerName)} text-white font-bold flex items-center justify-center`}>
                  {viewBill.customerName?.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-gray-900 truncate">{viewBill.customerName}</div>
                  <div className="text-sm text-gray-500 flex items-center gap-1"><Phone size={12} /> {viewBill.mobileNumber}</div>
                  {viewBill.customerEmail && <div className="text-sm text-gray-500 flex items-center gap-1 truncate"><Mail size={12} /> {viewBill.customerEmail}</div>}
                </div>
              </div>
              {(viewBill.customerGstNumber || viewBill.billedBy?.name) && (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 rounded-xl bg-gray-50"><div className="text-[11px] uppercase text-gray-400 font-bold">Billed by</div><div className="font-semibold text-gray-900 truncate">{viewBill.billedBy?.name || '—'}</div></div>
                  {viewBill.customerGstNumber && <div className="p-3 rounded-xl bg-gray-50"><div className="text-[11px] uppercase text-gray-400 font-bold">Customer GST</div><div className="font-semibold text-gray-900 truncate">{viewBill.customerGstNumber}</div></div>}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Items</h3>
                  <span className="text-[11px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">{viewBill.products.length}</span>
                </div>
                <div className="divide-y divide-gray-100 rounded-2xl border border-gray-100">
                  {viewBill.products.map((p, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 p-3.5">
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-900 truncate">{p.itemName}</div>
                        <div className="text-xs text-gray-500">{formatQty(p.quantity, p.unit)} × {inr(p.price)}{p.gstIncluded ? ' · incl. GST' : ''}</div>
                      </div>
                      <div className="font-bold text-gray-900 tabular-nums">{inr(p.total)}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-gray-900 text-white p-5 space-y-2 text-sm">
                <div className="flex justify-between text-gray-400"><span>Subtotal</span><span className="text-white tabular-nums">{inr(viewBill.subTotal)}</span></div>
                <div className="flex justify-between text-gray-400"><span>GST (5%)</span><span className="text-white tabular-nums">{inr(viewBill.gstAmount)}</span></div>
                <div className="flex justify-between pt-3 mt-1 border-t border-white/10 text-base font-bold"><span>Total</span><span className="text-emerald-400 tabular-nums">{inr(viewBill.totalAmount)}</span></div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-white grid grid-cols-3 gap-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <button onClick={() => handleDownloadPdf(viewBill)} disabled={downloadingId === viewBill._id}
                className="h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition disabled:opacity-60">
                {downloadingId === viewBill._id ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />} PDF
              </button>
              <button onClick={() => handlePrint(viewBill)} className="h-12 rounded-xl border border-gray-200 text-gray-700 font-semibold flex items-center justify-center gap-2 hover:bg-gray-50 active:scale-95 transition">
                <Printer size={18} /> Print
              </button>
              <button onClick={() => handleWhatsApp(viewBill)} className="h-12 rounded-xl border border-[#25D366]/40 text-[#128C7E] font-semibold flex items-center justify-center gap-2 hover:bg-[#25D366]/10 active:scale-95 transition">
                <Send size={18} /> Share
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
