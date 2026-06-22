// ============================================================================
// LafiaPay — Admin Reconciliation Module
// Interactive system matching virtual ledgers with simulated escrow accounts
// ============================================================================

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, CheckCircle, AlertTriangle, ShieldCheck, Landmark, ArrowRight, Info } from 'lucide-react';
import { mockStore } from '../../lib/mockData';
import { formatFCFA } from '../../types';
import { useToast } from '../../contexts/ToastContext';

export default function ReconciliationPage() {
  const { showToast } = useToast();
  const [reconState, setReconState] = useState<'idle' | 'running' | 'success' | 'warning'>('idle');
  const [currentStep, setCurrentStep] = useState(0);
  const [hasDiscrepancy, setHasDiscrepancy] = useState(false);

  // Read current balances from mockStore
  const stats = useMemo(() => {
    const totalClientBalance = mockStore.comptes
      .filter(c => {
        const p = mockStore.getProfile(c.profile_id);
        return p?.role === 'client';
      })
      .reduce((sum, c) => sum + c.solde, 0);

    const totalMerchantBalance = mockStore.comptes
      .filter(c => {
        const p = mockStore.getProfile(c.profile_id);
        return p?.role === 'commercant';
      })
      .reduce((sum, c) => sum + c.solde, 0);

    const totalAgentBalance = mockStore.comptes
      .filter(c => {
        const p = mockStore.getProfile(c.profile_id);
        return p?.role === 'agent';
      })
      .reduce((sum, c) => sum + c.solde, 0);

    const totalPlatformRevenue = mockStore.transactions
      .filter(t => t.statut === 'reussie')
      .reduce((sum, t) => sum + (t.frais || 0), 0);

    const totalVirtualCirculation = totalClientBalance + totalMerchantBalance + totalAgentBalance + totalPlatformRevenue;

    // Escrow Account (Cantonnement BCEAO)
    // Normally matched exactly. If hasDiscrepancy is true, we simulate a small difference of 15,000 FCFA.
    const escrowBalance = hasDiscrepancy 
      ? totalVirtualCirculation - 15000 
      : totalVirtualCirculation;

    return {
      totalClientBalance,
      totalMerchantBalance,
      totalAgentBalance,
      totalPlatformRevenue,
      totalVirtualCirculation,
      escrowBalance,
      gap: escrowBalance - totalVirtualCirculation,
    };
  }, [hasDiscrepancy, mockStore.comptes, mockStore.transactions]);

  // Steps to display in the scanning animation
  const STEPS = [
    'Calcul de la masse monétaire virtuelle globale...',
    'Interrogation du solde du compte de cantonnement (Banque Centrale)...',
    'Vérification de la concordance des écritures de dépôts...',
    'Audit de la balance transactions vs commissions...',
    'Calcul de l\'écart de réconciliation...',
  ];

  // Launch reconciliation process
  const startReconciliation = () => {
    setReconState('running');
    setCurrentStep(0);

    // Sequence steps one by one
    const timer = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= STEPS.length - 1) {
          clearInterval(timer);
          setTimeout(() => {
            if (stats.gap === 0) {
              setReconState('success');
              showToast({
                type: 'success',
                title: 'Réconciliation réussie',
                message: 'Aucun écart détecté entre les portefeuilles et la banque.',
              });
              // Log to audit log
              mockStore.auditLogs.unshift({
                id: `audit-${Date.now()}`,
                admin_id: 'demo-admin-001',
                action: 'Réconciliation effectuée',
                details: { status: 'Conforme', écart: 0, circulation: stats.totalVirtualCirculation },
                created_at: new Date().toISOString(),
                admin_nom: 'Admin LafiaPay',
              });
            } else {
              setReconState('warning');
              showToast({
                type: 'error',
                title: 'Écart de réconciliation détecté',
                message: `Une anomalie de ${formatFCFA(Math.abs(stats.gap))} a été identifiée.`,
              });
              // Log warning to audit log
              mockStore.auditLogs.unshift({
                id: `audit-${Date.now()}`,
                admin_id: 'demo-admin-001',
                action: 'Réconciliation effectuée (ANOMALIE)',
                details: { status: 'Non-conforme', écart: stats.gap, circulation: stats.totalVirtualCirculation },
                created_at: new Date().toISOString(),
                admin_nom: 'Admin LafiaPay',
              });
            }
          }, 800);
          return prev;
        }
        return prev + 1;
      });
    }, 900);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Simulation options */}
      <div className="card" style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Info size={16} style={{ color: 'var(--color-primary-500)' }} />
          <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Outils de démonstration :</span>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={() => {
              setHasDiscrepancy(false);
              setReconState('idle');
            }}
            className={`btn btn-sm ${!hasDiscrepancy ? 'btn-primary' : 'btn-secondary'}`}
          >
            Mode Standard (Écart = 0)
          </button>
          <button
            onClick={() => {
              setHasDiscrepancy(true);
              setReconState('idle');
            }}
            className={`btn btn-sm ${hasDiscrepancy ? 'btn-accent' : 'btn-secondary'}`}
            style={{ color: hasDiscrepancy ? 'white' : '#d4a017' }}
          >
            Simuler une anomalie (Écart ≠ 0)
          </button>
        </div>
      </div>

      {/* Main Comparative Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        
        {/* virtual ledger */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary-600)' }}>
            <Landmark size={20} />
            <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Masse Monétaire LafiaPay</h3>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-surface-500)' }}>
            Total de la monnaie électronique en circulation sur les portefeuilles virtuels des utilisateurs.
          </p>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0.5rem 0' }} className="tabular-nums">
            {formatFCFA(stats.totalVirtualCirculation)}
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid var(--color-surface-200)', paddingTop: '0.75rem' }} className="dark:border-dark-border">
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
              <span style={{ color: 'var(--color-surface-500)' }}>Portefeuilles Clients</span>
              <span style={{ fontWeight: 600 }} className="tabular-nums">{formatFCFA(stats.totalClientBalance)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
              <span style={{ color: 'var(--color-surface-500)' }}>Portefeuilles Commerçants</span>
              <span style={{ fontWeight: 600 }} className="tabular-nums">{formatFCFA(stats.totalMerchantBalance)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
              <span style={{ color: 'var(--color-surface-500)' }}>Portefeuilles Agents</span>
              <span style={{ fontWeight: 600 }} className="tabular-nums">{formatFCFA(stats.totalAgentBalance)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
              <span style={{ color: 'var(--color-surface-500)' }}>Frais collectés LafiaPay</span>
              <span style={{ fontWeight: 600 }} className="tabular-nums">{formatFCFA(stats.totalPlatformRevenue)}</span>
            </div>
          </div>
        </div>

        {/* Escrow Account */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-accent-600)' }}>
            <ShieldCheck size={20} />
            <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Compte de Cantonnement (BCEAO)</h3>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-surface-500)' }}>
            Fonds fiduciaires de garantie déposés à la Banque Centrale. Doit correspondre à 100% de la monnaie émise.
          </p>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0.5rem 0' }} className="tabular-nums">
            {formatFCFA(stats.escrowBalance)}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid var(--color-surface-200)', paddingTop: '0.75rem' }} className="dark:border-dark-border">
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
              <span style={{ color: 'var(--color-surface-500)' }}>Banque de dépôt</span>
              <span style={{ fontWeight: 600 }}>BCEAO (Mali)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
              <span style={{ color: 'var(--color-surface-500)' }}>Type de compte</span>
              <span style={{ fontWeight: 600 }}>Compte Escrow Séquestre</span>
            </div>
          </div>
        </div>

      </div>

      {/* Discrepancy Status Card */}
      <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', textAlign: 'center' }}>
        <div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: '0.25rem' }}>Statut de l'alignement comptable</h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-surface-500)' }}>Dernière vérification à l'instant</p>
        </div>

        {/* Big visual indicator */}
        {reconState === 'idle' && (
          <div style={{ padding: '1.25rem 2rem', borderRadius: 'var(--radius-xl)', backgroundColor: 'var(--color-surface-100)', display: 'flex', gap: '2rem', alignItems: 'center' }} className="dark:bg-dark-surface">
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-surface-500)' }}>Écart Actuel</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800 }} className="tabular-nums">-- FCFA</div>
            </div>
            <button className="btn btn-primary" onClick={startReconciliation}>
              <RefreshCw size={18} />
              Lancer la réconciliation
            </button>
          </div>
        )}

        {/* Scanning loop */}
        {reconState === 'running' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', width: '100%', maxWidth: '400px' }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, ease: 'linear', duration: 1.5 }}
              style={{ color: 'var(--color-primary-500)' }}
            >
              <RefreshCw size={36} />
            </motion.div>
            <div style={{ width: '100%', height: '6px', background: 'var(--color-surface-200)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
                style={{ height: '100%', background: 'var(--color-primary-600)' }}
              />
            </div>
            <p style={{ fontSize: '0.875rem', fontWeight: 600 }} className="animate-pulse">
              {STEPS[currentStep]}
            </p>
          </div>
        )}

        {/* Success output */}
        {reconState === 'success' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'var(--color-success-100)', color: 'var(--color-success-600)' }}>
              <CheckCircle size={36} />
            </div>
            <div>
              <span className="badge badge-success" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
                Système Équilibré (Conforme)
              </span>
              <p style={{ fontSize: '0.875rem', marginTop: '0.75rem', color: 'var(--color-surface-600)' }}>
                La balance est de <span style={{ fontWeight: 700 }} className="tabular-nums">0 FCFA</span>. La masse de monnaie virtuelle émise est couverte à 100% par les dépôts en banque séquestre.
              </p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setReconState('idle')}>
              Refaire l'audit
            </button>
          </div>
        )}

        {/* Warning output */}
        {reconState === 'warning' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'var(--color-error-100)', color: 'var(--color-error-600)' }}>
              <AlertTriangle size={36} />
            </div>
            <div>
              <span className="badge badge-error" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
                Écart de Balance Détecté
              </span>
              <p style={{ fontSize: '0.875rem', marginTop: '0.75rem', color: 'var(--color-surface-600)' }}>
                Attention ! Un écart de <span style={{ fontWeight: 800, color: 'var(--color-error-600)' }} className="tabular-nums">{formatFCFA(Math.abs(stats.gap))}</span> a été identifié. Les fonds bancaires garantis sont inférieurs à la masse virtuelle émise.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setReconState('idle')}>
                Refaire l'audit
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => {
                showToast({
                  type: 'info',
                  title: 'Alerte transmise',
                  message: 'Alerte transmise au département conformité pour enquête.',
                });
              }}>
                Signaler l'écart
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
