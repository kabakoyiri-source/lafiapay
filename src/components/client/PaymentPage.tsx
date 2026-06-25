// ============================================================================
// LafiaPay — Client Payment Page
// QR scan simulation + manual merchant entry + PIN verification + success
// ============================================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Hash, Store, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { mockStore } from '../../lib/mockData';
import { formatFCFA, generateReference, CATEGORY_INFO } from '../../types';
import QRScanner from '../common/QRScanner';
import type { Transaction, Commercant } from '../../types';

type Step = 'scan' | 'merchant' | 'amount' | 'pin' | 'processing' | 'success';

export default function PaymentPage() {
  const navigate = useNavigate();
  const { profile, compte, updateBalance } = useAuth();
  const { showToast } = useToast();

  const [step, setStep] = useState<Step>('scan');
  const [merchant, setMerchant] = useState<Commercant | null>(null);
  const [amount, setAmount] = useState('');
  const [pin, setPin] = useState('');
  const [manualCode, setManualCode] = useState('');

  // Handle QR scan result — format: LAFIAPAY:MERCHANT:{qr_code_id}
  const handleQRScan = (data: string) => {
    let found: Commercant | undefined;

    if (data.startsWith('LAFIAPAY:MERCHANT:')) {
      const qrCodeId = data.split(':')[2];
      found = mockStore.getCommerçantByQR(qrCodeId);
    } else {
      // Fallback: try matching raw QR code ID
      found = mockStore.getCommerçantByQR(data) ||
        mockStore.commercants.find(c => c.qr_code_id.toLowerCase() === data.toLowerCase());
    }

    if (found) {
      setMerchant(found);
      setStep('amount');
      showToast({ type: 'success', title: 'Commerçant identifié', message: found.nom_boutique });
    } else {
      showToast({ type: 'error', title: 'QR non reconnu', message: 'Ce QR code ne correspond à aucun commerçant LafiaPay' });
    }
  };

  // Simulate scan: pick the demo merchant
  const simulatedMerchantQR = `LAFIAPAY:MERCHANT:${mockStore.commercants[0]?.qr_code_id || 'QR-EPICERIE-SOGO'}`;

  const handleManualCode = () => {
    const found = mockStore.getCommerçantByQR(manualCode) ||
      mockStore.commercants.find(c => c.qr_code_id.toLowerCase() === manualCode.toLowerCase());
    if (found) {
      setMerchant(found);
      setStep('amount');
    } else {
      showToast({ type: 'error', title: 'Commerçant introuvable', message: 'Vérifiez le code et réessayez' });
    }
  };

  const handlePinKey = (key: string) => {
    if (key === 'delete') {
      setPin(prev => prev.slice(0, -1));
    } else if (pin.length < 4) {
      const newPin = pin + key;
      setPin(newPin);
      if (newPin.length === 4) {
        setTimeout(() => processPayment(), 300);
      }
    }
  };

  const processPayment = async () => {
    setStep('processing');
    await new Promise(r => setTimeout(r, 2000));

    const montant = Number(amount);
    if (montant > (compte?.solde ?? 0)) {
      showToast({ type: 'error', title: 'Solde insuffisant', message: `Il vous manque ${formatFCFA(montant - (compte?.solde ?? 0))}` });
      setStep('amount');
      setPin('');
      return;
    }

    const commission = Math.round(montant * 0.005);
    const txn: Transaction = {
      id: `txn-${Date.now()}`,
      type: 'paiement',
      client_id: profile!.id,
      commercant_id: merchant!.id,
      montant,
      montant_brut: montant,
      montant_net: montant - commission,
      frais: commission,
      statut: 'reussie',
      operateur_mobile_money: null,
      reference: generateReference(),
      created_at: new Date().toISOString(),
      client_nom: profile!.nom,
      commercant_nom: mockStore.getProfile(merchant!.id)?.nom,
      commercant_boutique: merchant!.nom_boutique,
      commercant_categorie: merchant!.categorie,
    };

    mockStore.addTransaction(txn);
    updateBalance(-montant);
    mockStore.updateBalance(merchant!.id, montant - commission);
    setStep('success');
    showToast({ type: 'success', title: 'Paiement envoyé !', message: `${formatFCFA(montant)} à ${merchant!.nom_boutique} (dont ${formatFCFA(commission)} de frais commerçant)` });
  };

  return (
    <div style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <button className="btn btn-icon btn-secondary" onClick={() => step === 'scan' ? navigate(-1) : setStep('scan')}>
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Payer</h1>
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Scan / Manual Entry */}
        {step === 'scan' && (
          <motion.div key="scan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Real QR Scanner */}
            <QRScanner
              onScan={handleQRScan}
              simulatedData={simulatedMerchantQR}
              simulateLabel="Simuler un scan commerçant"
              showSimulate={true}
            />

            {/* Manual code entry */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '1rem',
              margin: '1rem 0',
            }}>
              <div style={{ flex: 1, height: 1, background: 'var(--color-surface-200)' }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--color-surface-400)', fontWeight: 600 }}>SAISIE MANUELLE</span>
              <div style={{ flex: 1, height: 1, background: 'var(--color-surface-200)' }} />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <div className="input-group" style={{ flex: 1 }}>
                <input
                  className="input-field"
                  placeholder="Code commerçant (ex: QR-EPICERIE-SOGO)"
                  value={manualCode}
                  onChange={e => setManualCode(e.target.value)}
                  style={{ paddingTop: '0.875rem' }}
                />
              </div>
              <button className="btn btn-secondary" onClick={handleManualCode} disabled={!manualCode}>
                <Hash size={18} />
              </button>
            </div>
          </motion.div>
        )}

        {/* Merchant Info (for reference between steps) */}
        {step === 'merchant' && null}

        {/* Step 2: Amount Entry */}
        {(step === 'amount' && merchant) && (
          <motion.div key="amount" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            {/* Merchant card */}
            <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: 50, height: 50, borderRadius: 'var(--radius-xl)',
                background: `${CATEGORY_INFO[merchant.categorie].color}15`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.5rem',
              }}>
                {CATEGORY_INFO[merchant.categorie].emoji}
              </div>
              <div>
                <div style={{ fontWeight: 700 }}>{merchant.nom_boutique}</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-surface-500)' }}>
                  {CATEGORY_INFO[merchant.categorie].label} · {merchant.ville}
                </div>
              </div>
              <Store size={20} style={{ marginLeft: 'auto', color: 'var(--color-success-500)' }} />
            </div>

            <div className="input-group" style={{ marginBottom: '1.5rem' }}>
              <label className="input-label">Montant à payer (FCFA)</label>
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

            <p style={{ fontSize: '0.8125rem', color: 'var(--color-surface-500)', textAlign: 'center', marginBottom: '1rem' }}>
              Solde disponible : <strong>{formatFCFA(compte?.solde ?? 0)}</strong>
            </p>

            <button
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
              disabled={!amount || Number(amount) < 50}
              onClick={() => { setPin(''); setStep('pin'); }}
            >
              Confirmer · {amount ? formatFCFA(Number(amount)) : '—'}
            </button>
          </motion.div>
        )}

        {/* Step 3: PIN Entry */}
        {step === 'pin' && (
          <motion.div key="pin" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            style={{ textAlign: 'center', paddingTop: '1rem' }}
          >
            <p style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>Confirmez avec votre PIN</p>
            <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-primary-700)', marginBottom: '1.5rem' }}>
              {formatFCFA(Number(amount))}
            </p>

            {/* PIN Dots */}
            <div className="pin-dots" style={{ marginBottom: '2rem' }}>
              {[0, 1, 2, 3].map(i => (
                <div key={i} className={`pin-dot ${i < pin.length ? 'filled' : ''}`} />
              ))}
            </div>

            {/* PIN Pad */}
            <div className="pin-pad">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'delete'].map(key => (
                key === '' ? <div key="empty" /> :
                <motion.button
                  key={key}
                  whileTap={{ scale: 0.85 }}
                  className="pin-key"
                  onClick={() => handlePinKey(key)}
                >
                  {key === 'delete' ? '⌫' : key}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Step 4: Processing */}
        {step === 'processing' && (
          <motion.div key="proc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', paddingTop: '3rem' }}>
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
            <p style={{ fontWeight: 700, fontSize: '1.125rem' }}>Paiement en cours...</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-surface-500)', marginTop: '0.25rem' }}>
              {merchant?.nom_boutique}
            </p>
          </motion.div>
        )}

        {/* Step 5: Success */}
        {step === 'success' && (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            style={{ textAlign: 'center', paddingTop: '2rem' }}
          >
            <svg className="checkmark-svg" viewBox="0 0 52 52" style={{ margin: '0 auto 1.5rem' }}>
              <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none" />
              <path className="checkmark-check" fill="none" d="m14.1 27.2 7.1 7.2 16.7-16.8" />
            </svg>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--color-success-600)' }}>
              Paiement réussi !
            </h2>
            <p className="amount-display" style={{ fontSize: '1.75rem', color: 'var(--color-primary-700)' }}>
              {formatFCFA(Number(amount))}
            </p>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-surface-500)', margin: '0.25rem 0 2rem' }}>
              payé à <strong>{merchant?.nom_boutique}</strong>
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
