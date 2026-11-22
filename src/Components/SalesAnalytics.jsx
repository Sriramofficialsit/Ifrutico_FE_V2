import { useEffect, useMemo, useState } from 'react';
import { Chart, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement,
  Tooltip, Filler, Legend, BarController, LineController,
} from 'chart.js';
import {
  BarChart3, IndianRupee, Receipt, Users, TicketPercent, TrendingUp, TrendingDown, Clock, CalendarDays,
  Crown, Wallet, Store, Minus,
} from 'lucide-react';
import { apiFetch } from '../utils/api';
import { useTheme } from '../Context/ThemeContext';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Filler, Legend, BarController, LineController);

const PERIODS = [7, 30, 90];
const inr = (n) => `₹${Math.round(Number(n || 0)).toLocaleString('en-IN')}`;
const compact = (n) => (n >= 10000000 ? `${(n / 10000000).toFixed(1)}Cr` : n >= 100000 ? `${(n / 100000).toFixed(1)}L` : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${Math.round(n)}`);
const hourLabel = (h) => `${h % 12 || 12}${h < 12 ? 'am' : 'pm'}`;
const PAY = { cash: 'Cash', upi: 'UPI', card: 'Card' };
const TYPE = { retail: 'Retail', event: 'Events', stall: 'Stalls' };
const UNIT_BIG = { g: ['kg', 1000], ml: ['L', 1000] };
const qtyText = (q, unit) => {
  const [u, f] = UNIT_BIG[unit] || [unit === 'ltr' ? 'L' : unit || 'pcs', 1];
  return `${Number((q / f).toFixed(1)).toLocaleString('en-IN')} ${u}`;
};

// Theme-aware chart palette
const paletteOf = (dark) => ({
  green: dark ? '#34c38f' : '#00754A',
  greenSoft: dark ? 'rgba(52,195,143,0.22)' : 'rgba(0,117,74,0.12)',
  greenFaint: dark ? 'rgba(52,195,143,0.10)' : 'rgba(0,117,74,0.06)',
  lime: dark ? '#a3d977' : '#8db552',
  amber: dark ? '#fbbf24' : '#f59e0b',
  sky: dark ? '#60a5fa' : '#3b82f6',
  violet: dark ? '#a78bfa' : '#8b5cf6',
  tick: dark ? '#7f938a' : '#8a958f',
  grid: dark ? 'rgba(148,163,184,0.12)' : 'rgba(148,163,184,0.2)',
  ring: dark ? '#111a16' : '#ffffff',
  tipBg: dark ? 'rgba(17,26,22,0.96)' : 'rgba(255,255,255,0.97)',
  tipTitle: dark ? '#6ee7b7' : '#006241',
  tipBody: dark ? '#e6efeb' : 'rgba(0,0,0,0.85)',
  tipBorder: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
});

const pctChange = (cur, prev) => (prev > 0 ? ((cur - prev) / prev) * 100 : cur > 0 ? null : 0);

function Delta({ cur, prev }) {
  const p = pctChange(cur, prev);
  if (p === null) return <span className="text-[11px] font-semibold text-emerald-600">New</span>;
  const up = p > 0.5, down = p < -0.5;
  const Icon = up ? TrendingUp : down ? TrendingDown : Minus;
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${up ? 'bg-emerald-50 text-emerald-700' : down ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
      <Icon size={12} /> {Math.abs(p).toFixed(p !== 0 && Math.abs(p) < 10 ? 1 : 0)}%
    </span>
  );
}

function Kpi({ icon, label, value, cur, prev, hint, accent }) {
  const Icon = icon;
  return (
    <div className="relative overflow-hidden bg-white rounded-2xl p-4 sm:p-5 min-w-0 hover:-translate-y-0.5 transition-all duration-300">
      <div className={`absolute -right-6 -top-6 w-20 h-20 rounded-full opacity-[0.12] ${accent}`} />
      <div className="flex items-center justify-between gap-2">
        <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-white ${accent}`}><Icon size={17} /></span>
        {prev !== undefined && <Delta cur={cur} prev={prev} />}
      </div>
      <div className="mt-3 text-xl sm:text-2xl font-bold text-gray-900 tabular-nums truncate">{value}</div>
      <div className="text-xs sm:text-sm text-gray-500 font-medium">{label}</div>
      {hint && <div className="mt-1 text-[11px] text-gray-400 truncate">{hint}</div>}
    </div>
  );
}

function Card({ title, subtitle, icon: Icon, children, className = '', right }) {
  return (
    <div className={`bg-white rounded-2xl p-4 sm:p-6 min-w-0 w-full overflow-hidden ${className}`}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 text-base sm:text-lg font-bold text-gray-900">
            {Icon && <Icon size={17} className="text-emerald-600 shrink-0" />} {title}
          </h3>
          {subtitle && <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

function Empty({ text = 'No sales in this period yet.' }) {
  return <div className="h-full min-h-40 flex items-center justify-center text-sm text-gray-400">{text}</div>;
}

// Doughnut + legend with share bars
function Split({ items, colors, center, ring, tooltip }) {
  const total = items.reduce((s, i) => s + i.value, 0);
  if (!total) return <Empty />;
  const data = {
    labels: items.map((i) => i.label),
    datasets: [{ data: items.map((i) => i.value), backgroundColor: colors, borderColor: ring, borderWidth: 3, hoverOffset: 6 }],
  };
  return (
    <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-center gap-5">
      <div className="relative w-40 h-40 shrink-0">
        <Doughnut data={data} options={{ responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { display: false }, tooltip } }} />
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">{center.label}</span>
          <span className="text-lg font-extrabold text-gray-900">{center.value}</span>
        </div>
      </div>
      <div className="flex-1 w-full space-y-3">
        {items.map((i, idx) => {
          const pct = (i.value / total) * 100;
          return (
            <div key={i.label}>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-gray-700 font-medium"><span className="w-2.5 h-2.5 rounded-full" style={{ background: colors[idx] }} />{i.label}</span>
                <span className="tabular-nums text-gray-900 font-semibold">{Math.round(pct)}%</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: colors[idx] }} />
              </div>
              <div className="mt-0.5 text-[11px] text-gray-400">{i.sub}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function SalesAnalytics() {
  const { theme } = useTheme();
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    apiFetch(`/bill/analytics?days=${days}`)
      .then((d) => live && setData(d.data))
      .catch(console.error)
      .finally(() => live && setLoading(false));
    return () => { live = false; };
  }, [days]);

  const P = paletteOf(theme === 'dark');

  const view = useMemo(() => {
    if (!data) return null;
    const tooltip = {
      backgroundColor: P.tipBg, titleColor: P.tipTitle, bodyColor: P.tipBody, borderColor: P.tipBorder,
      borderWidth: 1, padding: 12, cornerRadius: 12, boxPadding: 4, usePointStyle: true,
    };
    const scale = (extra = {}) => ({ grid: { color: P.grid, drawTicks: false }, border: { display: false }, ticks: { color: P.tick, padding: 8, font: { size: 11 } }, ...extra });

    // Fill every day of the period (days with no bills show as zero)
    const start = new Date(data.from);
    const dayKeys = Array.from({ length: data.days }, (_, i) => new Date(start.getTime() + i * 86400000 + 6 * 3600000).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }));
    const byDay = new Map(data.daily.map((d) => [d.date, d]));
    const series = dayKeys.map((k) => byDay.get(k) || { date: k, revenue: 0, bills: 0 });
    const labels = series.map((d) => new Date(`${d.date}T00:00`).toLocaleDateString('en-IN', data.days > 7 ? { day: 'numeric', month: 'short' } : { weekday: 'short', day: 'numeric' }));

    const trend = {
      data: {
        labels,
        datasets: [
          {
            type: 'line', label: 'Revenue', data: series.map((d) => d.revenue), yAxisID: 'y',
            borderColor: P.green, borderWidth: 2.5, tension: 0.4, fill: true,
            backgroundColor: (ctx) => {
              const { chart } = ctx;
              if (!chart.chartArea) return P.greenFaint;
              const g = chart.ctx.createLinearGradient(0, chart.chartArea.top, 0, chart.chartArea.bottom);
              g.addColorStop(0, P.greenSoft); g.addColorStop(1, 'rgba(0,0,0,0)');
              return g;
            },
            pointRadius: data.days > 30 ? 0 : 3, pointHoverRadius: 6, pointBackgroundColor: P.green, pointBorderColor: P.ring, pointBorderWidth: 2, order: 1,
          },
          {
            type: 'bar', label: 'Bills', data: series.map((d) => d.bills), yAxisID: 'y1',
            backgroundColor: P.lime + (theme === 'dark' ? '55' : '66'), hoverBackgroundColor: P.lime, borderRadius: 6, maxBarThickness: 18, order: 2,
          },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: true, position: 'top', align: 'end', labels: { color: P.tick, usePointStyle: true, boxWidth: 8, padding: 14 } },
          tooltip: { ...tooltip, callbacks: { label: (c) => (c.dataset.yAxisID === 'y' ? ` Revenue: ${inr(c.parsed.y)}` : ` Bills: ${c.parsed.y}`) } },
        },
        scales: {
          x: scale({ grid: { display: false }, ticks: { color: P.tick, maxRotation: 0, autoSkipPadding: 14, font: { size: 11 } } }),
          y: scale({ beginAtZero: true, ticks: { color: P.tick, padding: 8, font: { size: 11 }, callback: (v) => `₹${compact(v)}` } }),
          y1: scale({ position: 'right', beginAtZero: true, grid: { display: false }, ticks: { color: P.tick, padding: 8, precision: 0, font: { size: 11 } } }),
        },
      },
    };

    // Peak hours: trimmed to the trading day (at least 9am–10pm, widened if sales happen outside it)
    const active = data.hourly.filter((h) => h.bills > 0).map((h) => h.hour);
    const hFrom = Math.min(9, ...(active.length ? active : [9]));
    const hTo = Math.max(22, ...(active.length ? active : [22]));
    const hours = data.hourly.filter((h) => h.hour >= hFrom && h.hour <= hTo);
    const peakHour = data.hourly.reduce((m, h) => (h.revenue > m.revenue ? h : m), { revenue: 0, hour: null });
    const hourly = {
      data: {
        labels: hours.map((h) => hourLabel(h.hour)),
        datasets: [{
          label: 'Revenue', data: hours.map((h) => h.revenue),
          backgroundColor: hours.map((h) => (h.hour === peakHour.hour ? P.amber : P.green + (theme === 'dark' ? 'aa' : 'cc'))),
          borderRadius: 6, maxBarThickness: 22,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { ...tooltip, callbacks: { title: (c) => c[0].label, label: (c) => ` ${inr(c.parsed.y)} · ${hours[c.dataIndex].bills} bills` } } },
        scales: { x: scale({ grid: { display: false } }), y: scale({ beginAtZero: true, ticks: { color: P.tick, padding: 8, font: { size: 11 }, callback: (v) => `₹${compact(v)}` } }) },
      },
    };

    const bestDay = data.weekday.reduce((m, d) => (d.revenue > m.revenue ? d : m), { revenue: 0, day: null });
    const weekday = {
      data: {
        labels: data.weekday.map((d) => d.day),
        datasets: [{
          label: 'Revenue', data: data.weekday.map((d) => d.revenue),
          backgroundColor: data.weekday.map((d) => (d.day === bestDay.day && bestDay.revenue ? P.amber : P.lime)),
          borderRadius: 8, maxBarThickness: 34,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { ...tooltip, callbacks: { label: (c) => ` ${inr(c.parsed.y)} · ${data.weekday[c.dataIndex].bills} bills` } } },
        scales: { x: scale({ grid: { display: false } }), y: scale({ beginAtZero: true, ticks: { color: P.tick, padding: 8, font: { size: 11 }, callback: (v) => `₹${compact(v)}` } }) },
      },
    };

    const top = data.topProducts;
    const products = {
      data: {
        labels: top.map((p) => p.name),
        datasets: [{
          label: 'Revenue', data: top.map((p) => p.revenue),
          backgroundColor: top.map((_, i) => (i === 0 ? P.green : i < 3 ? P.green + 'b3' : P.green + '66')),
          borderRadius: 6, maxBarThickness: 20,
        }],
      },
      options: {
        indexAxis: 'y', responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { ...tooltip, callbacks: { label: (c) => ` ${inr(c.parsed.x)} · ${qtyText(top[c.dataIndex].qty, top[c.dataIndex].unit)} sold` } } },
        scales: {
          x: scale({ beginAtZero: true, ticks: { color: P.tick, padding: 6, font: { size: 11 }, callback: (v) => `₹${compact(v)}` } }),
          y: scale({ grid: { display: false }, ticks: { color: P.tick, padding: 6, font: { size: 12, weight: '600' } } }),
        },
      },
    };

    const payTotal = data.payments.reduce((s, p) => s + p.revenue, 0);
    const upi = data.payments.find((p) => p.method === 'upi');
    const insights = [
      peakHour.hour !== null && peakHour.revenue > 0 && { icon: Clock, label: 'Busiest hour', value: `${hourLabel(peakHour.hour)} – ${hourLabel((peakHour.hour + 1) % 24)}` },
      bestDay.revenue > 0 && { icon: CalendarDays, label: 'Best day', value: bestDay.day },
      top[0] && { icon: Crown, label: 'Top seller', value: top[0].name },
      payTotal > 0 && { icon: Wallet, label: 'Paid by UPI', value: `${Math.round(((upi?.revenue || 0) / payTotal) * 100)}%` },
    ].filter(Boolean);

    return { tooltip, trend, hourly, weekday, products, insights, peakHour, bestDay };
  }, [data, theme]); // eslint-disable-line react-hooks/exhaustive-deps

  const t = data?.totals;
  const prev = data?.previous;
  const totalCustomers = (t?.newCustomers || 0) + (t?.returningCustomers || 0);

  return (
    <section className="space-y-5 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-emerald-700 flex items-center justify-center"><BarChart3 className="w-4 h-4 text-white" /></div>
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Sales Analytics</span>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Trends, peaks &amp; what sells</h2>
          <p className="text-sm text-gray-500 mt-1">Compared with the previous {days} days</p>
        </div>
        <div className="inline-flex p-1 rounded-full bg-white self-start" role="tablist" aria-label="Analytics period">
          {PERIODS.map((d) => (
            <button key={d} role="tab" aria-selected={days === d} onClick={() => { if (d !== days) { setLoading(true); setDays(d); } }}
              className={`px-4 py-2 text-sm font-semibold transition-all ${days === d ? 'bg-emerald-700 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
              {d} days
            </button>
          ))}
        </div>
      </div>

      {!data ? (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">{[...Array(5)].map((_, i) => <div key={i} className="h-32 rounded-2xl bg-white/60 animate-pulse" />)}</div>
          <div className="h-80 rounded-2xl bg-white/60 animate-pulse" />
        </div>
      ) : (
        <div className={`space-y-5 sm:space-y-6 transition-opacity ${loading ? 'opacity-60' : ''}`}>
          {/* KPIs with change vs previous period */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            <Kpi icon={IndianRupee} label="Revenue" value={inr(t.revenue)} cur={t.revenue} prev={prev.revenue} accent="bg-emerald-700" />
            <Kpi icon={Receipt} label="Bills" value={t.bills.toLocaleString('en-IN')} cur={t.bills} prev={prev.bills} accent="bg-emerald-500" />
            <Kpi icon={TrendingUp} label="Average bill" value={inr(t.avgBill)} cur={t.avgBill} prev={prev.avgBill} accent="bg-sky-600" />
            <Kpi icon={Users} label="Customers" value={t.customers.toLocaleString('en-IN')} cur={t.customers} prev={prev.customers} accent="bg-violet-600"
              hint={totalCustomers ? `${t.newCustomers} new · ${t.returningCustomers} returning` : undefined} />
            <Kpi icon={TicketPercent} label="Discounts given" value={inr(t.discounts)} cur={t.discounts} prev={prev.discounts} accent="bg-amber-500"
              hint={t.revenue ? `${((t.discounts / (t.revenue + t.discounts)) * 100).toFixed(1)}% of gross sales` : undefined} />
          </div>

          {/* Quick insights */}
          {view.insights.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {view.insights.map((i) => (
                <div key={i.label} className="flex items-center gap-3 rounded-2xl bg-emerald-50 px-4 py-3 min-w-0">
                  <span className="w-8 h-8 rounded-full bg-white text-emerald-700 flex items-center justify-center shrink-0"><i.icon size={16} /></span>
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">{i.label}</div>
                    <div className="text-sm font-bold text-gray-900 truncate">{i.value}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Revenue + bills trend */}
          <Card title="Revenue & bills" icon={TrendingUp} subtitle={`${inr(t.revenue)} from ${t.bills} bills · GST ${inr(t.gst)}`}>
            <div className="relative h-64 sm:h-80">
              {t.bills ? <Chart type="bar" data={view.trend.data} options={view.trend.options} /> : <Empty />}
            </div>
          </Card>

          <div className="grid lg:grid-cols-2 gap-5 sm:gap-6">
            <Card title="Peak hours" icon={Clock} subtitle={view.peakHour.revenue ? `Busiest: ${hourLabel(view.peakHour.hour)} (highlighted)` : 'Sales by hour of day'}>
              <div className="relative h-60">{t.bills ? <Bar data={view.hourly.data} options={view.hourly.options} /> : <Empty />}</div>
            </Card>
            <Card title="Sales by weekday" icon={CalendarDays} subtitle={view.bestDay.revenue ? `${view.bestDay.day} is your strongest day` : 'Which days sell the most'}>
              <div className="relative h-60">{t.bills ? <Bar data={view.weekday.data} options={view.weekday.options} /> : <Empty />}</div>
            </Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-5 sm:gap-6">
            <Card title="Top products" icon={Crown} subtitle="By revenue after item discounts" className="lg:col-span-1">
              <div className="relative" style={{ height: Math.max(200, data.topProducts.length * 36) }}>
                {data.topProducts.length ? <Bar data={view.products.data} options={view.products.options} /> : <Empty />}
              </div>
            </Card>
            <Card title="Payment methods" icon={Wallet} subtitle="Share of revenue">
              <Split
                ring={P.ring} tooltip={{ ...view.tooltip, callbacks: { label: (c) => ` ${c.label}: ${inr(c.parsed)}` } }}
                colors={[P.green, P.lime, P.sky]}
                center={{ label: 'Revenue', value: `₹${compact(t.revenue)}` }}
                items={['cash', 'upi', 'card'].map((m) => {
                  const p = data.payments.find((x) => x.method === m);
                  return { label: PAY[m], value: p?.revenue || 0, sub: `${inr(p?.revenue)} · ${p?.bills || 0} bills` };
                }).filter((i) => i.value > 0)}
              />
            </Card>
            <Card title="Channels" icon={Store} subtitle="Retail counter, events and stalls">
              <Split
                ring={P.ring} tooltip={{ ...view.tooltip, callbacks: { label: (c) => ` ${c.label}: ${inr(c.parsed)}` } }}
                colors={[P.green, P.amber, P.violet]}
                center={{ label: 'Bills', value: t.bills.toLocaleString('en-IN') }}
                items={['retail', 'event', 'stall'].map((k) => {
                  const p = data.billTypes.find((x) => x.type === k);
                  return { label: TYPE[k], value: p?.revenue || 0, sub: `${inr(p?.revenue)} · ${p?.bills || 0} bills` };
                }).filter((i) => i.value > 0)}
              />
            </Card>
          </div>

          {/* New vs returning customers */}
          {totalCustomers > 0 && (
            <Card title="New vs returning customers" icon={Users} subtitle="Returning = bought before this period too">
              <div className="flex h-4 rounded-full overflow-hidden bg-gray-100">
                <div className="h-full bg-violet-500 transition-all duration-700" style={{ width: `${(t.newCustomers / totalCustomers) * 100}%` }} />
                <div className="h-full bg-emerald-600 transition-all duration-700" style={{ width: `${(t.returningCustomers / totalCustomers) * 100}%` }} />
              </div>
              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                <span className="flex items-center gap-2 text-gray-700"><span className="w-2.5 h-2.5 rounded-full bg-violet-500" />New <b className="text-gray-900 tabular-nums">{t.newCustomers}</b> <span className="text-gray-400">({Math.round((t.newCustomers / totalCustomers) * 100)}%)</span></span>
                <span className="flex items-center gap-2 text-gray-700"><span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />Returning <b className="text-gray-900 tabular-nums">{t.returningCustomers}</b> <span className="text-gray-400">({Math.round((t.returningCustomers / totalCustomers) * 100)}%)</span></span>
              </div>
            </Card>
          )}
        </div>
      )}
    </section>
  );
}
