// ============================================================================
// LafiaPay — Agent Transaction History Page
// View and search through cash deposits performed, with CSV export
// ============================================================================

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Calendar, ArrowUpRight, X, Download, FileText, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { mockStore } from '../../lib/mockData';
import { formatFCFA, formatDate } from '../../types';
import type { Transaction } from '../../types';

export default function AgentHistory() {
  const { profile } = useAuth();
  const { showToast } = useToast();
  
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);

  // Fetch only depot transactions where this agent is the agent_id
  const agentTransactions = useMemo(() => {
    return mockStore.getTransactionsForUser(profile?.id || '')
      .filter(t => t.type === 'depot' && t.agent_id === profile?.id);
  }, [profile?.id]);

  // Apply filters
  const filteredTxns = useMemo(() => {
    return agentTransactions.filter(txn => {
      // Date filter
      const txnDate = new Date(txn.created_at);
      const now = new Date();
      if (dateFilter === 'today') {
        if (txnDate.toDateString() !== now.toDateString()) return false;
      } else if (dateFilter === 'week') {
        const oneWeekAgo = new Date(now.getTime() - 7 * 86400000);
        if (txnDate < oneWeekAgo) return false;
      } else if (dateFilter === 'month') {
        const oneMonthAgo = new Date(now.getTime() - 30 * 86400000);
        if (txnDate < oneMonthAgo) return false;
      }

      // Search query (reference, client name)
      if (search) {
        const s = search.toLowerCase();
        return (
          txn.reference.toLowerCase().includes(s) ||
          (txn.client_nom && txn.client_nom.toLowerCase().includes(s)) ||
          txn.client_id.toLowerCase().includes(s)
        );
      }

      return true;
    });
  }, [agentTransactions, dateFilter, search]);

  // CSV Exporter
  const handleExportCSV = () => {
    if (filteredTxns.length === 0) {
      showToast({ type: 'error', title: 'Export impossible', message: 'Aucun enregistrement à exporter.' });
      return;
    }

    const headers = 'ID Transaction,Référence,Client,Date,Montant (FCFA),Statut\n';
    const rows = filteredTxns.map(t => 
      `"${t.id}","${t.reference}","${t.client_nom || 'Client'}","${t.created_at}",${t.montant},"${t.statut}"`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `depots_agent_${profile?.nom.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast({ type: 'success', title: 'Export CSV réussi', message: 'Relevé de dépôts téléchargé' });
  };

  return (
    <div style={{ padding: '1rem' }}>
      {/* Header with Export */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.375rem', fontWeight: 800 }}>Historique des Dépôts</h1>
        <button
          className="btn btn-secondary btn-sm"
          onClick={handleExportCSV}
          style={{ gap: '0.375rem', padding: '0.5rem 0.75rem' }}
          title="Exporter au format CSV"
        >
          <Download size={16} />
          <span>Exporter</span>
        </button>
      </div>

      {/* Search Input */}
      <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-surface-400)' }} />
        <input
          className="input-field"
          style={{ paddingLeft: '2.75rem', paddingTop: '0.875rem' }}
          placeholder="Rechercher par client ou référence..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
        {[
          { value: 'all', label: 'Tout' },
          { value: 'today', label: 'Aujourd\'hui' },
          { value: 'week', label: '7 derniers jours' },
          { value: 'month', label: '30 derniers jours' },
        ].map(({ value, label }) => (
          <button
            key={value}
            className={`btn btn-sm ${dateFilter === value ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setDateFilter(value as any)}
            style={{ flexShrink: 0 }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Operations count */}
      <p style={{ fontSize: '0.8125rem', color: 'var(--color-surface-500)', marginBottom: '0.75rem' }}>
        {filteredTxns.length} opération{filteredTxns.length !== 1 ? 's' : ''} trouvée{filteredTxns.length !== 1 ? 's' : ''}
      </p>

      {/* List */}
      {filteredTxns.length === 0 ? (
        <div className="card" style={{ padding: '2.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔍</div>
          <p style={{ fontWeight: 600 }}>Aucune opération trouvée</p>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-surface-500)' }}>
            Aucun dépôt ne correspond à vos critères de recherche.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {filteredTxns.map((txn, i) => (
            <motion.div
              key={txn.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.3) }}
              className="card card-interactive"
              onClick={() => setSelectedTxn(txn)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1rem', cursor: 'pointer' }}
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
                  Dépôt à {txn.client_nom || 'Client'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-surface-500)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {new Date(txn.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  {` · Réf: ${txn.reference}`}
                </div>
              </div>
              <div>
                <div className="tabular-nums" style={{ fontWeight: 700, fontSize: '0.875rem', textAlign: 'right', color: 'var(--color-success-600)' }}>
                  +{formatFCFA(txn.montant)}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`badge badge-${txn.statut === 'reussie' ? 'success' : 'error'}`} style={{ fontSize: '0.625rem', padding: '0.125rem 0.5rem' }}>
                    {txn.statut === 'reussie' ? 'Réussi' : 'Échoué'}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Transaction Detail Modal */}
      <AnimatePresence>
        {selectedTxn && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => setSelectedTxn(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              className="modal-content"
              onClick={e => e.stopPropagation()}
              style={{ padding: '1.5rem' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 800 }}>Reçu de Dépôt Physique</h2>
                <button className="btn btn-icon btn-secondary btn-sm" onClick={() => setSelectedTxn(null)}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div className="amount-display" style={{ fontSize: '2rem', color: 'var(--color-success-600)' }}>
                  +{formatFCFA(selectedTxn.montant)}
                </div>
                <span className={`badge badge-${selectedTxn.statut === 'reussie' ? 'success' : 'error'}`}>
                  {selectedTxn.statut === 'reussie' ? '✓ Dépôt Réussi' : '✗ Échoué'}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
                {[
                  ['Référence', selectedTxn.reference],
                  ['Date', formatDate(selectedTxn.created_at)],
                  ['Bénéficiaire Client', selectedTxn.client_nom || 'Client LafiaPay'],
                  ['ID Client', selectedTxn.client_id],
                  ['Type d\'opération', 'Dépôt physique (Cash-In)'],
                  ['Agent Mandataire', profile?.nom || 'Modibo Keïta'],
                  ['Frais de service', '0 FCFA (Gratuit)'],
                ].map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--color-surface-100)' }}>
                    <span style={{ color: 'var(--color-surface-500)' }}>{label}</span>
                    <span style={{ fontWeight: 600, wordBreak: label.includes('ID') ? 'break-all' : undefined, textAlign: 'right', maxWidth: '60%' }}>{value}</span>
                  </div>
                ))}
              </div>

              <button
                className="btn btn-secondary"
                style={{ width: '100%', marginTop: '1.5rem', gap: '0.5rem' }}
                onClick={() => {
                  setSelectedTxn(null);
                  showToast({ type: 'success', title: 'Reçu réimprimé', message: 'Le reçu a été envoyé à l\'imprimante de démonstration.' });
                }}
              >
                <FileText size={16} />
                <span>Imprimer le reçu</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
