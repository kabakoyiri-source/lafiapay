// ============================================================================
// LafiaPay — Client Recharge Page
// Mobile Money top-up flow with operator selection and success animation
// ============================================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, Smartphone } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { mockStore } from '../../lib/mockData';
import { formatFCFA, generateReference, OPERATOR_INFO, QUICK_AMOUNTS } from '../../types';
import type { MobileMoneyOperator, Transaction } from '../../types';

type Step = 'amount' | 'operator' | 'confirm' | 'processing' | 'success';

export default function RechargePage() {
  const navigate = useNavigate();
  const { profile, updateBalance } = useAuth();
  const { showToast } = useToast();

  const [step, setStep] = useState<Step>('amount');
  const [amount, setAmount] = useState<number>(0);
  const [customAmount, setCustomAmount] = useState('');
  const [operator, setOperator] = useState<MobileMoneyOperator | null>(null);

  const selectedAmount = amount || Number(customAmount) || 0;

  const handleAmountSelect = (val: number) => {
    setAmount(val);
    setCustomAmount('');
  };

  const handleNext = () => {
    if (step === 'amount' && selectedAmount > 0) setStep('operator');
    else if (step === 'operator' && operator) setStep('confirm');
    else if (step === 'confirm') processRecharge();
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
      statut: 'reussie',
      operateur_mobile_money: operator,
      reference: generateReference(),
      created_at: new Date().toISOString(),
      client_nom: profile!.nom,
    };

    mockStore.addTransaction(txn);
    updateBalance(selectedAmount);
    setStep('success');
    showToast({ type: 'success', title: 'Recharge réussie !', message: `+${formatFCFA(selectedAmount)} ajoutés` });
  };

  return (
    <div style={{ padding: '1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <button className="btn btn-icon btn-secondary" onClick={() => step === 'amount' ? navigate(-1) : setStep('amount')}>
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Recharger</h1>
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Amount Selection */}
        {step === 'amount' && (
          <motion.div key="amount" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-surface-500)', marginBottom: '1rem' }}>
              Choisissez le montant à recharger
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

            <button
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
              disabled={selectedAmount < 100}
              onClick={handleNext}
            >
              Continuer · {selectedAmount > 0 ? formatFCFA(selectedAmount) : '—'}
            </button>
          </motion.div>
        )}

        {/* Step 2: Operator Selection */}
        {step === 'operator' && (
          <motion.div key="operator" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-surface-500)', marginBottom: '1rem' }}>
              Choisissez votre opérateur Mobile Money
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {(Object.entries(OPERATOR_INFO) as [MobileMoneyOperator, typeof OPERATOR_INFO[MobileMoneyOperator]][]).map(([key, info]) => (
                <motion.button
                  key={key}
                  whileTap={{ scale: 0.97 }}
                  className={`operator-badge ${operator === key ? 'selected' : ''}`}
                  style={{
                    background: info.bgColor,
                    padding: '1.25rem',
                    justifyContent: 'flex-start',
                    fontSize: '1rem',
                  }}
                  onClick={() => setOperator(key)}
                >
                  <Smartphone size={22} />
                  <span style={{ fontWeight: 700 }}>{info.label}</span>
                  {operator === key && <Check size={20} style={{ marginLeft: 'auto' }} />}
                </motion.button>
              ))}
            </div>

            <button
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
              disabled={!operator}
              onClick={handleNext}
            >
              Confirmer l'opérateur
            </button>
          </motion.div>
        )}

        {/* Step 3: Confirmation */}
        {step === 'confirm' && (
          <motion.div key="confirm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem', textAlign: 'center' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-surface-500)', marginBottom: '0.5rem' }}>Montant de la recharge</p>
              <div className="amount-display" style={{ fontSize: '2rem', color: 'var(--color-primary-700)', marginBottom: '1rem' }}>
                {formatFCFA(selectedAmount)}
              </div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)',
                background: operator ? OPERATOR_INFO[operator].bgColor : '#666',
                color: 'white', fontWeight: 600, fontSize: '0.875rem',
              }}>
                <Smartphone size={16} />
                {operator ? OPERATOR_INFO[operator].label : ''}
              </div>
            </div>

            <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={handleNext}>
              Confirmer la recharge
            </button>
          </motion.div>
        )}

        {/* Step 4: Processing */}
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
            <p style={{ fontWeight: 700, fontSize: '1.125rem', marginBottom: '0.5rem' }}>Traitement en cours...</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-surface-500)' }}>
              Connexion avec {operator ? OPERATOR_INFO[operator].label : 'l\'opérateur'}
            </p>
          </motion.div>
        )}

        {/* Step 5: Success */}
        {step === 'success' && (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', paddingTop: '2rem' }}>
            <svg className="checkmark-svg" viewBox="0 0 52 52" style={{ margin: '0 auto 1.5rem' }}>
              <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none" />
              <path className="checkmark-check" fill="none" d="m14.1 27.2 7.1 7.2 16.7-16.8" />
            </svg>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--color-success-600)' }}>
              Recharge réussie !
            </h2>
            <p className="amount-display" style={{ fontSize: '1.75rem', color: 'var(--color-primary-700)', marginBottom: '0.25rem' }}>
              +{formatFCFA(selectedAmount)}
            </p>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-surface-500)', marginBottom: '2rem' }}>
              Votre solde a été mis à jour
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
