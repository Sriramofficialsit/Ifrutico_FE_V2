import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { isLowStock } from '../utils/units';
import { DollarSign, ShoppingCart, TrendingUp, AlertCircle, ArrowUpRight, Sparkles, Store, Crown, ChevronRight } from 'lucide-react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, BarElement, ArcElement, Tooltip, Filler, Legend,
} from 'chart.js';
import { useAuth } from '../Context/AuthContext';
import { apiFetch } from '../utils/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Filler, Legend);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(255,255,255,0.95)',
      titleColor: '#006241',
      bodyColor: 'rgba(0,0,0,0.87)',
      borderColor: 'rgba(0,0,0,0.08)',
      borderWidth: 1,
      padding: 12,
      cornerRadius: 12,
      callbacks: { label: (ctx) => ` ₹${ctx.parsed.y.toLocaleString('en-IN')}` },
    },
  },
  scales: {
    y: {
      grid: { color: 'rgba(229,231,235,0.5)' },
      ticks: { color: '#9ca3af', padding: 8, font: { size: 12 } },
      beginAtZero: true,
    },
    x: {
      grid: { display: false },
      ticks: { color: '#9ca3af', padding: 8, font: { size: 12 } },
    },
  },
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function buildWeeklyChart(weeklyData) {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  const labels = days.map((d) =>
    new Date(d).toLocaleDateString('en-IN', { weekday: 'short' })
  );
  const data = days.map((d) => {
    const found = weeklyData.find((w) => w._id === d);
    return found?.total || 0;
  });
  return {
    labels,
    datasets: [{
      label: 'Sales ₹',
      data,
      borderColor: '#00754A',
      backgroundColor: 'rgba(0,117,74,0.08)',
      tension: 0.45,
      fill: true,
      pointRadius: 4,
      pointBackgroundColor: '#00754A',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
      borderWidth: 2.5,
    }],
  };
}

// Brand greens first, then neutrals, so many branches stay legible without leaving the palette
const BRANCH_COLORS = ['#00754A', '#1E3932', '#5fae92', '#8a8f8c', '#2b5148', '#b3d7ca', '#4d4f4e', '#d6dbde'];
const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const compact = (n) => (n >= 100000 ? `${(n / 100000).toFixed(1)}L` : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`);

const branchChartOptions = (legend = false) => ({
  ...chartOptions,
  plugins: {
    ...chartOptions.plugins,
    legend: { display: legend, position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, color: '#6b7280', padding: 16 } },
    tooltip: {
      ...chartOptions.plugins.tooltip,
      titleColor: '#006241',
      callbacks: { label: (ctx) => ` ${ctx.dataset.label ? ctx.dataset.label + ': ' : ''}${inr(ctx.parsed.y ?? ctx.parsed)}` },
    },
  },
  scales: {
    ...chartOptions.scales,
    y: { ...chartOptions.scales.y, ticks: { ...chartOptions.scales.y.ticks, callback: (v) => `₹${compact(v)}` } },
  },
});

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '68%',
  plugins: {
    legend: { display: false },
    tooltip: { ...chartOptions.plugins.tooltip, titleColor: '#006241', callbacks: { label: (ctx) => ` ${ctx.label}: ${inr(ctx.parsed)}` } },
  },
};

function ChartCard({ title, subtitle, children, className = '' }) {
  return (
    <div className={`bg-white/60 backdrop-blur-xl rounded-2xl p-4 sm:p-6  min-w-0 w-full overflow-hidden ${className}`}>
      <h3 className="text-lg sm:text-xl font-bold text-gray-900">{title}</h3>
      {subtitle && <p className="text-xs sm:text-sm text-gray-500 mt-1 mb-5 font-medium">{subtitle}</p>}
      {children}
    </div>
  );
}

function BranchAnalytics() {
  const [days, setDays] = useState(7);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    apiFetch(`/bill/branch-analytics?days=${days}`)
      .then((d) => live && setData(d.data))
      .catch(console.error)
      .finally(() => live && setLoading(false));
    return () => { live = false; };
  }, [days]);

  const view = useMemo(() => {
    if (!data) return null;
    const { branches, daily } = data;
    const dates = Array.from({ length: data.days }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (data.days - 1 - i));
      return d.toLocaleDateString('en-CA');
    });
    const labels = dates.map((d) => new Date(d + 'T00:00').toLocaleDateString('en-IN', data.days > 7 ? { day: 'numeric', month: 'short' } : { weekday: 'short' }));
    const colorOf = (i) => BRANCH_COLORS[i % BRANCH_COLORS.length];
    const total = branches.reduce((s, b) => s + b.revenue, 0);

    return {
      total,
      totalBills: branches.reduce((s, b) => s + b.bills, 0),
      branches,
      colorOf,
      bar: {
        labels: branches.map((b) => b.name),
        datasets: [{
          label: 'Revenue',
          data: branches.map((b) => b.revenue),
          backgroundColor: branches.map((_, i) => colorOf(i)),
          borderRadius: 10,
          maxBarThickness: 56,
        }],
      },
      line: {
        labels,
        datasets: branches.slice(0, 8).map((b, i) => ({
          label: b.name,
          data: dates.map((d) => daily.find((x) => x.date === d && String(x.branch) === String(b.id))?.total || 0),
          borderColor: colorOf(i),
          backgroundColor: colorOf(i) + '22',
          tension: 0.4,
          pointRadius: data.days > 7 ? 0 : 3,
          pointHoverRadius: 5,
          borderWidth: 2.5,
        })),
      },
      donut: {
        labels: branches.map((b) => b.name),
        datasets: [{ data: branches.map((b) => b.revenue), backgroundColor: branches.map((_, i) => colorOf(i)), borderWidth: 3, borderColor: '#fff', hoverOffset: 8 }],
      },
    };
  }, [data]);

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-700 to-emerald-800 flex items-center justify-center shadow-sm"><Store className="w-4 h-4 text-white" /></div>
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Branch Analytics</span>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">How each branch is performing</h2>
        </div>
        <div className="inline-flex p-1 rounded-xl bg-white/70  shadow-sm self-start" role="tablist" aria-label="Period">
          {[7, 30].map((d) => (
            <button key={d} role="tab" aria-selected={days === d} onClick={() => { setLoading(true); setDays(d); }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${days === d ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow' : 'text-gray-600 hover:bg-white'}`}>
              {d} days
            </button>
          ))}
        </div>
      </div>

      {loading && !view ? (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 rounded-2xl bg-white/40 animate-pulse" />
          <div className="h-80 rounded-2xl bg-white/40 animate-pulse" />
        </div>
      ) : !view || view.branches.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-white/50 border border-dashed border-gray-200 text-gray-400">
          No branch sales in the last {days} days.
        </div>
      ) : (
        <div className={`space-y-6 sm:space-y-8 transition-opacity ${loading ? 'opacity-60' : ''}`}>
          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
            <ChartCard className="lg:col-span-2" title="Sales trend by branch" subtitle={`${inr(view.total)} across ${view.branches.length} ${view.branches.length === 1 ? 'branch' : 'branches'} · ${view.totalBills} bills`}>
              <div className="relative h-64 sm:h-72 lg:h-80"><Line data={view.line} options={branchChartOptions(true)} /></div>
            </ChartCard>

            <ChartCard title="Revenue share" subtitle={`Last ${days} days`}>
              <div className="relative h-52 sm:h-56">
                <Doughnut data={view.donut} options={doughnutOptions} />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[11px] uppercase tracking-wider text-gray-400 font-bold">Total</span>
                  <span className="text-2xl font-extrabold text-gray-900">₹{compact(view.total)}</span>
                </div>
              </div>
              <div className="mt-5 space-y-2">
                {view.branches.map((b, i) => (
                  <div key={b.id} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 min-w-0"><span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: view.colorOf(i) }} /><span className="truncate text-gray-700">{b.name}</span></span>
                    <span className="font-semibold text-gray-900 tabular-nums">{view.total ? Math.round((b.revenue / view.total) * 100) : 0}%</span>
                  </div>
                ))}
              </div>
            </ChartCard>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
            <ChartCard title="Revenue by branch" subtitle="Compare branches side by side">
              <div className="relative h-64 sm:h-72"><Bar data={view.bar} options={branchChartOptions(false)} /></div>
            </ChartCard>

            <ChartCard title="Branch leaderboard" subtitle="Ranked by revenue · tap a branch for its full details">
              <div className="space-y-3">
                {view.branches.map((b, i) => {
                  const pct = view.branches[0].revenue ? (b.revenue / view.branches[0].revenue) * 100 : 0;
                  const row = (
                    <div className="group p-3 rounded-xl hover:bg-white/80 border border-transparent hover:border-emerald-100 transition-all">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0 ${i === 0 ? 'bg-amber-50 text-amber-600 ring-1 ring-amber-200' : 'bg-gray-100 text-gray-500'}`}>
                          {i === 0 ? <Crown size={15} /> : `#${i + 1}`}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-gray-900 truncate group-hover:text-emerald-600 transition-colors">{b.name}{b.role === 'admin' && <span className="ml-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">ADMIN</span>}</span>
                            <span className="font-bold text-gray-900 tabular-nums">{inr(b.revenue)}</span>
                          </div>
                          <div className="mt-1.5 h-2 rounded-full bg-gray-100 overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: view.colorOf(i) }} />
                          </div>
                          <div className="mt-1.5 flex flex-wrap gap-x-4 text-xs text-gray-500">
                            <span>{b.bills} bills</span><span>Avg {inr(b.avgBill)}</span><span>Today {inr(b.today)}</span>
                          </div>
                        </div>
                        {b.role !== 'admin' && <ChevronRight size={16} className="text-gray-300 group-hover:text-emerald-500 flex-shrink-0" />}
                      </div>
                    </div>
                  );
                  return b.role !== 'admin' ? <Link key={b.id} to={`/team/${b.id}`} className="block">{row}</Link> : <div key={b.id}>{row}</div>;
                })}
              </div>
            </ChartCard>
          </div>
        </div>
      )}
    </div>
  );
}

const colorMap = {
  emerald: { icon: 'bg-emerald-100 text-emerald-500', text: 'text-emerald-600' },
  blue:    { icon: 'bg-emerald-100 text-emerald-500', text: 'text-emerald-600' },
  purple:  { icon: 'bg-emerald-800 text-white',       text: 'text-emerald-800' },
  amber:   { icon: 'bg-amber-100 text-amber-600',     text: 'text-amber-600' },
};

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [lowStock, setLowStock] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch('/bill/stats'),
      apiFetch('/product/fetch?limit=100'),
    ])
      .then(([billData, productData]) => {
        setStats(billData.data);
        const low = (productData.data || []).filter((p) => isLowStock(p)).length;
        setLowStock(low);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const statCards = stats
    ? [
      { title: "Today's Sales",  value: `₹${stats.today.sales.toLocaleString('en-IN')}`,           icon: DollarSign,  color: 'emerald' },
      { title: 'Bills Today',    value: stats.today.bills,                                           icon: ShoppingCart, color: 'blue' },
      { title: 'Total Revenue',  value: `₹${(stats.allTime.revenue / 100000).toFixed(1)}L`,          icon: TrendingUp,  color: 'purple' },
      { title: 'Low Stock',      value: lowStock, icon: AlertCircle, color: 'amber', urgent: lowStock > 0 },
    ]
    : [];

  const chartData = stats ? buildWeeklyChart(stats.weekly) : null;

  return (
    <div className="animate-fade-in-up w-full min-w-0">
      <div className="mx-auto max-w-screen-2xl space-y-6 sm:space-y-8 md:space-y-10 w-full min-w-0">

        {/* Greeting: House Green feature band */}
        <div className="rounded-xl bg-emerald-800 px-5 py-6 sm:px-8 sm:py-8 md:py-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2 min-w-0">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-300" />
              <span className="text-xs font-semibold text-emerald-300 uppercase tracking-widest">Dashboard Overview</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight leading-tight" style={{ color: '#fff' }}>
              {getGreeting()}, {user?.name?.split(' ')[0] || 'User'}
            </h1>
            <p className="text-sm sm:text-base" style={{ color: 'rgba(255,255,255,0.7)' }}>
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <Link to="/billing" className="self-start sm:self-auto inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white text-emerald-500 font-semibold text-sm hover:bg-emerald-100 active:scale-95 transition-all">
            New bill <ArrowUpRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-6 sm:space-y-8 w-full min-w-0">
            {/* Stats Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl p-5 sm:p-6 h-[132px] sm:h-36 animate-pulse flex flex-col justify-between shadow-sm">
                   <div className="flex justify-between items-start">
                     <div className="w-24 h-4 bg-gray-200/60 rounded-md"></div>
                     <div className="w-10 h-10 bg-gray-200/60 rounded-xl"></div>
                   </div>
                   <div className="w-32 h-8 bg-gray-200/60 rounded-lg mt-4"></div>
                </div>
              ))}
            </div>
            
            {/* Charts Skeleton */}
            <div className="grid lg:grid-cols-3 gap-6 lg:gap-8 w-full min-w-0">
               <div className="lg:col-span-2 bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl p-5 sm:p-6 lg:p-8 h-80 sm:h-96 animate-pulse shadow-sm min-w-0 w-full"></div>
               <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-2xl p-5 sm:p-6 lg:p-8 h-80 sm:h-96 animate-pulse shadow-sm min-w-0 w-full"></div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 sm:space-y-8 w-full min-w-0">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 w-full min-w-0">
              {statCards.map((stat, i) => {
                const c = colorMap[stat.color];
                return (
                  <div key={i} className="bg-white rounded-xl p-5 sm:p-6 hover:-translate-y-0.5 transition-all duration-300 min-w-0">
                    <div className="flex justify-between items-start">
                      <div className="min-w-0">
                        <p className="text-[11px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider">{stat.title}</p>
                        <p className={`text-2xl sm:text-3xl font-semibold mt-2 tabular-nums ${c.text}`}>{stat.value}</p>
                      </div>
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${c.icon}`}>
                        <stat.icon className="w-5 h-5" />
                      </div>
                    </div>
                    {stat.urgent && lowStock > 0 && (
                      <div className="inline-flex items-center gap-1.5 text-amber-600 text-xs font-semibold bg-amber-50 rounded-full px-3 py-1 mt-3">
                        <ArrowUpRight size={14} /> Needs attention
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Charts Row */}
            <div className="grid lg:grid-cols-3 gap-6 lg:gap-8 w-full min-w-0">
              {/* Weekly Chart */}
              <div className="lg:col-span-2 bg-white/60 backdrop-blur-xl rounded-2xl p-4 sm:p-6 lg:p-8  min-w-0 w-full overflow-hidden">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                  <div>
                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">Weekly Sales Trend</h2>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1 font-medium">
                      ₹{(stats?.weekly?.reduce((s, w) => s + w.total, 0) || 0).toLocaleString('en-IN')} in the past 7 days
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-emerald-50/80 backdrop-blur-sm text-emerald-700 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider border border-emerald-200/50">
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-500 rounded-full animate-pulse" />
                    Live Data
                  </span>
                </div>
                <div className="relative h-60 sm:h-72 lg:h-80 w-full min-w-0">
                  {chartData && <Line data={chartData} options={chartOptions} />}
                </div>
              </div>

              {/* Top Products */}
              <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-4 sm:p-6 lg:p-8  min-w-0 w-full">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-1 sm:mb-2 text-gray-900">Top Products</h2>
                <p className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-wider mb-5 sm:mb-6">Last 7 days</p>
                {stats?.topProducts?.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 gap-3 text-gray-400">
                    <ShoppingCart className="w-10 h-10 opacity-30" />
                    <p className="text-xs sm:text-sm">No sales yet this week.</p>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {(stats?.topProducts || []).map((p, i) => (
                      <div key={i} className="flex items-center gap-3 sm:gap-4 group">
                        <div className={`
                          w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl text-xs sm:text-sm font-black flex-shrink-0
                          ${i === 0 ? 'bg-amber-50 text-amber-600 ring-1 ring-amber-200 shadow-sm'
                            : i === 1 ? 'bg-gray-100 text-gray-500 shadow-sm'
                            : 'bg-gray-50 text-gray-400 border border-gray-100'}
                        `}>
                          #{i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-gray-900 truncate text-xs sm:text-sm group-hover:text-emerald-600 transition-colors">{p._id}</div>
                          <div className="text-[10px] sm:text-xs text-emerald-600 font-bold mt-0.5 sm:mt-1">{p.sold} sold · ₹{p.revenue?.toLocaleString('en-IN')}</div>
                        </div>
                        <div className="w-1 h-8 sm:w-1.5 sm:h-10 rounded-full bg-gradient-to-b from-emerald-400 to-emerald-200 opacity-60" style={{ opacity: 1 - i * 0.2 }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {user?.role === 'admin' && <BranchAnalytics />}
          </div>
        )}
      </div>
    </div>
  );
}