import React, { useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  useLocation,
  Navigate,
  Outlet,
} from 'react-router-dom';
import { Store, Package, DollarSign, Settings as SettingsIcon } from 'lucide-react';
import { Sidebar, moduleMeta } from './components/Sidebar';
import { AuthProvider, useAuth } from './lib/AuthContext';
import {
  MODULE_HOME,
  MODULE_TO_ROLE,
  moduleFromPath,
  roleHome,
  type TModule,
} from './lib/auth';

import Login from './pages/auth/Login';
import Activate from './pages/auth/Activate';
import ForgotPassword from './pages/auth/ForgotPassword';
import RoleSelect from './pages/auth/RoleSelect';
import Settings from './pages/Settings';

import OwnerHome from './pages/owner/OwnerHome';
import TradeInEntry from './pages/owner/TradeInEntry';
import TradeInHistory from './pages/owner/TradeInHistory';
import ClerkList from './pages/owner/ClerkList';
import ClerkAdd from './pages/owner/ClerkAdd';
import ClerkDetail from './pages/owner/ClerkDetail';
import RevenueDashboard from './pages/owner/RevenueDashboard';
import WhHome from './pages/wh/WhHome';
import InboundScan from './pages/wh/InboundScan';
import InboundDetail from './pages/wh/InboundDetail';
import RefurbishQuality from './pages/wh/RefurbishQuality';
import RefurbishUpload from './pages/wh/RefurbishUpload';
import PickingList from './pages/wh/PickingList';
import PickingScan from './pages/wh/PickingScan';
import LabelPrint from './pages/wh/LabelPrint';
import InventoryQuery from './pages/wh/InventoryQuery';

import DbHome from './pages/db/DbHome';
import SettlementList from './pages/db/SettlementList';
import SettlementDetail from './pages/db/SettlementDetail';
import Reconciliation from './pages/db/Reconciliation';
import ReconciliationDetail from './pages/db/ReconciliationDetail';
import VoucherReview from './pages/db/VoucherReview';
import CommissionList from './pages/db/CommissionList';
import CommissionDetail from './pages/db/CommissionDetail';

function PublicOnly({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  if (session?.accountStatus === 'pending_activation') {
    return <Navigate to="/activate" replace />;
  }
  if (session && !session.activeRoleCode) {
    return <Navigate to="/select-role" replace />;
  }
  if (session?.activeRoleCode) {
    return <Navigate to={roleHome(session.activeRoleCode)} replace />;
  }
  return <>{children}</>;
}

/** Session required; pending users may stay here (e.g. /activate). */
function RequireSession({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

/** Session + activated; pending → /activate. Do not wrap /activate itself. */
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  if (!session) return <Navigate to="/login" replace />;
  if (session.accountStatus === 'pending_activation') {
    return <Navigate to="/activate" replace />;
  }
  return <>{children}</>;
}

function RequireActiveRole({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  if (!session) return <Navigate to="/login" replace />;
  if (session.accountStatus === 'pending_activation') {
    return <Navigate to="/activate" replace />;
  }
  if (!session.activeRoleCode) {
    return <Navigate to="/select-role" replace />;
  }
  return <>{children}</>;
}

function ModuleGuard({ module }: { module: TModule }) {
  const { session, modules, switchRole } = useAuth();
  const neededRole = MODULE_TO_ROLE[module];

  useEffect(() => {
    if (!session) return;
    if (!modules.includes(module)) return;
    if (session.activeRoleCode !== neededRole) {
      switchRole(neededRole);
    }
  }, [session, modules, module, neededRole, switchRole]);

  if (!session?.activeRoleCode) {
    return <Navigate to="/select-role" replace />;
  }
  if (!modules.includes(module)) {
    return <Navigate to={roleHome(session.activeRoleCode)} replace />;
  }

  return <Outlet />;
}

function HomeRedirect() {
  const { session } = useAuth();
  if (!session?.activeRoleCode) return <Navigate to="/select-role" replace />;
  return <Navigate to={roleHome(session.activeRoleCode)} replace />;
}

function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, modules, switchRole } = useAuth();
  const pathMod = moduleFromPath(location.pathname);
  const activeModule: TModule =
    pathMod && modules.includes(pathMod)
      ? pathMod
      : modules[0] ?? 'owner';

  return (
    <div className="min-h-[100dvh] bg-surface">
      <div className="sticky top-0 z-50 bg-accent-500 text-white text-center py-1.5 text-eyebrow font-semibold tracking-wider">
        [Demo Mode] Auth enabled · UA-P0-01/02
      </div>

      <div className="flex min-h-[calc(100dvh-28px)]">
        <aside className="hidden md:block w-[240px] flex-shrink-0 bg-surface-container border-r border-border">
          <Sidebar active={activeModule} />
        </aside>

        <main className="flex-1 w-full max-w-lg md:max-w-none mx-auto pb-14 md:pb-0 min-w-0">
          <header className="md:hidden bg-surface-container border-b border-border px-4 py-3 flex items-center justify-between gap-2">
            <a href="/" className="text-h4 font-heading text-primary-500 no-underline shrink-0">
              Dobara
            </a>
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-caption text-text-muted truncate">
                {session?.name} · {moduleMeta[activeModule]?.label}
              </span>
              <button
                type="button"
                className="text-caption text-primary-600 shrink-0"
                onClick={() => navigate('/settings')}
                aria-label="Settings"
              >
                <SettingsIcon size={18} />
              </button>
            </div>
          </header>

          <div className="p-4">
            <Outlet />
          </div>
        </main>
      </div>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface-container border-t border-border z-40">
        <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
          {modules.map((mod) => {
            const meta = moduleMeta[mod];
            const Icon =
              mod === 'owner' ? Store : mod === 'wh' ? Package : DollarSign;
            return (
              <button
                key={mod}
                type="button"
                onClick={() => {
                  switchRole(meta.role);
                  navigate(MODULE_HOME[mod]);
                }}
                className={`flex flex-col items-center justify-center gap-0.5 w-full h-full transition-colors ${
                  activeModule === mod ? 'text-primary-500' : 'text-text-muted'
                }`}
              >
                <Icon size={20} />
                <span className="text-eyebrow">{meta.label.split(' ')[0]}</span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className={`flex flex-col items-center justify-center gap-0.5 w-full h-full transition-colors ${
              location.pathname.startsWith('/settings') ? 'text-primary-500' : 'text-text-muted'
            }`}
          >
            <SettingsIcon size={20} />
            <span className="text-eyebrow">Settings</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicOnly>
            <Login />
          </PublicOnly>
        }
      />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route
        path="/activate"
        element={
          <RequireSession>
            <Activate />
          </RequireSession>
        }
      />
      <Route
        path="/select-role"
        element={
          <RequireAuth>
            <RoleSelect />
          </RequireAuth>
        }
      />

      <Route
        element={
          <RequireActiveRole>
            <AppShell />
          </RequireActiveRole>
        }
      >
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/settings" element={<Settings />} />

        <Route path="/owner" element={<ModuleGuard module="owner" />}>
          <Route index element={<OwnerHome />} />
          <Route path="trade-in/history" element={<TradeInHistory />} />
          <Route path="trade-in/:sessionId" element={<TradeInEntry />} />
          <Route path="clerks" element={<ClerkList />} />
          <Route path="clerks/add" element={<ClerkAdd />} />
          <Route path="clerks/:clerkId" element={<ClerkDetail />} />
          <Route path="revenue" element={<RevenueDashboard />} />
        </Route>

        <Route path="/wh" element={<ModuleGuard module="wh" />}>
          <Route index element={<WhHome />} />
          <Route path="inbound" element={<InboundScan />} />
          <Route path="inbound/:imei" element={<InboundDetail />} />
          <Route path="inbound/:imei/refurbish" element={<RefurbishQuality />} />
          <Route path="inbound/:imei/refurbish/upload" element={<RefurbishUpload />} />
          <Route path="picking" element={<PickingList />} />
          <Route path="picking/:orderId/scan" element={<PickingScan />} />
          <Route path="picking/:orderId/label" element={<LabelPrint />} />
          <Route path="inventory" element={<InventoryQuery />} />
        </Route>

        <Route path="/db" element={<ModuleGuard module="db" />}>
          <Route index element={<DbHome />} />
          <Route path="settlement" element={<SettlementList />} />
          <Route path="settlement/:orderId" element={<SettlementDetail />} />
          <Route path="reconciliation" element={<Reconciliation />} />
          <Route path="reconciliation/:storeId/:period" element={<ReconciliationDetail />} />
          <Route path="voucher-review" element={<VoucherReview />} />
          <Route path="commission" element={<CommissionList />} />
          <Route path="commission/:commissionId" element={<CommissionDetail />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter basename="/management">
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
