// ============================================================================
// LafiaPay — Client Transaction History
// Filterable list with search and transaction details
// ============================================================================

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, ArrowDownLeft, ArrowUpRight, X, AlertTriangle } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { mockStore } from '../../lib/mockData';
import { formatFCFA, formatDate, CATEGORY_INFO } from '../../types';
import type { Transaction, TransactionType } from '../../types';

export default function HistoryPage() {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'all'>('all');
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);

  const allTransactions = useMemo(() =>
    mockStore.getTransactionsForUser(profile?.id || ''),
    [profile?.id]
  );

  const filtered = useMemo(() => {
    return allTransactions.filter(txn => {
      if (typeFilter !== 'all' && txn.type !== typeFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        return (txn.commercant_boutique?.toLowerCase().includes(s) ||
          txn.reference.toLowerCase().includes(s) ||
          txn.commercant_nom?.toLowerCase().includes(s) ||
          txn.destinataire_nom?.toLowerCase().includes(s) ||
          txn.client_nom?.toLowerCase().includes(s));
      }
      return true;
    });
  }, [allTransactions, typeFilter, search]);

  return (
    <div style={{ padding: '1rem' }}>
      <h1 style={{ fontSize: '1.375rem', fontWeight: 800, marginBottom: '1rem' }}>Historique</h1>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
        <Search size={18} style={{
          position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)',
          color: 'var(--color-surface-400)',
        }} />
        <input
          className="input-field"
          style={{ paddingLeft: '2.75rem', paddingTop: '0.875rem' }}
          placeholder="Rechercher un commerçant..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
        {[
          { value: 'all', label: 'Tout' },
          { value: 'depot', label: 'Dépôts' },
          { value: 'paiement', label: 'Paiements' },
          { value: 'transfert', label: 'Transferts' },
        ].map(({ value, label }) => (
          <button
            key={value}
            className={`btn btn-sm ${typeFilter === value ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTypeFilter(value as TransactionType | 'all')}
            style={{ flexShrink: 0 }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Transaction Count */}
      <p style={{ fontSize: '0.8125rem', color: 'var(--color-surface-500)', marginBottom: '0.75rem' }}>
        {filtered.length} transaction{filtered.length !== 1 ? 's' : ''}
      </p>

      {/* Transaction List */}
      {filtered.length === 0 ? (
        <div className="card" style={{ padding: '2.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔍</div>
          <p style={{ fontWeight: 600 }}>Aucun résultat</p>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-surface-500)' }}>
            Essayez un autre filtre ou terme de recherche
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {filtered.map((txn, i) => {
            const isDeposit = txn.type === 'depot';
            const isTransfer = txn.type === 'transfert';
            const isReceiver = isTransfer && txn.destinataire_id === profile?.id;
            
            const cat = txn.commercant_categorie || 'autre';
            const catInfo = CATEGORY_INFO[cat];

            let displayName = '';
            let subtitle = '';
            let iconContent = null;
            let amountPrefix = '';
            let amountValue = 0;
            let amountColor = '';

            if (isDeposit) {
              displayName = 'Dépôt physique';
              subtitle = 'Via Agent';
              iconContent = <ArrowDownLeft size={20} style={{ color: 'var(--color-success-600)' }} />;
              amountPrefix = '+';
              amountValue = txn.montant;
              amountColor = 'var(--color-success-600)';
            } else if (isTransfer) {
              if (isReceiver) {
                displayName = 'Transfert reçu';
                subtitle = `de ${txn.client_nom || 'Client'}`;
                iconContent = <ArrowDownLeft size={20} style={{ color: 'var(--color-success-600)' }} />;
                amountPrefix = '+';
                amountValue = txn.montant_net;
                amountColor = 'var(--color-success-600)';
              } else {
                displayName = 'Transfert envoyé';
                subtitle = `à ${txn.destinataire_nom || 'Client'}`;
                iconContent = <ArrowUpRight size={20} style={{ color: 'var(--color-error-600)' }} />;
                amountPrefix = '-';
                amountValue = txn.montant_brut;
                amountColor = 'inherit';
              }
            } else {
              displayName = txn.commercant_boutique || 'Paiement';
              subtitle = catInfo?.label || 'Services';
              iconContent = <span>{catInfo?.emoji || '🛒'}</span>;
              amountPrefix = '-';
              amountValue = txn.montant;
              amountColor = 'inherit';
            }

            return (
              <motion.div
                key={txn.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
                className="card card-interactive"
                onClick={() => setSelectedTxn(txn)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.875rem 1rem', cursor: 'pointer',
                }}
              >
                <div className="category-icon" style={{
                  background: isDeposit || isReceiver ? 'var(--color-success-100)' : (isTransfer ? 'var(--color-error-100)' : `${catInfo?.color || '#cbd5e1'}15`),
                  width: 40, height: 40, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {iconContent}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {displayName}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-surface-500)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {new Date(txn.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    {` · ${subtitle}`}
                  </div>
                </div>
                <div>
                  <div className="tabular-nums" style={{
                    fontWeight: 700, fontSize: '0.875rem', textAlign: 'right',
                    color: amountColor,
                  }}>
                    {amountPrefix}{formatFCFA(amountValue)}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className={`badge badge-${txn.statut === 'reussie' ? 'success' : txn.statut === 'echouee' ? 'error' : 'warning'}`}
                      style={{ fontSize: '0.625rem', padding: '0.125rem 0.5rem' }}>
                      {txn.statut === 'reussie' ? 'Réussie' : txn.statut === 'echouee' ? 'Échouée' : 'En attente'}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
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
                <h2 style={{ fontSize: '1.125rem', fontWeight: 800 }}>Détail de la transaction</h2>
                <button className="btn btn-icon btn-secondary btn-sm" onClick={() => setSelectedTxn(null)}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div className="amount-display" style={{
                  fontSize: '2rem',
                  color: selectedTxn.type === 'depot' || (selectedTxn.type === 'transfert' && selectedTxn.destinataire_id === profile?.id) ? 'var(--color-success-600)' : 'var(--color-surface-900)',
                }}>
                  {selectedTxn.type === 'depot' || (selectedTxn.type === 'transfert' && selectedTxn.destinataire_id === profile?.id) ? '+' : '-'}{formatFCFA(selectedTxn.type === 'transfert' ? (selectedTxn.destinataire_id === profile?.id ? selectedTxn.montant_net : selectedTxn.montant_brut) : selectedTxn.montant)}
                </div>
                <span className={`badge badge-${selectedTxn.statut === 'reussie' ? 'success' : selectedTxn.statut === 'echouee' ? 'error' : 'warning'}`}>
                  {selectedTxn.statut === 'reussie' ? '✓ Réussie' : selectedTxn.statut === 'echouee' ? '✗ Échouée' : '⏳ En attente'}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
                {(() => {
                  const items: [string, string][] = [
                    ['Référence', selectedTxn.reference],
                    ['Date', formatDate(selectedTxn.created_at)],
                  ];
                  
                  if (selectedTxn.type === 'depot') {
                    items.unshift(['Type', 'Dépôt physique']);
                    items.push(['Canal', 'Agent agréé']);
                  } else if (selectedTxn.type === 'transfert') {
                    const isSender = selectedTxn.client_id === profile?.id;
                    items.unshift(['Type', isSender ? 'Transfert envoyé' : 'Transfert reçu']);
                    if (isSender) {
                      items.push(['Destinataire', selectedTxn.destinataire_nom || 'Client']);
                      items.push(['Montant transféré', formatFCFA(selectedTxn.montant_net)]);
                      items.push(['Frais de service (1%)', formatFCFA(selectedTxn.frais)]);
                      items.push(['Total débité', formatFCFA(selectedTxn.montant_brut)]);
                    } else {
                      items.push(['Expéditeur', selectedTxn.client_nom || 'Client']);
                      items.push(['Montant reçu', formatFCFA(selectedTxn.montant_net)]);
                      items.push(['Frais de transfert', '0 FCFA']);
                    }
                  } else {
                    items.unshift(['Type', 'Paiement']);
                    items.push(['Commerçant', selectedTxn.commercant_boutique || 'Boutique']);
                    items.push(['Catégorie', selectedTxn.commercant_categorie ? CATEGORY_INFO[selectedTxn.commercant_categorie].label : 'Commerce']);
                    items.push(['Montant débité', formatFCFA(selectedTxn.montant)]);
                    items.push(['Frais de paiement', '0 FCFA (Frais commerçant)']);
                  }
                  
                  return items.map(([label, value]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--color-surface-100)' }}>
                      <span style={{ color: 'var(--color-surface-500)' }}>{label}</span>
                      <span style={{ fontWeight: 600 }}>{value}</span>
                    </div>
                  ));
                })()}
              </div>

              <button
                className="btn btn-secondary"
                style={{ width: '100%', marginTop: '1.5rem', color: 'var(--color-warning-600)' }}
                onClick={() => {
                  setSelectedTxn(null);
                  showToast({ type: 'info', title: 'Signalement envoyé', message: 'Notre équipe va examiner votre demande' });
                }}
              >
                <AlertTriangle size={16} />
                Signaler un problème
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
