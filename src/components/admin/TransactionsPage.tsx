// ============================================================================
// LafiaPay — Admin Transactions Page
// Comprehensive list of all platform transactions with advanced filters
// ============================================================================

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, ArrowUpRight, ArrowDownLeft, X, Receipt, CheckCircle, AlertTriangle } from 'lucide-react';
import { mockStore } from '../../lib/mockData';
import { formatFCFA, formatDate, CATEGORY_INFO, OPERATOR_INFO } from '../../types';
import type { Transaction, TransactionType, TransactionStatus } from '../../types';

export default function TransactionsPage() {
  // Filters state
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Tick for re-rendering on store mutations
  const [, setTick] = useState(0);
  useMemo(() => {
    return mockStore.subscribe(() => setTick(t => t + 1));
  }, []);

  // Filter transactions
  const filteredTxns = useMemo(() => {
    return mockStore.transactions.filter(t => {
      const matchType = typeFilter === 'all' ? true : t.type === typeFilter;
      const matchStatus = statusFilter === 'all' ? true : t.statut === statusFilter;
      
      const s = search.toLowerCase();
      const matchSearch =
        t.reference.toLowerCase().includes(s) ||
        (t.client_nom && t.client_nom.toLowerCase().includes(s)) ||
        (t.commercant_boutique && t.commercant_boutique.toLowerCase().includes(s)) ||
        (t.commercant_nom && t.commercant_nom.toLowerCase().includes(s));

      return matchType && matchStatus && matchSearch;
    });
  }, [search, typeFilter, statusFilter]);

  // Compute paginated items
  const paginatedTxns = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTxns.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTxns, currentPage]);

  const totalPages = Math.ceil(filteredTxns.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Filters Bar */}
      <div className="card" style={{ padding: '1.25rem 1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-surface-400)' }} />
          <input
            className="input-field"
            style={{ paddingLeft: '2.5rem', paddingTop: '0.8rem', paddingBottom: '0.8rem', fontSize: '0.875rem' }}
            placeholder="Rechercher par référence, client ou commerce..."
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        {/* Filter Type */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-surface-500)' }}>Type</span>
          <select
            value={typeFilter}
            onChange={e => {
              setTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              padding: '0.625rem 1.5rem 0.625rem 0.75rem',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-surface-200)',
              backgroundColor: 'white',
              fontSize: '0.875rem',
              outline: 'none',
              cursor: 'pointer',
            }}
            className="dark:bg-dark-card dark:border-dark-border"
          >
            <option value="all">Tous les types</option>
            <option value="depot">Dépôts (Recharges)</option>
            <option value="paiement">Paiements Commerçants</option>
          </select>
        </div>

        {/* Filter Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-surface-500)' }}>Statut</span>
          <select
            value={statusFilter}
            onChange={e => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              padding: '0.625rem 1.5rem 0.625rem 0.75rem',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-surface-200)',
              backgroundColor: 'white',
              fontSize: '0.875rem',
              outline: 'none',
              cursor: 'pointer',
            }}
            className="dark:bg-dark-card dark:border-dark-border"
          >
            <option value="all">Tous les statuts</option>
            <option value="reussie">Réussie</option>
            <option value="en_attente">En attente</option>
            <option value="echouee">Échouée</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Référence</th>
                <th>Date & Heure</th>
                <th>Type</th>
                <th>Client</th>
                <th>Destinataire</th>
                <th>Montant</th>
                <th>Moyen de Paiement</th>
                <th>Statut</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTxns.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-surface-400)' }}>
                    Aucune transaction trouvée.
                  </td>
                </tr>
              ) : (
                paginatedTxns.map(txn => {
                  const isDepot = txn.type === 'depot';
                  return (
                    <tr key={txn.id}>
                      <td style={{ fontWeight: 700, fontFamily: 'monospace' }}>{txn.reference}</td>
                      <td style={{ fontSize: '0.8125rem', color: 'var(--color-surface-500)' }}>
                        {formatDate(txn.created_at)}
                      </td>
                      <td>
                        <span className={`badge badge-${isDepot ? 'success' : 'info'}`}>
                          {isDepot ? 'Dépôt' : 'Paiement'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{txn.client_nom || 'Client Anonyme'}</td>
                      <td style={{ fontWeight: 600 }}>
                        {isDepot ? (
                          <span style={{ color: 'var(--color-surface-400)', fontStyle: 'italic', fontWeight: 'normal' }}>Mon portefeuille</span>
                        ) : (
                          txn.commercant_boutique || txn.commercant_nom || 'Commerce'
                        )}
                      </td>
                      <td className="tabular-nums" style={{ fontWeight: 700, color: isDepot ? 'var(--color-success-600)' : 'inherit' }}>
                        {isDepot ? '+' : '-'}{formatFCFA(txn.montant)}
                      </td>
                      <td>
                        {isDepot && txn.operateur_mobile_money ? (
                          <span
                            className="badge"
                            style={{
                              backgroundColor: OPERATOR_INFO[txn.operateur_mobile_money]?.bgColor + '15',
                              color: OPERATOR_INFO[txn.operateur_mobile_money]?.bgColor,
                            }}
                          >
                            {OPERATOR_INFO[txn.operateur_mobile_money]?.label}
                          </span>
                        ) : (
                          <span className="badge badge-neutral">Portefeuille Closed-Loop</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge badge-${txn.statut === 'reussie' ? 'success' : txn.statut === 'echouee' ? 'error' : 'warning'}`}>
                          {txn.statut === 'reussie' ? 'Réussie' : txn.statut === 'echouee' ? 'Échouée' : 'En attente'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => setSelectedTxn(txn)}
                          className="btn btn-sm btn-secondary"
                          style={{ padding: '0.375rem 0.75rem' }}
                        >
                          Détails
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-surface-200)' }} className="dark:border-dark-border">
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-surface-500)' }}>
              Page {currentPage} sur {totalPages} • ({filteredTxns.length} transactions au total)
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn btn-sm btn-secondary"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                Précédent
              </button>
              <button
                className="btn btn-sm btn-secondary"
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedTxn && (
          <div
            onClick={() => setSelectedTxn(null)}
            className="modal-overlay"
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              onClick={e => e.stopPropagation()}
              className="card"
              style={{ width: '100%', maxWidth: '480px', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Receipt size={20} className="text-primary-500" />
                  Détail de la Transaction
                </h3>
                <button className="btn btn-icon btn-secondary btn-sm" onClick={() => setSelectedTxn(null)}>
                  <X size={18} />
                </button>
              </div>

              {/* Amount display */}
              <div style={{ textAlign: 'center', padding: '1.25rem', backgroundColor: 'var(--color-surface-50)', borderRadius: 'var(--radius-xl)' }} className="dark:bg-dark-surface">
                <div style={{ fontSize: '2rem', fontWeight: 800, color: selectedTxn.type === 'depot' ? 'var(--color-success-600)' : 'inherit' }} className="tabular-nums">
                  {selectedTxn.type === 'depot' ? '+' : '-'}{formatFCFA(selectedTxn.montant)}
                </div>
                <span className={`badge badge-${selectedTxn.statut === 'reussie' ? 'success' : selectedTxn.statut === 'echouee' ? 'error' : 'warning'}`} style={{ marginTop: '0.5rem' }}>
                  {selectedTxn.statut === 'reussie' ? 'Transaction Réussie' : selectedTxn.statut === 'echouee' ? 'Transaction Échouée' : 'Transaction En attente'}
                </span>
              </div>

              {/* Data Rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--color-surface-150)' }} className="dark:border-dark-border">
                  <span style={{ color: 'var(--color-surface-500)' }}>Référence unique</span>
                  <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>{selectedTxn.reference}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--color-surface-150)' }} className="dark:border-dark-border">
                  <span style={{ color: 'var(--color-surface-500)' }}>Date & Heure</span>
                  <span style={{ fontWeight: 600 }}>{formatDate(selectedTxn.created_at)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--color-surface-150)' }} className="dark:border-dark-border">
                  <span style={{ color: 'var(--color-surface-500)' }}>Type de transaction</span>
                  <span style={{ fontWeight: 600 }}>{selectedTxn.type === 'depot' ? 'Dépôt / Recharge' : 'Paiement Commerçant'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--color-surface-150)' }} className="dark:border-dark-border">
                  <span style={{ color: 'var(--color-surface-500)' }}>Client Émetteur</span>
                  <span style={{ fontWeight: 600 }}>{selectedTxn.client_nom || 'Client ID: ' + selectedTxn.client_id}</span>
                </div>
                
                {selectedTxn.type === 'paiement' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--color-surface-150)' }} className="dark:border-dark-border">
                    <span style={{ color: 'var(--color-surface-500)' }}>Commerce Destinataire</span>
                    <span style={{ fontWeight: 600 }}>{selectedTxn.commercant_boutique || selectedTxn.commercant_nom}</span>
                  </div>
                )}

                {selectedTxn.operateur_mobile_money && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--color-surface-150)' }} className="dark:border-dark-border">
                    <span style={{ color: 'var(--color-surface-500)' }}>Opérateur de dépôt</span>
                    <span style={{ fontWeight: 600 }}>{OPERATOR_INFO[selectedTxn.operateur_mobile_money]?.label}</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => setSelectedTxn(null)}>
                  Fermer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
