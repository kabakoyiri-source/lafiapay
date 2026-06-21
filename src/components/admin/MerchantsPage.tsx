// ============================================================================
// LafiaPay — Admin Merchant Management Page
// Table of merchant profiles with search, filter, stats, detail drawer, and status toggle
// ============================================================================

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Store, UserX, UserCheck, Eye, X, ArrowUpRight, ArrowDownLeft, Receipt, DollarSign, MapPin } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { mockStore } from '../../lib/mockData';
import { formatFCFA, formatDate, CATEGORY_INFO } from '../../types';
import type { Profile, Transaction, Commercant } from '../../types';
import { useToast } from '../../contexts/ToastContext';

export default function MerchantsPage() {
  const { showToast } = useToast();

  // State variables
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [selectedMerchant, setSelectedMerchant] = useState<Profile | null>(null);
  const [merchantDetails, setSelectedMerchantDetails] = useState<Commercant | null>(null);
  const [merchantTransactions, setMerchantTransactions] = useState<Transaction[]>([]);
  const [confirmToggleMerchant, setConfirmToggleMerchant] = useState<Profile | null>(null);

  // Tick for re-rendering on store mutations
  const [, setTick] = useState(0);
  useMemo(() => {
    return mockStore.subscribe(() => setTick(t => t + 1));
  }, []);

  // Fetch all merchants
  const merchants = useMemo(() => {
    return mockStore.profiles.filter(p => p.role === 'commercant');
  }, [mockStore.profiles]);

  // Filter merchants based on search and filters
  const filteredMerchants = useMemo(() => {
    return merchants.filter(m => {
      const details = mockStore.getCommerçant(m.id);
      const boutiqueName = details?.nom_boutique || '';
      const matchSearch = m.nom.toLowerCase().includes(search.toLowerCase()) ||
                          boutiqueName.toLowerCase().includes(search.toLowerCase()) ||
                          m.telephone.includes(search);
      const matchCategory = categoryFilter === 'all' ? true : details?.categorie === categoryFilter;
      const matchStatus = statusFilter === 'all' ? true : m.statut === statusFilter;
      return matchSearch && matchCategory && matchStatus;
    });
  }, [merchants, search, categoryFilter, statusFilter]);

  // Open details drawer
  const handleViewDetails = (merchant: Profile) => {
    setSelectedMerchant(merchant);
    const details = mockStore.getCommerçant(merchant.id) || null;
    setSelectedMerchantDetails(details);
    const txns = mockStore.transactions.filter(t => t.commercant_id === merchant.id);
    setMerchantTransactions(txns);
  };

  // Toggle merchant status
  const handleToggleStatus = (merchant: Profile) => {
    const nextStatus = merchant.statut === 'actif' ? 'suspendu' : 'actif';
    merchant.statut = nextStatus;

    // Add to audit logs
    mockStore.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      admin_id: 'demo-admin-001',
      action: nextStatus === 'suspendu' ? 'Suspension de commerce' : 'Réactivation de commerce',
      details: { target: merchant.id, telephone: merchant.telephone, nom: merchant.nom },
      created_at: new Date().toISOString(),
      admin_nom: 'Admin LafiaPay',
    });

    showToast({
      type: nextStatus === 'actif' ? 'success' : 'warning',
      title: nextStatus === 'actif' ? 'Commerce réactivé' : 'Commerce suspendu',
      message: `Le compte commerçant de ${merchant.nom} est désormais ${nextStatus}.`,
    });

    setConfirmToggleMerchant(null);
  };

  // Calculate merchant details
  const getMerchantBalance = (profileId: string) => {
    const compte = mockStore.comptes.find(c => c.profile_id === profileId);
    return compte ? compte.solde : 0;
  };

  const getMerchantRevenue = (merchantId: string) => {
    const txns = mockStore.transactions.filter(
      t => t.commercant_id === merchantId && t.statut === 'reussie'
    );
    return txns.reduce((sum, t) => sum + t.montant, 0);
  };

  // Prepare chart data for detail drawer (daily performance of this merchant)
  const chartData = useMemo(() => {
    if (!selectedMerchant) return [];
    const daily: Record<string, number> = {};
    const now = new Date();
    
    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
      daily[key] = 0;
    }

    merchantTransactions
      .filter(t => t.statut === 'reussie')
      .forEach(t => {
        const key = new Date(t.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
        if (daily[key] !== undefined) {
          daily[key] += t.montant;
        }
      });

    return Object.entries(daily).map(([date, montant]) => ({ date, montant }));
  }, [selectedMerchant, merchantTransactions]);

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
            placeholder="Rechercher par boutique, gérant ou numéro..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Filter Category */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-surface-500)' }}>Catégorie</span>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
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
            <option value="all">Toutes</option>
            {Object.entries(CATEGORY_INFO).map(([key, info]) => (
              <option key={key} value={key}>
                {info.emoji} {info.label}
              </option>
            ))}
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

      {/* Merchants Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Boutique</th>
                <th>Gérant</th>
                <th>Téléphone</th>
                <th>Catégorie</th>
                <th>Ville</th>
                <th>Solde Actuel</th>
                <th>Volume Ventes</th>
                <th>Statut</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMerchants.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-surface-400)' }}>
                    Aucun commerçant trouvé.
                  </td>
                </tr>
              ) : (
                filteredMerchants.map(merchant => {
                  const details = mockStore.getCommerçant(merchant.id);
                  const balance = getMerchantBalance(merchant.id);
                  const revenue = getMerchantRevenue(merchant.id);
                  const cat = details?.categorie || 'autre';
                  const catInfo = CATEGORY_INFO[cat] || CATEGORY_INFO.autre;

                  return (
                    <tr key={merchant.id}>
                      <td style={{ fontWeight: 700 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '32px', height: '32px', borderRadius: '50%',
                            background: `${catInfo.color}15`, color: catInfo.color,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem'
                          }}>
                            {catInfo.emoji}
                          </div>
                          {details?.nom_boutique || 'Boutique'}
                        </div>
                      </td>
                      <td style={{ fontWeight: 500 }}>{merchant.nom}</td>
                      <td className="tabular-nums" style={{ color: 'var(--color-surface-600)' }}>{merchant.telephone}</td>
                      <td>
                        <span className="badge badge-neutral" style={{ textTransform: 'capitalize' }}>
                          {catInfo.label}
                        </span>
                      </td>
                      <td style={{ color: 'var(--color-surface-600)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8125rem' }}>
                          <MapPin size={12} style={{ opacity: 0.7 }} />
                          {details?.ville || 'Mali'}
                        </div>
                      </td>
                      <td className="tabular-nums" style={{ fontWeight: 600 }}>{formatFCFA(balance)}</td>
                      <td className="tabular-nums" style={{ fontWeight: 600, color: 'var(--color-primary-600)' }}>{formatFCFA(revenue)}</td>
                      <td>
                        <span className={`badge badge-${merchant.statut === 'actif' ? 'success' : 'error'}`}>
                          {merchant.statut === 'actif' ? 'Actif' : 'Suspendu'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleViewDetails(merchant)}
                            className="btn btn-sm btn-secondary"
                            title="Voir les détails"
                            style={{ padding: '0.375rem' }}
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => setConfirmToggleMerchant(merchant)}
                            className={`btn btn-sm ${merchant.statut === 'actif' ? 'btn-secondary' : 'btn-primary'}`}
                            style={{
                              padding: '0.375rem',
                              color: merchant.statut === 'actif' ? '#ef4444' : '#10b981',
                              borderColor: merchant.statut === 'actif' ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                            }}
                            title={merchant.statut === 'actif' ? 'Suspendre' : 'Activer'}
                          >
                            {merchant.statut === 'actif' ? <UserX size={16} /> : <UserCheck size={16} />}
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

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmToggleMerchant && (
          <div
            onClick={() => setConfirmToggleMerchant(null)}
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
                {confirmToggleMerchant.statut === 'actif' ? 'Suspendre le commerçant ?' : 'Réactiver le commerçant ?'}
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-surface-500)' }}>
                {confirmToggleMerchant.statut === 'actif'
                  ? `Voulez-vous suspendre le compte de ${confirmToggleMerchant.nom} ? Ses clients ne pourront plus scanner son QR code pour payer.`
                  : `Voulez-vous réactiver le compte de ${confirmToggleMerchant.nom} ? Il retrouvera l'usage complet de son portefeuille et de son QR code.`}
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setConfirmToggleMerchant(null)}>
                  Annuler
                </button>
                <button
                  className={confirmToggleMerchant.statut === 'actif' ? 'btn btn-danger' : 'btn btn-success'}
                  style={{ flex: 1 }}
                  onClick={() => handleToggleStatus(confirmToggleMerchant)}
                >
                  {confirmToggleMerchant.statut === 'actif' ? 'Suspendre' : 'Réactiver'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Details Drawer */}
      <AnimatePresence>
        {selectedMerchant && merchantDetails && (
          <div
            onClick={() => setSelectedMerchant(null)}
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
                <h3 style={{ fontSize: '1.125rem', fontWeight: 800 }}>Détails du Commerce</h3>
                <button className="btn btn-icon btn-secondary btn-sm" onClick={() => setSelectedMerchant(null)}>
                  <X size={18} />
                </button>
              </div>

              {/* Drawer Body */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Shop Banner Overview */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: '60px', height: '60px', borderRadius: '50%',
                    background: `${CATEGORY_INFO[merchantDetails.categorie].color}15`, color: CATEGORY_INFO[merchantDetails.categorie].color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem'
                  }}>
                    {CATEGORY_INFO[merchantDetails.categorie].emoji}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1.125rem', fontWeight: 800 }}>{merchantDetails.nom_boutique}</h4>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--color-surface-500)' }}>
                      Gérant : <span style={{ fontWeight: 600 }}>{selectedMerchant.nom}</span>
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-surface-500)' }}>{selectedMerchant.telephone}</p>
                  </div>
                </div>

                {/* Account Details grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="card" style={{ padding: '1rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-surface-500)', marginBottom: '0.25rem' }}>Solde Portefeuille</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800 }} className="tabular-nums">
                      {formatFCFA(getMerchantBalance(selectedMerchant.id))}
                    </div>
                  </div>
                  <div className="card" style={{ padding: '1rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-surface-500)', marginBottom: '0.25rem' }}>Volume Ventes</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary-600)' }} className="tabular-nums">
                      {formatFCFA(getMerchantRevenue(selectedMerchant.id))}
                    </div>
                  </div>
                </div>

                {/* Performance Chart */}
                <div>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 800, marginBottom: '0.75rem' }}>Activité (7 derniers jours)</h4>
                  <div className="card" style={{ padding: '1rem 0.5rem 0.5rem 0.5rem', height: '180px' }}>
                    {chartData.length === 0 ? (
                      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-surface-400)' }}>
                        Aucune vente réussie
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-surface-150)" />
                          <XAxis dataKey="date" stroke="var(--color-surface-500)" fontSize={9} tickLine={false} />
                          <YAxis stroke="var(--color-surface-500)" fontSize={9} tickLine={false} axisLine={false} tickFormatter={value => `${value / 1000}k`} />
                          <Tooltip formatter={(value: any) => [formatFCFA(Number(value)), 'Chiffre d\'affaires']} />
                          <Bar dataKey="montant" fill="var(--color-primary-500)" radius={[4, 4, 0, 0]} barSize={20} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Metadata Info */}
                <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                    <span style={{ color: 'var(--color-surface-500)' }}>ID QR Code</span>
                    <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>{merchantDetails.qr_code_id}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                    <span style={{ color: 'var(--color-surface-500)' }}>Ville / Région</span>
                    <span style={{ fontWeight: 600 }}>{merchantDetails.ville}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                    <span style={{ color: 'var(--color-surface-500)' }}>Statut</span>
                    <span className={`badge badge-${selectedMerchant.statut === 'actif' ? 'success' : 'error'}`}>
                      {selectedMerchant.statut === 'actif' ? 'Actif' : 'Suspendu'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                    <span style={{ color: 'var(--color-surface-500)' }}>Affilié le</span>
                    <span style={{ fontWeight: 600 }}>{formatDate(selectedMerchant.created_at)}</span>
                  </div>
                </div>

                {/* Recent Payments Received */}
                <div>
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 800, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Receipt size={18} />
                    Dernières Ventes ({merchantTransactions.length})
                  </h4>
                  {merchantTransactions.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-surface-400)', fontSize: '0.875rem' }} className="card">
                      Aucun encaissement enregistré.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '240px', overflowY: 'auto' }}>
                      {merchantTransactions.slice(0, 10).map(txn => (
                        <div key={txn.id} className="card" style={{ padding: '0.75rem 1rem', display: 'flex', justifyItems: 'center', alignItems: 'center', gap: '0.75rem', fontSize: '0.8125rem' }}>
                          <div style={{
                            padding: '0.375rem', borderRadius: '50%',
                            background: 'var(--color-success-100)', color: 'var(--color-success-600)'
                          }}>
                            <ArrowDownLeft size={16} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              Client : {txn.client_nom || 'Client Anonyme'}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-surface-500)' }}>
                              Ref: {txn.reference} • {new Date(txn.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 700, color: 'var(--color-success-600)' }} className="tabular-nums">
                              +{formatFCFA(txn.montant)}
                            </div>
                            <span className={`badge badge-${txn.statut === 'reussie' ? 'success' : 'error'}`} style={{ fontSize: '0.625rem', padding: '0.05rem 0.35rem' }}>
                              {txn.statut === 'reussie' ? 'Réussi' : 'Échoué'}
                            </span>
                          </div>
                        </div>
                      ))}
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
