// ============================================================================
// LafiaPay — Agent Dashboard Page
// Float balance, today's deposit statistics, quick cash-in launcher
// ============================================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PlusCircle, Clock, UserCheck, ArrowUpRight, ChevronRight, TrendingUp, DollarSign } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { mockStore } from '../../lib/mockData';
import { formatFCFA } from '../../types';
import type { Transaction } from '../../types';

/** Animated counter hook for float balance */
function useCountUp(target: number, duration = 1200) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const startTime = Date.now();
    const step = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);

  return count;
}

export default function AgentDashboard() {
  const navigate = useNavigate();
  const { profile, compte } = useAuth();
  const balance = compte?.solde ?? 0;
  const animatedBalance = useCountUp(balance);

  // Get agent transactions
  const agentTxns = mockStore.getTransactionsForUser(profile?.id || '')
    .filter(t => t.type === 'depot' && t.agent_id === profile?.id);

  // Statistics for today
  const today = new Date().toDateString();
  const todayTxns = agentTxns.filter(t => new Date(t.created_at).toDateString() === today && t.statut === 'reussie');
  
  const todayVolume = todayTxns.reduce((sum, t) => sum + t.montant, 0);
  const todayCount = todayTxns.length;

  const recentTxns = agentTxns.slice(0, 5);

  return (
    <div style={{ padding: '1.5rem 1rem' }}>
      {/* Greeting Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <div>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-surface-500)' }}>Espace Agent Agréé 🏪</p>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 800 }}>{profile?.nom || 'Agent LafiaPay'}</h1>
        </div>
        <div style={{
          background: 'rgba(245, 158, 11, 0.1)',
          color: '#F59E0B',
          borderRadius: 'var(--radius-full)',
          padding: '0.375rem 0.75rem',
          fontSize: '0.75rem',
          fontWeight: 700,
          border: '1px solid rgba(245, 158, 11, 0.2)'
        }}>
          Licence active
        </div>
      </motion.div>

      {/* Float Balance Card */}
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
          background: 'linear-gradient(135deg, var(--color-primary-700), var(--color-primary-900))', // Deep emerald style
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

        <p style={{ fontSize: '0.875rem', opacity: 0.8, marginBottom: '0.25rem' }}>Solde Float Disponible</p>
        <div className="amount-display" style={{ fontSize: '2.25rem', lineHeight: 1.1, fontWeight: 800 }}>
          {animatedBalance.toLocaleString('fr-FR')}
          <span style={{ fontSize: '1rem', fontWeight: 600, marginLeft: '0.375rem', opacity: 0.8 }}>FCFA</span>
        </div>

        <p style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          Ce solde sert à approvisionner les portefeuilles clients.
        </p>
      </motion.div>

      {/* Today's Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.75rem',
          marginBottom: '1.5rem',
        }}
      >
        <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-surface-500)', fontWeight: 600 }}>Dépôts du Jour</span>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary-700)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <TrendingUp size={18} /> {formatFCFA(todayVolume)}
          </div>
        </div>
        <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-surface-500)', fontWeight: 600 }}>Total Opérations</span>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-surface-900)' }}>
            {todayCount} {todayCount > 1 ? 'dépôts' : 'dépôt'}
          </div>
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{ marginBottom: '1.75rem' }}
      >
        <button
          className="btn btn-primary btn-lg"
          onClick={() => navigate('/agent/cashin')}
          style={{ width: '100%', gap: '0.5rem', padding: '1.25rem', borderRadius: 'var(--radius-xl)' }}
        >
          <PlusCircle size={22} />
          <span>Faire un dépôt client (Cash-In)</span>
        </button>
      </motion.div>

      {/* Recent Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.75rem',
        }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Dépôts récents</h2>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => navigate('/agent/history')}
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
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🏪</div>
            <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Aucun dépôt effectué</p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-surface-500)' }}>
              Les opérations de dépôt créditées aux clients s'afficheront ici.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {recentTxns.map((txn, i) => (
              <AgentTransactionItem key={txn.id} transaction={txn} index={i} />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

function AgentTransactionItem({ transaction: txn, index }: { transaction: Transaction; index: number }) {
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
        background: txn.statut === 'reussie' ? 'var(--color-success-100)' : 'var(--color-error-100)',
        width: 40, height: 40, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <ArrowUpRight size={20} style={{ color: txn.statut === 'reussie' ? 'var(--color-success-600)' : 'var(--color-error-600)' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          Dépôt à {txn.client_nom || 'Client LafiaPay'}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-surface-500)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {new Date(txn.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
          {` · Réf: ${txn.reference}`}
        </div>
      </div>
      <div style={{
        fontWeight: 700,
        fontSize: '0.9375rem',
        color: txn.statut === 'reussie' ? 'var(--color-success-600)' : 'var(--color-error-600)',
      }}
        className="tabular-nums"
      >
        {formatFCFA(txn.montant)}
      </div>
    </motion.div>
  );
}
