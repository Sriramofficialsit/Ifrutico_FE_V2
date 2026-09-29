import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, IndianRupee, Receipt, Users, Boxes, Phone, Mail, Search, Download, X,
  LayoutDashboard, Contact, Package, AlertCircle, CalendarDays, Wallet, Smartphone, CreditCard, Banknote,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { createPortal } from 'react-dom';
import { apiFetch, assetUrl, downloadInvoicePdf } from '../utils/api';
import { unitOf, isLowStock, formatQty } from '../utils/units';

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const fmtTime = (d) => new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'bills', label: 'Bills & Invoices', icon: Receipt },
  { id: 'customers', label: 'Customers', icon: Contact },
  { id: 'stock', label: 'Stock', icon: Package },
];

const payIcon = (m) => {
  const v = String(m || '').toLowerCase();
  if (v === 'upi') return <Smartphone size={12} />;
  if (v === 'card') return <CreditCard size={12} />;
  return <Banknote size={12} />;
};

function StatCard({ icon: Icon, label, value, sub, tone }) {
  return (
    <div className="relative overflow-hidden bg-white/70 backdrop-blur-xl rounded-2xl border border-white/70 shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all">
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-20 ${tone}`} />
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${tone} shadow-md`}>
        <Icon size={20} />
      </div>
      <div className="mt-4 text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}

function Empty({ text }) {
  return <div className="py-16 text-center text-gray-400">{text}</div>;
}

export default function BranchDetail() {
  const { id } = useParams();
  const [tab, setTab] = useState('overview');
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  const [bills, setBills] = useState([]);
  const [billsPage, setBillsPage] = useState(1);
  const [billsPages, setBillsPages] = useState(1);
  const [billsLoading, setBillsLoading] = useState(false);
  const [viewBill, setViewBill] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  const [customers, setCustomers] = useState(null);
  const [stock, setStock] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    apiFetch(`/sales/${id}/overview`)
      .then((d) => setOverview(d.data))
      .catch((e) => toast.error(e.message || 'Could not load branch'))
      .finally(() => setLoading(false));
  }, [id]);

  const loadBills = useCallback((p = 1) => {
    setBillsLoading(true);
    apiFetch(`/bill/fetch?branch=${id}&page=${p}&limit=10`)
      .then((d) => {
        setBills(d.data || []);
        setBillsPages(d.pagination?.totalPages || 1);
        setBillsPage(p);
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setBillsLoading(false));
  }, [id]);

  useEffect(() => {
    if (tab === 'bills' && bills.length === 0) loadBills(1);
    if (tab === 'customers' && customers === null) {
      apiFetch(`/sales/${id}/customers`).then((d) => setCustomers(d.data || [])).catch((e) => toast.error(e.message));
    }
    if (tab === 'stock' && stock === null) {
      apiFetch(`/product/fetch?branch=${id}&limit=1000`).then((d) => setStock(d.data || [])).catch((e) => toast.error(e.message));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const download = async (bill) => {
    if (downloadingId) return;
    setDownloadingId(bill._id);
    try {
      await downloadInvoicePdf(bill._id, bill.invoiceNumber);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) return <div className="py-24 text-center text-gray-500">Loading branch...</div>;
  if (!overview) {
    return (
      <div className="py-24 text-center">
        <p className="text-gray-500 mb-4">Branch not found.</p>
        <Link to="/team" className="text-emerald-600 font-semibold">← Back to Branch Management</Link>
      </div>
    );
  }

  const { branch, stats, weekly } = overview;
  const q = search.trim().toLowerCase();

  // Fill the last 7 days so the chart always has 7 bars
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toLocaleDateString('en-CA');
    return { key, label: d.toLocaleDateString('en-IN', { weekday: 'short' }), total: weekly.find((w) => w._id === key)?.total || 0 };
  });
  const maxDay = Math.max(...days.map((d) => d.total), 1);

  const filteredBills = bills.filter((b) =>
    !q || b.invoiceNumber?.toLowerCase().includes(q) || b.customerName?.toLowerCase().includes(q) || b.mobileNumber?.includes(q));
  const filteredCustomers = (customers || []).filter((c) =>
    !q || c.name?.toLowerCase().includes(q) || c.mobile?.includes(q));
  const heldStock = (stock || []).filter((p) => p.stock > 0 && (!q || p.itemName?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q)));

  return (
    <div className="animate-fade-in-up">
      <div className="mx-auto max-w-screen-2xl space-y-6 md:space-y-8">
        <Link to="/team" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-emerald-600 transition-colors">
          <ArrowLeft size={16} /> Branch Management
        </Link>

        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-600 p-6 md:p-8 text-white shadow-xl shadow-emerald-500/20">
          <div className="absolute -right-10 -top-10 w-56 h-56 rounded-full bg-white/10" />
          <div className="absolute right-24 -bottom-16 w-40 h-40 rounded-full bg-white/10" />
          <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-3xl font-bold overflow-hidden ring-4 ring-white/30 flex-shrink-0">
              {branch.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl md:text-4xl font-bold tracking-tight truncate">{branch.name}</h1>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${branch.status === 'active' ? 'bg-white/25' : 'bg-black/25'}`}>
                  {branch.status === 'active' ? '● Active' : '○ Inactive'}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5 text-sm text-white/90">
                <span className="inline-flex items-center gap-2"><Mail size={14} /> {branch.email}</span>
                <span className="inline-flex items-center gap-2"><Phone size={14} /> {branch.mobile}</span>
                <span className="inline-flex items-center gap-2"><CalendarDays size={14} /> Since {fmtDate(branch.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 p-1.5 bg-white/60 backdrop-blur-xl rounded-2xl border border-white/70 shadow-sm overflow-x-auto">
          {TABS.map(({ id: tid, label, icon: Icon }) => (
            <button
              key={tid}
              onClick={() => { setTab(tid); setSearch(''); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                tab === tid ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/20' : 'text-gray-600 hover:bg-white/80'
              }`}
            >
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={IndianRupee} label="Total Revenue" value={inr(stats.revenue)} sub={`${stats.bills} bills`} tone="bg-gradient-to-br from-emerald-500 to-teal-500" />
              <StatCard icon={Wallet} label="Today's Sales" value={inr(stats.todaySales)} sub={`${stats.todayBills} bills today`} tone="bg-gradient-to-br from-emerald-700 to-emerald-800" />
              <StatCard icon={Users} label="Customers" value={stats.customers} sub="unique customers billed" tone="bg-gradient-to-br from-emerald-600 to-emerald-700" />
              <StatCard icon={Boxes} label="Stock on hand" value={stats.stockItems} sub={`worth ${inr(stats.stockValue)}`} tone="bg-gradient-to-br from-emerald-800 to-emerald-900" />
            </div>

            <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/70 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Last 7 days</h2>
                <span className="text-sm text-gray-500">{inr(days.reduce((s, d) => s + d.total, 0))} total</span>
              </div>
              <div className="flex items-end gap-2 sm:gap-4 h-48">
                {days.map((d) => (
                  <div key={d.key} className="flex-1 flex flex-col items-center justify-end h-full gap-2 group">
                    <span className="text-[11px] text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">{inr(d.total)}</span>
                    <div
                      className="w-full max-w-[56px] rounded-t-xl bg-gradient-to-t from-emerald-500 to-teal-300 transition-all group-hover:from-emerald-600"
                      style={{ height: `${Math.max((d.total / maxDay) * 100, d.total ? 6 : 2)}%`, opacity: d.total ? 1 : 0.25 }}
                    />
                    <span className="text-xs text-gray-500">{d.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Search (non-overview tabs) */}
        {tab !== 'overview' && (
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={tab === 'bills' ? 'Search invoice, customer or mobile...' : tab === 'customers' ? 'Search customer or mobile...' : 'Search item or SKU...'}
              className="w-full h-12 pl-11 pr-4 rounded-2xl border border-white/70 bg-white/60 backdrop-blur-xl focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none"
            />
          </div>
        )}

        {/* Bills */}
        {tab === 'bills' && (
          <div className="space-y-3">
            {billsLoading ? <Empty text="Loading bills..." /> : filteredBills.length === 0 ? <Empty text="No bills found for this branch." /> : filteredBills.map((b) => (
              <div key={b._id} className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/70 shadow-sm p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-4 hover:shadow-md transition-all">
                <button onClick={() => setViewBill(b)} className="flex items-center gap-4 flex-1 min-w-0 text-left">
                  <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0"><Receipt size={20} /></div>
                  <div className="min-w-0">
                    <div className="font-mono text-sm font-semibold text-gray-900 truncate">{b.invoiceNumber}</div>
                    <div className="text-sm text-gray-600 truncate">{b.customerName} · {b.mobileNumber}</div>
                    <div className="text-xs text-gray-400">{fmtDate(b.createdAt)} · {fmtTime(b.createdAt)}</div>
                  </div>
                </button>
                <div className="flex items-center justify-between md:justify-end gap-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium capitalize">{payIcon(b.paymentMethod)} {b.paymentMethod || 'cash'}</span>
                  <span className="text-lg font-bold text-emerald-600">{inr(b.totalAmount)}</span>
                  <button onClick={() => download(b)} disabled={downloadingId === b._id} title="Download invoice"
                    className="p-2.5 rounded-xl bg-gray-50 hover:bg-emerald-50 text-emerald-600 border border-gray-100 hover:border-emerald-200 disabled:opacity-50 transition-all">
                    <Download size={18} />
                  </button>
                </div>
              </div>
            ))}
            {billsPages > 1 && !q && (
              <div className="flex items-center justify-between pt-2">
                <span className="text-sm text-gray-500">Page {billsPage} of {billsPages}</span>
                <div className="flex gap-2">
                  <button disabled={billsPage <= 1} onClick={() => loadBills(billsPage - 1)} className="px-4 py-2 rounded-xl border bg-white/60 disabled:opacity-50 text-sm">Prev</button>
                  <button disabled={billsPage >= billsPages} onClick={() => loadBills(billsPage + 1)} className="px-4 py-2 rounded-xl border bg-white/60 disabled:opacity-50 text-sm">Next</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Customers */}
        {tab === 'customers' && (
          customers === null ? <Empty text="Loading customers..." /> : filteredCustomers.length === 0 ? <Empty text="No customers yet." /> : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredCustomers.map((c) => (
                <div key={c.mobile} className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/70 shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-700 to-emerald-800 text-white flex items-center justify-center font-bold">{c.name?.charAt(0).toUpperCase()}</div>
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900 truncate">{c.name}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1"><Phone size={11} /> {c.mobile}</div>
                    </div>
                  </div>
                  {c.email && <div className="mt-3 text-xs text-gray-500 flex items-center gap-1.5 truncate"><Mail size={12} /> {c.email}</div>}
                  <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 text-center">
                    <div><div className="font-bold text-gray-900">{c.bills}</div><div className="text-[11px] text-gray-400">Bills</div></div>
                    <div><div className="font-bold text-emerald-600">{inr(c.spent)}</div><div className="text-[11px] text-gray-400">Spent</div></div>
                    <div><div className="font-bold text-gray-900 text-sm leading-6">{fmtDate(c.lastPurchase)}</div><div className="text-[11px] text-gray-400">Last visit</div></div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Stock */}
        {tab === 'stock' && (
          stock === null ? <Empty text="Loading stock..." /> : heldStock.length === 0 ? <Empty text="This branch has no stock. Transfer stock from Stock Management." /> : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {heldStock.map((p) => {
                const low = isLowStock(p);
                return (
                  <div key={p._id} className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/70 shadow-sm p-4 flex gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0 flex items-center justify-center text-gray-400">
                      {p.images?.[0] ? <img src={assetUrl(p.images[0])} alt={p.itemName} loading="lazy" className="w-full h-full object-cover" /> : <Package size={22} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 truncate">{p.itemName}</div>
                      <div className="text-xs text-gray-400 font-mono">{p.sku} · <span className="capitalize font-sans">{p.category}</span></div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${low ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                          {low && <AlertCircle size={12} />} {formatQty(p.stock, unitOf(p))}{low ? ' left' : ''}
                        </span>
                        <span className="text-xs text-gray-500">{inr(p.price)}{unitOf(p) !== 'pcs' && `/${unitOf(p)}`}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* Bill detail drawer */}
      {viewBill && createPortal(
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-sm" onClick={() => setViewBill(null)}>
          <div className="w-full max-w-md h-full bg-white shadow-2xl overflow-y-auto animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wider text-white/70">Invoice</div>
                  <div className="font-mono font-bold text-lg break-all">{viewBill.invoiceNumber}</div>
                </div>
                <button onClick={() => setViewBill(null)} className="p-2 rounded-xl hover:bg-white/20"><X size={20} /></button>
              </div>
              <div className="mt-4 text-3xl font-bold">{inr(viewBill.totalAmount)}</div>
              <div className="text-sm text-white/80">{fmtDate(viewBill.createdAt)} · {fmtTime(viewBill.createdAt)}</div>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase mb-2">Customer</div>
                <div className="font-semibold text-gray-900">{viewBill.customerName}</div>
                <div className="text-sm text-gray-500">{viewBill.mobileNumber}</div>
                {viewBill.customerEmail && <div className="text-sm text-gray-500">{viewBill.customerEmail}</div>}
                {viewBill.customerGstNumber && <div className="text-sm text-gray-500">GST: {viewBill.customerGstNumber}</div>}
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase mb-2">Items</div>
                <div className="space-y-3">
                  {viewBill.products?.map((p, i) => (
                    <div key={i} className="flex justify-between gap-3 text-sm">
                      <div>
                        <div className="font-medium text-gray-900">{p.itemName}</div>
                        <div className="text-xs text-gray-500">{formatQty(p.quantity, p.unit)} × {inr(p.price)}{p.gstIncluded ? ' · incl. GST' : ''}</div>
                      </div>
                      <div className="font-semibold text-gray-900">{inr(p.total)}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="pt-4 border-t border-gray-100 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{inr(viewBill.subTotal)}</span></div>
                <div className="flex justify-between text-gray-600"><span>GST</span><span>{inr(viewBill.gstAmount)}</span></div>
                <div className="flex justify-between font-bold text-gray-900 text-base"><span>Total</span><span>{inr(viewBill.totalAmount)}</span></div>
                <div className="flex justify-between text-gray-500 capitalize"><span>Payment</span><span>{viewBill.paymentMethod || 'cash'}</span></div>
              </div>
              <button onClick={() => download(viewBill)} disabled={downloadingId === viewBill._id}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
                <Download size={18} /> {downloadingId === viewBill._id ? 'Downloading...' : 'Download Invoice PDF'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
