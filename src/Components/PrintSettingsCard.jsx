import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Printer, Save, Minus, Plus, RotateCcw } from 'lucide-react';
import { apiFetch } from '../utils/api';
import { buildReceiptHtml, PRINT_PAPERS, DEFAULT_PRINT } from '../utils/receipt';

// Sample bill for the preview (never saved anywhere)
const SAMPLE = {
  invoice: 'INV-SAMPLE-0001',
  date: new Date(),
  customerName: 'Priya Sharma',
  mobile: '9876543210',
  billedBy: 'Counter 1',
  paymentMethod: 'upi',
  items: [
    { name: 'Tender Coconut Ice Cream', quantity: 500, unit: 'g', price: 400, priceQty: 1000, total: 200 },
    { name: 'Mango Delight Cup', quantity: 2, unit: 'pcs', price: 60, priceQty: 1, total: 120, gstIncluded: true },
    { name: 'Sapota Family Pack', quantity: 1, unit: 'ltr', price: 320, priceQty: 1, total: 320 },
  ],
  gross: 640, discountLabel: 'Coupon MANGO20', discountAmount: 64, subTotal: 551.24, gstAmount: 24.76, total: 576,
};

const SCALE_STEPS = [80, 90, 100, 110, 120, 130];

// Settings → Bill printing: paper size, scale and margin for this branch's printer, with a live preview
export default function PrintSettingsCard({ shop }) {
  const [p, setP] = useState(DEFAULT_PRINT);
  const [saved, setSaved] = useState(DEFAULT_PRINT);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch('/settings')
      .then((d) => {
        const v = {
          printPaper: d.data?.printPaper || DEFAULT_PRINT.printPaper,
          printScale: d.data?.printScale ?? DEFAULT_PRINT.printScale,
          printMargin: d.data?.printMargin ?? DEFAULT_PRINT.printMargin,
        };
        setP(v);
        setSaved(v);
      })
      .catch(() => {}); // no settings yet: defaults
  }, []);

  const set = (k, v) => setP((x) => ({ ...x, [k]: v }));
  const dirty = p.printPaper !== saved.printPaper || p.printScale !== saved.printScale || p.printMargin !== saved.printMargin;
  const html = useMemo(() => buildReceiptHtml(SAMPLE, { ...shop, ...p }), [shop, p]);
  const paper = PRINT_PAPERS.find((x) => x.value === p.printPaper) || PRINT_PAPERS[1];

  const save = async () => {
    setSaving(true);
    try {
      const res = await apiFetch('/settings/print', { method: 'PUT', body: { ...p, printScale: Math.round(p.printScale), printMargin: Number(p.printMargin) } });
      setSaved(p);
      toast.success(res.message);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const testPrint = () => {
    const win = window.open('', '_blank');
    if (!win) { toast.error('Allow pop-ups to print a test bill.'); return; }
    win.document.write(html);
    win.document.close();
    let printed = false;
    const go = () => { if (!printed) { printed = true; win.print(); } };
    win.onload = go;
    setTimeout(go, 1200);
  };

  return (
    <section id="bill-printing" className="scroll-mt-28 bg-white/60 backdrop-blur-xl rounded-2xl border border-white/70 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-white/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold text-gray-900">Bill Printing</h2>
          <p className="text-sm text-gray-500 mt-1">Paper size and scale for this branch's printer. Used by every Print button.</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button type="button" onClick={testPrint} className="h-11 px-4 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 font-medium flex items-center gap-2">
            <Printer size={17} /> Test print
          </button>
          <button type="button" onClick={save} disabled={saving || !dirty}
            className="h-11 px-5 rounded-xl bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white font-semibold flex items-center gap-2 shadow-lg">
            <Save size={17} /> {saving ? 'Saving…' : dirty ? 'Save' : 'Saved'}
          </button>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-8">
        <div className="space-y-7">
          {/* Paper */}
          <div>
            <span className="block text-sm font-medium text-gray-700 mb-2">Paper size</span>
            <div role="radiogroup" aria-label="Paper size" className="grid grid-cols-2 gap-2">
              {PRINT_PAPERS.map((x) => (
                <button key={x.value} type="button" role="radio" aria-checked={p.printPaper === x.value} onClick={() => set('printPaper', x.value)}
                  className={`text-left p-3 rounded-xl border transition-colors flex items-center gap-3 ${p.printPaper === x.value ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-600/20' : 'border-gray-200 bg-white/70 hover:border-gray-400'}`}>
                  {/* little paper shape, width proportional to the roll */}
                  <span className="w-9 h-10 flex items-end justify-center shrink-0">
                    <span className={`block rounded-sm border ${p.printPaper === x.value ? 'border-emerald-600 bg-white' : 'border-gray-300 bg-white'}`}
                      style={{ width: x.value === 'a4' ? 28 : Math.round(8 + (x.width / 104) * 20), height: x.value === 'a4' ? 36 : 40 }} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-gray-900">{x.label}</span>
                    <span className="block text-xs text-gray-500">{x.hint}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Scale */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="print-scale" className="text-sm font-medium text-gray-700">Bill scale</label>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => set('printScale', Math.max(60, p.printScale - 5))} aria-label="Smaller" className="w-8 h-8 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-50"><Minus size={14} /></button>
                <span className="w-14 text-center font-semibold text-gray-900 tabular-nums">{p.printScale}%</span>
                <button type="button" onClick={() => set('printScale', Math.min(160, p.printScale + 5))} aria-label="Bigger" className="w-8 h-8 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-50"><Plus size={14} /></button>
              </div>
            </div>
            <input id="print-scale" type="range" min="60" max="160" step="5" value={p.printScale} onChange={(e) => set('printScale', Number(e.target.value))}
              className="w-full accent-emerald-700" />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {SCALE_STEPS.map((v) => (
                <button key={v} type="button" onClick={() => set('printScale', v)}
                  className={`px-3 h-8 rounded-full text-xs font-semibold border ${p.printScale === v ? 'bg-gray-900 border-gray-900 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'}`}>{v}%</button>
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-500">Makes all text bigger or smaller while the bill still fits the paper width. {p.printPaper === '58mm' ? 'On 58 mm rolls, 80–90% keeps long item names on one line.' : p.printPaper === 'a4' ? 'On A4, 120–140% is easier to read.' : ''}</p>
          </div>

          {/* Margin */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="print-margin" className="text-sm font-medium text-gray-700">Margin around the bill</label>
              <span className="font-semibold text-gray-900 tabular-nums">{p.printMargin} mm</span>
            </div>
            <input id="print-margin" type="range" min="0" max="15" step="0.5" value={p.printMargin} onChange={(e) => set('printMargin', Number(e.target.value))}
              className="w-full accent-emerald-700" />
            <p className="mt-1 text-xs text-gray-500">Increase it if the printer cuts off the edges; most thermal printers need 2–4 mm.</p>
          </div>

          <button type="button" onClick={() => setP(DEFAULT_PRINT)} className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800">
            <RotateCcw size={14} /> Reset to 80 mm, 100%, 3 mm
          </button>
        </div>

        {/* Preview */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Preview</span>
            <span className="text-xs text-gray-500">{paper.label} · {p.printScale}% · {p.printMargin} mm</span>
          </div>
          <div className="rounded-xl border border-gray-200 bg-[#eceae4] overflow-hidden">
            <iframe title="Bill print preview" sandbox="" srcDoc={html} className="w-full h-[640px] border-0 block" />
          </div>
          <p className="mt-2 text-xs text-gray-400">Sample bill. Your shop name, address and GSTIN come from Shop Details above.</p>
        </div>
      </div>
    </section>
  );
}
