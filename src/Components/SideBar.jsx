import { useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import {
  LayoutDashboard,
  ReceiptIndianRupee,
  Package,
  FileText,
  BarChart3,
  Users,
  Settings,
  IceCream,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  LogOut,
  PhoneCall,
  ShoppingBag,
  MessageSquare,
  Landmark,
  Contact,
  History,
} from 'lucide-react';

const menuItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/billing', icon: ReceiptIndianRupee, label: 'Billing' },
  { path: '/stock', icon: Package, label: 'Stock' },
  { path: '/bills', icon: FileText, label: 'Billing List', adminOnly: true },
  { path: '/customers', icon: Contact, label: 'Customers', adminOnly: true },
  { path: '/reports', icon: BarChart3, label: 'Reports' },
  { path: '/team', icon: Users, label: 'Branch Management', adminOnly: true },
  { path: '/login-activity', icon: History, label: 'Login Activity', adminOnly: true },
  { path: '/menu-leads', icon: PhoneCall, label: 'Menu Leads', adminOnly: true },
  { path: '/order-leads', icon: ShoppingBag, label: 'Order Leads', adminOnly: true },
  { path: '/dealership-leads', icon: Landmark, label: 'Dealership Leads', adminOnly: true },
  { path: '/testimonials-manager', icon: MessageSquare, label: 'Manage Reviews', adminOnly: true },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function SideBar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const visibleItems = menuItems.filter(item => !item.adminOnly || user?.role === 'admin');

  // House Green rail: active item is a full pill, inactive items are quiet white-on-green
  const itemClass = (isActive, compact) =>
    `flex items-center gap-4 px-4 py-2.5 rounded-full transition-all duration-200 active:scale-95
    ${isActive ? 'bg-white text-emerald-500 font-semibold' : 'text-white/70 hover:bg-white/10 hover:text-white'}
    ${compact ? 'justify-center px-2' : ''}`;

  const brand = (showName = true) => (
    <div className={`flex items-center gap-3 ${!showName ? 'justify-center w-full' : ''}`}>
      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0">
        <IceCream className="w-6 h-6 text-emerald-500" />
      </div>
      {showName && <span className="text-xl font-semibold tracking-tight text-white">IFRUTICO</span>}
    </div>
  );

  const userCard = (
    <div className="flex items-center gap-3 rounded-xl p-3 bg-white/10">
      <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-semibold text-lg flex-shrink-0 overflow-hidden">
        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-white truncate text-sm">{user?.name || 'User'}</div>
        <div className="text-xs text-white/60 capitalize">{user?.role || 'staff'}</div>
      </div>
      <button onClick={handleLogout} title="Logout" aria-label="Logout" className="p-2 text-white/60 hover:text-white hover:bg-white/10 flex-shrink-0">
        <LogOut size={16} />
      </button>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col bg-emerald-800 fixed inset-y-0 left-0 z-30 transition-all duration-300 ease-in-out ${collapsed ? 'w-20' : 'w-72'}`}>
        <div className="relative h-20 flex items-center px-5">
          {brand(!collapsed)}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="absolute -right-3 top-7 z-50 p-1 bg-white text-emerald-800 shadow-sm rounded-full hover:bg-emerald-100"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <nav className="flex-1 pt-4 px-3 space-y-1 overflow-y-auto">
          {visibleItems.map((item) => (
            <NavLink key={item.path} to={item.path} title={collapsed ? item.label : undefined} className={({ isActive }) => itemClass(isActive, collapsed)}>
              <item.icon size={20} className="flex-shrink-0" />
              {!collapsed && <span className="text-sm">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {!collapsed && <div className="p-4">{userCard}</div>}
      </aside>

      {/* Mobile Drawer */}
      <div className={`md:hidden fixed inset-0 z-50 transition-all duration-300 ease-in-out ${mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
        <aside className={`absolute left-0 top-0 h-full w-72 sm:w-80 bg-emerald-800 flex flex-col transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="h-20 flex items-center justify-between px-5">
            {brand()}
            <button onClick={() => setMobileOpen(false)} className="p-2 text-white/70 hover:text-white hover:bg-white/10" aria-label="Close menu">
              <X size={22} />
            </button>
          </div>

          <nav className="flex-1 pt-4 px-3 space-y-1 overflow-y-auto">
            {visibleItems.map((item) => (
              <NavLink key={item.path} to={item.path} onClick={() => setMobileOpen(false)} className={({ isActive }) => itemClass(isActive, false)}>
                <item.icon size={20} className="flex-shrink-0" />
                <span className="text-sm">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="p-4">{userCard}</div>
        </aside>
      </div>
    </>
  );
}
