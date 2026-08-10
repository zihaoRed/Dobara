import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { RoleProvider } from './context/RoleContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useRoleStore } from './store/roleStore';
import { clearSession, getSession, type OpsSession } from './lib/opsAuth';

import Login from './pages/auth/Login';
import Dashboard from './pages/Dashboard';
import ReviewList from './pages/ReviewList';
import ReviewDetail from './pages/ReviewDetail';
import ReviewHistory from './pages/ReviewHistory';
import ConfigCenter from './pages/ConfigCenter';
import CategoryMgmt from './pages/CategoryMgmt';
import SpecEdit from './pages/SpecEdit';
import OrgMgmt from './pages/OrgMgmt';
import RoleMgmt from './pages/RoleMgmt';
import AccountMgmt from './pages/AccountMgmt';
import I18nMgmt from './pages/I18nMgmt';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import RecycleOrderList from './pages/orders/RecycleOrderList';
import RecycleOrderDetail from './pages/orders/RecycleOrderDetail';
import MallOrderList from './pages/orders/MallOrderList';
import MallOrderDetail from './pages/orders/MallOrderDetail';

const App: React.FC = () => {
  const setRole = useRoleStore((s) => s.setRole);
  const [session, setSession] = useState<OpsSession | null>(() => getSession());

  useEffect(() => {
    if (session) setRole(session.role);
  }, [session, setRole]);

  const handleLogin = (s: OpsSession) => {
    setRole(s.role);
    setSession(s);
  };

  const handleLogout = () => {
    clearSession();
    setSession(null);
  };

  return (
    <BrowserRouter basename="/ops">
      {!session ? (
        <Login onSuccess={handleLogin} />
      ) : (
        <RoleProvider>
          <div className="min-h-screen bg-surface-low">
            <Sidebar />
            <div className="ml-[240px] flex flex-col min-h-screen">
              <Header session={session} onLogout={handleLogout} />
              <main className="flex-1 p-6">
                <Routes>
                  <Route path="/" element={<ProtectedRoute allowedRoles={['ops', 'admin']}><Dashboard /></ProtectedRoute>} />
                  <Route path="/review" element={<ProtectedRoute allowedRoles={['ops', 'admin']}><ReviewList /></ProtectedRoute>} />
                  {/* /review/history MUST be before /review/:imei */}
                  <Route path="/review/history" element={<ProtectedRoute allowedRoles={['ops', 'admin']}><ReviewHistory /></ProtectedRoute>} />
                  <Route path="/review/:imei" element={<ProtectedRoute allowedRoles={['ops', 'admin']}><ReviewDetail /></ProtectedRoute>} />
                  <Route path="/orders/recycle" element={<ProtectedRoute allowedRoles={['ops', 'admin']}><RecycleOrderList /></ProtectedRoute>} />
                  <Route path="/orders/recycle/:id" element={<ProtectedRoute allowedRoles={['ops', 'admin']}><RecycleOrderDetail /></ProtectedRoute>} />
                  <Route path="/orders/mall" element={<ProtectedRoute allowedRoles={['ops', 'admin']}><MallOrderList /></ProtectedRoute>} />
                  <Route path="/orders/mall/:id" element={<ProtectedRoute allowedRoles={['ops', 'admin']}><MallOrderDetail /></ProtectedRoute>} />
                  <Route path="/config" element={<ProtectedRoute allowedRoles={['ops', 'admin']}><ConfigCenter /></ProtectedRoute>} />
                  <Route path="/pricing/config" element={<Navigate to="/config" replace />} />
                  <Route path="/pricing/base-price" element={<Navigate to="/config" replace />} />
                  <Route path="/category" element={<ProtectedRoute allowedRoles={['ops', 'admin']}><CategoryMgmt /></ProtectedRoute>} />
                  <Route path="/category/:modelId" element={<ProtectedRoute allowedRoles={['ops', 'admin']}><SpecEdit /></ProtectedRoute>} />
                  <Route path="/users/orgs" element={<ProtectedRoute allowedRoles={['admin']}><OrgMgmt /></ProtectedRoute>} />
                  <Route path="/users/roles" element={<ProtectedRoute allowedRoles={['admin']}><RoleMgmt /></ProtectedRoute>} />
                  <Route path="/users/accounts" element={<ProtectedRoute allowedRoles={['admin']}><AccountMgmt /></ProtectedRoute>} />
                  <Route path="/i18n/manage" element={<ProtectedRoute allowedRoles={['admin']}><I18nMgmt /></ProtectedRoute>} />
                  <Route path="/data/reports" element={<ProtectedRoute allowedRoles={['ops', 'admin']}><Reports /></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute allowedRoles={['ops', 'admin']}><Settings /></ProtectedRoute>} />
                </Routes>
              </main>
            </div>
          </div>
        </RoleProvider>
      )}
    </BrowserRouter>
  );
};

export default App;
