// ============================================================================
// LafiaPay — Admin Client Management Page
// Table of client profiles with search, filter, detail drawer, and status toggle
// ============================================================================

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Shield, UserX, UserCheck, Eye, X, ArrowUpRight, ArrowDownLeft, Receipt } from 'lucide-react';
import { mockStore } from '../../lib/mockData';
import { formatFCFA, formatDate } from '../../types';
import type { Profile, Transaction } from '../../types';
import { useToast } from '../../contexts/ToastContext';

export default function UsersPage() {
  const { showToast } = useToast();
  
  // State variables for search, filters and modals
  const [search, setSearch] = useState('');
  const [kycFilter, setKycFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const [selectedClient, setSelectedClient] = useState<Profile | null>(null);
  const [clientTransactions, setClientTransactions] = useState<Transaction[]>([]);
  const [confirmToggleClient, setConfirmToggleClient] = useState<Profile | null>(null);

  // Read all clients from the store
  const clients = useMemo(() => {
    return mockStore.profiles.filter(p => p.role === 'client');
  }, [mockStore.profiles]); // mockStore.profiles is in memory, let's subscribe to force updates when status changes

  // Trigger state update on store updates
  const [, setTick] = useState(0);
  useMemo(() => {
    return mockStore.subscribe(() => setTick(t => t + 1));
  }, []);

  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      const matchSearch = c.nom.toLowerCase().includes(search.toLowerCase()) || 
                          c.telephone.includes(search);
      const matchKyc = kycFilter === 'all' ? true : c.kyc_niveau === Number(kycFilter);
      const matchStatus = statusFilter === 'all' ? true : c.statut === statusFilter;
      return matchSearch && matchKyc && matchStatus;
    });
  }, [clients, search, kycFilter, statusFilter, mockStore.profiles]);

  // Open client detail drawer
  const handleViewDetails = (client: Profile) => {
    setSelectedClient(client);
    const txns = mockStore.transactions.filter(t => t.client_id === client.id);
    setClientTransactions(txns);
  };

  // Toggle user status between actif and suspendu
  const handleToggleStatus = (client: Profile) => {
    const nextStatus = client.statut === 'actif' ? 'suspendu' : 'actif';
    client.statut = nextStatus; // Direct modification since it is in-memory mockStore
    
    // Add to audit logs
    mockStore.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      admin_id: 'demo-admin-001',
      action: nextStatus === 'suspendu' ? 'Suspension de compte' : 'Réactivation de compte',
      details: { target: client.id, telephone: client.telephone, nom: client.nom },
      created_at: new Date().toISOString(),
      admin_nom: 'Admin LafiaPay',
    });

    showToast({
      type: nextStatus === 'actif' ? 'success' : 'warning',
      title: nextStatus === 'actif' ? 'Compte réactivé' : 'Compte suspendu',
      message: `Le compte de ${client.nom} est désormais ${nextStatus}.`,
    });

    setConfirmToggleClient(null);
  };

  // Get balance for a specific client
  const getClientBalance = (profileId: string) => {
    const compte = mockStore.comptes.find(c => c.profile_id === profileId);
    return compte ? compte.solde : 0;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Search & Filter Bar */}
      <div className="card" style={{ padding: '1.25rem 1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-surface-400)' }} />
          <input
            className="input-field"
            style={{ paddingLeft: '2.5rem', paddingTop: '0.8rem', paddingBottom: '0.8rem', fontSize: '0.875rem' }}
            placeholder="Rechercher par nom ou numéro..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Filter KYC */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-surface-500)' }}>KYC</span>
          <select
            value={kycFilter}
            onChange={e => setKycFilter(e.target.value)}
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
            <option value="all">Tous les niveaux</option>
            <option value="1">Niveau 1 (Bas)</option>
            <option value="2">Niveau 2 (Moyen)</option>
            <option value="3">Niveau 3 (Élevé)</option>
          </select>
        </div>

        {/* Filter Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-surface-500)' }}>Statut</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
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
            <option value="actif">Actif</option>
            <option value="suspendu">Suspendu</option>
          </select>
        </div>
      </div>

      {/* Clients Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Nom Complet</th>
                <th>Téléphone</th>
                <th>Niveau KYC</th>
                <th>Solde Portefeuille</th>
                <th>Statut</th>
                <th>Date d'inscription</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-surface-400)' }}>
                    Aucun client ne correspond aux critères.
                  </td>
                </tr>
              ) : (
                filteredClients.map(client => {
                  const balance = getClientBalance(client.id);
                  return (
                    <tr key={client.id}>
                      <td style={{ fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '32px', height: '32px', borderRadius: '50%',
                            background: 'var(--color-primary-100)', color: 'var(--color-primary-700)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.75rem'
                          }} className="dark:bg-primary-900 dark:text-primary-100">
                            {client.nom.charAt(0)}
                          </div>
                          {client.nom}
                        </div>
                      </td>
                      <td className="tabular-nums" style={{ color: 'var(--color-surface-600)' }}>{client.telephone}</td>
                      <td>
                        <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Shield size={12} />
                          Niv. {client.kyc_niveau}
                        </span>
                      </td>
                      <td className="tabular-nums" style={{ fontWeight: 600 }}>{formatFCFA(balance)}</td>
                      <td>
                        <span className={`badge badge-${client.statut === 'actif' ? 'success' : 'error'}`}>
                          {client.statut === 'actif' ? 'Actif' : 'Suspendu'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--color-surface-500)', fontSize: '0.8125rem' }}>
                        {new Date(client.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleViewDetails(client)}
                            className="btn btn-sm btn-secondary"
                            title="Voir les détails"
                            style={{ padding: '0.375rem' }}
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => setConfirmToggleClient(client)}
                            className={`btn btn-sm ${client.statut === 'actif' ? 'btn-secondary' : 'btn-primary'}`}
                            style={{
                              padding: '0.375rem',
                              color: client.statut === 'actif' ? '#ef4444' : '#10b981',
                              borderColor: client.statut === 'actif' ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                            }}
                            title={client.statut === 'actif' ? 'Suspendre' : 'Activer'}
                          >
                            {client.statut === 'actif' ? <UserX size={16} /> : <UserCheck size={16} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal for status change */}
      <AnimatePresence>
        {confirmToggleClient && (
          <div
            onClick={() => setConfirmToggleClient(null)}
            className="modal-overlay"
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="card"
              style={{ width: '100%', maxWidth: '400px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800 }}>
                {confirmToggleClient.statut === 'actif' ? 'Suspendre le client ?' : 'Réactiver le client ?'}
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-surface-500)' }}>
                {confirmToggleClient.statut === 'actif'
                  ? `Êtes-vous sûr de vouloir suspendre le compte de ${confirmToggleClient.nom} ? Il ne pourra plus effectuer de recharge ni de paiement.`
                  : `Voulez-vous réactiver le compte de ${confirmToggleClient.nom} ? Il retrouvera l'accès complet à son portefeuille.`}
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setConfirmToggleClient(null)}>
                  Annuler
                </button>
                <button
                  className={confirmToggleClient.statut === 'actif' ? 'btn btn-danger' : 'btn btn-success'}
                  style={{ flex: 1 }}
                  onClick={() => handleToggleStatus(confirmToggleClient)}
                >
                  {confirmToggleClient.statut === 'actif' ? 'Suspendre' : 'Réactiver'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Detail Drawer (Right side sidebar drawer) */}
      <AnimatePresence>
        {selectedClient && (
          <div
            onClick={() => setSelectedClient(null)}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(4px)',
              zIndex: 90,
              display: 'flex',
              justifyContent: 'flex-end',
            }}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={e => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '480px',
                height: '100%',
                backgroundColor: 'white',
                boxShadow: 'var(--shadow-xl)',
                display: 'flex',
                flexDirection: 'column',
              }}
              className="dark:bg-dark-surface"
            >
              {/* Drawer Header */}
              <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-surface-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="dark:border-dark-border">
                <h3 style={{ fontSize: '1.125rem', fontWeight: 800 }}>Détails du Client</h3>
                <button className="btn btn-icon btn-secondary btn-sm" onClick={() => setSelectedClient(null)}>
                  <X size={18} />
                </button>
              </div>

              {/* Drawer Body (Scrollable) */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Profile Overview */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: '60px', height: '60px', borderRadius: '50%',
                    background: 'var(--color-primary-100)', color: 'var(--color-primary-700)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.5rem'
                  }} className="dark:bg-primary-900 dark:text-primary-100">
                    {selectedClient.nom.charAt(0)}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1.125rem', fontWeight: 700 }}>{selectedClient.nom}</h4>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-surface-500)' }}>{selectedClient.telephone}</p>
                  </div>
                </div>

                {/* Account Details grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="card" style={{ padding: '1rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-surface-500)', marginBottom: '0.25rem' }}>Solde Actuel</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800 }} className="tabular-nums">
                      {formatFCFA(getClientBalance(selectedClient.id))}
                    </div>
                  </div>
                  <div className="card" style={{ padding: '1rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-surface-500)', marginBottom: '0.25rem' }}>Niveau KYC</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.37rem', fontSize: '1rem', fontWeight: 700 }}>
                      <Shield size={16} className="text-primary-500" />
                      Niveau {selectedClient.kyc_niveau}
                    </div>
                  </div>
                </div>

                {/* Metadata Info */}
                <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                    <span style={{ color: 'var(--color-surface-500)' }}>ID Utilisateur</span>
                    <span style={{ fontWeight: 600 }} className="tabular-nums">{selectedClient.id}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                    <span style={{ color: 'var(--color-surface-500)' }}>Statut du Compte</span>
                    <span className={`badge badge-${selectedClient.statut === 'actif' ? 'success' : 'error'}`}>
                      {selectedClient.statut === 'actif' ? 'Actif' : 'Suspendu'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                    <span style={{ color: 'var(--color-surface-500)' }}>Date d'inscription</span>
                    <span style={{ fontWeight: 600 }}>{formatDate(selectedClient.created_at)}</span>
                  </div>
                </div>

                {/* Transaction History Sub-list */}
                <div>
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 800, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Receipt size={18} />
                    Transactions Récentes ({clientTransactions.length})
                  </h4>
                  {clientTransactions.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-surface-400)', fontSize: '0.875rem' }} className="card">
                      Aucune transaction enregistrée.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                      {clientTransactions.map(txn => {
                        const isDepot = txn.type === 'depot';
                        return (
                          <div key={txn.id} className="card" style={{ padding: '0.75rem 1rem', display: 'flex', justifyItems: 'center', alignItems: 'center', gap: '0.75rem', fontSize: '0.8125rem' }}>
                            <div style={{
                              padding: '0.375rem', borderRadius: '50%',
                              background: isDepot ? 'var(--color-success-100)' : 'var(--color-primary-100)',
                              color: isDepot ? 'var(--color-success-600)' : 'var(--color-primary-600)',
                            }}>
                              {isDepot ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {isDepot ? 'Dépôt Mobile Money' : txn.commercant_boutique || 'Paiement'}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--color-surface-500)' }}>
                                {new Date(txn.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontWeight: 700, color: isDepot ? 'var(--color-success-600)' : 'inherit' }} className="tabular-nums">
                                {isDepot ? '+' : '-'}{formatFCFA(txn.montant)}
                              </div>
                              <span className={`badge badge-${txn.statut === 'reussie' ? 'success' : 'error'}`} style={{ fontSize: '0.625rem', padding: '0.05rem 0.35rem' }}>
                                {txn.statut === 'reussie' ? 'Réussi' : 'Échoué'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
