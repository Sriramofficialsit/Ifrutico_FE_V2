import { useState, useEffect } from 'react';
import { Clock, LogOut, Menu } from 'lucide-react';
import { useAuth } from '../Context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';

export default function TopBar({ collapsed, mobileOpen, setMobileOpen }) {
  const [time, setTime] = useState('');
  const { user, logout } = useAuth();
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
    if (path.includes('settings'))   return 'Settings';
    return 'Dashboard';
  };

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  useEffect(() => {
    const updateTime = () => {
      setTime(new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit', hour12: true,
      }));
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <header
      className={`fixed right-0 top-0 z-40 h-14 sm:h-16 md:h-20 bg-white transition-all duration-300 left-0 ${collapsed ? 'md:left-20' : 'md:left-72'}`}
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
          <h1 className="text-xl sm:text-2xl tracking-tight" style={{ color: '#006241', fontWeight: 600 }}>
            {getPageTitle()}
          </h1>
        </div>

        {/* Right — time + user */}
        <div className="flex items-center gap-3 sm:gap-5">
          <div className="hidden sm:flex items-center gap-2.5 px-4 py-2 rounded-full bg-emerald-100 text-[11px] uppercase tracking-widest font-bold text-emerald-600">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Live • {time}
          </div>

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
