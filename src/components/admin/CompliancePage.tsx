// ============================================================================
// LafiaPay — Admin Compliance Page
// Compliance alert management panel and KYC threshold configuration limits
// ============================================================================

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, CheckCircle, RefreshCw, X, AlertTriangle, FileText, Info } from 'lucide-react';
import { mockStore } from '../../lib/mockData';
import { formatFCFA, formatDate } from '../../types';
import type { AlerteConformite, AlertCriticality } from '../../types';
import { useToast } from '../../contexts/ToastContext';

export default function CompliancePage() {
  const { showToast } = useToast();
  const [selectedAlert, setSelectedAlert] = useState<AlerteConformite | null>(null);

  // Tick for re-rendering on store mutations
  const [, setTick] = useState(0);
  useMemo(() => {
    return mockStore.subscribe(() => setTick(t => t + 1));
  }, []);

  const alerts = useMemo(() => {
    return mockStore.alertes;
  }, [mockStore.alertes]);

  // Handle alert resolution
  const handleResolveAlert = (id: string) => {
    const alert = mockStore.alertes.find(a => a.id === id);
    if (alert) {
      alert.statut = 'verifie';
      
      // Log to audit logs
      mockStore.auditLogs.unshift({
        id: `audit-${Date.now()}`,
        admin_id: 'demo-admin-001',
        action: 'Alerte conformité résolue',
        details: { alerte_id: id, description: alert.description },
        created_at: new Date().toISOString(),
        admin_nom: 'Admin LafiaPay',
      });

      showToast({
        type: 'success',
        title: 'Alerte traitée',
        message: 'L\'alerte a été marquée comme vérifiée et archivée.',
      });
    }
    setSelectedAlert(null);
  };

  // KYC levels limits table data
  const KYC_LIMITS = [
    {
      level: 1,
      name: 'Niveau 1 (Défaut)',
      maxBalance: 200000,
      dailyLimit: 50000,
      monthlyLimit: 200000,
      documents: 'Numéro de téléphone validé uniquement (SIM enregistrée)',
    },
    {
      level: 2,
      name: 'Niveau 2 (Vérifié)',
      maxBalance: 1000000,
      dailyLimit: 250000,
      monthlyLimit: 1000000,
      documents: 'Carte d\'identité nationale (NINA / Passeport) + Photo',
    },
    {
      level: 3,
      name: 'Niveau 3 (Commerçant / Premium)',
      maxBalance: 5000000,
      dailyLimit: 1000000,
      monthlyLimit: 5000000,
      documents: 'Justificatif de domicile de moins de 3 mois + Registre du commerce (pour commerçants)',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Upper row: compliance statistics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        <div className="card" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--color-error-100)', color: 'var(--color-error-600)' }}>
            <ShieldAlert size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-surface-500)', fontWeight: 600 }}>Alertes non traitées</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>
              {alerts.filter(a => a.statut !== 'verifie').length}
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--color-success-100)', color: 'var(--color-success-600)' }}>
            <CheckCircle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-surface-500)', fontWeight: 600 }}>Alertes archivées</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>
              {alerts.filter(a => a.statut === 'verifie').length}
            </div>
          </div>
        </div>
      </div>

      {/* Main Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
        
        {/* Compliance Alerts Card */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Alertes de transactions suspectes</h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-surface-500)' }}>
            Le système surveille en temps réel les volumes inhabituels ou les dépassements de plafonds réglementaires de la BCEAO.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {alerts.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-surface-400)', fontSize: '0.875rem' }} className="card">
                Aucune alerte en cours.
              </div>
            ) : (
              alerts.map(alert => {
                const isResolved = alert.statut === 'verifie';
                return (
                  <div
                    key={alert.id}
                    className="card"
                    style={{
                      padding: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      borderLeft: `4px solid ${
                        isResolved ? 'var(--color-success-500)' :
                        alert.niveau_criticite === 'eleve' ? 'var(--color-error-500)' :
                        alert.niveau_criticite === 'moyen' ? 'var(--color-warning-500)' :
                        'var(--color-primary-400)'
                      }`,
                      opacity: isResolved ? 0.6 : 1,
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.25rem' }}>
                        <span className={`badge badge-${
                          isResolved ? 'success' :
                          alert.niveau_criticite === 'eleve' ? 'error' :
                          alert.niveau_criticite === 'moyen' ? 'warning' :
                          'info'
                        }`} style={{ fontSize: '0.625rem' }}>
                          {isResolved ? 'Vérifié' : `Criticité: ${alert.niveau_criticite}`}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-surface-500)' }}>
                          {formatDate(alert.created_at)}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>{alert.description}</p>
                      {alert.transaction_reference && (
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-surface-500)', marginTop: '0.125rem' }}>
                          Transaction : <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>{alert.transaction_reference}</span>
                          {alert.transaction_montant && ` • Montant: ${formatFCFA(alert.transaction_montant)}`}
                        </p>
                      )}
                    </div>
                    <div>
                      {!isResolved ? (
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => setSelectedAlert(alert)}
                        >
                          Traiter
                        </button>
                      ) : (
                        <span className="badge badge-success">✓ Résolue</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* KYC Threshold Limits Card */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldAlert size={20} className="text-primary-500" />
            <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Limites réglementaires KYC (Normes UMOA)</h3>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-surface-500)' }}>
            Seuils et limites de portefeuilles en vigueur fixés par la BCEAO pour l'émission de monnaie électronique au Mali.
          </p>

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Niveau KYC</th>
                  <th>Solde maximum autorisé</th>
                  <th>Limite quotidienne d'envoi</th>
                  <th>Limite mensuelle cumulée</th>
                  <th>Documents obligatoires</th>
                </tr>
              </thead>
              <tbody>
                {KYC_LIMITS.map(limit => (
                  <tr key={limit.level}>
                    <td style={{ fontWeight: 700 }}>{limit.name}</td>
                    <td className="tabular-nums" style={{ fontWeight: 600 }}>{formatFCFA(limit.maxBalance)}</td>
                    <td className="tabular-nums" style={{ fontWeight: 600 }}>{formatFCFA(limit.dailyLimit)}</td>
                    <td className="tabular-nums" style={{ fontWeight: 600 }}>{formatFCFA(limit.monthlyLimit)}</td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--color-surface-600)', maxWidth: '300px' }}>
                      {limit.documents}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Alert Treatment Modal */}
      <AnimatePresence>
        {selectedAlert && (
          <div
            onClick={() => setSelectedAlert(null)}
            className="modal-overlay"
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="card"
              style={{ width: '100%', maxWidth: '440px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800 }}>Audit Compliance de l'Alerte</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
                <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-surface-50)', borderRadius: 'var(--radius-lg)' }} className="dark:bg-dark-surface">
                  <span style={{ fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Alerte déclenchée :</span>
                  {selectedAlert.description}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-surface-500)' }}>Date</span>
                  <span style={{ fontWeight: 600 }}>{formatDate(selectedAlert.created_at)}</span>
                </div>
                {selectedAlert.transaction_reference && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-surface-500)' }}>Référence transaction</span>
                    <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>{selectedAlert.transaction_reference}</span>
                  </div>
                )}
                {selectedAlert.transaction_montant && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-surface-500)' }}>Montant</span>
                    <span style={{ fontWeight: 700 }}>{formatFCFA(selectedAlert.transaction_montant)}</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setSelectedAlert(null)}>
                  Fermer
                </button>
                <button
                  className="btn btn-success"
                  style={{ flex: 1 }}
                  onClick={() => handleResolveAlert(selectedAlert.id)}
                >
                  Valider & Classer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
