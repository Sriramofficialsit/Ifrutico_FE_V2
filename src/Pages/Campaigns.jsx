import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Plus, Megaphone, TicketPercent, PartyPopper, Image as ImageIcon, X, Send, Save, Trash2, Pencil, Copy, ChevronLeft,
  Users, Upload, Loader2, Mail, Monitor, Smartphone, CheckCircle2, AlertTriangle, Clock,
} from 'lucide-react';
import { apiFetch, assetUrl } from '../utils/api';
import { offerText } from '../utils/coupon';

const inputCls = 'w-full h-11 px-3.5 border border-gray-200 bg-white text-sm outline-none transition-all focus:border-emerald-600';
const labelCls = 'block text-sm font-medium text-gray-700 mb-1.5';

// The three mail templates and their starting content
const TEMPLATES = {
  coupon: {
    key: 'coupon', label: 'Coupon offer', icon: TicketPercent, tone: 'from-emerald-700 to-emerald-900',
    blurb: 'A discount code for your regular customers, shown as a ticket they can use at billing.',
    defaults: {
      subject: '{name}, a sweet treat is waiting for you 🍨',
      preheader: 'Your exclusive Ifrutico coupon is inside',
      heading: 'Thank you for being a regular, {name}!',
      message: 'You have been with us through every season, so here is a little something back.\n\nShow this code at any Ifrutico counter or stall and the discount is yours.',
      ctaText: '', ctaUrl: '',
    },
  },
  event: {
    key: 'event', label: 'Event invitation', icon: PartyPopper, tone: 'from-amber-500 to-orange-600',
    blurb: 'Invite customers to a launch, tasting, festival stall or function with date, time and venue.',
    defaults: {
      subject: "You're invited: {name}, join us!",
      preheader: 'Date, time and venue inside',
      heading: 'Join us for a scoop-tacular day',
      message: 'We are celebrating with new fruit flavours, live tasting and special offers.\n\nBring your family and friends. We would love to see you there!',
      ctaText: 'Get directions', ctaUrl: '',
    },
  },
  poster: {
    key: 'poster', label: 'Poster', icon: ImageIcon, tone: 'from-sky-600 to-indigo-700',
    blurb: 'Send a designed poster or flyer image (new flavour, festival offer) with a short note.',
    defaults: {
      subject: 'New at Ifrutico: something fresh for you, {name}',
      preheader: 'Take a look at what is new this week',
      heading: '',
      message: 'Made with real fruit, just like always. Visit your nearest Ifrutico this week!',
      ctaText: 'Visit our website', ctaUrl: 'https://ifrutico.com',
    },
  },
};

const STATUS = {
  draft: { label: 'Draft', cls: 'bg-gray-100 text-gray-600', icon: Pencil },
  sending: { label: 'Sending', cls: 'bg-sky-100 text-sky-800', icon: Loader2 },
  sent: { label: 'Sent', cls: 'bg-emerald-100 text-emerald-800', icon: CheckCircle2 },
  failed: { label: 'Needs attention', cls: 'bg-amber-100 text-amber-800', icon: AlertTriangle },
};

const blank = (template) => ({
  name: '', template, coupon: '', eventDate: '', eventTime: '', venue: '', imageUrl: '',
  audience: { segment: 'regular', minBills: 3, withinDays: 0 },
  ...TEMPLATES[template].defaults,
});

const toPayload = (f) => ({
  name: f.name.trim() || `${TEMPLATES[f.template].label} – ${new Date().toLocaleDateString('en-IN')}`,
  template: f.template,
  subject: f.subject, preheader: f.preheader || '', heading: f.heading || '', message: f.message || '',
  coupon: f.template === 'coupon' ? f.coupon || null : null,
  eventDate: f.template === 'event' && f.eventDate ? new Date(`${f.eventDate}T00:00:00`).toISOString() : null,
  eventTime: f.template === 'event' ? f.eventTime || '' : '',
  venue: f.template === 'event' ? f.venue || '' : '',
  imageUrl: f.imageUrl || null,
  ctaText: f.ctaText || '', ctaUrl: f.ctaUrl || '',
  audience: { segment: f.audience.segment, minBills: Number(f.audience.minBills) || 1, withinDays: Number(f.audience.withinDays) || 0 },
});

const fromCampaign = (c) => ({
  ...blank(c.template),
  ...c,
  coupon: c.coupon?._id || c.coupon || '',
  eventDate: c.eventDate ? new Date(c.eventDate).toLocaleDateString('en-CA') : '',
  imageUrl: c.imageUrl || '',
  audience: { segment: 'regular', minBills: 3, withinDays: 0, ...(c.audience || {}) },
});

const useDebounced = (value, ms) => {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
};

// ── Editor ────────────────────────────────────────────────────
function CampaignEditor({ initial, onBack, onSaved }) {
  const [f, setF] = useState(initial);
  const [id, setId] = useState(initial._id || null);
  const [coupons, setCoupons] = useState([]);
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewSubject, setPreviewSubject] = useState('');
  const [device, setDevice] = useState('desktop');
  const [audience, setAudience] = useState(null);
  const [busy, setBusy] = useState(null); // 'save' | 'test' | 'send' | 'upload'
  const [testEmail, setTestEmail] = useState('');
  const [confirmSend, setConfirmSend] = useState(false);
  const fileRef = useRef(null);
  const tpl = TEMPLATES[f.template];
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const setAud = (k, v) => setF((x) => ({ ...x, audience: { ...x.audience, [k]: v } }));

  useEffect(() => {
    if (f.template !== 'coupon') return;
    apiFetch('/coupons/active').then((d) => setCoupons(d.data || [])).catch(() => {});
  }, [f.template]);

  // Live preview (server renders the exact email HTML)
  const payload = useMemo(() => toPayload(f), [f]);
  const debouncedPayload = useDebounced(payload, 400);
  useEffect(() => {
    let cancelled = false;
    apiFetch('/campaigns/preview', { method: 'POST', body: debouncedPayload })
      .then((d) => { if (!cancelled) { setPreviewHtml(d.data.html); setPreviewSubject(d.data.subject); } })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [debouncedPayload]);

  // Recipient count for the chosen segment
  const aud = useDebounced(f.audience, 400);
  useEffect(() => {
    let cancelled = false;
    const qs = new URLSearchParams({ segment: aud.segment, minBills: aud.minBills || 1, withinDays: aud.withinDays || 0 });
    apiFetch(`/campaigns/audience?${qs}`).then((d) => !cancelled && setAudience(d.data)).catch(() => !cancelled && setAudience(null));
    return () => { cancelled = true; };
  }, [aud]);

  const save = async ({ quiet } = {}) => {
    setBusy((b) => b || 'save');
    try {
      const res = id
        ? await apiFetch(`/campaigns/${id}`, { method: 'PUT', body: payload })
        : await apiFetch('/campaigns', { method: 'POST', body: payload });
      setId(res.data._id);
      if (!quiet) toast.success('Draft saved');
      return res.data._id;
    } catch (e) {
      toast.error(e.message);
      return null;
    } finally {
      setBusy((b) => (b === 'save' ? null : b));
    }
  };

  const sendTest = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmail.trim())) { toast.error('Enter an email for the test.'); return; }
    setBusy('test');
    const savedId = await save({ quiet: true });
    if (savedId) {
      try {
        const res = await apiFetch(`/campaigns/${savedId}/test`, { method: 'POST', body: { email: testEmail.trim() } });
        toast.success(res.message);
      } catch (e) { toast.error(e.message); }
    }
    setBusy(null);
  };

  const sendNow = async () => {
    setBusy('send');
    const savedId = await save({ quiet: true });
    if (savedId) {
      try {
        await apiFetch(`/campaigns/${savedId}/send`, { method: 'POST' });
        toast.success('Sending started. You can leave this page.');
        setConfirmSend(false);
        onSaved();
        return;
      } catch (e) { toast.error(e.message); }
    }
    setBusy(null);
  };

  const upload = async (file) => {
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { toast.error('Image must be under 3 MB.'); return; }
    const fd = new FormData();
    fd.append('image', file);
    setBusy('upload');
    try {
      const res = await apiFetch('/campaigns/upload', { method: 'POST', body: fd });
      setF((x) => ({ ...x, imageUrl: res.data.url }));
    } catch (e) { toast.error(e.message); } finally {
      setBusy(null);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const selectedCoupon = coupons.find((c) => c._id === f.coupon);
  const canSend = audience?.count > 0 && (f.template !== 'coupon' || f.coupon) && (f.template !== 'poster' || f.imageUrl);

  return (
    <div className="animate-fade-in-up">
      <div className="mx-auto max-w-screen-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button type="button" onClick={onBack} aria-label="Back to campaigns" className="w-10 h-10 shrink-0 border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-50"><ChevronLeft size={20} /></button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-700"><tpl.icon size={14} /> {tpl.label}</div>
              <input value={f.name} onChange={set('name')} placeholder="Untitled campaign" aria-label="Campaign name"
                className="w-full text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 bg-transparent outline-none !border-0 !shadow-none p-0 placeholder-gray-300" />
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button type="button" onClick={() => save()} disabled={!!busy} className="h-11 px-4 border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 font-medium flex items-center gap-2 disabled:opacity-60">
              {busy === 'save' ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save draft
            </button>
            <button type="button" onClick={() => setConfirmSend(true)} disabled={!!busy || !canSend}
              title={!canSend ? 'Pick a coupon / poster and make sure the audience has customers' : undefined}
              className="h-11 px-5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-semibold flex items-center gap-2 shadow-lg">
              <Send size={16} /> Send{audience?.count ? ` to ${audience.count}` : ''}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] gap-6 items-start">
          {/* Form */}
          <div className="space-y-6 min-w-0">
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2"><Mail size={18} className="text-emerald-700" /> Email</h2>
              <div>
                <label htmlFor="cm-subject" className={labelCls}>Subject line *</label>
                <input id="cm-subject" value={f.subject} maxLength={150} onChange={set('subject')} className={inputCls} />
              </div>
              <div>
                <label htmlFor="cm-pre" className={labelCls}>Preview text <span className="font-normal text-gray-400">(shown after the subject in the inbox)</span></label>
                <input id="cm-pre" value={f.preheader} maxLength={150} onChange={set('preheader')} className={inputCls} />
              </div>
              <div>
                <label htmlFor="cm-heading" className={labelCls}>Heading</label>
                <input id="cm-heading" value={f.heading} maxLength={120} onChange={set('heading')} className={inputCls} />
              </div>
              <div>
                <label htmlFor="cm-msg" className={labelCls}>Message</label>
                <textarea id="cm-msg" value={f.message} maxLength={3000} rows={5} onChange={set('message')} className="w-full px-3.5 py-3 border border-gray-200 bg-white text-sm outline-none focus:border-emerald-600 resize-y" />
                <p className="mt-1 text-xs text-gray-500">Type <code className="px-1 bg-gray-100">{'{name}'}</code> anywhere to insert the customer's first name. Leave a blank line between paragraphs.</p>
              </div>
            </section>

            {f.template === 'coupon' && (
              <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900 flex items-center gap-2"><TicketPercent size={18} className="text-emerald-700" /> Coupon</h2>
                  <Link to="/campaigns/coupons" className="text-sm font-medium text-emerald-700 hover:underline">Manage coupons</Link>
                </div>
                {coupons.length === 0 ? (
                  <p className="text-sm text-gray-500">No live coupons. <Link to="/campaigns/coupons" className="text-emerald-700 font-medium hover:underline">Create one first</Link>, then come back.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {coupons.map((c) => (
                      <button key={c._id} type="button" onClick={() => setF((x) => ({ ...x, coupon: c._id }))} aria-pressed={f.coupon === c._id}
                        className={`text-left p-3 border flex items-center gap-3 transition-colors ${f.coupon === c._id ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-600/20' : 'border-gray-200 hover:border-gray-400'}`}>
                        <span className="font-mono font-bold tracking-wider text-sm text-gray-900">{c.code}</span>
                        <span className="text-xs text-gray-500 truncate">{offerText(c)}</span>
                      </button>
                    ))}
                  </div>
                )}
                {selectedCoupon?.perCustomerLimit === 0 && <p className="text-xs text-amber-700">This coupon has no per-customer limit, so anyone who gets the email can use it again and again.</p>}
              </section>
            )}

            {f.template === 'event' && (
              <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2"><PartyPopper size={18} className="text-emerald-700" /> Event details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label htmlFor="cm-date" className={labelCls}>Date</label><input id="cm-date" type="date" value={f.eventDate} onChange={set('eventDate')} className={inputCls} /></div>
                  <div><label htmlFor="cm-time" className={labelCls}>Time</label><input id="cm-time" value={f.eventTime} maxLength={60} onChange={set('eventTime')} placeholder="e.g. 4 PM – 9 PM" className={inputCls} /></div>
                </div>
                <div><label htmlFor="cm-venue" className={labelCls}>Venue</label><input id="cm-venue" value={f.venue} maxLength={200} onChange={set('venue')} placeholder="e.g. Ifrutico, Anna Nagar" className={inputCls} /></div>
              </section>
            )}

            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2"><ImageIcon size={18} className="text-emerald-700" /> {f.template === 'poster' ? 'Poster image *' : 'Banner image'} {f.template === 'coupon' && <span className="text-xs font-normal text-gray-400">(not shown in the coupon template)</span>}</h2>
              {f.template !== 'coupon' && (
                f.imageUrl ? (
                  <div className="relative group">
                    <img src={assetUrl(f.imageUrl)} alt="Campaign" className="w-full max-h-72 object-contain bg-gray-50 border border-gray-100" />
                    <div className="absolute top-2 right-2 flex gap-2">
                      <button type="button" onClick={() => fileRef.current?.click()} className="h-9 px-3 bg-white/95 text-sm font-medium shadow flex items-center gap-1.5"><Upload size={14} /> Replace</button>
                      <button type="button" onClick={() => setF((x) => ({ ...x, imageUrl: '' }))} aria-label="Remove image" className="h-9 w-9 bg-white/95 shadow flex items-center justify-center text-gray-600 hover:text-red-600"><X size={16} /></button>
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileRef.current?.click()} disabled={busy === 'upload'}
                    onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); upload(e.dataTransfer.files?.[0]); }}
                    className="w-full py-10 border-2 border-dashed border-gray-200 hover:border-emerald-500 hover:bg-emerald-50/40 flex flex-col items-center gap-2 text-gray-500 transition-colors">
                    {busy === 'upload' ? <Loader2 size={28} className="animate-spin text-emerald-700" /> : <Upload size={28} />}
                    <span className="text-sm font-medium">Click or drop a JPG / PNG (max 3 MB)</span>
                    <span className="text-xs">{f.template === 'poster' ? 'Portrait or square posters look best on phones' : 'Wide images (about 1200 × 600) work best'}</span>
                  </button>
                )
              )}
              <input ref={fileRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_1.4fr] gap-4">
                <div><label htmlFor="cm-cta" className={labelCls}>Button text</label><input id="cm-cta" value={f.ctaText} maxLength={40} onChange={set('ctaText')} placeholder="Optional" className={inputCls} /></div>
                <div><label htmlFor="cm-url" className={labelCls}>Button link</label><input id="cm-url" type="url" value={f.ctaUrl} maxLength={500} onChange={set('ctaUrl')} placeholder="https://…" className={inputCls} /></div>
              </div>
            </section>

            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2"><Users size={18} className="text-emerald-700" /> Who gets it</h2>
              <div role="radiogroup" className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[['regular', 'Regular customers', 'Customers who bill with you often'], ['all', 'All customers', 'Everyone with an email on file']].map(([k, l, d]) => (
                  <button key={k} type="button" role="radio" aria-checked={f.audience.segment === k} onClick={() => setAud('segment', k)}
                    className={`text-left p-3 border transition-colors ${f.audience.segment === k ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-600/20' : 'border-gray-200 hover:border-gray-400'}`}>
                    <div className="font-semibold text-sm text-gray-900">{l}</div><div className="text-xs text-gray-500">{d}</div>
                  </button>
                ))}
              </div>
              {f.audience.segment === 'regular' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="cm-min" className={labelCls}>At least this many bills</label>
                    <input id="cm-min" type="number" min="1" max="1000" value={f.audience.minBills} onChange={(e) => setAud('minBills', e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label htmlFor="cm-within" className={labelCls}>Within</label>
                    <select id="cm-within" value={f.audience.withinDays} onChange={(e) => setAud('withinDays', Number(e.target.value))} className={inputCls}>
                      <option value={0}>All time</option><option value={30}>Last 30 days</option><option value={90}>Last 3 months</option>
                      <option value={180}>Last 6 months</option><option value={365}>Last 12 months</option>
                    </select>
                  </div>
                </div>
              )}
              <div className="p-4 bg-gray-50 border border-gray-100">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-gray-900">{audience ? audience.count : '…'}</span>
                  <span className="text-sm text-gray-500">customer{audience?.count === 1 ? '' : 's'} will get this email</span>
                </div>
                {audience?.capped && <p className="mt-1 text-xs text-amber-700">{audience.matched} match; one campaign sends to at most {audience.count} to stay within the mailbox's daily limit.</p>}
                {audience?.sample?.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {audience.sample.map((c) => (
                      <li key={c.email} className="px-2.5 py-1 rounded-full bg-white border border-gray-200 text-xs text-gray-700" title={c.email}>
                        {c.name}{c.bills ? <span className="text-gray-400"> · {c.bills} bills</span> : null}
                      </li>
                    ))}
                    {audience.count > audience.sample.length && <li className="px-2.5 py-1 text-xs text-gray-400">+{audience.count - audience.sample.length} more</li>}
                  </ul>
                )}
                {audience && audience.count === 0 && <p className="mt-1 text-xs text-gray-500">No customers with an email match. Emails are saved when entered on a bill.</p>}
                <p className="mt-3 text-xs text-gray-400">Customers who used the unsubscribe link are always left out.</p>
              </div>
            </section>
          </div>

          {/* Preview */}
          <div className="xl:sticky xl:top-24 space-y-3 min-w-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Preview · as Priya would see it</div>
                  <div className="text-sm font-semibold text-gray-900 truncate">{previewSubject || f.subject}</div>
                </div>
                <div className="flex border border-gray-200 shrink-0">
                  {[['desktop', <Monitor key="m" size={16} />], ['mobile', <Smartphone key="s" size={16} />]].map(([d, icon]) => (
                    <button key={d} type="button" onClick={() => setDevice(d)} aria-label={`${d} preview`} aria-pressed={device === d}
                      className={`w-9 h-9 flex items-center justify-center ${device === d ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>{icon}</button>
                  ))}
                </div>
              </div>
              <div className="bg-gray-100 p-3 sm:p-4 flex justify-center">
                <iframe title="Email preview" sandbox="" srcDoc={previewHtml}
                  className={`bg-white border-0 shadow-sm transition-all duration-300 h-[70vh] ${device === 'mobile' ? 'w-[375px] max-w-full rounded-2xl' : 'w-full'}`} />
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <label htmlFor="cm-test" className={labelCls}>Send a test first</label>
              <div className="flex gap-2">
                <input id="cm-test" type="email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="you@example.com" className={inputCls} />
                <button type="button" onClick={sendTest} disabled={!!busy} className="shrink-0 h-11 px-4 bg-gray-900 hover:bg-gray-800 disabled:opacity-60 text-white text-sm font-semibold flex items-center gap-2">
                  {busy === 'test' ? <Loader2 size={15} className="animate-spin" /> : <Mail size={15} />} Send test
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {confirmSend && createPortal(
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => busy !== 'send' && setConfirmSend(false)}>
          <div onClick={(e) => e.stopPropagation()} role="alertdialog" aria-modal="true" className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 animate-zoom-in">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center"><Send size={22} /></div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">Send to {audience?.count} customer{audience?.count === 1 ? '' : 's'}?</h3>
            <p className="text-sm text-gray-500 mt-1">
              "{previewSubject || f.subject}" goes out one email at a time (about {Math.max(1, Math.ceil(((audience?.count || 0) * 1.3) / 60))} min).
              Emails can't be recalled once sent.
            </p>
            <div className="mt-5 flex gap-3">
              <button type="button" onClick={() => setConfirmSend(false)} disabled={busy === 'send'} className="flex-1 h-11 border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium">Cancel</button>
              <button type="button" onClick={sendNow} disabled={busy === 'send'} className="flex-1 h-11 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white font-semibold flex items-center justify-center gap-2">
                {busy === 'send' ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Send now
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// ── List ──────────────────────────────────────────────────────
export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [picking, setPicking] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = () =>
    apiFetch('/campaigns')
      .then((d) => setCampaigns(d.data || []))
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  // Refresh progress while anything is sending
  const sending = campaigns.some((c) => c.status === 'sending');
  useEffect(() => {
    if (!sending || editing) return;
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, [sending, editing]);

  const remove = async () => {
    try {
      const res = await apiFetch(`/campaigns/${confirmDelete._id}`, { method: 'DELETE' });
      toast.success(res.message);
      setConfirmDelete(null);
      load();
    } catch (e) { toast.error(e.message); }
  };

  const duplicate = (c) => {
    const copy = fromCampaign(c);
    delete copy._id;
    setEditing({ ...copy, name: `${c.name} (copy)`, status: 'draft' });
  };

  if (editing) {
    return <CampaignEditor initial={editing} onBack={() => { setEditing(null); load(); }} onSaved={() => { setEditing(null); load(); }} />;
  }

  const totals = campaigns.reduce((s, c) => ({ sent: s.sent + (c.stats?.sent || 0), campaigns: s.campaigns + (c.status === 'sent' ? 1 : 0) }), { sent: 0, campaigns: 0 });

  return (
    <div className="animate-fade-in-up">
      <div className="mx-auto max-w-screen-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">Email Campaigns</h1>
            <p className="text-sm text-gray-500 mt-1">Send coupons, event invitations and posters to your regular customers.</p>
          </div>
          <button type="button" onClick={() => setPicking(true)} className="h-11 px-5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold flex items-center gap-2 shadow-lg self-start sm:self-auto"><Plus size={18} /> New campaign</button>
        </div>

        {/* Template gallery */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.values(TEMPLATES).map((t) => (
            <button key={t.key} type="button" onClick={() => setEditing(blank(t.key))}
              className="group text-left bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:-translate-y-0.5 hover:shadow-md transition-all">
              <div className={`h-28 bg-gradient-to-br ${t.tone} relative overflow-hidden flex items-center justify-center`}>
                <TemplateArt kind={t.key} />
              </div>
              <div className="p-4">
                <div className="font-semibold text-gray-900 flex items-center gap-2"><t.icon size={16} className="text-emerald-700" /> {t.label}</div>
                <p className="text-sm text-gray-500 mt-1">{t.blurb}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 group-hover:gap-2 transition-all">Use template →</span>
              </div>
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Your campaigns</h2>
            <span className="text-xs text-gray-500">{totals.campaigns} sent · {totals.sent} emails delivered to the mail server</span>
          </div>
          {loading ? (
            <div className="p-5 space-y-3">{Array.from({ length: 4 }, (_, i) => <div key={i} className="h-16 bg-gray-100 animate-pulse" />)}</div>
          ) : campaigns.length === 0 ? (
            <div className="py-16 text-center">
              <Megaphone size={40} strokeWidth={1.25} className="mx-auto text-gray-300" />
              <p className="mt-3 font-medium text-gray-700">No campaigns yet</p>
              <p className="text-sm text-gray-500">Pick a template above to create your first one.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {campaigns.map((c) => {
                const t = TEMPLATES[c.template] || TEMPLATES.poster;
                const st = STATUS[c.status] || STATUS.draft;
                const pct = c.stats?.total ? Math.round(((c.stats.sent + c.stats.failed) / c.stats.total) * 100) : 0;
                const editable = c.status === 'draft' || c.status === 'failed';
                return (
                  <li key={c._id} className="p-4 sm:px-5 flex flex-col md:flex-row md:items-center gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {c.imageUrl ? (
                        <img src={assetUrl(c.imageUrl)} alt="" className="w-12 h-12 object-cover rounded-xl shrink-0" />
                      ) : (
                        <span className={`w-12 h-12 rounded-xl bg-gradient-to-br ${t.tone} text-white flex items-center justify-center shrink-0`}><t.icon size={20} /></span>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-900 truncate">{c.name}</span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${st.cls}`}>
                            <st.icon size={11} className={c.status === 'sending' ? 'animate-spin' : ''} /> {st.label}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {t.label}{c.coupon?.code ? ` · ${c.coupon.code}` : ''} · {c.subject}
                        </div>
                        {c.lastError && c.status !== 'sending' && <div className="text-xs text-amber-700 truncate" title={c.lastError}>{c.lastError}</div>}
                      </div>
                    </div>
                    <div className="md:w-56 shrink-0">
                      {c.status === 'draft' ? (
                        <span className="text-xs text-gray-400 flex items-center gap-1"><Clock size={12} /> Saved {new Date(c.updatedAt).toLocaleDateString('en-IN')}</span>
                      ) : (
                        <>
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>{c.stats?.sent || 0} sent{c.stats?.failed ? ` · ${c.stats.failed} failed` : ''}</span>
                            <span>{c.status === 'sending' ? `${pct}%` : c.sentAt ? new Date(c.sentAt).toLocaleDateString('en-IN') : ''}</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className={`h-full ${c.stats?.failed && !c.stats?.sent ? 'bg-amber-500' : 'bg-emerald-600'} transition-all`} style={{ width: `${c.status === 'sending' ? pct : 100}%` }} /></div>
                        </>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {editable && <button type="button" onClick={() => setEditing(fromCampaign(c))} className="h-9 px-3 border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-1.5"><Pencil size={14} /> {c.status === 'failed' ? 'Review & resend' : 'Edit'}</button>}
                      <button type="button" onClick={() => duplicate(c)} className="h-9 px-3 border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-1.5"><Copy size={14} /> Duplicate</button>
                      {c.status !== 'sending' && <button type="button" onClick={() => setConfirmDelete(c)} aria-label={`Delete ${c.name}`} className="h-9 px-3 border border-gray-200 text-gray-500 hover:text-red-600 hover:bg-red-50"><Trash2 size={14} /></button>}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {picking && createPortal(
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 sm:p-4" onClick={() => setPicking(false)}>
          <div onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Choose a template" className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-w-lg w-full p-6 animate-zoom-in">
            <div className="flex items-center justify-between"><h3 className="text-lg font-semibold text-gray-900">Choose a template</h3>
              <button type="button" onClick={() => setPicking(false)} aria-label="Close" className="p-2 -mr-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100"><X size={20} /></button></div>
            <div className="mt-4 space-y-2">
              {Object.values(TEMPLATES).map((t) => (
                <button key={t.key} type="button" onClick={() => { setPicking(false); setEditing(blank(t.key)); }}
                  className="w-full text-left p-4 border border-gray-200 hover:border-emerald-600 hover:bg-emerald-50/50 flex items-center gap-3">
                  <span className={`w-11 h-11 rounded-xl bg-gradient-to-br ${t.tone} text-white flex items-center justify-center shrink-0`}><t.icon size={20} /></span>
                  <span><span className="block font-semibold text-gray-900">{t.label}</span><span className="block text-xs text-gray-500">{t.blurb}</span></span>
                </button>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}

      {confirmDelete && createPortal(
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setConfirmDelete(null)}>
          <div onClick={(e) => e.stopPropagation()} role="alertdialog" aria-modal="true" className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 animate-zoom-in">
            <h3 className="text-lg font-semibold text-gray-900">Delete "{confirmDelete.name}"?</h3>
            <p className="text-sm text-gray-500 mt-1">{confirmDelete.status === 'sent' ? 'Emails already sent stay in customers’ inboxes; only this record is removed.' : 'This draft will be removed.'} This can't be undone.</p>
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

// Small illustration of each template for the gallery cards
function TemplateArt({ kind }) {
  if (kind === 'coupon') {
    return (
      <div className="bg-white rounded-xl shadow-lg flex items-stretch rotate-[-4deg] group-hover:rotate-0 transition-transform">
        <div className="px-4 py-3"><div className="text-lg font-extrabold text-emerald-700 leading-none">20% OFF</div><div className="text-[10px] text-gray-400 mt-1">on bills ₹300+</div></div>
        <div className="border-l-2 border-dashed border-emerald-300 px-3 flex items-center font-mono text-xs font-bold text-gray-800 tracking-widest">MANGO20</div>
      </div>
    );
  }
  if (kind === 'event') {
    return (
      <div className="bg-white rounded-xl shadow-lg px-4 py-3 rotate-[3deg] group-hover:rotate-0 transition-transform text-center">
        <div className="text-[10px] font-bold uppercase tracking-widest text-amber-600">You're invited</div>
        <div className="text-sm font-extrabold text-gray-900">Summer Fruit Fest</div>
        <div className="text-[10px] text-gray-500">Sat · 4 PM · Anna Nagar</div>
      </div>
    );
  }
  return (
    <div className="w-20 h-24 bg-white rounded-lg shadow-lg p-1.5 rotate-[-3deg] group-hover:rotate-0 transition-transform">
      <div className="w-full h-14 rounded bg-gradient-to-br from-pink-300 via-amber-200 to-emerald-300" />
      <div className="mt-1.5 h-1.5 w-3/4 bg-gray-200 rounded" /><div className="mt-1 h-1.5 w-1/2 bg-gray-200 rounded" />
    </div>
  );
}
