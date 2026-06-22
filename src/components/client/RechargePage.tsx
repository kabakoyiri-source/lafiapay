// ============================================================================
// LafiaPay — Client Recharge Page
// Agent-only deposit flow with QR simulation, instructions, and agent validation
// ============================================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, QrCode, Copy, Info } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { mockStore } from '../../lib/mockData';
import { formatFCFA, generateReference, QUICK_AMOUNTS } from '../../types';
import type { Transaction } from '../../types';

type Step = 'amount' | 'code' | 'processing' | 'success';

export default function RechargePage() {
  const navigate = useNavigate();
  const { profile, updateBalance } = useAuth();
  const { showToast } = useToast();

  const [step, setStep] = useState<Step>('amount');
  const [amount, setAmount] = useState<number>(0);
  const [customAmount, setCustomAmount] = useState('');
  const [depositCode, setDepositCode] = useState('');

  const selectedAmount = amount || Number(customAmount) || 0;

  const handleAmountSelect = (val: number) => {
    setAmount(val);
    setCustomAmount('');
  };

  const handleNext = () => {
    if (step === 'amount' && selectedAmount >= 100) {
      // Generate 6-digit deposit code
      const code = `LFA-${Math.floor(100000 + Math.random() * 900000)}`;
      setDepositCode(code);
      setStep('code');
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(depositCode);
    showToast({ type: 'success', title: 'Code copié', message: 'Le code de dépôt a été copié dans le presse-papiers' });
  };

  const processRecharge = async () => {
    setStep('processing');
    await new Promise(r => setTimeout(r, 2500)); // Simulate processing

    // Create transaction
    const txn: Transaction = {
      id: `txn-${Date.now()}`,
      type: 'depot',
      client_id: profile!.id,
      commercant_id: null,
      montant: selectedAmount,
      montant_brut: selectedAmount,
      montant_net: selectedAmount,
      frais: 0,
      statut: 'reussie',
      operateur_mobile_money: null,
      reference: generateReference(),
      created_at: new Date().toISOString(),
      client_nom: profile!.nom,
    };

    mockStore.addTransaction(txn);
    updateBalance(selectedAmount);
    setStep('success');
    showToast({ type: 'success', title: 'Dépôt validé !', message: `+${formatFCFA(selectedAmount)} ajoutés à votre solde` });
  };

  return (
    <div style={{ padding: '1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <button 
          className="btn btn-icon btn-secondary" 
          onClick={() => step === 'amount' ? navigate(-1) : setStep('amount')}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Recharger</h1>
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Amount Selection */}
        {step === 'amount' && (
          <motion.div key="amount" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-surface-500)', marginBottom: '1rem' }}>
              Choisissez le montant du dépôt physique chez l'agent
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
              {QUICK_AMOUNTS.map(val => (
                <motion.button
                  key={val}
                  whileTap={{ scale: 0.95 }}
                  className={`card card-interactive`}
                  onClick={() => handleAmountSelect(val)}
                  style={{
                    padding: '1.125rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    border: amount === val ? '2px solid var(--color-primary-500)' : '2px solid transparent',
                    background: amount === val ? 'var(--color-primary-50)' : undefined,
                  }}
                >
                  <div className="amount-display" style={{ fontSize: '1.25rem', color: 'var(--color-primary-700)' }}>
                    {val.toLocaleString('fr-FR')}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-surface-500)', marginTop: '0.125rem' }}>FCFA</div>
                </motion.button>
              ))}
            </div>

            <div className="input-group" style={{ marginBottom: '1.5rem' }}>
              <label className="input-label">Montant personnalisé</label>
              <input
                className="input-field"
                type="number"
                placeholder="Saisir un montant"
                value={customAmount}
                onChange={e => { setCustomAmount(e.target.value); setAmount(0); }}
                min={100}
              />
            </div>

            <div className="card" style={{ padding: '1rem', background: 'var(--color-surface-50)', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <Info size={20} style={{ color: 'var(--color-primary-600)', flexShrink: 0 }} />
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-surface-600)' }}>
                Les recharges LafiaPay s'effectuent uniquement par dépôt d'espèces physique auprès d'un agent agréé. Aucun frais n'est prélevé sur les dépôts.
              </p>
            </div>

            <button
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
              disabled={selectedAmount < 100}
              onClick={handleNext}
            >
              Générer le code de dépôt · {selectedAmount > 0 ? formatFCFA(selectedAmount) : '—'}
            </button>
          </motion.div>
        )}

        {/* Step 2: Code Generation & QR Simulation */}
        {step === 'code' && (
          <motion.div key="code" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem', textAlign: 'center' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-surface-500)', marginBottom: '0.25rem' }}>Dépôt d'espèces</p>
              <div className="amount-display" style={{ fontSize: '1.75rem', color: 'var(--color-primary-700)', marginBottom: '1rem' }}>
                {formatFCFA(selectedAmount)}
              </div>

              {/* Code display */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: 'var(--color-surface-100)', padding: '0.75rem', borderRadius: 'var(--radius-lg)', marginBottom: '1.5rem' }}>
                <span className="tabular-nums" style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--color-surface-900)', letterSpacing: '0.05em' }}>
                  {depositCode}
                </span>
                <button className="btn btn-icon btn-secondary btn-sm" onClick={handleCopyCode} style={{ padding: '0.375rem' }}>
                  <Copy size={16} />
                </button>
              </div>

              {/* QR Code simulation */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                <div style={{ padding: '1rem', background: 'white', borderRadius: 'var(--radius-xl)', border: '2px solid var(--color-surface-200)' }}>
                  {/* Styled QR Block SVG */}
                  <svg width="140" height="140" viewBox="0 0 140 140" style={{ display: 'block' }}>
                    {/* Corners */}
                    <rect x="10" y="10" width="30" height="30" fill="none" stroke="var(--color-surface-900)" strokeWidth="8" />
                    <rect x="18" y="18" width="14" height="14" fill="var(--color-surface-900)" />
                    
                    <rect x="100" y="10" width="30" height="30" fill="none" stroke="var(--color-surface-900)" strokeWidth="8" />
                    <rect x="108" y="18" width="14" height="14" fill="var(--color-surface-900)" />
                    
                    <rect x="10" y="100" width="30" height="30" fill="none" stroke="var(--color-surface-900)" strokeWidth="8" />
                    <rect x="18" y="108" width="14" height="14" fill="var(--color-surface-900)" />
                    
                    {/* center logo area background */}
                    <rect x="55" y="55" width="30" height="30" fill="white" />
                    <circle cx="70" cy="70" r="14" fill="var(--color-primary-500)" />
                    <path d="M70 65 L70 75 M65 70 L75 70" stroke="white" strokeWidth="3" />

                    {/* Random patterns */}
                    <rect x="50" y="10" width="10" height="20" fill="var(--color-surface-700)" />
                    <rect x="50" y="35" width="20" height="10" fill="var(--color-surface-700)" />
                    <rect x="80" y="10" width="10" height="10" fill="var(--color-surface-700)" />
                    <rect x="80" y="30" width="10" height="20" fill="var(--color-surface-700)" />
                    
                    <rect x="10" y="50" width="20" height="10" fill="var(--color-surface-700)" />
                    <rect x="10" y="70" width="10" height="20" fill="var(--color-surface-700)" />
                    <rect x="35" y="50" width="10" height="20" fill="var(--color-surface-700)" />
                    
                    <rect x="100" y="50" width="20" height="10" fill="var(--color-surface-700)" />
                    <rect x="100" y="70" width="10" height="10" fill="var(--color-surface-700)" />
                    <rect x="120" y="80" width="10" height="10" fill="var(--color-surface-700)" />
                    
                    <rect x="50" y="90" width="20" height="10" fill="var(--color-surface-700)" />
                    <rect x="50" y="110" width="10" height="20" fill="var(--color-surface-700)" />
                    <rect x="70" y="100" width="20" height="10" fill="var(--color-surface-700)" />
                    <rect x="80" y="120" width="40" height="10" fill="var(--color-surface-700)" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <h3 style={{ fontSize: '0.875rem', fontWeight: 800, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-surface-500)' }}>
              Instructions de recharge
            </h3>

            <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
              <ol style={{ fontSize: '0.875rem', paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', color: 'var(--color-surface-700)' }}>
                <li>Rendez-vous dans un point de service ou chez un agent physique <strong>LafiaPay</strong>.</li>
                <li>Présentez-lui ce code de recharge <strong>{depositCode}</strong> ou faites scanner le code QR.</li>
                <li>Remettez-lui la somme de <strong>{formatFCFA(selectedAmount)}</strong> en espèces.</li>
                <li>L'agent validera la réception sur son terminal et votre compte sera instantanément crédité.</li>
              </ol>
            </div>

            {/* Demo simulation block */}
            <div className="card" style={{ padding: '1.25rem', border: '1.5px dashed var(--color-accent-500)', background: 'var(--color-accent-50)', marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-accent-800)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Simulation Démo (Test)
              </h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-accent-700)', marginBottom: '1rem' }}>
                Pour tester l'application sans vous déplacer, simulez la validation instantanée par l'agent.
              </p>
              <button className="btn btn-accent btn-lg" style={{ width: '100%' }} onClick={processRecharge}>
                Simuler la validation de l'agent
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Processing */}
        {step === 'processing' && (
          <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', paddingTop: '3rem' }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              style={{
                width: 64, height: 64, borderRadius: '50%',
                border: '3px solid var(--color-surface-200)',
                borderTopColor: 'var(--color-primary-600)',
                margin: '0 auto 1.5rem',
              }}
            />
            <p style={{ fontWeight: 700, fontSize: '1.125rem', marginBottom: '0.5rem' }}>Validation par l'agent en cours...</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-surface-500)' }}>
              En attente du signal de confirmation du terminal agent...
            </p>
          </motion.div>
        )}

        {/* Step 4: Success */}
        {step === 'success' && (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', paddingTop: '2rem' }}>
            <svg className="checkmark-svg" viewBox="0 0 52 52" style={{ margin: '0 auto 1.5rem' }}>
              <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none" />
              <path className="checkmark-check" fill="none" d="m14.1 27.2 7.1 7.2 16.7-16.8" />
            </svg>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--color-success-600)' }}>
              Recharge validée !
            </h2>
            <p className="amount-display" style={{ fontSize: '1.75rem', color: 'var(--color-primary-700)', marginBottom: '0.25rem' }}>
              +{formatFCFA(selectedAmount)}
            </p>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-surface-500)', marginBottom: '2rem' }}>
              Crédité sur votre compte par l'agent
            </p>

            <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={() => navigate('/client')}>
              Retour à l'accueil
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
