import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { RoleProvider } from './context/RoleContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ProtectedRoute } from './components/ProtectedRoute';

// Ops Core Pages
import Dashboard from './pages/Dashboard';
import ReviewList from './pages/ReviewList';
import ReviewDetail from './pages/ReviewDetail';
import PricingConfig from './pages/PricingConfig';
import BasePriceMgmt from './pages/BasePriceMgmt';
import CategoryMgmt from './pages/CategoryMgmt';
import SpecEdit from './pages/SpecEdit';

// Admin Pages
import RoleMgmt from './pages/RoleMgmt';
import AccountMgmt from './pages/AccountMgmt';
import I18nMgmt from './pages/I18nMgmt';

// Shared Pages
import Reports from './pages/Reports';
import OwnerRevenue from './pages/OwnerRevenue';
import OwnerClerks from './pages/OwnerClerks';
import Notifications from './pages/Notifications';
import WhInbound from './pages/WhInbound';
import WhRefurbish from './pages/WhRefurbish';
import WhOutbound from './pages/WhOutbound';
import DbSettlement from './pages/DbSettlement';
import DbReconciliation from './pages/DbReconciliation';
import DbVoucherReview from './pages/DbVoucherReview';
import Settings from './pages/Settings';

const App: React.FC = () => {
  return (
    <BrowserRouter basename="/ops">
      <RoleProvider>
        <div className="min-h-screen bg-surface-low">
          <Sidebar />
          <div className="ml-[240px] flex flex-col min-h-screen">
            <Header />
            <main className="flex-1 p-6">
              <Routes>
                {/* Ops Core */}
                <Route path="/" element={<ProtectedRoute allowedRoles={['ops', 'admin']}><Dashboard /></ProtectedRoute>} />
                <Route path="/review" element={<ProtectedRoute allowedRoles={['ops', 'admin']}><ReviewList /></ProtectedRoute>} />
                <Route path="/review/:imei" element={<ProtectedRoute allowedRoles={['ops', 'admin']}><ReviewDetail /></ProtectedRoute>} />
                <Route path="/pricing/config" element={<ProtectedRoute allowedRoles={['ops', 'admin']}><PricingConfig /></ProtectedRoute>} />
                <Route path="/pricing/base-price" element={<ProtectedRoute allowedRoles={['ops', 'admin']}><BasePriceMgmt /></ProtectedRoute>} />
                <Route path="/category" element={<ProtectedRoute allowedRoles={['ops', 'admin']}><CategoryMgmt /></ProtectedRoute>} />
                <Route path="/category/:modelId" element={<ProtectedRoute allowedRoles={['ops', 'admin']}><SpecEdit /></ProtectedRoute>} />

                {/* Admin Only */}
                <Route path="/users/roles" element={<ProtectedRoute allowedRoles={['admin']}><RoleMgmt /></ProtectedRoute>} />
                <Route path="/users/accounts" element={<ProtectedRoute allowedRoles={['admin']}><AccountMgmt /></ProtectedRoute>} />
                <Route path="/i18n/manage" element={<ProtectedRoute allowedRoles={['admin']}><I18nMgmt /></ProtectedRoute>} />

                {/* Shared */}
                <Route path="/data/reports" element={<ProtectedRoute allowedRoles={['ops', 'admin']}><Reports /></ProtectedRoute>} />
                <Route path="/owner/revenue" element={<ProtectedRoute allowedRoles={['store_owner', 'admin']}><OwnerRevenue /></ProtectedRoute>} />
                <Route path="/owner/clerks" element={<ProtectedRoute allowedRoles={['store_owner', 'admin']}><OwnerClerks /></ProtectedRoute>} />
                <Route path="/owner/notifications" element={<ProtectedRoute allowedRoles={['ops', 'store_owner', 'admin']}><Notifications /></ProtectedRoute>} />
                <Route path="/wh/inbound" element={<ProtectedRoute allowedRoles={['wh_manager', 'admin']}><WhInbound /></ProtectedRoute>} />
                <Route path="/wh/refurbish" element={<ProtectedRoute allowedRoles={['wh_manager', 'admin']}><WhRefurbish /></ProtectedRoute>} />
                <Route path="/wh/outbound" element={<ProtectedRoute allowedRoles={['wh_manager', 'admin']}><WhOutbound /></ProtectedRoute>} />
                <Route path="/db/settlement" element={<ProtectedRoute allowedRoles={['finance', 'admin']}><DbSettlement /></ProtectedRoute>} />
                <Route path="/db/reconciliation" element={<ProtectedRoute allowedRoles={['finance', 'admin']}><DbReconciliation /></ProtectedRoute>} />
                <Route path="/db/voucher-review" element={<ProtectedRoute allowedRoles={['finance', 'admin']}><DbVoucherReview /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute allowedRoles={['ops', 'admin', 'store_owner', 'wh_manager', 'finance']}><Settings /></ProtectedRoute>} />
              </Routes>
            </main>
          </div>
        </div>
      </RoleProvider>
    </BrowserRouter>
  );
};

export default App;
