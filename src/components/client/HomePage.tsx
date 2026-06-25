// ============================================================================
// LafiaPay — Client Home Page
// Balance display, action buttons, recent transactions, KYC badge
// ============================================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, Plus, ArrowUpRight, ArrowDownLeft, ChevronRight, Shield, X, Info } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { mockStore } from '../../lib/mockData';
import { formatFCFA, CATEGORY_INFO } from '../../types';
import { QRCodeSVG } from 'qrcode.react';
import type { Transaction } from '../../types';

/** Animated counter hook for balance display */
function useCountUp(target: number, duration = 1200) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const startTime = Date.now();
    const step = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);

  return count;
}

export default function ClientHome() {
  const navigate = useNavigate();
  const { profile, compte, updateBalance } = useAuth();
  const { showToast } = useToast();
  const balance = compte?.solde ?? 0;
  const animatedBalance = useCountUp(balance);

  const [showQRModal, setShowQRModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);

  // Get last 5 transactions for this user
  const recentTxns = mockStore.getTransactionsForUser(profile?.id || '')
    .slice(0, 5);

  const kycLevel = profile?.kyc_niveau ?? 1;
  const kycLabels = ['', 'Basique', 'Standard', 'Premium'];
  const kycProgress = (kycLevel / 3) * 100;

  return (
    <div style={{ padding: '1.5rem 1rem' }}>
      {/* Greeting & Personal QR Code Button */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <div>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-surface-500)' }}>Bonjour 👋</p>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 800 }}>{profile?.nom || 'Client'}</h1>
        </div>
        <button
          className="btn btn-secondary btn-icon"
          onClick={() => setShowQRModal(true)}
          style={{ borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          title="Mon QR Code de dépôt"
        >
          <QrCode size={22} style={{ color: 'var(--color-primary-600)' }} />
        </button>
      </motion.div>

      {/* Balance Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="gradient-hero"
        style={{
          borderRadius: 'var(--radius-3xl)',
          padding: '1.75rem 1.5rem',
          color: 'white',
          marginBottom: '1.5rem',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative circles */}
        <div style={{
          position: 'absolute', top: -30, right: -30,
          width: 120, height: 120, borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)',
        }} />
        <div style={{
          position: 'absolute', bottom: -20, left: -20,
          width: 80, height: 80, borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)',
        }} />

        <p style={{ fontSize: '0.875rem', opacity: 0.8, marginBottom: '0.25rem' }}>Solde disponible</p>
        <div className="amount-display" style={{ fontSize: '2.25rem', lineHeight: 1.1 }}>
          {animatedBalance.toLocaleString('fr-FR')}
          <span style={{ fontSize: '1rem', fontWeight: 600, marginLeft: '0.375rem', opacity: 0.8 }}>FCFA</span>
        </div>

        {/* KYC Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginTop: '1rem',
          background: 'rgba(255,255,255,0.12)',
          borderRadius: 'var(--radius-full)',
          padding: '0.375rem 0.75rem',
          width: 'fit-content',
        }}>
          <Shield size={14} />
          <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>
            KYC {kycLabels[kycLevel]}
          </span>
          <div style={{
            width: 60, height: 4, borderRadius: 2,
            background: 'rgba(255,255,255,0.2)',
            overflow: 'hidden',
          }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${kycProgress}%` }}
              transition={{ delay: 0.8, duration: 0.6 }}
              style={{
                height: '100%',
                background: 'var(--color-accent-400)',
                borderRadius: 2,
              }}
            />
          </div>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.75rem',
          marginBottom: '1.75rem',
        }}
      >
        <button
          className="btn btn-primary btn-lg"
          onClick={() => navigate('/client/pay')}
          style={{ flexDirection: 'column', gap: '0.375rem', padding: '1.25rem', width: '100%' }}
        >
          <QrCode size={28} />
          <span>Payer</span>
        </button>
        <button
          className="btn btn-accent btn-lg"
          onClick={() => navigate('/client/transfer')}
          style={{ flexDirection: 'column', gap: '0.375rem', padding: '1.25rem', width: '100%' }}
        >
          <ArrowUpRight size={28} />
          <span>Transférer</span>
        </button>
      </motion.div>

      {/* Recent Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.75rem',
        }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Dernières transactions</h2>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => navigate('/client/history')}
            style={{ gap: '0.25rem', fontSize: '0.8125rem' }}
          >
            Voir tout <ChevronRight size={16} />
          </button>
        </div>

        {recentTxns.length === 0 ? (
          <div className="card" style={{
            padding: '2rem',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>💳</div>
            <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Aucune transaction</p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-surface-500)' }}>
              Faites un dépôt physique chez un agent ou recevez un transfert pour commencer
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {recentTxns.map((txn, i) => (
              <TransactionItem key={txn.id} transaction={txn} index={i} />
            ))}
          </div>
        )}
      </motion.div>

      {/* Personal QR Code Modal */}
      <AnimatePresence>
        {showQRModal && (
          <div
            onClick={() => setShowQRModal(false)}
            className="modal-overlay"
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              onClick={e => e.stopPropagation()}
              className="card"
              style={{
                width: '100%',
                maxWidth: '380px',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 800 }}>Mon Code QR</h3>
                <button
                  className="btn btn-icon btn-secondary btn-sm"
                  onClick={() => setShowQRModal(false)}
                  style={{ borderRadius: '50%' }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* QR display card */}
              <div style={{ textAlign: 'center', padding: '1rem', border: '1px solid var(--color-surface-200)', borderRadius: 'var(--radius-xl)', background: 'white' }}>
                <div style={{ display: 'inline-block', padding: '0.75rem', background: 'white', border: '1px solid var(--color-surface-100)', borderRadius: 'var(--radius-lg)', marginBottom: '0.75rem' }}>
                  <QRCodeSVG
                    value={`LAFIAPAY:CLIENT:${profile?.telephone || 'unknown'}:${profile?.id || 'unknown'}`}
                    size={160}
                    level="H"
                    fgColor="var(--color-primary-600)"
                    bgColor="white"
                  />
                </div>
                <h4 style={{ fontWeight: 700, fontSize: '1rem' }}>{profile?.nom}</h4>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-surface-500)', fontFamily: 'monospace', marginTop: '0.125rem' }}>
                  {profile?.telephone}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--color-surface-50)', padding: '0.75rem', borderRadius: 'var(--radius-lg)' }}>
                <Info size={16} style={{ color: 'var(--color-primary-600)', flexShrink: 0, marginTop: '0.125rem' }} />
                <p style={{ fontSize: '0.75rem', color: 'var(--color-surface-600)', lineHeight: '1.2' }}>
                  Présentez ce QR code à un agent LafiaPay physique pour faire un dépôt, ou à un autre client pour recevoir un transfert.
                </p>
              </div>

              {/* Demo top-up simulator */}
              <div
                style={{
                  border: '1.5px dashed var(--color-accent-400)',
                  background: 'var(--color-accent-50)',
                  padding: '1rem',
                  borderRadius: 'var(--radius-xl)',
                }}
              >
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: 'var(--color-accent-800)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Simulation Dépôt (Démo)
                </span>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-accent-700)', marginTop: '0.125rem', marginBottom: '0.75rem' }}>
                  Créditez votre portefeuille instantanément sans passer chez un agent physique.
                </p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="number"
                    className="input-field"
                    style={{ flex: 1, padding: '0.5rem 0.75rem', fontSize: '0.875rem', height: '36px', paddingTop: '0.5rem' }}
                    placeholder="Montant (ex: 5000)"
                    value={depositAmount}
                    onChange={e => setDepositAmount(e.target.value)}
                    disabled={isSimulating}
                  />
                  <button
                    className="btn btn-accent btn-sm"
                    style={{ height: '36px', padding: '0 0.75rem' }}
                    onClick={async () => {
                      const amt = Number(depositAmount);
                      if (amt >= 100) {
                        setIsSimulating(true);
                        await new Promise(r => setTimeout(r, 1200));
                        
                        const txn: Transaction = {
                          id: `txn-${Date.now()}`,
                          type: 'depot',
                          client_id: profile!.id,
                          commercant_id: null,
                          montant: amt,
                          montant_brut: amt,
                          montant_net: amt,
                          frais: 0,
                          statut: 'reussie',
                          operateur_mobile_money: null,
                          reference: `LP-A${Math.floor(100000 + Math.random() * 900000)}`,
                          created_at: new Date().toISOString(),
                          client_nom: profile!.nom,
                        };
                        mockStore.addTransaction(txn);
                        updateBalance(amt);
                        
                        setIsSimulating(false);
                        setDepositAmount('');
                        setShowQRModal(false);
                        showToast({
                          type: 'success',
                          title: 'Dépôt crédité',
                          message: `+${formatFCFA(amt)} ajoutés avec succès !`,
                        });
                      } else {
                        showToast({
                          type: 'error',
                          title: 'Montant invalide',
                          message: 'Le montant de dépôt doit être de minimum 100 FCFA.',
                        });
                      }
                    }}
                    disabled={!depositAmount || isSimulating}
                  >
                    {isSimulating ? '...' : 'Déposer'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TransactionItem({ transaction: txn, index }: { transaction: Transaction; index: number }) {
  const { profile } = useAuth();
  const isDeposit = txn.type === 'depot';
  const isTransfer = txn.type === 'transfert';
  
  const isReceiver = isTransfer && txn.destinataire_id === profile?.id;
  const isSender = isTransfer && txn.client_id === profile?.id;
  
  const category = txn.commercant_categorie || 'autre';
  const catInfo = CATEGORY_INFO[category];

  let displayName = '';
  let subtitle = '';
  let iconContent = null;
  let amountPrefix = '';
  let amountValue = 0;
  let amountColor = '';

  if (isDeposit) {
    displayName = 'Dépôt physique';
    subtitle = 'Via Agent agréé';
    iconContent = <ArrowDownLeft size={20} style={{ color: 'var(--color-success-600)' }} />;
    amountPrefix = '+';
    amountValue = txn.montant;
    amountColor = 'var(--color-success-600)';
  } else if (isTransfer) {
    if (isReceiver) {
      displayName = 'Transfert reçu';
      subtitle = `de ${txn.client_nom || 'Client'}`;
      iconContent = <ArrowDownLeft size={20} style={{ color: 'var(--color-success-600)' }} />;
      amountPrefix = '+';
      amountValue = txn.montant_net;
      amountColor = 'var(--color-success-600)';
    } else {
      displayName = 'Transfert envoyé';
      subtitle = `à ${txn.destinataire_nom || 'Client'}`;
      iconContent = <ArrowUpRight size={20} style={{ color: 'var(--color-error-600)' }} />;
      amountPrefix = '-';
      amountValue = txn.montant_brut;
      amountColor = 'var(--color-surface-900)';
    }
  } else {
    displayName = txn.commercant_boutique || 'Paiement';
    subtitle = catInfo?.label || 'Services';
    iconContent = <span>{catInfo?.emoji || '🛒'}</span>;
    amountPrefix = '-';
    amountValue = txn.montant;
    amountColor = 'var(--color-surface-900)';
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="card"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.875rem 1rem',
      }}
    >
      <div className="category-icon" style={{
        background: isDeposit || isReceiver ? 'var(--color-success-100)' : (isTransfer ? 'var(--color-error-100)' : `${catInfo?.color || '#cbd5e1'}15`),
        width: 40, height: 40, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {iconContent}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {displayName}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-surface-500)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {new Date(txn.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
          {` · ${subtitle}`}
        </div>
      </div>
      <div style={{
        fontWeight: 700,
        fontSize: '0.9375rem',
        color: amountColor,
      }}
        className="tabular-nums"
      >
        {amountPrefix}{formatFCFA(amountValue)}
      </div>
    </motion.div>
  );
}
