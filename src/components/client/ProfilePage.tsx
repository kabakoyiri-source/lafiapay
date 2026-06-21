// ============================================================================
// LafiaPay — Client Profile Page
// Personal info, KYC, spending stats, settings
// ============================================================================

import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Shield, BarChart3, Moon, Sun, Globe, Lock, LogOut, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { mockStore } from '../../lib/mockData';
import { formatFCFA } from '../../types';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { profile, compte, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  // Calculate monthly spending
  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();
  const monthlyTxns = mockStore.getTransactionsForUser(profile?.id || '')
    .filter(t => {
      const d = new Date(t.created_at);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear && t.type === 'paiement';
    });
  const monthlySpending = monthlyTxns.reduce((sum, t) => sum + t.montant, 0);
  const monthlyDeposits = mockStore.getTransactionsForUser(profile?.id || '')
    .filter(t => {
      const d = new Date(t.created_at);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear && t.type === 'depot';
    })
    .reduce((sum, t) => sum + t.montant, 0);

  const kycLabels = ['', 'Basique', 'Standard', 'Premium'];

  const handleLogout = () => {
    signOut();
    navigate('/');
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h1 style={{ fontSize: '1.375rem', fontWeight: 800, marginBottom: '1.5rem' }}>Mon Profil</h1>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
        style={{ padding: '1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}
      >
        <div style={{
          width: 56, height: 56, borderRadius: 'var(--radius-xl)',
          background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-accent-500))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontSize: '1.25rem', fontWeight: 800,
        }}>
          {profile?.nom.split(' ').map(n => n[0]).join('').substring(0, 2)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '1.0625rem' }}>{profile?.nom}</div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--color-surface-500)' }}>{profile?.telephone}</div>
        </div>
        <span className="badge badge-info">
          <Shield size={12} /> {kycLabels[profile?.kyc_niveau ?? 1]}
        </span>
      </motion.div>

      {/* Monthly Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}
      >
        <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
          <BarChart3 size={20} style={{ color: 'var(--color-error-500)', margin: '0 auto 0.375rem' }} />
          <div className="amount-display" style={{ fontSize: '1.125rem', color: 'var(--color-error-600)' }}>
            {formatFCFA(monthlySpending)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-surface-500)', marginTop: '0.125rem' }}>Dépensé ce mois</div>
        </div>
        <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
          <BarChart3 size={20} style={{ color: 'var(--color-success-500)', margin: '0 auto 0.375rem' }} />
          <div className="amount-display" style={{ fontSize: '1.125rem', color: 'var(--color-success-600)' }}>
            {formatFCFA(monthlyDeposits)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-surface-500)', marginTop: '0.125rem' }}>Rechargé ce mois</div>
        </div>
      </motion.div>

      {/* Settings */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-surface-500)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Paramètres
        </h2>
        <div className="card" style={{ overflow: 'hidden' }}>
          {[
            { icon: isDark ? Sun : Moon, label: isDark ? 'Mode clair' : 'Mode sombre', action: toggleTheme, toggle: true },
            { icon: Lock, label: 'Changer le code PIN', action: () => {} },
            { icon: Globe, label: 'Langue · Français', action: () => {} },
          ].map(({ icon: Icon, label, action, toggle }, i) => (
            <button
              key={label}
              onClick={action}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.875rem',
                padding: '1rem 1.25rem', width: '100%', background: 'none', border: 'none',
                borderTop: i > 0 ? '1px solid var(--color-surface-100)' : 'none',
                cursor: 'pointer', fontSize: '0.9375rem', fontWeight: 500,
                color: 'inherit', textAlign: 'left',
              }}
            >
              <Icon size={20} style={{ color: 'var(--color-primary-500)' }} />
              <span style={{ flex: 1 }}>{label}</span>
              {toggle ? (
                <div style={{
                  width: 44, height: 24, borderRadius: 12,
                  background: isDark ? 'var(--color-primary-500)' : 'var(--color-surface-300)',
                  position: 'relative', transition: 'background 0.2s',
                }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', background: 'white',
                    position: 'absolute', top: 2,
                    left: isDark ? 22 : 2, transition: 'left 0.2s',
                    boxShadow: 'var(--shadow-sm)',
                  }} />
                </div>
              ) : (
                <ChevronRight size={18} style={{ color: 'var(--color-surface-400)' }} />
              )}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Logout */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="btn btn-danger"
        onClick={handleLogout}
        style={{ width: '100%', marginTop: '1.5rem' }}
      >
        <LogOut size={18} /> Déconnexion
      </motion.button>

      {/* Version */}
      <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--color-surface-400)', marginTop: '1rem' }}>
        LafiaPay v1.0.0 · Mode démo
      </p>
    </div>
  );
}
