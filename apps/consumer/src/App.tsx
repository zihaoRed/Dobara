import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, RefreshCw, User } from 'lucide-react';

import { Login } from './pages/Login';
import { MallHome } from './pages/MallHome';
import { ProductDetail } from './pages/ProductDetail';
import { OrderConfirm } from './pages/OrderConfirm';
import { OrderSuccess } from './pages/OrderSuccess';
import { OrderList } from './pages/OrderList';
import { OrderDetail } from './pages/OrderDetail';
import { Appointment } from './pages/Appointment';
import { AppointmentSuccess } from './pages/AppointmentSuccess';
import { InspectionReport } from './pages/InspectionReport';
import { AcceptQuote } from './pages/AcceptQuote';
import { Profile } from './pages/Profile';
import { H5Preview } from './pages/H5Preview';
import { RecycleHome } from './pages/RecycleHome';

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

/* ── Tab Bar Layout ── */
const TABS = [
  { key: '/home', label: 'Mall', icon: <Home size={22} /> },
  { key: '/recycle', label: 'Recycle', icon: <RefreshCw size={22} /> },
  { key: '/profile', label: 'Profile', icon: <User size={22} /> },
];

function TabBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const active = TABS.some((t) => location.pathname.startsWith(t.key))
    ? TABS.find((t) => location.pathname.startsWith(t.key))!.key
    : '/home';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 safe-bottom">
      <div className="bg-white/80 backdrop-blur-xl border-t border-border-light">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => navigate(tab.key)}
              className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-all duration-300 ${
                active === tab.key
                  ? 'text-emerald-600 scale-105'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              <div className={`transition-all duration-300 ${active === tab.key ? 'scale-110' : ''}`}>
                {tab.icon}
              </div>
              <span className="text-eyebrow font-medium">{tab.label}</span>
              {active === tab.key && (
                <div className="absolute top-0 w-8 h-0.5 rounded-full bg-emerald-500" />
              )}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}

/* ── App Layout with tab visibility ── */
const TAB_PATHS = ['/home', '/recycle', '/profile'];

function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const showTabs = TAB_PATHS.some((p) => location.pathname.startsWith(p) || location.pathname === p);

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {showTabs && (
        <header className="h-11 bg-surface-container border-b border-border flex items-center px-4 shrink-0">
          <a href="/" className="text-h4 font-heading text-primary-500 hover:text-primary-600 transition-colors no-underline">Dobara</a>
        </header>
      )}
      <main className={`flex-1 ${showTabs ? 'pb-16' : ''}`}>{children}</main>
      {showTabs && <TabBar />}
    </div>
  );
}

/* ── App ── */
export function App() {
  const { t } = useTranslation();
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

          <Route
            path="/home"
            element={<RequireAuth><MallHome /></RequireAuth>}
          />
          <Route
            path="/home/product/:imei"
            element={<RequireAuth><ProductDetail /></RequireAuth>}
          />
          <Route
            path="/home/product/:imei/order"
            element={<RequireAuth><OrderConfirm /></RequireAuth>}
          />
          <Route
            path="/home/order/success/:orderId"
            element={<RequireAuth><OrderSuccess /></RequireAuth>}
          />

          <Route
            path="/recycle"
            element={<RequireAuth><RecycleHome /></RequireAuth>}
          />
          <Route
            path="/recycle/appointment"
            element={<RequireAuth><Appointment /></RequireAuth>}
          />
          <Route
            path="/recycle/appointment/success"
            element={<RequireAuth><AppointmentSuccess /></RequireAuth>}
          />
          <Route
            path="/recycle/report/:sessionId"
            element={<RequireAuth><InspectionReport /></RequireAuth>}
          />
          <Route
            path="/recycle/report/:sessionId/accept"
            element={<RequireAuth><AcceptQuote /></RequireAuth>}
          />

          <Route
            path="/profile"
            element={<RequireAuth><Profile /></RequireAuth>}
          />
          <Route
            path="/profile/orders"
            element={<RequireAuth><OrderList /></RequireAuth>}
          />
          <Route
            path="/profile/orders/:orderId"
            element={<RequireAuth><OrderDetail /></RequireAuth>}
          />
          <Route
            path="/profile/h5-preview"
            element={<RequireAuth><H5Preview /></RequireAuth>}
          />

          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}
