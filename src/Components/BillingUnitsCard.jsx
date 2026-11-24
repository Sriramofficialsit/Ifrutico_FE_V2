import { useEffect, useState } from 'react';
import { Save, X, Plus, IceCreamCone, PartyPopper, Scale, Store } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiFetch } from '../utils/api';
import { DEFAULT_BILLING_CONFIG, fmtLitres } from '../utils/billModes';
import { UNITS } from '../utils/units';

const inputCls = 'w-full h-11 px-4 rounded-lg border border-white/50 bg-white/50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all';

// Admin: the central units every branch uses — Retail's default measure, Events & Functions (litre boxes) and Stalls (scoops)
export default function BillingUnitsCard() {
  const [cfg, setCfg] = useState(DEFAULT_BILLING_CONFIG);
  const [scoop, setScoop] = useState(String(DEFAULT_BILLING_CONFIG.scoopGrams));
  const [gpl, setGpl] = useState(String(DEFAULT_BILLING_CONFIG.gramsPerLitre));
  const [newBox, setNewBox] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch('/billing-config')
      .then((d) => {
        if (!d.data) return;
        setCfg(d.data);
        setScoop(String(d.data.scoopGrams));
        setGpl(String(d.data.gramsPerLitre));
      })
      .catch(() => toast.error('Could not load billing units.'));
  }, []);

  // Open on #billing-units (the "Change units" link on the billing screens)
  useEffect(() => {
    if (window.location.hash === '#billing-units') {
      setTimeout(() => document.getElementById('billing-units')?.scrollIntoView({ behavior: 'smooth' }), 300);
    }
  }, []);

  const addBox = () => {
    const v = Number(newBox);
    if (!(v >= 0.1 && v <= 50)) { toast.error('Box size must be 0.1–50 L.'); return; }
    if (cfg.boxSizes.includes(v)) { setNewBox(''); return; }
    if (cfg.boxSizes.length >= 12) { toast.error('Up to 12 box sizes.'); return; }
    setCfg({ ...cfg, boxSizes: [...cfg.boxSizes, v].sort((a, b) => a - b) });
    setNewBox('');
  };
  const removeBox = (v) => {
    if (cfg.boxSizes.length <= 1) { toast.error('Keep at least one box size.'); return; }
    setCfg({ ...cfg, boxSizes: cfg.boxSizes.filter((b) => b !== v) });
  };

  const save = async () => {
    const scoopGrams = Number(scoop);
    const gramsPerLitre = Number(gpl);
    if (!(scoopGrams >= 10 && scoopGrams <= 1000)) { toast.error('Scoop size must be 10–1000 g.'); return; }
    if (!(gramsPerLitre >= 100 && gramsPerLitre <= 2000)) { toast.error('Weight per litre must be 100–2000 g.'); return; }
    setSaving(true);
    try {
      const res = await apiFetch('/billing-config', { method: 'PUT', body: { scoopGrams, gramsPerLitre, boxSizes: cfg.boxSizes, retailUnit: cfg.retailUnit || '' } });
      setCfg(res.data);
      toast.success('Billing units saved for all branches');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section id="billing-units" className="scroll-mt-28 bg-white/60 backdrop-blur-xl rounded-2xl border border-white/70 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-white/60">
        <h2 className="text-xl md:text-2xl font-semibold text-gray-900">Billing Units</h2>
        <p className="text-sm text-gray-500 mt-1">Shared by every branch. Retail, Events & Functions and Stalls bills use these to measure sales and take stock out of the central inventory.</p>
      </div>
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div>
          <label htmlFor="cfg-retail-unit" className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5"><Store size={15} className="text-emerald-700" /> Retail default measure</label>
          <select id="cfg-retail-unit" value={cfg.retailUnit || ''} onChange={(e) => setCfg({ ...cfg, retailUnit: e.target.value })} className={inputCls}>
            <option value="">Each product's own unit</option>
            {UNITS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
          </select>
          <p className="mt-1 text-xs text-gray-500">New retail lines start in this measure and cards show the rate per it. Products that can't be converted keep their own unit; staff can still switch units on each line.</p>
        </div>
        <div>
          <label htmlFor="cfg-scoop" className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5"><IceCreamCone size={15} className="text-emerald-700" /> Stall scoop size (g)</label>
          <input id="cfg-scoop" type="number" min="10" max="1000" step="5" value={scoop} onChange={(e) => setScoop(e.target.value)} className={inputCls} />
          <p className="mt-1 text-xs text-gray-500">Default for each stall bill; staff can change it per bill.</p>
        </div>
        <div>
          <span className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5"><PartyPopper size={15} className="text-emerald-700" /> Suggested event box sizes (litres) — any custom size can still be typed at billing</span>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {cfg.boxSizes.map((b) => (
              <span key={b} className="inline-flex items-center gap-1 pl-3 pr-1 h-8 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold">
                {fmtLitres(b)}
                <button type="button" onClick={() => removeBox(b)} aria-label={`Remove ${fmtLitres(b)}`} className="p-1 rounded-full hover:bg-emerald-100"><X size={13} /></button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input type="number" min="0.1" max="50" step="0.1" placeholder="e.g. 4" value={newBox}
              onChange={(e) => setNewBox(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addBox(); } }}
              aria-label="New box size in litres" className={inputCls} />
            <button type="button" onClick={addBox} className="shrink-0 h-11 px-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 flex items-center gap-1 text-sm font-medium"><Plus size={16} /> Add</button>
          </div>
        </div>
        <div>
          <label htmlFor="cfg-gpl" className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5"><Scale size={15} className="text-emerald-700" /> Weight of 1 litre (g)</label>
          <input id="cfg-gpl" type="number" min="100" max="2000" step="10" value={gpl} onChange={(e) => setGpl(e.target.value)} className={inputCls} />
          <p className="mt-1 text-xs text-gray-500">Converts litres ↔ grams when a product is stocked by weight but sold by volume (or the reverse). 1000 = 1 g per ml.</p>
        </div>
      </div>
      <div className="px-6 pb-6 flex justify-end">
        <button type="button" onClick={save} disabled={saving}
          className="px-6 py-3 rounded-xl bg-gray-900 hover:bg-gray-800 disabled:opacity-60 text-white font-semibold flex items-center gap-2 transition-all shadow-lg">
          <Save size={18} /> {saving ? 'Saving...' : 'Save Billing Units'}
        </button>
      </div>
    </section>
  );
}
