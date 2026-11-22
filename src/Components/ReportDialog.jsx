import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, FileText, FileSpreadsheet, Download, Loader2, CalendarRange, Filter, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { downloadReport } from '../utils/api';

// All dates are India-time calendar days (YYYY-MM-DD), matching how the server reads them
const IST = 'Asia/Kolkata';
const ymd = (d) => d.toLocaleDateString('en-CA', { timeZone: IST });
const today = () => ymd(new Date());
const shift = (s, days) => ymd(new Date(new Date(`${s}T12:00:00+05:30`).getTime() + days * 86400000));
const pretty = (s) => new Date(`${s}T12:00:00+05:30`).toLocaleDateString('en-IN', { timeZone: IST, day: '2-digit', month: 'short', year: 'numeric' });

const PRESETS = [
  { id: 'today', label: 'Today', range: () => [today(), today()] },
  { id: 'yesterday', label: 'Yesterday', range: () => [shift(today(), -1), shift(today(), -1)] },
  { id: '7', label: 'Last 7 days', range: () => [shift(today(), -6), today()] },
  { id: '30', label: 'Last 30 days', range: () => [shift(today(), -29), today()] },
  { id: 'month', label: 'This month', range: () => [`${today().slice(0, 8)}01`, today()] },
  {
    id: 'lastmonth', label: 'Last month', range: () => {
      const firstThis = `${today().slice(0, 8)}01`;
      const lastPrev = shift(firstThis, -1);
      return [`${lastPrev.slice(0, 8)}01`, lastPrev];
    },
  },
  { id: 'year', label: 'This year', range: () => [`${today().slice(0, 4)}-01-01`, today()] },
  { id: 'custom', label: 'Custom', range: null },
];

const FORMATS = [
  { id: 'pdf', label: 'PDF report', icon: FileText, desc: 'Branded, print-ready, with summary cards and totals' },
  { id: 'csv', label: 'Excel (CSV)', icon: FileSpreadsheet, desc: 'Every column, opens in Excel or Google Sheets' },
];

/**
 * kind: 'bills' (date range required) | 'customers' (no dates)
 * endpoint: '/bill/report' | '/customers/report'
 * filters: { key: value } extra query params from the page (e.g. payment, type, search) — optional to apply
 * filterSummary: human text for those filters, e.g. 'UPI · Retail · "ravi"'
 */
export default function ReportDialog({ open, onClose, kind, endpoint, title, filters = {}, filterSummary = '' }) {
  const [preset, setPreset] = useState('month');
  const [from, setFrom] = useState(() => PRESETS.find((p) => p.id === 'month').range()[0]);
  const [to, setTo] = useState(today);
  const [format, setFormat] = useState('pdf');
  const [useFilters, setUseFilters] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape' && !busy) onClose(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [open, busy, onClose]);

  const pickPreset = (p) => {
    setPreset(p.id);
    if (p.range) { const [f, t] = p.range(); setFrom(f); setTo(t); }
  };

  const isBills = kind === 'bills';
  const hasFilters = Object.values(filters).some(Boolean);
  const dateError = isBills && (!from || !to ? 'Pick both dates.' : from > to ? 'The start date is after the end date.' : to > today() ? "The end date can't be in the future." : null);
  const days = useMemo(() => (isBills && from && to && from <= to ? Math.round((new Date(to) - new Date(from)) / 86400000) + 1 : 0), [isBills, from, to]);

  const download = async () => {
    if (dateError || busy) return;
    const qs = new URLSearchParams({ format });
    if (isBills) { qs.set('from', from); qs.set('to', to); }
    if (useFilters) Object.entries(filters).forEach(([k, v]) => v && qs.set(k, v));
    setBusy(true);
    try {
      const name = await downloadReport(`${endpoint}?${qs}`, `${kind}-report.${format}`);
      toast.success(`Downloaded ${name}`);
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-labelledby="report-title">
      <div className="absolute inset-0 bg-black/40" onClick={() => !busy && onClose()} />
      <div className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-5 sm:px-6 pt-5 pb-4 border-b border-gray-100 flex items-start justify-between gap-3 z-10">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center"><Download size={20} /></span>
            <div>
              <h2 id="report-title" className="text-lg font-bold text-gray-900">{title}</h2>
              <p className="text-sm text-gray-500">{isBills ? 'Choose a date range and format' : 'Your full customer list, ranked by spend'}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} disabled={busy} aria-label="Close" className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100"><X size={18} /></button>
        </div>

        <div className="px-5 sm:px-6 py-5 space-y-6">
          {isBills && (
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2.5"><CalendarRange size={15} /> Date range</div>
              <div className="flex flex-wrap gap-1.5">
                {PRESETS.map((p) => (
                  <button key={p.id} type="button" onClick={() => pickPreset(p)} aria-pressed={preset === p.id}
                    className={`px-3.5 py-1.5 text-sm font-semibold transition-colors ${preset === p.id ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="block text-xs font-medium text-gray-500 mb-1">From</span>
                  <input type="date" value={from} max={today()} onChange={(e) => { setFrom(e.target.value); setPreset('custom'); }}
                    className="w-full h-11 px-3 border border-gray-200 bg-white text-sm outline-none" />
                </label>
                <label className="block">
                  <span className="block text-xs font-medium text-gray-500 mb-1">To</span>
                  <input type="date" value={to} max={today()} onChange={(e) => { setTo(e.target.value); setPreset('custom'); }}
                    className="w-full h-11 px-3 border border-gray-200 bg-white text-sm outline-none" />
                </label>
              </div>
              <p className={`mt-2 text-xs ${dateError ? 'text-red-600' : 'text-gray-500'}`}>
                {dateError || (from === to ? `All bills on ${pretty(from)}` : `All bills from ${pretty(from)} to ${pretty(to)} · ${days} days`)}
              </p>
            </div>
          )}

          <div>
            <div className="text-sm font-semibold text-gray-700 mb-2.5">Format</div>
            <div className="grid sm:grid-cols-2 gap-3">
              {FORMATS.map((f) => {
                const active = format === f.id;
                return (
                  <button key={f.id} type="button" onClick={() => setFormat(f.id)} aria-pressed={active}
                    className={`sb-square relative text-left p-4 border-2 transition-all ${active ? 'border-emerald-600 bg-emerald-50' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                    {active && <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center"><Check size={12} strokeWidth={3} /></span>}
                    <f.icon size={22} className={active ? 'text-emerald-700' : 'text-gray-400'} />
                    <div className="mt-2 font-semibold text-gray-900 text-sm">{f.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5 leading-snug">{f.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {hasFilters && (
            <label className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 cursor-pointer">
              <input type="checkbox" checked={useFilters} onChange={(e) => setUseFilters(e.target.checked)} className="mt-0.5 w-4 h-4" />
              <span className="text-sm">
                <span className="flex items-center gap-1.5 font-semibold text-gray-800"><Filter size={14} /> Only include what matches my filters</span>
                <span className="block text-gray-500 mt-0.5">{filterSummary}</span>
              </span>
            </label>
          )}
        </div>

        <div className="sticky bottom-0 bg-white px-5 sm:px-6 py-4 border-t border-gray-100 flex gap-3">
          <button type="button" onClick={onClose} disabled={busy} className="flex-1 h-12 border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50">Cancel</button>
          <button type="button" onClick={download} disabled={busy || !!dateError}
            className="flex-[2] h-12 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-semibold flex items-center justify-center gap-2">
            {busy ? <><Loader2 size={18} className="animate-spin" /> Preparing…</> : <><Download size={18} /> Download {format === 'pdf' ? 'PDF' : 'CSV'}</>}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
