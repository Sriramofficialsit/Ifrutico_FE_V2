import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, TicketPercent, X, Pencil, Trash2, Pause, Play, Copy, Search, Megaphone, CalendarClock, Users } from 'lucide-react';
import { apiFetch } from '../utils/api';
import { offerText } from '../utils/coupon';
import { BILL_MODES } from '../utils/billModes';

const inputCls = 'w-full h-11 px-3.5 border border-gray-200 bg-white text-sm outline-none transition-all focus:border-emerald-600';
const labelCls = 'block text-sm font-medium text-gray-700 mb-1.5';

const STATE = {
  live: { label: 'Live', cls: 'bg-emerald-100 text-emerald-800' },
  scheduled: { label: 'Scheduled', cls: 'bg-sky-100 text-sky-800' },
  paused: { label: 'Paused', cls: 'bg-gray-100 text-gray-600' },
  expired: { label: 'Expired', cls: 'bg-red-50 text-red-700' },
  used_up: { label: 'Used up', cls: 'bg-amber-100 text-amber-800' },
};
const FILTERS = [['all', 'All'], ['live', 'Live'], ['scheduled', 'Scheduled'], ['paused', 'Paused'], ['expired', 'Expired'], ['used_up', 'Used up']];

const toDateInput = (d) => (d ? new Date(d).toLocaleDateString('en-CA') : ''); // yyyy-mm-dd in local time
const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const emptyForm = {
  code: '', description: '', type: 'percent', value: '', maxDiscount: '', minBill: '',
  validFrom: '', validTo: '', usageLimit: '', perCustomerLimit: '1', billTypes: [], active: true,
};

// Random readable code, e.g. FRUIT-7KQ2
const suggestCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return 'FRUIT-' + Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

function CouponForm({ initial, onClose, onSaved }) {
  const [f, setF] = useState(initial ? {
    ...emptyForm, ...initial,
    value: String(initial.value ?? ''), maxDiscount: initial.maxDiscount ? String(initial.maxDiscount) : '',
    minBill: initial.minBill ? String(initial.minBill) : '', usageLimit: initial.usageLimit ? String(initial.usageLimit) : '',
    perCustomerLimit: String(initial.perCustomerLimit ?? 1), validFrom: toDateInput(initial.validFrom), validTo: toDateInput(initial.validTo),
  } : { ...emptyForm, code: suggestCode() });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const toggleType = (t) => setF({ ...f, billTypes: f.billTypes.includes(t) ? f.billTypes.filter((x) => x !== t) : [...f.billTypes, t] });

  const submit = async (e) => {
    e.preventDefault();
    const body = {
      code: f.code.trim().toUpperCase(),
      description: f.description.trim(),
      type: f.type,
      value: Number(f.value),
      maxDiscount: f.type === 'percent' ? Number(f.maxDiscount) || 0 : 0,
      minBill: Number(f.minBill) || 0,
      // Start of the first day .. end of the last day, in the shop's local time
      validFrom: f.validFrom ? new Date(`${f.validFrom}T00:00:00`).toISOString() : null,
      validTo: f.validTo ? new Date(`${f.validTo}T23:59:59`).toISOString() : null,
      usageLimit: Number(f.usageLimit) || 0,
      perCustomerLimit: Number(f.perCustomerLimit) || 0,
      billTypes: f.billTypes,
      active: f.active,
    };
    if (!(body.value > 0)) { toast.error('Enter the discount value.'); return; }
    setSaving(true);
    try {
      const res = initial
        ? await apiFetch(`/coupons/${initial._id}`, { method: 'PUT', body })
        : await apiFetch('/coupons', { method: 'POST', body });
      toast.success(res.message);
      onSaved();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const preview = Number(f.value) > 0 ? offerText({ type: f.type, value: Number(f.value), maxDiscount: Number(f.maxDiscount) || 0 }) : '—';

  return createPortal(
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 sm:p-4 animate-fade-in" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={initial ? 'Edit coupon' : 'New coupon'}
        className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-zoom-in">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">{initial ? 'Edit coupon' : 'New coupon'}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="p-2 -mr-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Live ticket preview */}
          <div className="relative flex items-stretch overflow-hidden rounded-2xl bg-emerald-800 text-white">
            <div className="flex-1 p-5">
              <div className="text-xs uppercase tracking-widest text-emerald-200 font-semibold">Coupon</div>
              <div className="text-3xl font-extrabold mt-1">{preview}</div>
              <div className="text-sm text-emerald-100 mt-1 truncate">{f.description || 'Add a short description customers will see'}</div>
            </div>
            <div className="border-l-2 border-dashed border-emerald-500 px-5 flex items-center">
              <span className="font-mono text-lg font-bold tracking-widest">{f.code || 'CODE'}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="c-code" className={labelCls}>Code *</label>
              <div className="flex gap-2">
                <input id="c-code" value={f.code} maxLength={20} required
                  onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '') })}
                  className={`${inputCls} font-mono tracking-wider`} />
                <button type="button" onClick={() => setF({ ...f, code: suggestCode() })} className="shrink-0 px-3 border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Random</button>
              </div>
            </div>
            <div>
              <label htmlFor="c-desc" className={labelCls}>Description</label>
              <input id="c-desc" value={f.description} maxLength={200} onChange={set('description')} placeholder="e.g. Mango season special" className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <span className={labelCls}>Discount type</span>
              <div role="radiogroup" className="grid grid-cols-2 border border-gray-200">
                {[['percent', '% off'], ['amount', '₹ off']].map(([t, l]) => (
                  <button key={t} type="button" role="radio" aria-checked={f.type === t} onClick={() => setF({ ...f, type: t })}
                    className={`h-11 text-sm font-semibold ${f.type === t ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>{l}</button>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="c-value" className={labelCls}>{f.type === 'percent' ? 'Percent *' : 'Amount (₹) *'}</label>
              <input id="c-value" type="number" min="0.01" max={f.type === 'percent' ? 100 : undefined} step="0.01" required value={f.value} onChange={set('value')} className={inputCls} />
            </div>
            {f.type === 'percent' && (
              <div>
                <label htmlFor="c-max" className={labelCls}>Max discount (₹)</label>
                <input id="c-max" type="number" min="0" step="1" value={f.maxDiscount} onChange={set('maxDiscount')} placeholder="No cap" className={inputCls} />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="c-min" className={labelCls}>Minimum bill (₹)</label>
              <input id="c-min" type="number" min="0" step="1" value={f.minBill} onChange={set('minBill')} placeholder="None" className={inputCls} />
            </div>
            <div>
              <label htmlFor="c-from" className={labelCls}>Valid from</label>
              <input id="c-from" type="date" value={f.validFrom} onChange={set('validFrom')} className={inputCls} />
            </div>
            <div>
              <label htmlFor="c-to" className={labelCls}>Valid till</label>
              <input id="c-to" type="date" min={f.validFrom || undefined} value={f.validTo} onChange={set('validTo')} className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="c-limit" className={labelCls}>Total uses</label>
              <input id="c-limit" type="number" min="0" step="1" value={f.usageLimit} onChange={set('usageLimit')} placeholder="Unlimited" className={inputCls} />
            </div>
            <div>
              <label htmlFor="c-per" className={labelCls}>Uses per customer</label>
              <input id="c-per" type="number" min="0" step="1" value={f.perCustomerLimit} onChange={set('perCustomerLimit')} placeholder="Unlimited" className={inputCls} />
              <p className="mt-1 text-xs text-gray-500">Counted by mobile number. 0 = unlimited.</p>
            </div>
          </div>

          <div>
            <span className={labelCls}>Works on</span>
            <div className="flex flex-wrap gap-2">
              {Object.values(BILL_MODES).map((m) => {
                const on = f.billTypes.length === 0 || f.billTypes.includes(m.key);
                return (
                  <button key={m.key} type="button" aria-pressed={f.billTypes.includes(m.key)} onClick={() => toggleType(m.key)}
                    className={`inline-flex items-center gap-1.5 px-3 h-9 text-sm font-medium border ${on ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-gray-200 text-gray-500'}`}>
                    <m.icon size={15} /> {m.label}
                  </button>
                );
              })}
            </div>
            <p className="mt-1 text-xs text-gray-500">{f.billTypes.length === 0 ? 'All billing types. Tap to limit it to specific ones.' : 'Only the highlighted billing types accept this code.'}</p>
          </div>

          <label className="flex items-center gap-3 text-sm text-gray-700">
            <input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} className="w-4 h-4 accent-emerald-700" />
            Active (can be used at billing)
          </label>
        </div>

        <div className="p-4 border-t border-gray-100 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="h-11 px-5 border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium">Cancel</button>
          <button type="submit" disabled={saving} className="h-11 px-6 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white font-semibold">
            {saving ? 'Saving…' : initial ? 'Save changes' : 'Create coupon'}
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}

export default function Coupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | 'new' | coupon
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = () =>
    apiFetch('/coupons')
      .then((d) => setCoupons(d.data || []))
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const shown = useMemo(() => {
    const term = q.trim().toUpperCase();
    return coupons.filter((c) => (filter === 'all' || c.state === filter) && (!term || c.code.includes(term) || (c.description || '').toUpperCase().includes(term)));
  }, [coupons, filter, q]);

  const stats = useMemo(() => ({
    live: coupons.filter((c) => c.state === 'live').length,
    uses: coupons.reduce((s, c) => s + (c.usedCount || 0), 0),
    total: coupons.length,
  }), [coupons]);

  const toggleActive = async (c) => {
    try {
      const res = await apiFetch(`/coupons/${c._id}/active`, { method: 'PATCH', body: { active: !c.active } });
      toast.success(res.message);
      load();
    } catch (e) { toast.error(e.message); }
  };

  const remove = async () => {
    try {
      const res = await apiFetch(`/coupons/${confirmDelete._id}`, { method: 'DELETE' });
      toast.success(res.message);
      setConfirmDelete(null);
      load();
    } catch (e) { toast.error(e.message); }
  };

  const copy = (code) => navigator.clipboard?.writeText(code).then(() => toast.success(`${code} copied`), () => {});

  return (
    <div className="animate-fade-in-up">
      <div className="mx-auto max-w-screen-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">Coupons</h1>
            <p className="text-sm text-gray-500 mt-1">Codes customers can use on Retail, Events & Functions and Stall bills.</p>
          </div>
          <div className="flex gap-2">
            <Link to="/campaigns" className="h-11 px-4 border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 font-medium flex items-center gap-2"><Megaphone size={18} /> Send to customers</Link>
            <button type="button" onClick={() => setEditing('new')} className="h-11 px-5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold flex items-center gap-2 shadow-lg"><Plus size={18} /> New coupon</button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[['Live coupons', stats.live, <TicketPercent key="t" size={20} />], ['Times used', stats.uses, <Users key="u" size={20} />], ['All coupons', stats.total, <CalendarClock key="c" size={20} />]].map(([l, v, icon]) => (
            <div key={l} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
              <span className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">{icon}</span>
              <div className="min-w-0"><div className="text-2xl font-bold text-gray-900">{v}</div><div className="text-xs text-gray-500 truncate">{l}</div></div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
            <div className="relative lg:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search code or description" className="w-full h-11 pl-11 pr-3 border border-gray-200 outline-none text-sm" />
            </div>
            <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {FILTERS.map(([k, l]) => (
                <button key={k} type="button" onClick={() => setFilter(k)}
                  className={`shrink-0 px-4 h-9 text-sm font-medium border ${filter === k ? 'bg-gray-900 border-gray-900 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'}`}>{l}</button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }, (_, i) => <div key={i} className="h-40 rounded-2xl bg-gray-100 animate-pulse" />)}
            </div>
          ) : shown.length === 0 ? (
            <div className="py-16 text-center">
              <TicketPercent size={40} strokeWidth={1.25} className="mx-auto text-gray-300" />
              <p className="mt-3 font-medium text-gray-700">{coupons.length ? 'No coupons match' : 'No coupons yet'}</p>
              <p className="text-sm text-gray-500">{coupons.length ? 'Try another filter.' : 'Create one, then send it to your regular customers from Campaigns.'}</p>
            </div>
          ) : (
            <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {shown.map((c) => {
                const st = STATE[c.state] || STATE.live;
                const pct = c.usageLimit > 0 ? Math.min(100, (c.usedCount / c.usageLimit) * 100) : null;
                return (
                  <article key={c._id} className={`rounded-2xl border overflow-hidden flex flex-col ${c.state === 'live' ? 'border-emerald-200' : 'border-gray-200'}`}>
                    <div className={`flex items-stretch ${c.state === 'live' ? 'bg-emerald-800 text-white' : 'bg-gray-100 text-gray-700'}`}>
                      <div className="flex-1 p-4 min-w-0">
                        <div className="text-2xl font-extrabold leading-tight">{offerText(c)}</div>
                        <div className={`text-xs mt-1 truncate ${c.state === 'live' ? 'text-emerald-100' : 'text-gray-500'}`}>{c.description || 'No description'}</div>
                      </div>
                      <button type="button" onClick={() => copy(c.code)} title="Copy code"
                        className={`border-l-2 border-dashed px-4 flex flex-col items-center justify-center gap-1 ${c.state === 'live' ? 'border-emerald-500 hover:bg-white/10' : 'border-gray-300 hover:bg-gray-200'}`}>
                        <span className="font-mono font-bold tracking-widest">{c.code}</span>
                        <Copy size={12} className="opacity-70" />
                      </button>
                    </div>
                    <div className="p-4 space-y-2 text-sm flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${st.cls}`}>{st.label}</span>
                        <span className="text-xs text-gray-500">{c.billTypes?.length ? c.billTypes.map((t) => BILL_MODES[t]?.label).join(' · ') : 'All bill types'}</span>
                      </div>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {c.minBill > 0 && <li>Minimum bill ₹{c.minBill}</li>}
                        <li>{c.validFrom || c.validTo ? `${c.validFrom ? fmtDate(c.validFrom) : 'Now'} → ${c.validTo ? fmtDate(c.validTo) : 'No end'}` : 'No expiry'}</li>
                        <li>{c.perCustomerLimit > 0 ? `${c.perCustomerLimit} use${c.perCustomerLimit === 1 ? '' : 's'} per customer` : 'Unlimited per customer'}</li>
                      </ul>
                      <div>
                        <div className="flex justify-between text-xs text-gray-500 mb-1"><span>Used</span><span className="font-semibold text-gray-800">{c.usedCount}{c.usageLimit > 0 ? ` / ${c.usageLimit}` : ''}</span></div>
                        {pct !== null && <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-600" style={{ width: `${pct}%` }} /></div>}
                      </div>
                    </div>
                    <div className="px-4 pb-4 flex gap-2">
                      <button type="button" onClick={() => setEditing(c)} className="flex-1 h-9 border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-1.5"><Pencil size={14} /> Edit</button>
                      <button type="button" onClick={() => toggleActive(c)} className="flex-1 h-9 border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-1.5">
                        {c.active ? <><Pause size={14} /> Pause</> : <><Play size={14} /> Resume</>}
                      </button>
                      <button type="button" onClick={() => setConfirmDelete(c)} disabled={c.usedCount > 0} title={c.usedCount > 0 ? 'Used coupons can only be paused' : 'Delete'}
                        aria-label={`Delete ${c.code}`} className="h-9 px-3 border border-gray-200 text-gray-500 hover:text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-500"><Trash2 size={14} /></button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {editing && <CouponForm initial={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}

      {confirmDelete && createPortal(
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setConfirmDelete(null)}>
          <div onClick={(e) => e.stopPropagation()} role="alertdialog" aria-modal="true" className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 animate-zoom-in">
            <h3 className="text-lg font-semibold text-gray-900">Delete {confirmDelete.code}?</h3>
            <p className="text-sm text-gray-500 mt-1">It hasn't been used yet. This can't be undone.</p>
            <div className="mt-5 flex gap-3">
              <button type="button" onClick={() => setConfirmDelete(null)} className="flex-1 h-11 border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium">Cancel</button>
              <button type="button" onClick={remove} className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white font-semibold">Delete</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
