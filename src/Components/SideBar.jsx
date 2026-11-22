import { useEffect, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { BILL_MODE_LIST } from '../utils/billModes';
import logo from '../LandingApp/images/logo.webp';
import { useAuth } from '../Context/AuthContext';
import {
  LayoutDashboard,
  ReceiptIndianRupee,
  Package,
  FileText,
  BarChart3,
  Users,
  Settings,
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
  ChevronDown,
  Megaphone,
  Mail,
  TicketPercent,
} from 'lucide-react';

const menuItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/billing', icon: ReceiptIndianRupee, label: 'Billing', children: BILL_MODE_LIST },
  {
    path: '/campaigns', icon: Megaphone, label: 'Campaigns', adminOnly: true,
    children: [
      { key: 'email', path: '/campaigns', label: 'Email Campaigns', icon: Mail },
      { key: 'coupons', path: '/campaigns/coupons', label: 'Coupons', icon: TicketPercent },
    ],
  },
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
  const { pathname } = useLocation();
  // Expandable groups (Billing, Campaigns): open while on one of their pages unless the user toggled them
  const [groupToggle, setGroupToggle] = useState({});
  const inGroup = (item) => pathname === item.path || pathname.startsWith(`${item.path}/`);
  const isOpen = (item) => groupToggle[item.path] ?? inGroup(item);

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
    ${isActive ? 'sb-nav-active bg-white text-emerald-500 font-semibold' : 'text-white/70 hover:bg-white/10 hover:text-white'}
    ${compact ? 'justify-center px-2' : ''}`;

  // Groups (Billing, Campaigns): a parent row that expands into its pages.
  // The collapsed rail shows the pages as separate icons instead.
  const renderItem = (item, compact, onNavigate) => {
    if (!item.children) {
      return (
        <NavLink key={item.path} to={item.path} onClick={onNavigate} title={compact ? item.label : undefined} className={({ isActive }) => itemClass(isActive, compact)}>
          <item.icon size={20} className="flex-shrink-0" />
          {!compact && <span className="text-sm">{item.label}</span>}
        </NavLink>
      );
    }
    if (compact) {
      return item.children.map((c) => (
        <NavLink key={c.path} to={c.path} end title={`${item.label}: ${c.label}`} className={({ isActive }) => itemClass(isActive, true)}>
          <c.icon size={20} className="flex-shrink-0" />
        </NavLink>
      ));
    }
    return (
      <div key={item.path}>
        <button type="button" onClick={() => setGroupToggle((g) => ({ ...g, [item.path]: !isOpen(item) }))} aria-expanded={isOpen(item)}
          className={`w-full ${itemClass(false, false)} ${inGroup(item) ? '!text-white bg-white/10 font-semibold' : ''}`}>
          <item.icon size={20} className="flex-shrink-0" />
          <span className="text-sm flex-1 text-left">{item.label}</span>
          <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen(item) ? 'rotate-180' : ''}`} />
        </button>
        <div className={`grid transition-all duration-300 ${isOpen(item) ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
          <div className="overflow-hidden">
            <div className="ml-6 mt-1 pl-3 border-l border-white/15 space-y-1">
              {item.children.map((c) => (
                <NavLink key={c.path} to={c.path} end onClick={onNavigate}
                  className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-full text-sm transition-all duration-200 active:scale-95 ${isActive ? 'sb-nav-active bg-white text-emerald-500 font-semibold' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
                  <c.icon size={17} className="flex-shrink-0" />
                  <span>{c.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Company logo on a white card (the logo is green, so it needs a light backing on the green sidebar)
  const brand = (full = true) => (
    <NavLink to="/dashboard" aria-label="Ifrutico dashboard home"
      className={`sb-keep-light flex items-center justify-center bg-white rounded-xl shadow-sm hover:shadow transition-shadow flex-shrink-0 ${full ? 'px-3 py-1.5' : 'w-12 h-12 mx-auto p-1'}`}>
      <img src={logo} alt="Ifrutico" className={full ? 'h-11 w-auto object-contain' : 'w-full h-full object-contain'} />
    </NavLink>
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
      <aside className={`sb-sidebar hidden md:flex flex-col bg-emerald-800 fixed inset-y-0 left-0 z-50 transition-all duration-300 ease-in-out ${collapsed ? 'w-20' : 'w-72'}`}>
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
          {visibleItems.map((item) => renderItem(item, collapsed))}
        </nav>

        {!collapsed && <div className="p-4">{userCard}</div>}
      </aside>

      {/* Mobile Drawer */}
      <div className={`md:hidden fixed inset-0 z-50 transition-all duration-300 ease-in-out ${mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
        <aside className={`sb-sidebar absolute left-0 top-0 h-full w-72 sm:w-80 bg-emerald-800 flex flex-col transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="h-20 flex items-center justify-between px-5">
            {brand()}
            <button onClick={() => setMobileOpen(false)} className="p-2 text-white/70 hover:text-white hover:bg-white/10" aria-label="Close menu">
              <X size={22} />
            </button>
          </div>

          <nav className="flex-1 pt-4 px-3 space-y-1 overflow-y-auto">
            {visibleItems.map((item) => renderItem(item, false, () => setMobileOpen(false)))}
          </nav>

          <div className="p-4">{userCard}</div>
        </aside>
      </div>
    </>
  );
}
