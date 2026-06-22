// ============================================================================
// LafiaPay — Agent Layout
// Mobile-first wrapper for physical agents with bottom navigation
// ============================================================================

import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, PlusCircle, Clock, User } from 'lucide-react';

const NAV_ITEMS = [
  { path: '/agent', icon: Home, label: 'Accueil' },
  { path: '/agent/cashin', icon: PlusCircle, label: 'Nouveau Dépôt' },
  { path: '/agent/history', icon: Clock, label: 'Historique' },
  { path: '/agent/profile', icon: User, label: 'Profil' },
];

export default function AgentLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    if (path === '/agent') return location.pathname === '/agent';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="mobile-frame-wrapper">
      <div className="mobile-frame">
        {/* Page Content */}
        <div style={{ paddingBottom: '5rem', minHeight: '100%' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom Navigation */}
        <nav className="bottom-nav">
          {NAV_ITEMS.map(({ path, icon: Icon, label }) => (
            <button
              key={path}
              className={`bottom-nav-item ${isActive(path) ? 'active' : ''}`}
              onClick={() => navigate(path)}
              style={{
                // Let's customize the active color for Agent (Safran Gold / primary emerald)
                color: isActive(path) ? 'var(--color-primary-600)' : undefined,
              }}
            >
              <div className="nav-icon-bg" style={{
                color: isActive(path) ? 'var(--color-primary-600)' : undefined,
                background: isActive(path) ? 'rgba(15, 159, 133, 0.08)' : undefined,
              }}>
                <Icon size={22} />
              </div>
              <span style={{
                color: isActive(path) ? 'var(--color-primary-700)' : undefined,
              }}>{label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
