// ============================================================================
// LafiaPay — Merchant Sales History
// ============================================================================

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Search, ArrowDownLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { mockStore } from '../../lib/mockData';
import { formatFCFA } from '../../types';

export default function SalesHistoryPage() {
  const { profile } = useAuth();
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('all');

  const allTxns = useMemo(() =>
    mockStore.getTransactionsForMerchant(profile?.id || '').filter(t => t.statut === 'reussie'),
    [profile?.id]
  );

  const filtered = useMemo(() => {
    const now = new Date();
    return allTxns.filter(t => {
      const d = new Date(t.created_at);
      if (period === 'today') {
        return d.toDateString() === now.toDateString();
      } else if (period === 'week') {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return d >= weekAgo;
      } else if (period === 'month') {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
      return true;
    }).filter(t => {
      if (!search) return true;
      return t.client_nom?.toLowerCase().includes(search.toLowerCase());
    });
  }, [allTxns, period, search]);

  const totalAmount = filtered.reduce((s, t) => s + t.montant, 0);

  const exportCSV = () => {
    const header = 'Date,Client,Montant,Référence\n';
    const rows = filtered.map(t =>
      `${new Date(t.created_at).toLocaleString('fr-FR')},${t.client_nom || 'N/A'},${t.montant},${t.reference}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ventes-lafiapay.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Historique des ventes</h1>
        <button className="btn btn-secondary btn-sm" onClick={exportCSV}>
          <Download size={16} /> CSV
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-surface-400)' }} />
        <input className="input-field" style={{ paddingLeft: '2.75rem', paddingTop: '0.875rem' }}
          placeholder="Rechercher un client..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Period filter */}
      <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '1rem', overflowX: 'auto' }}>
        {[
          { value: 'today', label: "Aujourd'hui" },
          { value: 'week', label: '7 jours' },
          { value: 'month', label: 'Ce mois' },
          { value: 'all', label: 'Tout' },
        ].map(({ value, label }) => (
          <button key={value}
            className={`btn btn-sm ${period === value ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setPeriod(value as typeof period)}>
            {label}
          </button>
        ))}
      </div>

      {/* Summary */}
      <div className="card gradient-primary" style={{ padding: '1rem', color: 'white', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Total ({filtered.length} ventes)</div>
          <div className="amount-display" style={{ fontSize: '1.5rem' }}>{formatFCFA(totalAmount)}</div>
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
          <p style={{ color: 'var(--color-surface-500)' }}>Aucune vente pour cette période</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {filtered.map((txn, i) => (
            <motion.div key={txn.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.3) }}
              className="card"
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem' }}>
              <div className="category-icon" style={{ background: 'var(--color-success-100)' }}>
                <ArrowDownLeft size={18} style={{ color: 'var(--color-success-600)' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{txn.client_nom || 'Client'}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-surface-500)' }}>
                  {new Date(txn.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <span className="tabular-nums" style={{ fontWeight: 700, color: 'var(--color-success-600)' }}>
                +{formatFCFA(txn.montant)}
              </span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
