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
    if (path.includes('records'))    return 'Records';
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
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden flex items-center justify-center w-10 h-10 -ml-1 border border-black/20 text-black/80 hover:bg-black/5 flex-shrink-0"
            aria-label="Open sidebar"
          >
            <Menu size={20} />
          </button>
          <h1 className="sb-topbar-title hidden min-[400px]:block text-lg sm:text-2xl tracking-tight font-semibold truncate min-w-0">
            {getPageTitle()}
          </h1>
        </div>

        {/* Right — time + user */}
        <div className="flex items-center gap-2 sm:gap-4 xl:gap-5 shrink-0 pl-2">
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

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="text-right hidden xl:block">
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
              className="hidden xl:block p-2.5 text-black/50 hover:text-red-600 hover:bg-red-50"
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
  const [h1, h2] = p.hm.slice(0, 2);
  const [m1, m2] = p.hm.slice(3, 5);
  const [s1, s2] = p.ss;
  const blink = Number(p.ss) % 2 === 0;
  return (
    <div
      className="sb-led flex items-center gap-2 sm:gap-3 h-9 sm:h-11 pl-2 pr-2.5 sm:pl-3 sm:pr-3.5 rounded-xl"
      role="timer" aria-live="off" aria-label={`${p.date}, ${p.hm}:${p.ss} ${p.ampm} India time`}
    >
      {/* Left: live indicator + date */}
      <div className="hidden lg:flex flex-col justify-center leading-none gap-1" aria-hidden="true">
        <span className="flex items-center gap-1">
          <span className="sb-led-dot" />
          <span className="sb-led-label">Live</span>
        </span>
        <span className="hidden lg:block sb-led-label sb-led-dim whitespace-nowrap">{p.date}</span>
      </div>
      <span className="hidden lg:block sb-led-divider" aria-hidden="true" />

      {/* Main: HH:MM */}
      <div className="flex items-center" aria-hidden="true">
        <SegDigit ch={h1} className="h-[18px] sm:h-[26px]" />
        <SegDigit ch={h2} className="h-[18px] sm:h-[26px]" />
        <span className={`sb-led-colon ${blink ? 'is-on' : ''}`}><i /><i /></span>
        <SegDigit ch={m1} className="h-[18px] sm:h-[26px]" />
        <SegDigit ch={m2} className="h-[18px] sm:h-[26px]" />
      </div>

      {/* Right: seconds over AM/PM */}
      <div className="flex flex-col items-start justify-center gap-[3px]" aria-hidden="true">
        <div className="hidden sm:flex">
          <SegDigit ch={s1} className="h-[12px] sm:h-[13px]" />
          <SegDigit ch={s2} className="h-[12px] sm:h-[13px]" />
        </div>
        <span className="flex gap-1 sb-led-label leading-none">
          <span className={p.ampm === 'AM' ? 'sb-led-on' : 'sb-led-off'}>AM</span>
          <span className={p.ampm === 'PM' ? 'sb-led-on' : 'sb-led-off'}>PM</span>
        </span>
      </div>
    </div>
  );
}

// Seven-segment digit (SVG). Unlit segments stay faintly visible, like a real LED display.
const SEGS = {
  a: '2.5,0 9.5,0 10.5,1 9.5,2 2.5,2 1.5,1',
  b: '11,1.5 12,2.5 12,8.5 11,9.5 10,8.5 10,2.5',
  c: '11,10.5 12,11.5 12,17.5 11,18.5 10,17.5 10,11.5',
  d: '2.5,18 9.5,18 10.5,19 9.5,20 2.5,20 1.5,19',
  e: '1,10.5 2,11.5 2,17.5 1,18.5 0,17.5 0,11.5',
  f: '1,1.5 2,2.5 2,8.5 1,9.5 0,8.5 0,2.5',
  g: '2.5,9 9.5,9 10.5,10 9.5,11 2.5,11 1.5,10',
};
const DIGIT_SEGS = {
  0: 'abcdef', 1: 'bc', 2: 'abdeg', 3: 'abcdg', 4: 'bcfg',
  5: 'acdfg', 6: 'acdefg', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg',
};

function SegDigit({ ch, className = '' }) {
  const on = DIGIT_SEGS[ch] || '';
  return (
    <svg viewBox="-1.5 -0.5 15 21" className={`sb-seg w-auto ${className}`}>
      {Object.entries(SEGS).map(([k, pts]) => (
        <polygon key={k} points={pts} className={on.includes(k) ? 'on' : 'off'} />
      ))}
    </svg>
  );
}
