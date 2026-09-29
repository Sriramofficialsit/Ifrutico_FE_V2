import { useState, useEffect } from 'react';
import { TrendingUp, Users, Package, DollarSign } from 'lucide-react';
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, BarElement,
  Title, Tooltip, Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { apiFetch } from '../utils/api';
import { useAuth } from '../Context/AuthContext';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(17, 24, 39, 0.95)',
      titleColor: '#fff',
      bodyColor: '#e5e7eb',
      borderColor: '#374151',
      borderWidth: 1,
    },
  },
  scales: {
    y: { grid: { color: '#e5e7eb' }, ticks: { color: '#6b7280' } },
    x: { grid: { display: false }, ticks: { color: '#6b7280' } },
  },
};

export default function Reports() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const isAdmin = user?.role === 'admin';

  // Fetch from the real APIs
  useEffect(() => {
    Promise.all([
      apiFetch('/bill/monthly'),
      apiFetch('/product/fetch?limit=1'), // just to get total active items count
      isAdmin ? apiFetch('/sales/all?limit=1') : Promise.resolve(null), // team count is admin-only
    ])
      .then(([monthlyRes, productsRes, salesRes]) => {
        setData({
          monthly: monthlyRes.data.monthly,
          topItems: monthlyRes.data.topItems,
          salespersonStats: monthlyRes.data.salespersonStats,
          totalProducts: productsRes.total || 0,
          totalMembers: salesRes?.pagination?.total || 0,
        });
      })
      .catch((err) => { console.error(err); setFailed(true); })
      .finally(() => setLoading(false));
  }, [isAdmin]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="relative">
          <div className="w-14 h-14 border-4 border-emerald-500/20 rounded-full" />
          <div className="absolute inset-0 w-14 h-14 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }
  if (failed || !data) {
    return (
      <div className="py-24 text-center">
        <p className="text-gray-700 font-semibold">Couldn't load reports.</p>
        <p className="text-sm text-gray-500 mt-1">Please refresh, or sign in again if your session expired.</p>
      </div>
    );
  }

  const { monthly, topItems, salespersonStats, totalProducts, totalMembers } = data;

  const totalRevenue = monthly.reduce((s, m) => s + m.revenue, 0);
  const totalBills = monthly.reduce((s, m) => s + m.bills, 0);

  const monthlySalesData = {
    labels: monthly.map(m => m.month),
    datasets: [{
      label: 'Revenue (₹)',
      data: monthly.map(m => m.revenue),
      borderColor: '#10b981',
      backgroundColor: 'rgba(16, 185, 129, 0.15)',
      tension: 0.4,
      fill: true,
    }],
  };

  const topItemsData = {
    labels: topItems.map(t => t._id),
    datasets: [{
      label: 'Units Sold',
      data: topItems.map(t => t.sold),
      backgroundColor: ['#10b981', '#059669', '#047857', '#065f46', '#064e3b'],
      borderRadius: 8,
    }],
  };

  const salespersonData = {
    labels: salespersonStats.map(s => s.name || 'Unknown'),
    datasets: [{
      label: 'Sales (₹)',
      data: salespersonStats.map(s => s.sales),
      backgroundColor: '#10b981',
      borderRadius: 8,
    }],
  };

  return (
    <div className="animate-fade-in-up">
      <div className="mx-auto max-w-screen-2xl space-y-8 md:space-y-10">
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-gray-900">Reports & Analytics</h1>
          <p className="text-base sm:text-lg text-gray-600">View business insights, sales trends, and team performance for {new Date().getFullYear()}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
          <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 border border-white/70 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 animate-fade-in-up opacity-0 stagger-1">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1">Total Revenue</div>
                <div className="text-2xl md:text-3xl font-bold text-emerald-600">₹{totalRevenue.toLocaleString('en-IN')}</div>
              </div>
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-emerald-50 flex items-center justify-center"><DollarSign className="text-emerald-600" /></div>
            </div>
          </div>
          <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 border border-white/70 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 animate-fade-in-up opacity-0 stagger-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1">Total Bills</div>
                <div className="text-2xl md:text-3xl font-bold text-gray-900">{totalBills}</div>
              </div>
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-emerald-50 flex items-center justify-center"><TrendingUp className="text-emerald-600" /></div>
            </div>
          </div>
          <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 border border-white/70 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 animate-fade-in-up opacity-0 stagger-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1">Active Items</div>
                <div className="text-2xl md:text-3xl font-bold text-amber-600">{totalProducts}</div>
              </div>
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-amber-50 flex items-center justify-center"><Package className="text-amber-600" /></div>
            </div>
          </div>
          {isAdmin && (
          <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 border border-white/70 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 animate-fade-in-up opacity-0 stagger-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1">Team Members</div>
                <div className="text-2xl md:text-3xl font-bold text-gray-900">{totalMembers}</div>
              </div>
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gray-100 flex items-center justify-center"><Users className="text-gray-700" /></div>
            </div>
          </div>
          )}
        </div>

        <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/70 shadow-sm overflow-hidden animate-fade-in-up opacity-0 stagger-5">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-900">Sales Overview</h2>
            <p className="text-sm text-gray-600 mt-1">Monthly revenue trend for {new Date().getFullYear()}</p>
          </div>
          <div className="p-6">
            <div className="h-64 md:h-80">
              <Line data={monthlySalesData} options={{ ...chartOptions, plugins: { ...chartOptions.plugins, legend: { display: true, position: 'top' } } }} />
            </div>
          </div>
        </div>

        <div className={`grid grid-cols-1 ${user?.role === 'admin' ? 'lg:grid-cols-2' : ''} gap-6 lg:gap-8 animate-fade-in-up opacity-0 stagger-5`}>
          <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/70 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-white/60">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900">Top Selling Items</h2>
              <p className="text-sm text-gray-600 mt-1">By units sold</p>
            </div>
            <div className="p-6">
              <div className="h-64 md:h-80">
                {topItems.length > 0 ? (
                  <Bar data={topItemsData} options={{ ...chartOptions, indexAxis: 'y' }} />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">No data available</div>
                )}
              </div>
            </div>
          </div>

          {user?.role === 'admin' && (
            <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/70 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-white/60">
                <h2 className="text-xl md:text-2xl font-semibold text-gray-900">Salesperson Performance</h2>
                <p className="text-sm text-gray-600 mt-1">Total sales comparison</p>
              </div>
              <div className="p-6">
                <div className="h-64 md:h-80">
                  {salespersonStats.length > 0 ? (
                    <Bar data={salespersonData} options={chartOptions} />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">No data available</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}