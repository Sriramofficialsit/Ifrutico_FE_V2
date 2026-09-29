import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, Phone, Mail, FileText, Download, Loader2, ChevronLeft, ChevronRight, Users, IndianRupee, Receipt } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiFetch, downloadInvoicePdf } from '../utils/api';
import { formatQty } from '../utils/units';

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
const LIMIT = 15;

function StatCard({ label, value, tone = 'text-gray-900', icon }) {
  return (
    <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 border border-white/70 shadow-sm">
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">{icon}{label}</div>
      <div className={`text-2xl md:text-3xl font-bold ${tone}`}>{value}</div>
    </div>
  );
}

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [summary, setSummary] = useState({ customers: 0, orders: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [selected, setSelected] = useState(null); // mobile of the open customer
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search.trim()); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(() => {
    setLoading(true);
    apiFetch(`/customers?page=${page}&limit=${LIMIT}&search=${encodeURIComponent(debouncedSearch)}`)
      .then((res) => {
        setCustomers(res.data || []);
        setSummary(res.summary || { customers: 0, orders: 0, revenue: 0 });
        setTotalPages(res.pagination?.totalPages || 1);
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [page, debouncedSearch]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!selected) return;
    let cancelled = false;
    setDetailLoading(true);
    setDetail(null);
    apiFetch(`/customers/${selected}`)
      .then((res) => { if (!cancelled) setDetail(res.data); })
      .catch((err) => { if (!cancelled) { toast.error(err.message); setSelected(null); } })
      .finally(() => { if (!cancelled) setDetailLoading(false); });
    return () => { cancelled = true; };
  }, [selected]);

  const handleDownload = async (inv) => {
    if (downloadingId) return;
    setDownloadingId(inv._id);
    try {
      await downloadInvoicePdf(inv._id, inv.invoiceNumber);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="animate-fade-in-up">
      <div className="mx-auto max-w-screen-2xl space-y-8 md:space-y-10">
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900">Customers</h1>
          <p className="text-base sm:text-lg text-gray-600">Everyone you've billed — saved automatically, with their order history</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 md:gap-6">
          <StatCard label="Customers" value={summary.customers} icon={<Users size={16} />} />
          <StatCard label="Total Orders" value={summary.orders} icon={<Receipt size={16} />} />
          <StatCard label="Total Revenue" value={inr(summary.revenue)} tone="text-emerald-600" icon={<IndianRupee size={16} />} />
        </div>

        <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/70 shadow-sm p-5 md:p-6">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by customer name or mobile number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 pl-11 pr-4 rounded-xl border border-white/50 bg-white/50 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
            />
          </div>
        </div>

        <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/70 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-16 flex justify-center"><Loader2 className="animate-spin text-emerald-500" /></div>
          ) : customers.length === 0 ? (
            <div className="p-16 text-center text-gray-500">
              {debouncedSearch ? 'No customers match your search.' : 'No customers yet — they appear here after your first bill.'}
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/60 text-xs uppercase tracking-wider text-gray-500">
                      <th className="p-5 font-semibold">Customer</th>
                      <th className="p-5 font-semibold">Mobile</th>
                      <th className="p-5 font-semibold">GST No.</th>
                      <th className="p-5 font-semibold text-right">Orders</th>
                      <th className="p-5 font-semibold text-right">Total Revenue</th>
                      <th className="p-5 font-semibold">Last Order</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((c) => (
                      <tr key={c.mobile} onClick={() => setSelected(c.mobile)} className="border-b border-white/40 hover:bg-emerald-50/50 cursor-pointer transition-colors">
                        <td className="p-5">
                          <div className="font-medium text-gray-900">{c.name}</div>
                          {c.email && <div className="text-xs text-gray-500 mt-0.5">{c.email}</div>}
                        </td>
                        <td className="p-5 text-sm text-gray-600">{c.mobile}</td>
                        <td className="p-5 text-sm text-gray-600 font-mono">{c.gstNumber || '—'}</td>
                        <td className="p-5 text-sm text-gray-900 text-right">{c.orders}</td>
                        <td className="p-5 text-sm font-semibold text-emerald-600 text-right">{inr(c.revenue)}</td>
                        <td className="p-5 text-sm text-gray-600">{fmtDate(c.lastOrderAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-white/50">
                {customers.map((c) => (
                  <button key={c.mobile} onClick={() => setSelected(c.mobile)} className="w-full text-left p-4 active:bg-emerald-50/60">
                    <div className="flex justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-900 truncate">{c.name}</div>
                        <div className="text-sm text-gray-500">{c.mobile}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-bold text-emerald-600">{inr(c.revenue)}</div>
                        <div className="text-xs text-gray-500">{c.orders} order{c.orders === 1 ? '' : 's'}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-white/60">
              <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => p - 1)} disabled={page <= 1} className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-40"><ChevronLeft size={18} /></button>
                <button onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages} className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-40"><ChevronRight size={18} /></button>
              </div>
            </div>
          )}
        </div>
      </div>

      {selected && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div className="w-full max-w-3xl max-h-[90vh] flex flex-col bg-white rounded-3xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 p-6 border-b border-gray-100">
              <div className="min-w-0">
                <h2 className="text-2xl font-bold text-gray-900 truncate">{detail?.customer?.name || 'Customer'}</h2>
                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-gray-600">
                  <span className="inline-flex items-center gap-1.5"><Phone size={14} className="text-emerald-500" />{selected}</span>
                  {detail?.customer?.email && <span className="inline-flex items-center gap-1.5"><Mail size={14} className="text-emerald-500" />{detail.customer.email}</span>}
                  {detail?.customer?.gstNumber && <span className="inline-flex items-center gap-1.5 font-mono"><FileText size={14} className="text-emerald-500" />GST {detail.customer.gstNumber}</span>}
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-900" aria-label="Close"><X size={20} /></button>
            </div>

            <div className="overflow-y-auto p-6 space-y-6">
              {detailLoading || !detail ? (
                <div className="py-16 flex justify-center"><Loader2 className="animate-spin text-emerald-500" /></div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-5">
                      <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Total Revenue</div>
                      <div className="text-2xl font-bold text-emerald-700 mt-1">{inr(detail.stats.revenue)}</div>
                    </div>
                    <div className="rounded-2xl bg-gray-50 border border-gray-100 p-5">
                      <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">Orders</div>
                      <div className="text-2xl font-bold text-gray-900 mt-1">{detail.stats.orders}</div>
                    </div>
                    <div className="rounded-2xl bg-gray-50 border border-gray-100 p-5">
                      <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">Avg. Order</div>
                      <div className="text-2xl font-bold text-gray-900 mt-1">{inr(detail.stats.averageOrder)}</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">Customer since {fmtDate(detail.stats.firstOrderAt)} · last order {fmtDate(detail.stats.lastOrderAt)}</div>

                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-3">Invoices ({detail.invoices.length})</h3>
                    <div className="space-y-3">
                      {detail.invoices.map((inv) => (
                        <div key={inv._id} className="rounded-2xl border border-gray-100 p-4 hover:border-emerald-200 transition-colors">
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="font-mono text-sm font-semibold text-gray-900 truncate">{inv.invoiceNumber}</div>
                              <div className="text-xs text-gray-500 mt-0.5">{fmtDate(inv.createdAt)} · <span className="uppercase">{inv.paymentMethod}</span></div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <div className="font-bold text-gray-900">{inr(inv.totalAmount)}</div>
                              <button
                                onClick={() => handleDownload(inv)}
                                disabled={downloadingId === inv._id}
                                title="Download Invoice PDF"
                                className="p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 disabled:opacity-50"
                              >
                                {downloadingId === inv._id ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                              </button>
                            </div>
                          </div>
                          <div className="mt-3 text-xs text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
                            {inv.products.map((p, i) => (
                              <span key={i}>{p.itemName} × {formatQty(p.quantity, p.unit)}</span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
