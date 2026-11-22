import { useState, useEffect } from 'react';
import { Clock, LogOut, Menu, Sun, Moon } from 'lucide-react';
import { useAuth } from '../Context/AuthContext';
import { useTheme } from '../Context/ThemeContext';
import { useLocation, useNavigate } from 'react-router-dom';

export default function TopBar({ collapsed, mobileOpen, setMobileOpen }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('dashboard'))  return 'Dashboard';
    if (path.includes('billing'))    return 'Billing';
    if (path.includes('stock'))      return 'Stock Management';
    if (path.includes('bills'))      return 'Billing List';
    if (path.includes('customers'))  return 'Customers';
    if (path.includes('reports'))    return 'Reports';
    if (path.includes('login-activity')) return 'Login Activity';
    if (path.includes('team'))       return 'Branch Management';
    if (path.includes('menu-leads')) return 'Menu Leads';
    if (path.includes('coupons'))    return 'Coupons';
    if (path.includes('campaigns'))  return 'Email Campaigns';
    if (path.includes('settings'))   return 'Settings';
    return 'Dashboard';
  };

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <header
      className={`sb-topbar fixed right-0 top-0 z-40 h-14 sm:h-16 md:h-20 transition-all duration-300 left-0 ${collapsed ? 'md:left-20' : 'md:left-72'}`}
      style={{ boxShadow: 'var(--sb-nav-shadow, 0 1px 3px rgba(0,0,0,.1), 0 2px 2px rgba(0,0,0,.06), 0 0 2px rgba(0,0,0,.07))' }}
    >
      <div className="mx-auto h-full max-w-screen-2xl pr-4 sm:pr-6 lg:pr-8 pl-4 sm:pl-6 lg:pl-8 flex items-center justify-between">

        {/* Left — page title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden flex items-center justify-center w-10 h-10 -ml-1 border border-black/20 text-black/80 hover:bg-black/5 flex-shrink-0"
            aria-label="Open sidebar"
          >
            <Menu size={20} />
          </button>
          <h1 className="sb-topbar-title text-xl sm:text-2xl tracking-tight font-semibold">
            {getPageTitle()}
          </h1>
        </div>

        {/* Right — time + user */}
        <div className="flex items-center gap-3 sm:gap-5">
          <button
            type="button"
            onClick={toggleTheme}
            className="sb-theme-switch"
            role="switch"
            aria-checked={theme === 'dark'}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            title={theme === 'dark' ? 'Light theme' : 'Dark theme'}
          >
            <Sun size={14} aria-hidden="true" />
            <Moon size={14} aria-hidden="true" />
            <span className="sb-theme-knob" aria-hidden="true">
              {theme === 'dark' ? <Moon size={15} /> : <Sun size={15} />}
            </span>
          </button>
          <LiveClock />

          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <div className="text-sm font-semibold text-gray-900">
                {getGreeting()}, {user?.name?.split(' ')[0] || 'User'}
              </div>
              <div className="text-xs text-gray-500 capitalize">{user?.role || 'staff'}</div>
            </div>

            <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-semibold text-base sm:text-lg flex-shrink-0 overflow-hidden">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>

            <button
              onClick={handleLogout}
              title="Logout"
              aria-label="Logout"
              className="p-2.5 text-black/50 hover:text-red-600 hover:bg-red-50"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

// Ticking India-time clock: re-renders on every real second boundary (no drift), seconds animate in,
// and only this small component updates — not the whole top bar.
const IST = 'Asia/Kolkata';
const partsOf = (d) => {
  const t = new Intl.DateTimeFormat('en-IN', { timeZone: IST, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }).formatToParts(d);
  const get = (type) => t.find((p) => p.type === type)?.value || '';
  return {
    hm: `${get('hour')}:${get('minute')}`,
    ss: get('second'),
    ampm: get('dayPeriod').toUpperCase(),
    date: d.toLocaleDateString('en-IN', { timeZone: IST, weekday: 'short', day: '2-digit', month: 'short' }),
  };
};

function LiveClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    let timer;
    const tick = () => {
      setNow(new Date());
      timer = setTimeout(tick, 1000 - (Date.now() % 1000) + 5); // land just after each new second
    };
    timer = setTimeout(tick, 1000 - (Date.now() % 1000) + 5);
    // Catch up immediately when the tab becomes visible again (browsers throttle background timers)
    const onVisible = () => document.visibilityState === 'visible' && setNow(new Date());
    document.addEventListener('visibilitychange', onVisible);
    return () => { clearTimeout(timer); document.removeEventListener('visibilitychange', onVisible); };
  }, []);

  const p = partsOf(now);
  return (
    <div className="sb-clock flex items-center gap-2 sm:gap-3 pl-2.5 pr-3 sm:pl-3 sm:pr-4 h-9 sm:h-10 rounded-full" role="timer" aria-live="off" aria-label={`${p.date}, ${p.hm}:${p.ss} ${p.ampm} India time`}>
      <span className="flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <span className="hidden sm:inline text-[10px] font-extrabold uppercase tracking-[0.18em] text-emerald-600">Live</span>
      </span>
      <span className="hidden lg:inline text-xs font-semibold text-gray-500 whitespace-nowrap">{p.date}</span>
      <span className="hidden lg:inline w-px h-4 bg-gray-300" aria-hidden="true" />
      <span className="flex items-baseline gap-1 font-bold tabular-nums text-gray-900 whitespace-nowrap">
        <span className="text-sm sm:text-[15px] tracking-tight">{p.hm}</span>
        <span key={p.ss} className="sb-clock-sec text-xs text-emerald-600">:{p.ss}</span>
        <span className="text-[10px] font-bold text-gray-500 ml-0.5">{p.ampm}</span>
        <span className="hidden xl:inline text-[10px] font-semibold text-gray-400 ml-1">IST</span>
      </span>
    </div>
  );
}
