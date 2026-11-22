import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import logo from '../LandingApp/images/logo.webp';
import sapota from '../LandingApp/images/top/sapota.webp';
import coffee from '../LandingApp/images/top/coffe.webp';
import custard from '../LandingApp/images/top/custedapple.webp';
import stall from '../LandingApp/images/gsap3.webp';
import expo from '../LandingApp/images/gsap2.webp';
import mango from '../LandingApp/images/fruits/Mango.webp';
import strawberry from '../LandingApp/images/fruits/Strawberry.webp';
import pineapple from '../LandingApp/images/fruits/Pineapple.webp';
import guava from '../LandingApp/images/fruits/Guava.webp';
import watermelon from '../LandingApp/images/fruits/Watermelon.webp';

const SLIDES = [
  { src: sapota, title: 'Real fruit. Real ice cream.', text: 'Every scoop starts with fresh, hand-picked fruit — no artificial flavours.' },
  { src: stall, title: 'From our stalls to your events', text: 'Retail counters, event boxes and stall scoops — billed from one inventory.' },
  { src: coffee, title: 'Small batches, big flavour', text: 'Track every litre and every scoop as it leaves the freezer.' },
  { src: expo, title: 'Growing branch by branch', text: 'Each branch sees its own stock; admins see the whole picture.' },
  { src: custard, title: 'Pure joy, served daily', text: 'Fast billing, instant invoices, happy customers.' },
];
const FRUITS = [mango, strawberry, pineapple, guava, watermelon];
const SLIDE_MS = 5500;

const STYLES = `
@keyframes auth-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
@keyframes auth-kenburns { from { transform: scale(1.04); } to { transform: scale(1.14); } }
@keyframes auth-progress { from { transform: scaleX(0); } to { transform: scaleX(1); } }
@keyframes auth-shake { 0%,100% { transform: none; } 20% { transform: translateX(-6px); } 40% { transform: translateX(6px); } 60% { transform: translateX(-4px); } 80% { transform: translateX(4px); } }
.auth-rise { animation: auth-rise .55s cubic-bezier(.22,1,.36,1) both; }
.auth-kenburns { animation: auth-kenburns ${SLIDE_MS + 1500}ms ease-out both; }
.auth-progress { animation: auth-progress ${SLIDE_MS}ms linear both; transform-origin: left; }
.auth-shake { animation: auth-shake .45s ease; }
@media (prefers-reduced-motion: reduce) { .auth-kenburns, .auth-progress, .auth-rise { animation: none; } }
`;

// Split-screen frame for login / forgot password / OTP / reset:
// left = landing-page photography carousel, right = the form.
export default function AuthShell({ icon: Icon, title, subtitle, back, children, footer }) {
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), SLIDE_MS);
    return () => clearInterval(t);
  }, [slide]); // restart the timer when a dot is clicked

  const current = SLIDES[slide];

  return (
    <div className="min-h-screen flex bg-[#f6faf7] text-gray-900">
      <style>{STYLES}</style>

      {/* ── Left: photo story (desktop) ── */}
      <aside className="hidden lg:flex relative w-[54%] xl:w-[58%] overflow-hidden bg-emerald-950">
        {SLIDES.map((s, i) => (
          <img
            key={s.src}
            src={s.src}
            alt=""
            aria-hidden="true"
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-[1200ms] ${i === slide ? 'opacity-100 auth-kenburns' : 'opacity-0'}`}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-950/45 to-emerald-950/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-emerald-950/30" />

        <div className="relative z-10 flex flex-col justify-between w-full p-10 xl:p-14">
          <Link to="/" className="self-start inline-flex items-center bg-white/95 rounded-2xl px-4 py-2.5 shadow-lg hover:bg-white transition" aria-label="Ifrutico home">
            <img src={logo} alt="Frutico — real fruit, real ice cream" className="h-10 w-auto" />
          </Link>

          <div className="max-w-lg">
            <div key={slide} className="auth-rise">
              <h2 className="text-4xl xl:text-5xl font-extrabold leading-[1.08] tracking-tight text-white">{current.title}</h2>
              <p className="mt-4 text-lg text-white/80 leading-relaxed">{current.text}</p>
            </div>

            {/* Fruit we use */}
            <div className="mt-8 flex items-center gap-3">
              <div className="flex -space-x-3">
                {FRUITS.map((f, i) => (
                  <img key={i} src={f} alt="" aria-hidden="true" className="w-11 h-11 rounded-full object-cover ring-2 ring-emerald-950 bg-white" />
                ))}
              </div>
              <span className="text-sm text-white/75">40+ fruit flavours, made fresh</span>
            </div>

            {/* Slide controls */}
            <div className="mt-8 flex gap-2" role="tablist" aria-label="Photos">
              {SLIDES.map((s, i) => (
                <button
                  key={s.src}
                  type="button"
                  role="tab"
                  aria-selected={i === slide}
                  aria-label={`Show photo ${i + 1}: ${s.title}`}
                  onClick={() => setSlide(i)}
                  className="relative h-1.5 flex-1 max-w-16 rounded-full bg-white/25 overflow-hidden"
                >
                  {i === slide && <span key={slide} className="auth-progress absolute inset-0 bg-white rounded-full" />}
                  {i < slide && <span className="absolute inset-0 bg-white/70 rounded-full" />}
                </button>
              ))}
            </div>
          </div>
        </div>

      </aside>

      {/* ── Right: form ── */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Mobile / tablet photo header */}
        <div className="lg:hidden relative h-56 sm:h-64 overflow-hidden rounded-b-[2rem] bg-emerald-950">
          <img src={current.src} alt="" aria-hidden="true" key={current.src} className="auth-kenburns absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/90 via-emerald-950/40 to-transparent" />
          <Link to="/" className="absolute top-4 left-4 inline-flex bg-white/95 rounded-xl px-3 py-2 shadow" aria-label="Ifrutico home">
            <img src={logo} alt="Frutico" className="h-7 w-auto" />
          </Link>
          <p className="absolute left-5 bottom-5 right-5 text-white font-bold text-xl leading-tight">{current.title}</p>
        </div>

        <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-10">
          <div className="w-full max-w-[420px]">
            {back && (
              <Link to={back.to} className="auth-rise inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-emerald-700 mb-8 transition-colors">
                <ArrowLeft size={16} /> {back.label}
              </Link>
            )}

            <div className="auth-rise" style={{ animationDelay: '60ms' }}>
              {Icon && (
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-5">
                  <Icon size={28} />
                </div>
              )}
              <h1 className="text-3xl sm:text-[2rem] font-extrabold tracking-tight text-gray-900">{title}</h1>
              {subtitle && <p className="mt-2 text-[15px] text-gray-500 leading-relaxed">{subtitle}</p>}
            </div>

            <div className="mt-8 auth-rise" style={{ animationDelay: '120ms' }}>{children}</div>

            {footer && <div className="mt-8 auth-rise" style={{ animationDelay: '180ms' }}>{footer}</div>}

            <p className="mt-12 text-center text-xs text-gray-400">© {new Date().getFullYear()} Ifrutico · Real fruit, real ice cream</p>
          </div>
        </div>
      </main>
    </div>
  );
}

// Labelled input with a leading icon and optional trailing control (e.g. show-password)
export function AuthField({ id, label, icon: Icon, trailing, hint, error, className = '', ...props }) {
  return (
    <div>
      {label && <label htmlFor={id} className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>}
      <div className="relative">
        {Icon && <Icon size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />}
        <input
          id={id}
          aria-invalid={!!error}
          className={`w-full h-12 rounded-xl border bg-white text-[15px] text-gray-900 placeholder-gray-400 outline-none transition-all
            focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/15 ${error ? 'border-red-400' : 'border-gray-200 hover:border-gray-300'}
            ${Icon ? 'pl-11' : 'pl-4'} ${trailing ? 'pr-12' : 'pr-4'} ${className}`}
          {...props}
        />
        {trailing && <div className="absolute right-2 top-1/2 -translate-y-1/2">{trailing}</div>}
      </div>
      {error ? <p className="mt-1.5 text-xs text-red-600">{error}</p> : hint && <p className="mt-1.5 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

export function AuthButton({ loading, loadingText, children, className = '', disabled, ...props }) {
  return (
    <button
      {...props}
      className={`w-full h-12 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-[15px]
        flex items-center justify-center gap-2 shadow-lg shadow-emerald-700/25 transition-all ${className}`}
      disabled={loading || disabled}
    >
      {loading ? (<><span className="w-5 h-5 border-[2.5px] border-white/40 border-t-white rounded-full animate-spin" /> {loadingText}</>) : children}
    </button>
  );
}

// Six boxes over one real input: typing, paste and SMS/email autofill all go through the single field
export function OtpBoxes({ id, value, onChange }) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        autoFocus
        maxLength={6}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        aria-label="6-digit verification code"
        className="absolute inset-0 w-full h-full opacity-0 cursor-text z-10"
      />
      <div className="grid grid-cols-6 gap-2 sm:gap-3" aria-hidden="true">
        {Array.from({ length: 6 }, (_, i) => {
          const filled = i < value.length;
          const active = i === Math.min(value.length, 5);
          return (
            <div key={i}
              className={`h-14 rounded-xl border-2 bg-white flex items-center justify-center text-2xl font-bold text-gray-900 transition-all
                ${filled || (active && focused) ? 'border-emerald-600' : 'border-gray-200'} ${active && focused ? 'ring-4 ring-emerald-600/15' : ''}`}>
              {value[i] || ''}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 1 Email -> 2 Code -> 3 New password
export function ResetSteps({ current }) {
  const steps = ['Email', 'Code', 'New password'];
  return (
    <ol className="flex items-center gap-2 text-xs font-medium" aria-label="Reset progress">
      {steps.map((s, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;
        return (
          <li key={s} className="flex items-center gap-2" aria-current={active ? 'step' : undefined}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${done ? 'bg-emerald-700 text-white' : active ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-500'}`}>{done ? '✓' : n}</span>
            <span className={active ? 'text-gray-900' : 'text-gray-400'}>{s}</span>
            {n < steps.length && <span className={`w-5 h-px ${done ? 'bg-emerald-700' : 'bg-gray-300'}`} />}
          </li>
        );
      })}
    </ol>
  );
}
