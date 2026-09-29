import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import { useState, useEffect, lazy, Suspense } from "react";
import { ShoppingBag } from "lucide-react";
import "./dashboard-theme.css";
import { Toaster } from 'react-hot-toast';

import SideBar from "./Components/SideBar";
import TopBar from "./Components/TopBar";

// Route-level code splitting: the marketing site (three.js, GSAP) and the admin
// dashboard (Chart.js) are only downloaded when their routes are visited.
const LandingMain = lazy(() => import("./LandingApp/LandingMain"));
const PureJoy = lazy(() => import("./LandingApp/Pages/PureJoy"));
const Dashboard = lazy(() => import("./Pages/Dashboard"));
const Billing = lazy(() => import("./Pages/Billing"));
const Stock = lazy(() => import("./Pages/Stock"));
const BillingList = lazy(() => import("./Pages/BillingList"));
const Reports = lazy(() => import("./Pages/Reports"));
const Customers = lazy(() => import("./Pages/Customers"));
const Salespersons = lazy(() => import("./Pages/SalesPerson"));
const BranchDetail = lazy(() => import("./Pages/BranchDetail"));
const LoginActivity = lazy(() => import("./Pages/LoginActivity"));
const Settings = lazy(() => import("./Pages/Settings"));
const LoginPage = lazy(() => import("./Pages/LoginPage"));
const ForgotPassword = lazy(() => import("./Pages/ForgotPassword"));
const VerifyOTP = lazy(() => import("./Pages/VerifyOTP"));
const ResetPassword = lazy(() => import("./Pages/ResetPassword"));
const MenuLeads = lazy(() => import("./Pages/MenuLeads"));
const OrderLeads = lazy(() => import("./Pages/OrderLeads"));
const DealershipLeads = lazy(() => import("./Pages/DealershipLeads"));
const TestimonialManager = lazy(() => import("./Pages/TestimonialManager"));

import { AuthProvider, useAuth } from "./Context/AuthContext";


// Shows a full-screen loader while the session cookie is being verified
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-emerald-800">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-emerald-300 text-sm font-medium">Loading...</p>
      </div>
    </div>
  );
}

// Redirects to login if no active session
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return user ? children : <Navigate to="/login" replace />;
}

// Redirects logged-in users away from the login page
function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return !user ? children : <Navigate to="/dashboard" replace />;
}


function Layout() {
  const { user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();

  // Dashboard design system is scoped to <body> so portalled modals/drawers get it too
  useEffect(() => {
    document.body.classList.add('sb-app');
    return () => document.body.classList.remove('sb-app');
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-canvas">
      <SideBar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      <div className="flex-1 flex flex-col min-w-0 h-screen">
        <TopBar collapsed={sidebarCollapsed} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

        <main className={`flex-1 overflow-y-auto overflow-x-hidden text-gray-900 pt-20 sm:pt-24 md:pt-28 pb-12 md:pb-16 transition-all duration-300 pr-4 sm:pr-6 lg:pr-8 pl-4 sm:pl-6 ${sidebarCollapsed ? 'md:pl-28' : 'md:pl-80'}`}>
          <Suspense fallback={<div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>}>
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/stock" element={<Stock />} />
            <Route path="/bills" element={user?.role === 'admin' ? <BillingList /> : <Navigate to="/dashboard" replace />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/customers" element={user?.role === 'admin' ? <Customers /> : <Navigate to="/dashboard" replace />} />
            <Route path="/team" element={user?.role === 'admin' ? <Salespersons /> : <Navigate to="/dashboard" replace />} />
            <Route path="/team/:id" element={user?.role === 'admin' ? <BranchDetail /> : <Navigate to="/dashboard" replace />} />
            <Route path="/login-activity" element={user?.role === 'admin' ? <LoginActivity /> : <Navigate to="/dashboard" replace />} />
            <Route path="/menu-leads" element={user?.role === 'admin' ? <MenuLeads /> : <Navigate to="/dashboard" replace />} />
            <Route path="/order-leads" element={user?.role === 'admin' ? <OrderLeads /> : <Navigate to="/dashboard" replace />} />
            <Route path="/dealership-leads" element={user?.role === 'admin' ? <DealershipLeads /> : <Navigate to="/dashboard" replace />} />
            <Route path="/testimonials-manager" element={user?.role === 'admin' ? <TestimonialManager /> : <Navigate to="/dashboard" replace />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
          </Suspense>
        </main>
      </div>

      {/* Frap: persistent floating entry to the most common action */}
      {pathname !== '/billing' && (
        <Link to="/billing" className="sb-frap" aria-label="New bill" title="New bill">
          <ShoppingBag size={24} />
        </Link>
      )}
    </div>
  );
}


function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{ style: { borderRadius: '12px', background: '#1E3932', color: '#fff', fontSize: '14px' }, success: { iconTheme: { primary: '#00754A', secondary: '#fff' } } }} />
        <Suspense fallback={<LoadingScreen />}>
        <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={<Suspense fallback={<div className="min-h-screen bg-gray-50" />}><LandingMain /></Suspense>} />
          <Route path="/pure-joy" element={<Suspense fallback={<div className="min-h-screen bg-gray-50" />}><PureJoy /></Suspense>} />
          
          {/* Public — redirect to dashboard if already logged in */}
          <Route
            path="/login"
            element={
              <GuestRoute>
                <LoginPage />
              </GuestRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <GuestRoute>
                <ForgotPassword />
              </GuestRoute>
            }
          />
          <Route
            path="/verify-otp"
            element={
              <GuestRoute>
                <VerifyOTP />
              </GuestRoute>
            }
          />
          <Route
            path="/reset-password"
            element={
              <GuestRoute>
                <ResetPassword />
              </GuestRoute>
            }
          />

          {/* Protected — redirect to login if not authenticated */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          />
        </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
