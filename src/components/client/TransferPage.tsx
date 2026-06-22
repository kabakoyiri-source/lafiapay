// ============================================================================
// LafiaPay — Client P2P Transfer Page
// Peer-to-peer transfers with 1% fee on sender and phone number lookup
// ============================================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, User, Phone, Check, Info } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { mockStore } from '../../lib/mockData';
import { formatFCFA, generateReference } from '../../types';
import type { Transaction, Profile } from '../../types';

type Step = 'recipient' | 'amount' | 'pin' | 'processing' | 'success';

export default function TransferPage() {
  const navigate = useNavigate();
  const { profile, compte, updateBalance } = useAuth();
  const { showToast } = useToast();

  const [step, setStep] = useState<Step>('recipient');
  const [phone, setPhone] = useState('');
  const [recipient, setRecipient] = useState<Profile | null>(null);
  const [amount, setAmount] = useState('');
  const [pin, setPin] = useState('');

  // Get eligible recipients (all clients except current user)
  const eligibleRecipients = mockStore.profiles.filter(
    p => p.role === 'client' && p.id !== profile?.id && p.statut === 'actif'
  );

  const handlePhoneChange = (val: string) => {
    setPhone(val);
    // Dynamic lookup
    const found = mockStore.profiles.find(
      p => p.role === 'client' && p.id !== profile?.id && p.telephone.replace(/\s+/g, '') === val.replace(/\s+/g, '')
    );
    if (found) {
      setRecipient(found);
    } else {
      setRecipient(null);
    }
  };

  const selectRecipient = (p: Profile) => {
    setRecipient(p);
    setPhone(p.telephone);
    setStep('amount');
  };

  const handlePinKey = (key: string) => {
    if (key === 'delete') {
      setPin(prev => prev.slice(0, -1));
    } else if (pin.length < 4) {
      const newPin = pin + key;
      setPin(newPin);
      if (newPin.length === 4) {
        setTimeout(() => processTransfer(), 300);
      }
    }
  };

  const processTransfer = async () => {
    setStep('processing');
    await new Promise(r => setTimeout(r, 2000));

    const amountNum = Number(amount);
    const frais = Math.round(amountNum * 0.01);
    const totalDebite = amountNum + frais;

    if (totalDebite > (compte?.solde ?? 0)) {
      showToast({
        type: 'error',
        title: 'Solde insuffisant',
        message: `Il vous faut ${formatFCFA(totalDebite)} pour ce transfert.`,
      });
      setStep('amount');
      setPin('');
      return;
    }

    // Create transaction
    const txn: Transaction = {
      id: `txn-${Date.now()}`,
      type: 'transfert',
      client_id: profile!.id,
      commercant_id: null,
      destinataire_id: recipient!.id,
      montant: amountNum,
      montant_brut: totalDebite,
      montant_net: amountNum,
      frais,
      statut: 'reussie',
      operateur_mobile_money: null,
      reference: generateReference(),
      created_at: new Date().toISOString(),
      client_nom: profile!.nom,
      destinataire_nom: recipient!.nom,
    };

    // Apply financial mutations in mock store
    mockStore.addTransaction(txn);
    updateBalance(-totalDebite);
    mockStore.updateBalance(recipient!.id, amountNum);

    setStep('success');
    showToast({
      type: 'success',
      title: 'Transfert effectué !',
      message: `${formatFCFA(amountNum)} envoyés à ${recipient!.nom}`,
    });
  };

  const amountNum = Number(amount) || 0;
  const transferFee = Math.round(amountNum * 0.01);
  const totalDebited = amountNum + transferFee;

  return (
    <div style={{ padding: '1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <button
          className="btn btn-icon btn-secondary"
          onClick={() => {
            if (step === 'recipient') navigate(-1);
            else if (step === 'amount') setStep('recipient');
            else if (step === 'pin') setStep('amount');
          }}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Transférer</h1>
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Select Recipient */}
        {step === 'recipient' && (
          <motion.div
            key="recipient"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <p style={{ fontSize: '0.875rem', color: 'var(--color-surface-500)', marginBottom: '1rem' }}>
              Saisissez le numéro du destinataire ou choisissez un contact
            </p>

            <div className="input-group" style={{ marginBottom: '1.5rem' }}>
              <label className="input-label">Numéro de téléphone</label>
              <input
                className="input-field"
                placeholder="Ex: +223 76 12 34 56"
                value={phone}
                onChange={e => handlePhoneChange(e.target.value)}
              />
            </div>

            {recipient && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="card"
                style={{
                  padding: '1rem',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  border: '1.5px solid var(--color-primary-500)',
                  background: 'var(--color-primary-50)',
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--color-primary-200)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-primary-700)',
                    fontWeight: 700,
                  }}
                >
                  {recipient.nom.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--color-primary-900)' }}>
                    {recipient.nom}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-primary-600)' }}>
                    Client Vérifié · KYC Niveau {recipient.kyc_niveau}
                  </div>
                </div>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setStep('amount')}
                >
                  Continuer
                </button>
              </motion.div>
            )}

            {/* Quick Contacts List */}
            <h2 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--color-surface-600)' }}>
              Contacts suggérés
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {eligibleRecipients.slice(0, 4).map(p => (
                <div
                  key={p.id}
                  className="card card-interactive"
                  onClick={() => selectRecipient(p)}
                  style={{
                    padding: '0.75rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    cursor: 'pointer',
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--color-surface-100)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 600,
                    }}
                  >
                    {p.nom.charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{p.nom}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-surface-500)' }}>{p.telephone}</div>
                  </div>
                  <Phone size={16} style={{ color: 'var(--color-surface-400)' }} />
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Step 2: Amount Entry */}
        {step === 'amount' && recipient && (
          <motion.div
            key="amount"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {/* Recipient Details Card */}
            <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--color-surface-100)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 600,
                }}
              >
                {recipient.nom.charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{recipient.nom}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-surface-500)' }}>{recipient.telephone}</div>
              </div>
              <User size={18} style={{ color: 'var(--color-primary-500)' }} />
            </div>

            {/* Input Amount */}
            <div className="input-group" style={{ marginBottom: '1.25rem' }}>
              <label className="input-label">Montant à envoyer (FCFA)</label>
              <input
                className="input-field"
                type="number"
                placeholder="0"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                style={{ fontSize: '1.5rem', fontWeight: 700, textAlign: 'center' }}
                autoFocus
              />
            </div>

            {/* Fees Calculator Breakdown */}
            {amountNum > 0 && (
              <div
                className="card"
                style={{
                  padding: '1rem',
                  marginBottom: '1.5rem',
                  background: 'var(--color-surface-50)',
                  border: '1px solid var(--color-surface-200)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--color-surface-500)' }}>Montant transféré</span>
                  <span style={{ fontWeight: 600 }}>{formatFCFA(amountNum)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--color-surface-500)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    Frais de service (1%) <Info size={12} style={{ color: 'var(--color-primary-500)' }} />
                  </span>
                  <span style={{ fontWeight: 600, color: 'var(--color-accent-700)' }}>+{formatFCFA(transferFee)}</span>
                </div>
                <div style={{ height: 1, background: 'var(--color-surface-200)', margin: '0.5rem 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', fontWeight: 700 }}>
                  <span>Total débité</span>
                  <span style={{ color: 'var(--color-primary-700)' }}>{formatFCFA(totalDebited)}</span>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--color-surface-500)' }}>Solde disponible :</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>{formatFCFA(compte?.solde ?? 0)}</span>
            </div>

            <button
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
              disabled={amountNum < 100 || totalDebited > (compte?.solde ?? 0)}
              onClick={() => {
                setPin('');
                setStep('pin');
              }}
            >
              {totalDebited > (compte?.solde ?? 0)
                ? 'Solde insuffisant'
                : `Confirmer · ${formatFCFA(amountNum)}`}
            </button>
          </motion.div>
        )}

        {/* Step 3: Pin Verification */}
        {step === 'pin' && recipient && (
          <motion.div
            key="pin"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            style={{ textAlign: 'center', paddingTop: '1rem' }}
          >
            <p style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>Valider le transfert vers</p>
            <p style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-surface-900)', marginBottom: '0.25rem' }}>
              {recipient.nom}
            </p>
            <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-primary-700)', marginBottom: '1.5rem' }}>
              {formatFCFA(amountNum)}
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-surface-500)', marginBottom: '1.5rem' }}>
              (Frais de {formatFCFA(transferFee)} inclus. Total débité : {formatFCFA(totalDebited)})
            </p>

            {/* PIN Dots */}
            <div className="pin-dots" style={{ marginBottom: '2rem' }}>
              {[0, 1, 2, 3].map(i => (
                <div key={i} className={`pin-dot ${i < pin.length ? 'filled' : ''}`} />
              ))}
            </div>

            {/* PIN Pad */}
            <div className="pin-pad">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'delete'].map(key =>
                key === '' ? (
                  <div key="empty" />
                ) : (
                  <motion.button
                    key={key}
                    whileTap={{ scale: 0.85 }}
                    className="pin-key"
                    onClick={() => handlePinKey(key)}
                  >
                    {key === 'delete' ? '⌫' : key}
                  </motion.button>
                )
              )}
            </div>
          </motion.div>
        )}

        {/* Step 4: Processing */}
        {step === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ textAlign: 'center', paddingTop: '3rem' }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                border: '3px solid var(--color-surface-200)',
                borderTopColor: 'var(--color-primary-600)',
                margin: '0 auto 1.5rem',
              }}
            />
            <p style={{ fontWeight: 700, fontSize: '1.125rem' }}>Transfert en cours...</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-surface-500)', marginTop: '0.25rem' }}>
              Envoi sécurisé vers {recipient?.nom}
            </p>
          </motion.div>
        )}

        {/* Step 5: Success */}
        {step === 'success' && recipient && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ textAlign: 'center', paddingTop: '2rem' }}
          >
            <svg className="checkmark-svg" viewBox="0 0 52 52" style={{ margin: '0 auto 1.5rem' }}>
              <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none" />
              <path className="checkmark-check" fill="none" d="m14.1 27.2 7.1 7.2 16.7-16.8" />
            </svg>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--color-success-600)' }}>
              Transfert envoyé !
            </h2>
            <p className="amount-display" style={{ fontSize: '1.75rem', color: 'var(--color-primary-700)' }}>
              {formatFCFA(amountNum)}
            </p>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-surface-500)', margin: '0.25rem 0 2rem' }}>
              transférés à <strong>{recipient.nom}</strong>
            </p>

            <button
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
              onClick={() => navigate('/client')}
            >
              Retour à l'accueil
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
