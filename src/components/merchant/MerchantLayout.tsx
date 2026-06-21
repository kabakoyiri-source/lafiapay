// ============================================================================
// LafiaPay — Merchant Layout
// Mobile-first wrapper with bottom navigation
// ============================================================================

import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Clock, Truck, LifeBuoy } from 'lucide-react';

const NAV_ITEMS = [
  { path: '/merchant', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/merchant/history', icon: Clock, label: 'Ventes' },
  { path: '/merchant/suppliers', icon: Truck, label: 'Fournisseurs' },
  { path: '/merchant/support', icon: LifeBuoy, label: 'Support' },
];

export default function MerchantLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    if (path === '/merchant') return location.pathname === '/merchant';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="mobile-frame-wrapper">
      <div className="mobile-frame">
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
