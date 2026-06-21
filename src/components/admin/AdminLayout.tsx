// ============================================================================
// LafiaPay — Admin Space Layout
// Desktop-first layout with collapsible sidebar and theme/auth integrations
// ============================================================================

import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Store,
  Receipt,
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
  FileText,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

const NAV_ITEMS = [
  { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/admin/users', icon: Users, label: 'Clients' },
  { path: '/admin/merchants', icon: Store, label: 'Commerçants' },
  { path: '/admin/transactions', icon: Receipt, label: 'Transactions' },
  { path: '/admin/reconciliation', icon: RefreshCw, label: 'Réconciliation' },
  { path: '/admin/disputes', icon: AlertTriangle, label: 'Litiges' },
  { path: '/admin/compliance', icon: ShieldCheck, label: 'Conformité' },
  { path: '/admin/audit', icon: FileText, label: 'Audit Logs' },
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  const getPageTitle = () => {
    const item = NAV_ITEMS.find(i => isActive(i.path));
    return item ? item.label : 'Administration';
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(4px)',
            zIndex: 35,
          }}
          className="lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem' }}>🛡️</span>
            <span style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.025em', background: 'linear-gradient(to right, var(--color-accent-400), #ffffff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              LafiaPay Admin
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
            className="lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav style={{ flex: 1, padding: '1rem 0', overflowY: 'auto' }}>
          {NAV_ITEMS.map(({ path, icon: Icon, label }) => (
            <button
              key={path}
              onClick={() => {
                navigate(path);
                setSidebarOpen(false);
              }}
              className={`admin-sidebar-link ${isActive(path) ? 'active' : ''}`}
              style={{ width: 'calc(100% - 1.5rem)', textAlign: 'left', background: 'none', border: 'none' }}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--color-primary-800)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
              A
            </div>
            <div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{profile?.nom || 'Administrateur'}</div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Admin principal</div>
            </div>
          </div>
          <button
            onClick={signOut}
            className="admin-sidebar-link"
            style={{ width: '100%', margin: 0, padding: '0.5rem 0.75rem', background: 'none', border: 'none', color: '#f87171' }}
          >
            <LogOut size={16} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Header */}
        <header
          style={{
            position: 'sticky',
            top: 0,
            background: 'var(--color-surface-50)',
            borderBottom: '1px solid var(--color-surface-200)',
            height: '70px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 2rem',
            zIndex: 30,
            transition: 'background-color var(--transition-normal), border-color var(--transition-normal)',
          }}
          className="dark:bg-dark-surface dark:border-dark-border"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => setSidebarOpen(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
              className="lg:hidden btn btn-icon btn-secondary btn-sm"
            >
              <Menu size={20} />
            </button>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{getPageTitle()}</h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="btn btn-icon btn-secondary btn-sm"
              style={{ borderRadius: '50%' }}
              title="Changer de thème"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>Prototype</span>
              <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>Mock Mode</span>
            </div>
          </div>
        </header>

        {/* View Content */}
        <main className="admin-content" style={{ flex: 1 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              style={{ height: '100%' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
