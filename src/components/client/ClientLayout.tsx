// ============================================================================
// LafiaPay — Client Layout
// Mobile-first wrapper with bottom navigation and phone frame on desktop
// ============================================================================

import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, QrCode, Clock, User, Send, Map } from 'lucide-react';

const NAV_ITEMS = [
  { path: '/client', icon: Home, label: 'Accueil' },
  { path: '/client/pay', icon: QrCode, label: 'Payer' },
  { path: '/client/transfer', icon: Send, label: 'Transfert' },
  { path: '/client/history', icon: Clock, label: 'Historique' },
  { path: '/client/profile', icon: User, label: 'Profil' },
];

export default function ClientLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    if (path === '/client') return location.pathname === '/client';
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
            >
              <div className="nav-icon-bg">
                <Icon size={22} />
              </div>
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
