import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { LogIn, Users, Clock, Monitor, Globe, ChevronLeft, ChevronRight, Loader2, SearchX, Shield, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiFetch } from '../utils/api';

const LIMIT = 20;
const RANGES = [
  { id: 'all', label: 'All time' },
  { id: 'today', label: 'Today' },
  { id: '7d', label: '7 days' },
  { id: '30d', label: '30 days' },
];

const rangeStart = (id) => {
  if (id === 'all') return null;
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (id === '7d') d.setDate(d.getDate() - 6);
  if (id === '30d') d.setDate(d.getDate() - 29);
  return d.toISOString();
};

const dayLabel = (iso) => {
  const d = new Date(iso);
  const t = new Date();
  const y = new Date();
  y.setDate(t.getDate() - 1);
  if (d.toDateString() === t.toDateString()) return 'Today';
  if (d.toDateString() === y.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};
const timeOf = (iso) => new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

const ago = (iso) => {
  if (!iso) return 'Never signed in';
  const mins = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.floor(hrs / 24);
  return days === 1 ? 'Yesterday' : `${days} days ago`;
};

function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="bg-white rounded-xl p-5 hover:-translate-y-0.5 transition-all duration-300 min-w-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
          <p className="text-2xl sm:text-3xl font-semibold mt-2 text-emerald-600 tabular-nums truncate">{value}</p>
          {sub && <p className="text-xs text-gray-500 mt-1 truncate">{sub}</p>}
        </div>
        <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-500 flex items-center justify-center flex-shrink-0"><Icon size={20} /></div>
      </div>
    </div>
  );
}

export default function LoginActivity() {
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState({ today: 0, activeToday: 0 });
  const [users, setUsers] = useState([]);
  const [userFilter, setUserFilter] = useState('all');
  const [range, setRange] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const reqId = useRef(0);

  const load = useCallback((p = 1) => {
    const id = ++reqId.current;
    setFetching(true);
    const qs = new URLSearchParams({ page: p, limit: LIMIT });
    if (userFilter !== 'all') qs.set('user', userFilter);
    const from = rangeStart(range);
    if (from) qs.set('from', from);
    apiFetch(`/login-activity?${qs}`)
      .then((d) => {
        if (id !== reqId.current) return;
        setLogs(d.data || []);
        setSummary(d.summary || { today: 0, activeToday: 0 });
        setTotalPages(d.pagination?.totalPages || 1);
        setTotal(d.pagination?.total || 0);
        setPage(p);
      })
      .catch((e) => id === reqId.current && toast.error(e.message))
      .finally(() => {
        if (id !== reqId.current) return;
        setLoading(false);
        setFetching(false);
      });
  }, [userFilter, range]);

  useEffect(() => { load(1); }, [load]);
  useEffect(() => {
    apiFetch('/login-activity/users').then((d) => setUsers(d.data || [])).catch(() => {});
  }, []);

  const groups = useMemo(() => {
    const map = new Map();
    logs.forEach((l) => {
      const k = dayLabel(l.loginAt);
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(l);
    });
    return [...map.entries()];
  }, [logs]);

  const lastLogin = users.find((u) => u.lastLogin);

  return (
    <div className="animate-fade-in-up">
      <div className="mx-auto max-w-screen-2xl space-y-6 md:space-y-8">
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl tracking-tight">Login Activity</h1>
          <p className="text-base sm:text-lg text-gray-600">When each branch and staff account signed in, after email verification</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-5">
          <StatCard icon={LogIn} label="Logins today" value={summary.today} />
          <StatCard icon={Users} label="Active today" value={summary.activeToday} sub={`of ${users.filter((u) => u.status === 'active').length} active accounts`} />
          <StatCard icon={Clock} label="Latest login" value={lastLogin ? ago(lastLogin.lastLogin) : '—'} sub={lastLogin?.name} />
        </div>

        {/* Last seen per account */}
        <div className="bg-white rounded-xl p-4 md:p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-3">Last login per account</h2>
          {users.length === 0 ? (
            <p className="text-sm text-gray-400">Loading…</p>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-2">
              {users.map((u) => (
                <button
                  key={u._id}
                  onClick={() => setUserFilter(userFilter === u._id ? 'all' : u._id)}
                  aria-pressed={userFilter === u._id}
                  className={`sb-square flex items-center gap-3 p-3 text-left border transition-all ${userFilter === u._id ? 'border-emerald-500 bg-emerald-50' : 'border-transparent bg-gray-50 hover:bg-emerald-50'}`}
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-500 text-white font-semibold flex items-center justify-center flex-shrink-0">{u.name?.charAt(0).toUpperCase()}</div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-gray-900 truncate">{u.name}{u.status !== 'active' && <span className="ml-2 text-[10px] text-gray-500 font-bold">INACTIVE</span>}</div>
                    <div className="text-xs text-gray-500">{ago(u.lastLogin)}{u.logins ? ` · ${u.logins} logins` : ''}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar" role="tablist" aria-label="Date range">
            {RANGES.map((r) => (
              <button key={r.id} role="tab" aria-selected={range === r.id} onClick={() => setRange(r.id)}
                className={`px-4 py-2 text-sm font-semibold whitespace-nowrap ${range === r.id ? 'bg-emerald-800 text-white' : 'bg-white text-gray-600 hover:bg-emerald-100'}`}>
                {r.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            {fetching && <Loader2 size={16} className="animate-spin text-emerald-500" />}
            <select value={userFilter} onChange={(e) => setUserFilter(e.target.value)} aria-label="Filter by account" className="h-11 px-4 bg-white border border-gray-200 outline-none">
              <option value="all">All accounts</option>
              {users.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
            </select>
          </div>
        </div>

        {/* Log */}
        <div className={`space-y-6 transition-opacity ${fetching && !loading ? 'opacity-60' : ''}`} aria-busy={fetching}>
          {loading ? (
            <div className="space-y-2">{Array.from({ length: 6 }, (_, i) => <div key={i} className="h-16 rounded-xl bg-white animate-pulse" />)}</div>
          ) : logs.length === 0 ? (
            <div className="py-20 text-center rounded-xl bg-white">
              <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-500 mb-4"><SearchX size={28} /></div>
              <div className="font-semibold text-gray-900">No logins recorded</div>
              <p className="text-sm text-gray-500 mt-1">Logins appear here once someone signs in with their email code.</p>
            </div>
          ) : groups.map(([label, items]) => (
            <section key={label}>
              <div className="flex items-baseline justify-between px-1 mb-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">{label}</h2>
                <span className="text-xs text-gray-400">{items.length} {items.length === 1 ? 'login' : 'logins'}</span>
              </div>
              <div className="space-y-2">
                {items.map((l) => (
                  <div key={l._id} className="bg-white rounded-xl p-3 md:p-4 flex items-center gap-3 md:gap-4">
                    <div className="w-11 h-11 rounded-full bg-emerald-500 text-white font-semibold flex items-center justify-center flex-shrink-0">{l.name?.charAt(0).toUpperCase()}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 truncate">{l.name}</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${l.role === 'admin' ? 'bg-emerald-800 text-white' : 'bg-emerald-100 text-emerald-700'}`}>
                          {l.role === 'admin' ? <Shield size={10} /> : <User size={10} />}{l.role}
                        </span>
                      </div>
                      <div className="text-xs md:text-sm text-gray-500 flex flex-wrap gap-x-4 gap-y-0.5 mt-0.5">
                        <span className="inline-flex items-center gap-1"><Monitor size={12} />{l.device || 'Unknown device'}</span>
                        {l.ip && <span className="inline-flex items-center gap-1"><Globe size={12} />{l.ip}</span>}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-semibold text-gray-900 tabular-nums">{timeOf(l.loginAt)}</div>
                      <div className="text-xs text-gray-400">{ago(l.loginAt)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between rounded-xl bg-white px-4 py-3">
            <span className="text-sm text-gray-500">Page <b className="text-gray-900">{page}</b> of {totalPages} · {total} logins</span>
            <div className="flex items-center gap-2">
              <button onClick={() => load(page - 1)} disabled={page <= 1 || fetching} aria-label="Previous page" className="h-10 w-10 flex items-center justify-center border border-gray-200 hover:bg-gray-50 disabled:opacity-40"><ChevronLeft size={18} /></button>
              <button onClick={() => load(page + 1)} disabled={page >= totalPages || fetching} aria-label="Next page" className="h-10 w-10 flex items-center justify-center border border-gray-200 hover:bg-gray-50 disabled:opacity-40"><ChevronRight size={18} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
