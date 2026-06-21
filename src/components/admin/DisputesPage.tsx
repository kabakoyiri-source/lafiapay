// ============================================================================
// LafiaPay — Admin Disputes Kanban Board
// Visual workflow board to view, triage, and resolve client-merchant disputes
// ============================================================================

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Clock, CheckCircle2, ChevronRight, ChevronLeft, Eye, X, HelpCircle } from 'lucide-react';
import { mockStore } from '../../lib/mockData';
import { formatFCFA, formatDate } from '../../types';
import type { Litige, DisputeStatus } from '../../types';
import { useToast } from '../../contexts/ToastContext';

export default function DisputesPage() {
  const { showToast } = useToast();
  const [selectedDispute, setSelectedDispute] = useState<Litige | null>(null);

  // Tick for re-rendering on store mutations
  const [, setTick] = useState(0);
  useMemo(() => {
    return mockStore.subscribe(() => setTick(t => t + 1));
  }, []);

  const disputes = useMemo(() => {
    return mockStore.litiges;
  }, [mockStore.litiges]);

  // Group disputes by status
  const openDisputes = useMemo(() => disputes.filter(d => d.statut === 'ouvert'), [disputes]);
  const progressDisputes = useMemo(() => disputes.filter(d => d.statut === 'en_cours'), [disputes]);
  const resolvedDisputes = useMemo(() => disputes.filter(d => d.statut === 'resolu'), [disputes]);

  // Update dispute status
  const handleUpdateStatus = (id: string, nextStatus: DisputeStatus) => {
    mockStore.updateDisputeStatus(id, nextStatus);

    // Add to audit logs
    const dispute = disputes.find(d => d.id === id);
    mockStore.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      admin_id: 'demo-admin-001',
      action: 'Mise à jour litige',
      details: { litige_id: id, reference: dispute?.transaction_reference, nouveau_statut: nextStatus },
      created_at: new Date().toISOString(),
      admin_nom: 'Admin LafiaPay',
    });

    const statusLabels: Record<DisputeStatus, string> = {
      ouvert: 'Ouvert',
      en_cours: 'En cours de traitement',
      resolu: 'Résolu',
    };

    showToast({
      type: nextStatus === 'resolu' ? 'success' : 'info',
      title: 'Statut du litige mis à jour',
      message: `Le litige est désormais marqué comme : ${statusLabels[nextStatus]}.`,
    });

    if (selectedDispute && selectedDispute.id === id) {
      setSelectedDispute(prev => prev ? { ...prev, statut: nextStatus } : null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
      
      {/* Kanban Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', alignItems: 'flex-start' }}>
        
        {/* Column 1: A Traiter (Open) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-error-600)' }}>
              <AlertCircle size={20} />
              <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>À Traiter</h3>
            </div>
            <span className="badge badge-error" style={{ fontSize: '0.75rem' }}>{openDisputes.length}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minHeight: '400px', padding: '0.5rem', borderRadius: 'var(--radius-xl)', backgroundColor: 'var(--color-surface-100)' }} className="dark:bg-dark-surface">
            {openDisputes.length === 0 ? (
              <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--color-surface-400)', fontSize: '0.875rem' }}>
                Aucun litige en attente.
              </div>
            ) : (
              openDisputes.map(dispute => (
                <DisputeCard
                  key={dispute.id}
                  dispute={dispute}
                  onView={() => setSelectedDispute(dispute)}
                  onMoveRight={() => handleUpdateStatus(dispute.id, 'en_cours')}
                />
              ))
            )}
          </div>
        </div>

        {/* Column 2: En cours (In progress) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-warning-600)' }}>
              <Clock size={20} />
              <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>En cours d'examen</h3>
            </div>
            <span className="badge badge-warning" style={{ fontSize: '0.75rem' }}>{progressDisputes.length}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minHeight: '400px', padding: '0.5rem', borderRadius: 'var(--radius-xl)', backgroundColor: 'var(--color-surface-100)' }} className="dark:bg-dark-surface">
            {progressDisputes.length === 0 ? (
              <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--color-surface-400)', fontSize: '0.875rem' }}>
                Aucun litige en cours de traitement.
              </div>
            ) : (
              progressDisputes.map(dispute => (
                <DisputeCard
                  key={dispute.id}
                  dispute={dispute}
                  onView={() => setSelectedDispute(dispute)}
                  onMoveLeft={() => handleUpdateStatus(dispute.id, 'ouvert')}
                  onMoveRight={() => handleUpdateStatus(dispute.id, 'resolu')}
                />
              ))
            )}
          </div>
        </div>

        {/* Column 3: Résolu (Resolved) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-success-600)' }}>
              <CheckCircle2 size={20} />
              <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Résolus</h3>
            </div>
            <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>{resolvedDisputes.length}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minHeight: '400px', padding: '0.5rem', borderRadius: 'var(--radius-xl)', backgroundColor: 'var(--color-surface-100)' }} className="dark:bg-dark-surface">
            {resolvedDisputes.length === 0 ? (
              <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--color-surface-400)', fontSize: '0.875rem' }}>
                Aucun litige résolu.
              </div>
            ) : (
              resolvedDisputes.map(dispute => (
                <DisputeCard
                  key={dispute.id}
                  dispute={dispute}
                  onView={() => setSelectedDispute(dispute)}
                  onMoveLeft={() => handleUpdateStatus(dispute.id, 'en_cours')}
                />
              ))
            )}
          </div>
        </div>

      </div>

      {/* Dispute Detail Modal */}
      <AnimatePresence>
        {selectedDispute && (
          <div
            onClick={() => setSelectedDispute(null)}
            className="modal-overlay"
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              onClick={e => e.stopPropagation()}
              className="card"
              style={{ width: '100%', maxWidth: '520px', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 800 }}>Triage et Résolution du Litige</h3>
                <button className="btn btn-icon btn-secondary btn-sm" onClick={() => setSelectedDispute(null)}>
                  <X size={18} />
                </button>
              </div>

              {/* Status Indicator */}
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-surface-500)' }}>Statut du dossier :</span>
                <span className={`badge badge-${selectedDispute.statut === 'ouvert' ? 'error' : selectedDispute.statut === 'en_cours' ? 'warning' : 'success'}`}>
                  {selectedDispute.statut === 'ouvert' ? 'À Traiter' : selectedDispute.statut === 'en_cours' ? 'En cours' : 'Résolu'}
                </span>
              </div>

              {/* Dispute details */}
              <div style={{ padding: '1rem', backgroundColor: 'var(--color-surface-50)', borderRadius: 'var(--radius-xl)', fontSize: '0.875rem' }} className="dark:bg-dark-surface">
                <div style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Description du problème :</div>
                <p style={{ color: 'var(--color-surface-700)', lineHeight: '1.4' }} className="dark:text-dark-text-muted">
                  "{selectedDispute.description}"
                </p>
              </div>

              {/* Transaction details inside dispute */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
                <h4 style={{ fontWeight: 800, borderBottom: '1px solid var(--color-surface-200)', paddingBottom: '0.25rem' }} className="dark:border-dark-border">Transaction Associée</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-surface-500)' }}>Référence</span>
                  <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>{selectedDispute.transaction_reference}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-surface-500)' }}>Montant Litigieux</span>
                  <span style={{ fontWeight: 700 }} className="tabular-nums">{formatFCFA(selectedDispute.transaction_montant || 0)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-surface-500)' }}>Déclarant</span>
                  <span style={{ fontWeight: 600 }}>{selectedDispute.declarant_nom}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-surface-500)' }}>Ouverture du ticket</span>
                  <span style={{ fontWeight: 600 }}>{formatDate(selectedDispute.created_at)}</span>
                </div>
                {selectedDispute.resolved_at && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-surface-500)' }}>Résolu le</span>
                    <span style={{ fontWeight: 600, color: 'var(--color-success-600)' }}>{formatDate(selectedDispute.resolved_at)}</span>
                  </div>
                )}
              </div>

              {/* Resolution options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid var(--color-surface-200)', paddingTop: '1rem' }} className="dark:border-dark-border">
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-surface-500)' }}>Changer le statut du dossier :</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {selectedDispute.statut !== 'ouvert' && (
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1 }}
                      onClick={() => handleUpdateStatus(selectedDispute.id, 'ouvert')}
                    >
                      À Traiter
                    </button>
                  )}
                  {selectedDispute.statut !== 'en_cours' && (
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1, color: 'var(--color-warning-600)' }}
                      onClick={() => handleUpdateStatus(selectedDispute.id, 'en_cours')}
                    >
                      Mettre En Cours
                    </button>
                  )}
                  {selectedDispute.statut !== 'resolu' && (
                    <button
                      className="btn btn-success btn-sm"
                      style={{ flex: 1 }}
                      onClick={() => handleUpdateStatus(selectedDispute.id, 'resolu')}
                    >
                      Marquer Résolu
                    </button>
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

// Mini Component inside the file: DisputeCard
interface DisputeCardProps {
  dispute: Litige;
  onView: () => void;
  onMoveLeft?: () => void;
  onMoveRight?: () => void;
}

function DisputeCard({ dispute, onView, onMoveLeft, onMoveRight }: DisputeCardProps) {
  return (
    <motion.div
      layout
      className="card card-interactive"
      style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', cursor: 'pointer' }}
      onClick={onView}
    >
      {/* Card Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{dispute.declarant_nom}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-surface-500)', fontFamily: 'monospace' }}>
            Ref: {dispute.transaction_reference}
          </div>
        </div>
        <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-primary-600)' }} className="tabular-nums">
          {formatFCFA(dispute.transaction_montant || 0)}
        </div>
      </div>

      {/* Card Body */}
      <p style={{
        fontSize: '0.75rem',
        color: 'var(--color-surface-600)',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        lineHeight: '1.3',
      }}>
        {dispute.description}
      </p>

      {/* Card Footer controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-surface-100)', paddingTop: '0.5rem', marginTop: '0.25rem' }} className="dark:border-dark-border">
        <span style={{ fontSize: '0.6875rem', color: 'var(--color-surface-400)' }}>
          {new Date(dispute.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
        </span>
        
        <div style={{ display: 'flex', gap: '0.25rem' }} onClick={e => e.stopPropagation()}>
          {onMoveLeft && (
            <button className="btn btn-icon btn-secondary btn-sm" style={{ padding: '0.25rem' }} onClick={onMoveLeft}>
              <ChevronLeft size={14} />
            </button>
          )}
          <button className="btn btn-icon btn-secondary btn-sm" style={{ padding: '0.25rem' }} onClick={onView}>
            <Eye size={14} />
          </button>
          {onMoveRight && (
            <button className="btn btn-icon btn-secondary btn-sm" style={{ padding: '0.25rem' }} onClick={onMoveRight}>
              <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
