import React from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Store, Package, DollarSign } from 'lucide-react';
import { Sidebar } from './components/Sidebar';

// Owner pages
import OwnerHome from './pages/owner/OwnerHome';
import TradeInEntry from './pages/owner/TradeInEntry';
import TradeInHistory from './pages/owner/TradeInHistory';
import ClerkList from './pages/owner/ClerkList';
import ClerkAdd from './pages/owner/ClerkAdd';
import ClerkDetail from './pages/owner/ClerkDetail';
import RevenueDashboard from './pages/owner/RevenueDashboard';

// Warehouse pages
import WhHome from './pages/wh/WhHome';
import InboundScan from './pages/wh/InboundScan';
import InboundDetail from './pages/wh/InboundDetail';
import RefurbishQuality from './pages/wh/RefurbishQuality';
import RefurbishUpload from './pages/wh/RefurbishUpload';
import PickingList from './pages/wh/PickingList';
import PickingScan from './pages/wh/PickingScan';

// Finance pages
import DbHome from './pages/db/DbHome';
import SettlementList from './pages/db/SettlementList';
import SettlementDetail from './pages/db/SettlementDetail';
import Reconciliation from './pages/db/Reconciliation';
import ReconciliationDetail from './pages/db/ReconciliationDetail';
import VoucherReview from './pages/db/VoucherReview';

type Module = 'owner' | 'wh' | 'db';

const moduleConfig: Record<Module, { label: string; icon: React.ReactNode; path: string }> = {
  owner: { label: 'Store Owner', icon: <Store size={20} />, path: '/owner' },
  wh: { label: 'Warehouse', icon: <Package size={20} />, path: '/wh' },
  db: { label: 'Finance', icon: <DollarSign size={20} />, path: '/db' },
};

function getModuleFromPath(pathname: string): Module {
  if (pathname.startsWith('/owner')) return 'owner';
  if (pathname.startsWith('/wh')) return 'wh';
  if (pathname.startsWith('/db')) return 'db';
  return 'owner';
}

function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const activeModule = getModuleFromPath(location.pathname);

  return (
    <div className="min-h-screen bg-surface">
      {/* Demo Mode Banner */}
      <div className="sticky top-0 z-50 bg-accent-500 text-white text-center py-1.5 text-eyebrow font-semibold tracking-wider">
        [Demo Mode]
      </div>

      <div className="flex min-h-[calc(100vh-28px)]">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-[240px] flex-shrink-0 bg-surface-container border-r border-border">
          <Sidebar active={activeModule} onNavigate={(mod) => navigate(moduleConfig[mod].path)} />
        </aside>

        {/* Main Content */}
        <main className="flex-1 w-full max-w-lg md:max-w-none mx-auto pb-14 md:pb-0">
          {/* Mobile Header */}
          <header className="md:hidden bg-surface-container border-b border-border px-4 py-3 flex items-center justify-between">
            <h1 className="text-h4 font-heading text-primary-500">Dobara</h1>
            <span className="text-caption text-text-muted">{moduleConfig[activeModule].label}</span>
          </header>

          <div className="p-4">
            <Routes>
              {/* Redirect root */}
              <Route path="/" element={<Navigate to="/owner" replace />} />

              {/* Owner routes */}
              <Route path="/owner" element={<OwnerHome />} />
              <Route path="/owner/trade-in/:sessionId" element={<TradeInEntry />} />
              <Route path="/owner/trade-in/history" element={<TradeInHistory />} />
              <Route path="/owner/clerks" element={<ClerkList />} />
              <Route path="/owner/clerks/add" element={<ClerkAdd />} />
              <Route path="/owner/clerks/:clerkId" element={<ClerkDetail />} />
              <Route path="/owner/revenue" element={<RevenueDashboard />} />

              {/* Warehouse routes */}
              <Route path="/wh" element={<WhHome />} />
              <Route path="/wh/inbound" element={<InboundScan />} />
              <Route path="/wh/inbound/:imei" element={<InboundDetail />} />
              <Route path="/wh/inbound/:imei/refurbish" element={<RefurbishQuality />} />
              <Route path="/wh/inbound/:imei/refurbish/upload" element={<RefurbishUpload />} />
              <Route path="/wh/picking" element={<PickingList />} />
              <Route path="/wh/picking/:orderId/scan" element={<PickingScan />} />

              {/* Finance routes */}
              <Route path="/db" element={<DbHome />} />
              <Route path="/db/settlement" element={<SettlementList />} />
              <Route path="/db/settlement/:orderId" element={<SettlementDetail />} />
              <Route path="/db/reconciliation" element={<Reconciliation />} />
              <Route path="/db/reconciliation/:storeId/:period" element={<ReconciliationDetail />} />
              <Route path="/db/voucher-review" element={<VoucherReview />} />
            </Routes>
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface-container border-t border-border z-40">
        <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
          {(Object.entries(moduleConfig) as [Module, typeof moduleConfig[Module]][]).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => navigate(cfg.path)}
              className={`flex flex-col items-center justify-center gap-0.5 w-full h-full transition-colors ${
                activeModule === key ? 'text-primary-500' : 'text-text-muted'
              }`}
            >
              {cfg.icon}
              <span className="text-eyebrow">{cfg.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter basename="/management">
      <AppLayout />
    </BrowserRouter>
  );
}
