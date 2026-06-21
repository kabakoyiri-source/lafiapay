// ============================================================================
// LafiaPay — Client Home Page
// Balance display, action buttons, recent transactions, KYC badge
// ============================================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { QrCode, Plus, ArrowUpRight, ArrowDownLeft, ChevronRight, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { mockStore } from '../../lib/mockData';
import { formatFCFA, CATEGORY_INFO } from '../../types';
import type { Transaction } from '../../types';

/** Animated counter hook for balance display */
function useCountUp(target: number, duration = 1200) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const startTime = Date.now();
    const step = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);

  return count;
}

export default function ClientHome() {
  const navigate = useNavigate();
  const { profile, compte } = useAuth();
  const balance = compte?.solde ?? 0;
  const animatedBalance = useCountUp(balance);

  // Get last 5 transactions for this user
  const recentTxns = mockStore.getTransactionsForUser(profile?.id || '')
    .slice(0, 5);

  const kycLevel = profile?.kyc_niveau ?? 1;
  const kycLabels = ['', 'Basique', 'Standard', 'Premium'];
  const kycProgress = (kycLevel / 3) * 100;

  return (
    <div style={{ padding: '1.5rem 1rem' }}>
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: '1.25rem' }}
      >
        <p style={{ fontSize: '0.875rem', color: 'var(--color-surface-500)' }}>Bonjour 👋</p>
        <h1 style={{ fontSize: '1.375rem', fontWeight: 800 }}>{profile?.nom || 'Client'}</h1>
      </motion.div>

      {/* Balance Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="gradient-hero"
        style={{
          borderRadius: 'var(--radius-3xl)',
          padding: '1.75rem 1.5rem',
          color: 'white',
          marginBottom: '1.5rem',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative circles */}
        <div style={{
          position: 'absolute', top: -30, right: -30,
          width: 120, height: 120, borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)',
        }} />
        <div style={{
          position: 'absolute', bottom: -20, left: -20,
          width: 80, height: 80, borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)',
        }} />

        <p style={{ fontSize: '0.875rem', opacity: 0.8, marginBottom: '0.25rem' }}>Solde disponible</p>
        <div className="amount-display" style={{ fontSize: '2.25rem', lineHeight: 1.1 }}>
          {animatedBalance.toLocaleString('fr-FR')}
          <span style={{ fontSize: '1rem', fontWeight: 600, marginLeft: '0.375rem', opacity: 0.8 }}>FCFA</span>
        </div>

        {/* KYC Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginTop: '1rem',
          background: 'rgba(255,255,255,0.12)',
          borderRadius: 'var(--radius-full)',
          padding: '0.375rem 0.75rem',
          width: 'fit-content',
        }}>
          <Shield size={14} />
          <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>
            KYC {kycLabels[kycLevel]}
          </span>
          <div style={{
            width: 60, height: 4, borderRadius: 2,
            background: 'rgba(255,255,255,0.2)',
            overflow: 'hidden',
          }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${kycProgress}%` }}
              transition={{ delay: 0.8, duration: 0.6 }}
              style={{
                height: '100%',
                background: 'var(--color-accent-400)',
                borderRadius: 2,
              }}
            />
          </div>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.75rem',
          marginBottom: '1.75rem',
        }}
      >
        <button
          className="btn btn-primary btn-lg"
          onClick={() => navigate('/client/pay')}
          style={{ flexDirection: 'column', gap: '0.375rem', padding: '1.25rem' }}
        >
          <QrCode size={28} />
          <span>Payer</span>
        </button>
        <button
          className="btn btn-accent btn-lg"
          onClick={() => navigate('/client/recharge')}
          style={{ flexDirection: 'column', gap: '0.375rem', padding: '1.25rem' }}
        >
          <Plus size={28} />
          <span>Recharger</span>
        </button>
      </motion.div>

      {/* Recent Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.75rem',
        }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Dernières transactions</h2>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => navigate('/client/history')}
            style={{ gap: '0.25rem', fontSize: '0.8125rem' }}
          >
            Voir tout <ChevronRight size={16} />
          </button>
        </div>

        {recentTxns.length === 0 ? (
          <div className="card" style={{
            padding: '2rem',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>💳</div>
            <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Aucune transaction</p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-surface-500)' }}>
              Commencez par recharger votre compte
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {recentTxns.map((txn, i) => (
              <TransactionItem key={txn.id} transaction={txn} index={i} />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

function TransactionItem({ transaction: txn, index }: { transaction: Transaction; index: number }) {
  const isDeposit = txn.type === 'depot';
  const category = txn.commercant_categorie || 'autre';
  const catInfo = CATEGORY_INFO[category];

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="card"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.875rem 1rem',
      }}
    >
      <div className="category-icon" style={{
        background: isDeposit ? 'var(--color-success-100)' : `${catInfo.color}15`,
      }}>
        {isDeposit ? (
          <ArrowDownLeft size={20} style={{ color: 'var(--color-success-600)' }} />
        ) : (
          <span>{catInfo.emoji}</span>
        )}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
          {isDeposit ? 'Dépôt' : txn.commercant_boutique || 'Paiement'}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-surface-500)' }}>
          {new Date(txn.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
        </div>
      </div>
      <div style={{
        fontWeight: 700,
        fontSize: '0.9375rem',
        color: isDeposit ? 'var(--color-success-600)' : 'var(--color-surface-900)',
      }}
        className="tabular-nums"
      >
        {isDeposit ? '+' : '-'}{formatFCFA(txn.montant)}
      </div>
    </motion.div>
  );
}
