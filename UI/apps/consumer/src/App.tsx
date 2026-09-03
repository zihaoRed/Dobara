import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Home as HomeIcon, ShoppingBag, ArrowLeftRight, User } from 'lucide-react';

import { Login } from './pages/Login';
import { Home } from './pages/Home';
import { MallHome } from './pages/MallHome';
import { ProductDetail } from './pages/ProductDetail';
import { OrderConfirm } from './pages/OrderConfirm';
import { Payment } from './pages/Payment';
import { OrderSuccess } from './pages/OrderSuccess';
import { OrderList } from './pages/OrderList';
import { OrderDetail } from './pages/OrderDetail';
import { Appointment } from './pages/Appointment';
import { AppointmentSuccess } from './pages/AppointmentSuccess';
import { InspectionReport } from './pages/InspectionReport';
import { QuoteAccepted } from './pages/QuoteAccepted';
import { Profile } from './pages/Profile';
import { H5Preview } from './pages/H5Preview';
import { RecycleHome } from './pages/RecycleHome';
import { AddressList } from './pages/AddressList';
import { AfterSaleList } from './pages/AfterSaleList';
import { AfterSaleApply } from './pages/AfterSaleApply';
import { AfterSaleDetail } from './pages/AfterSaleDetail';
import { HelpCenter } from './pages/HelpCenter';
import { TicketCreate } from './pages/TicketCreate';
import { TicketList } from './pages/TicketList';
import { TicketDetail } from './pages/TicketDetail';
import { RedeemConfirm } from './pages/RedeemConfirm';
import { EnterpriseHome } from './pages/EnterpriseHome';
import { EnterpriseCart } from './pages/EnterpriseCart';
import { isEnterpriseMode } from './lib/enterpriseMode';

/* ── Auth helpers ── */
const AUTH_KEY = 'dobara_user';

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null') as { phone: string; name: string } | null;
  } catch {
    return null;
  }
}

export function setUser(phone: string, name: string) {
  localStorage.setItem(AUTH_KEY, JSON.stringify({ phone, name }));
}

export function clearUser() {
  localStorage.removeItem(AUTH_KEY);
}

/* ── Auth Guard ── */
function RequireAuth({ children }: { children: React.ReactNode }) {
  const user = getUser();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

/* ── Tab Bar Layout — Home / Buy / Exchange / Account ── */
const TABS = [
  { key: '/home', label: 'Home', icon: <HomeIcon size={22} /> },
  { key: '/buy', label: 'Buy', icon: <ShoppingBag size={22} /> },
  { key: '/sell', label: 'Exchange', icon: <ArrowLeftRight size={22} /> },
  { key: '/account', label: 'Account', icon: <User size={22} /> },
];

function TabBar() {
  const navigate = useNavigate();
  const location = useLocation();

  const active = TABS.find((t) => location.pathname === t.key || location.pathname.startsWith(t.key + '/'))?.key
    ?? (location.pathname.startsWith('/buy') || location.pathname.startsWith('/home/product') ? '/buy' : null)
    ?? (location.pathname.startsWith('/sell') || location.pathname.startsWith('/recycle') ? '/sell' : null)
    ?? (location.pathname.startsWith('/account') || location.pathname.startsWith('/profile') ? '/account' : null)
    ?? '/home';

  const goTab = (key: string) => {
    if (key === '/buy' && isEnterpriseMode()) {
      navigate('/buy/enterprise');
      return;
    }
    navigate(key);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 px-3 pb-3 safe-bottom pointer-events-none">
      <div className="pointer-events-auto bg-white/95 backdrop-blur-xl border border-border rounded-2xl shadow-[0_-2px_12px_rgba(6,68,57,0.08)] max-w-lg mx-auto">
        <div className="flex items-center justify-around h-14">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => goTab(tab.key)}
              className={`flex flex-col items-center justify-center gap-0.5 w-full h-full transition-all duration-200 ${
                active === tab.key
                  ? 'text-primary-500'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              <div className={active === tab.key ? 'scale-110' : ''}>{tab.icon}</div>
              <span className="text-[10px] font-semibold tracking-wide uppercase">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}

/* ── App Layout ── */
const TAB_PATHS = ['/home', '/buy', '/sell', '/account'];

function BuyEntry() {
  if (isEnterpriseMode()) return <Navigate to="/buy/enterprise" replace />;
  return <MallHome />;
}

function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const showTabs =
    TAB_PATHS.some((p) => location.pathname === p) ||
    location.pathname === '/buy/enterprise' ||
    location.pathname === '/recycle' ||
    location.pathname === '/profile';

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Global page gutter — keep content off screen edges on every route */}
      <main className={`flex-1 w-full px-4 pt-4 ${showTabs ? 'pb-24' : 'pb-6'}`}>
        {children}
      </main>
      {showTabs && <TabBar />}
    </div>
  );
}

/* ── App ── */
export function App() {
  const [user, setUserState] = useState(getUser());

  useEffect(() => {
    const check = () => setUserState(getUser());
    window.addEventListener('storage', check);
    return () => window.removeEventListener('storage', check);
  }, []);

  return (
    <BrowserRouter basename="/consumer">
      <AppLayout>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to={user ? '/home' : '/login'} replace />} />

          {/* Home — marketing landing */}
          <Route path="/home" element={<RequireAuth><Home /></RequireAuth>} />

          {/* Buy — product catalog + enterprise B2B */}
          <Route path="/buy" element={<RequireAuth><BuyEntry /></RequireAuth>} />
          <Route path="/buy/enterprise" element={<RequireAuth><EnterpriseHome /></RequireAuth>} />
          <Route path="/buy/enterprise/cart" element={<RequireAuth><EnterpriseCart /></RequireAuth>} />
          <Route path="/buy/enterprise/checkout" element={<RequireAuth><EnterpriseCart /></RequireAuth>} />
          <Route path="/home/product/:imei" element={<RequireAuth><ProductDetail /></RequireAuth>} />
          <Route path="/buy/product/:imei" element={<RequireAuth><ProductDetail /></RequireAuth>} />
          <Route path="/home/product/:imei/order" element={<RequireAuth><OrderConfirm /></RequireAuth>} />
          <Route path="/buy/product/:imei/order" element={<RequireAuth><OrderConfirm /></RequireAuth>} />
          <Route path="/buy/order/pay/:orderId" element={<RequireAuth><Payment /></RequireAuth>} />
          <Route path="/home/order/pay/:orderId" element={<RequireAuth><Payment /></RequireAuth>} />
          <Route path="/home/order/success/:orderId" element={<RequireAuth><OrderSuccess /></RequireAuth>} />
          <Route path="/buy/order/success/:orderId" element={<RequireAuth><OrderSuccess /></RequireAuth>} />

          {/* Sell — Exchange / trade-in */}
          <Route path="/sell" element={<RequireAuth><RecycleHome /></RequireAuth>} />
          <Route path="/sell/appointment" element={<RequireAuth><Appointment /></RequireAuth>} />
          <Route path="/sell/appointment/success" element={<RequireAuth><AppointmentSuccess /></RequireAuth>} />
          <Route path="/sell/report/:sessionId" element={<RequireAuth><InspectionReport /></RequireAuth>} />
          <Route path="/sell/report/:sessionId/accepted" element={<RequireAuth><QuoteAccepted /></RequireAuth>} />
          <Route path="/sell/report/:sessionId/accept" element={<RequireAuth><InspectionReport /></RequireAuth>} />
          <Route path="/sell/redeem/:sessionId" element={<RequireAuth><RedeemConfirm /></RequireAuth>} />

          {/* Legacy recycle redirects */}
          <Route path="/recycle" element={<Navigate to="/sell" replace />} />
          <Route path="/recycle/appointment" element={<Navigate to="/sell/appointment" replace />} />
          <Route path="/recycle/appointment/success" element={<Navigate to="/sell/appointment/success" replace />} />
          <Route path="/recycle/report/:sessionId" element={<RequireAuth><InspectionReport /></RequireAuth>} />
          <Route path="/recycle/report/:sessionId/accept" element={<RequireAuth><InspectionReport /></RequireAuth>} />

          {/* Account */}
          <Route path="/account" element={<RequireAuth><Profile /></RequireAuth>} />
          <Route path="/account/orders" element={<RequireAuth><OrderList /></RequireAuth>} />
          <Route path="/account/orders/:orderId" element={<RequireAuth><OrderDetail /></RequireAuth>} />
          <Route path="/account/orders/:orderId/after-sale" element={<RequireAuth><AfterSaleApply /></RequireAuth>} />
          <Route path="/account/addresses" element={<RequireAuth><AddressList /></RequireAuth>} />
          <Route path="/account/after-sales" element={<RequireAuth><AfterSaleList /></RequireAuth>} />
          <Route path="/account/after-sales/:ticketId" element={<RequireAuth><AfterSaleDetail /></RequireAuth>} />
          <Route path="/account/help" element={<RequireAuth><HelpCenter /></RequireAuth>} />
          <Route path="/account/tickets" element={<RequireAuth><TicketList /></RequireAuth>} />
          <Route path="/account/tickets/new" element={<RequireAuth><TicketCreate /></RequireAuth>} />
          <Route path="/account/tickets/:ticketId" element={<RequireAuth><TicketDetail /></RequireAuth>} />
          <Route path="/account/h5-preview" element={<RequireAuth><H5Preview /></RequireAuth>} />

          {/* Legacy profile redirects */}
          <Route path="/profile" element={<Navigate to="/account" replace />} />
          <Route path="/profile/orders" element={<Navigate to="/account/orders" replace />} />
          <Route path="/profile/orders/:orderId" element={<RequireAuth><OrderDetail /></RequireAuth>} />
          <Route path="/profile/h5-preview" element={<Navigate to="/account/h5-preview" replace />} />

          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}
