// ============================================================================
// LafiaPay — Main Application Router
// Single SPA with role-based routing to 3 spaces
// ============================================================================

import { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';

// Client Space
import ClientLayout from './components/client/ClientLayout';
import ClientHome from './components/client/HomePage';
import ClientRecharge from './components/client/RechargePage';
import ClientPayment from './components/client/PaymentPage';
import ClientTransfer from './components/client/TransferPage';
import ClientHistory from './components/client/HistoryPage';
import ClientProfile from './components/client/ProfilePage';

// Merchant Space
import MerchantLayout from './components/merchant/MerchantLayout';
import MerchantDashboard from './components/merchant/DashboardPage';
import MerchantHistory from './components/merchant/SalesHistoryPage';
import MerchantSuppliers from './components/merchant/SuppliersPage';
import MerchantSupport from './components/merchant/SupportPage';

// Admin Space
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './components/admin/DashboardPage';
import AdminUsers from './components/admin/UsersPage';
import AdminMerchants from './components/admin/MerchantsPage';
import AdminTransactions from './components/admin/TransactionsPage';
import AdminReconciliation from './components/admin/ReconciliationPage';
import AdminDisputes from './components/admin/DisputesPage';
import AdminCompliance from './components/admin/CompliancePage';
import AdminAuditLog from './components/admin/AuditLogPage';

// Agent Space
import AgentLayout from './components/agent/AgentLayout';
import AgentDashboard from './components/agent/DashboardPage';
import AgentCashIn from './components/agent/CashInPage';
import AgentHistory from './components/agent/HistoryPage';
import AgentProfile from './components/agent/ProfilePage';

export default function App() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  // Auto-redirect after login based on role
  useEffect(() => {
    if (!loading && user && profile) {
      const currentPath = window.location.pathname;
      if (currentPath === '/' || currentPath === '/register') {
        const routes: Record<string, string> = {
          client: '/client',
          commercant: '/merchant',
          admin: '/admin',
          agent: '/agent',
        };
        navigate(routes[profile.role] || '/client', { replace: true });
      }
    }
  }, [user, profile, loading, navigate]);

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={
        user && profile ? (
          <Navigate to={profile.role === 'admin' ? '/admin' : profile.role === 'commercant' ? '/merchant' : profile.role === 'agent' ? '/agent' : '/client'} replace />
        ) : (
          <LoginPage />
        )
      } />

      {/* Registration */}
      <Route path="/register" element={<RegisterPage />} />

      {/* Client Space */}
      <Route path="/client" element={
        <ProtectedRoute requiredRole="client">
          <ClientLayout />
        </ProtectedRoute>
      }>
        <Route index element={<ClientHome />} />
        <Route path="recharge" element={<ClientRecharge />} />
        <Route path="pay" element={<ClientPayment />} />
        <Route path="transfer" element={<ClientTransfer />} />
        <Route path="history" element={<ClientHistory />} />
        <Route path="profile" element={<ClientProfile />} />
      </Route>

      {/* Merchant Space */}
      <Route path="/merchant" element={
        <ProtectedRoute requiredRole="commercant">
          <MerchantLayout />
        </ProtectedRoute>
      }>
        <Route index element={<MerchantDashboard />} />
        <Route path="history" element={<MerchantHistory />} />
        <Route path="suppliers" element={<MerchantSuppliers />} />
        <Route path="support" element={<MerchantSupport />} />
      </Route>

      {/* Admin Space */}
      <Route path="/admin" element={
        <ProtectedRoute requiredRole="admin">
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="merchants" element={<AdminMerchants />} />
        <Route path="transactions" element={<AdminTransactions />} />
        <Route path="reconciliation" element={<AdminReconciliation />} />
        <Route path="disputes" element={<AdminDisputes />} />
        <Route path="compliance" element={<AdminCompliance />} />
        <Route path="audit" element={<AdminAuditLog />} />
      </Route>

      {/* Agent Space */}
      <Route path="/agent" element={
        <ProtectedRoute requiredRole="agent">
          <AgentLayout />
        </ProtectedRoute>
      }>
        <Route index element={<AgentDashboard />} />
        <Route path="cashin" element={<AgentCashIn />} />
        <Route path="history" element={<AgentHistory />} />
        <Route path="profile" element={<AgentProfile />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
