// ============================================================================
// LafiaPay — Agent Cash-In Page
// Performs cash deposits on client accounts by scanning QR or typing telephone/code
// ============================================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, QrCode, Search, ShieldCheck, User, Sparkles, UserPlus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { mockStore } from '../../lib/mockData';
import { formatFCFA } from '../../types';
import type { Profile, Transaction } from '../../types';

type Step = 'client' | 'amount' | 'pin' | 'processing' | 'success';

export default function AgentCashIn() {
  const navigate = useNavigate();
  const { profile, compte, updateBalance } = useAuth();
  const { showToast } = useToast();

  const [step, setStep] = useState<Step>('client');
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Profile | null>(null);
  
  const [amountStr, setAmountStr] = useState('');
  const [agentPin, setAgentPin] = useState('');
  const [isQrScanning, setIsQrScanning] = useState(false);
  const [reference, setReference] = useState('');

  const agentBalance = compte?.solde ?? 0;
  const depositAmount = Number(amountStr) || 0;

  // Search clients list
  const handleClientLookup = () => {
    if (!clientSearch) return;

    // Search by telephone or exact name or clean code LFA-
    const cleanSearch = clientSearch.trim().toLowerCase();
    
    // Support matching client phones
    let found = mockStore.profiles.find(
      p => p.role === 'client' && 
      (p.telephone.replace(/\s+/g, '').includes(cleanSearch.replace(/\s+/g, '')) || 
       p.nom.toLowerCase().includes(cleanSearch))
    );

    // If searching by deposit code, we can match a random active client to simulate it!
    if (!found && cleanSearch.startsWith('lfa-')) {
      // Pick first active client as demonstration target
      found = mockStore.profiles.find(p => p.role === 'client' && p.statut === 'actif');
    }

    if (found) {
      if (found.statut === 'suspendu') {
        showToast({
          type: 'error',
          title: 'Compte suspendu',
          message: 'Ce compte client est actuellement suspendu pour raisons de conformité.'
        });
        return;
      }
      setSelectedClient(found);
      setStep('amount');
    } else {
      showToast({
        type: 'error',
        title: 'Client introuvable',
        message: 'Aucun client actif ne correspond à ce numéro ou code de dépôt.'
      });
    }
  };

  // Simulate scanning client QR code (random active client)
  const handleSimulateQRScan = async () => {
    setIsQrScanning(true);
    await new Promise(r => setTimeout(r, 1200)); // Scan time
    
    const clients = mockStore.profiles.filter(p => p.role === 'client' && p.statut === 'actif');
    const randomClient = clients[Math.floor(Math.random() * clients.length)];
    
    if (randomClient) {
      setSelectedClient(randomClient);
      setIsQrScanning(false);
      setStep('amount');
      showToast({
        type: 'success',
        title: 'QR Code scanné',
        message: `Client détecté : ${randomClient.nom}`
      });
    } else {
      setIsQrScanning(false);
      showToast({
        type: 'error',
        title: 'Erreur scan',
        message: 'Impossible de détecter le client.'
      });
    }
  };

  const handleAmountSubmit = () => {
    if (depositAmount < 100) {
      showToast({ type: 'error', title: 'Montant invalide', message: 'Le montant de dépôt doit être de minimum 100 FCFA.' });
      return;
    }
    if (depositAmount > agentBalance) {
      showToast({ type: 'error', title: 'Float insuffisant', message: 'Votre solde float est insuffisant pour effectuer ce dépôt.' });
      return;
    }
    setStep('pin');
  };

  const handlePinSubmit = async () => {
    if (agentPin === profile?.pin_hash || agentPin === '1234') {
      setStep('processing');
      await new Promise(r => setTimeout(r, 2000)); // Processing transaction

      const refCode = `LP-A${Math.floor(100000 + Math.random() * 900000)}`;
      setReference(refCode);

      // Perform ledger balance updates
      mockStore.updateBalance(profile!.id, -depositAmount); // Deduct agent float
      mockStore.updateBalance(selectedClient!.id, depositAmount); // Add to client balance

      // Insert transaction record
      const txn: Transaction = {
        id: `txn-${Date.now()}`,
        type: 'depot',
        client_id: selectedClient!.id,
        commercant_id: null,
        agent_id: profile!.id,
        montant: depositAmount,
        montant_brut: depositAmount,
        montant_net: depositAmount,
        frais: 0,
        statut: 'reussie',
        operateur_mobile_money: null,
        reference: refCode,
        created_at: new Date().toISOString(),
        client_nom: selectedClient!.nom,
        agent_nom: profile!.nom,
      };
      mockStore.addTransaction(txn);

      setStep('success');
      showToast({
        type: 'success',
        title: 'Dépôt validé !',
        message: `${formatFCFA(depositAmount)} crédités à ${selectedClient!.nom}`
      });
    } else {
      setAgentPin('');
      showToast({
        type: 'error',
        title: 'Code PIN incorrect',
        message: 'Le code PIN saisi est incorrect. Veuillez réessayer.'
      });
    }
  };

  const handlePinClick = (num: string) => {
    if (agentPin.length < 4) {
      setAgentPin(prev => prev + num);
    }
  };

  const handlePinDelete = () => {
    setAgentPin(prev => prev.slice(0, -1));
  };

  return (
    <div style={{ padding: '1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <button 
          className="btn btn-icon btn-secondary" 
          onClick={() => {
            if (step === 'client') navigate('/agent');
            else if (step === 'amount') setStep('client');
            else if (step === 'pin') setStep('amount');
            else if (step === 'success') navigate('/agent');
          }}
          disabled={step === 'processing'}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Dépôt Client (Cash-In)</h1>
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Identification Client */}
        {step === 'client' && (
          <motion.div key="client" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-surface-500)', marginBottom: '1.25rem' }}>
              Identifiez le client bénéficiaire du dépôt d'espèces.
            </p>

            {/* Simulated QR Scanner Frame */}
            {isQrScanning ? (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <div className="qr-viewfinder" style={{ margin: '0 auto 1.5rem' }}>
                  <div className="qr-scan-line" />
                </div>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-surface-700)' }}>
                  Scan simulé en cours...
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Search Bar */}
                <div className="input-group">
                  <label className="input-label">Téléphone ou Code de recharge client</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-surface-400)' }} />
                      <input
                        className="input-field"
                        style={{ paddingLeft: '2.75rem' }}
                        type="text"
                        placeholder="Ex: +223 70 00 00 01 ou LFA-123456"
                        value={clientSearch}
                        onChange={e => setClientSearch(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleClientLookup()}
                      />
                    </div>
                    <button className="btn btn-secondary btn-icon" onClick={handleClientLookup} style={{ height: '48px', width: '48px', flexShrink: 0 }}>
                      <Search size={20} style={{ color: 'var(--color-primary-600)' }} />
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ flex: 1, height: 1, background: 'var(--color-surface-200)' }} />
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-surface-400)', fontWeight: 600 }}>OU</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--color-surface-200)' }} />
                </div>

                {/* Scan Simulator Button */}
                <button className="btn btn-secondary btn-lg" onClick={handleSimulateQRScan} style={{ gap: '0.5rem', width: '100%' }}>
                  <QrCode size={20} style={{ color: 'var(--color-primary-600)' }} />
                  <span>Scanner le QR Code Client</span>
                </button>

                {/* Demo Client suggestions */}
                <div className="card" style={{ padding: '1rem', background: 'var(--color-surface-50)' }}>
                  <h4 style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-surface-700)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Clients de Démo :
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {[
                      { nom: 'Amadou Diallo', telephone: '+223 70 00 00 01' },
                      { nom: 'Aminata Coulibaly', telephone: '+223 76 12 34 56' },
                    ].map(c => (
                      <button
                        key={c.telephone}
                        className="btn btn-ghost btn-sm"
                        style={{ justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'white', border: '1px solid var(--color-surface-200)', borderRadius: 'var(--radius-md)' }}
                        onClick={() => {
                          setClientSearch(c.telephone);
                          setSelectedClient(mockStore.profiles.find(p => p.telephone === c.telephone) || null);
                          setStep('amount');
                        }}
                      >
                        <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                          <User size={14} /> {c.nom}
                        </span>
                        <span style={{ color: 'var(--color-surface-500)', fontSize: '0.75rem', fontFamily: 'monospace' }}>{c.telephone}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Step 2: Montant */}
        {step === 'amount' && selectedClient && (
          <motion.div key="amount" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            {/* Client summary badge */}
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', marginBottom: '1.25rem', background: 'var(--color-primary-50)', border: '1px solid var(--color-primary-100)' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--color-primary-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary-700)' }}>
                <User size={22} />
              </div>
              <div>
                <h3 style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--color-primary-800)' }}>{selectedClient.nom}</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-primary-600)', fontFamily: 'monospace' }}>{selectedClient.telephone}</p>
              </div>
            </div>

            <div className="input-group" style={{ marginBottom: '1.25rem' }}>
              <label className="input-label">Montant du dépôt physique (FCFA)</label>
              <input
                className="input-field amount-input"
                style={{ fontSize: '1.75rem', fontWeight: 800, textAlign: 'center', height: '60px' }}
                type="number"
                placeholder="0"
                value={amountStr}
                onChange={e => setAmountStr(e.target.value)}
                min={100}
              />
            </div>

            {/* Quick selectors */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {[1000, 5000, 10000, 25000].map(val => (
                <button
                  key={val}
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setAmountStr(String(val))}
                  style={{ borderRadius: 'var(--radius-lg)' }}
                >
                  +{val.toLocaleString('fr-FR')}
                </button>
              ))}
            </div>

            <div className="card" style={{ padding: '1rem', background: 'var(--color-surface-50)', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                <span style={{ color: 'var(--color-surface-500)' }}>Solde float actuel :</span>
                <span style={{ fontWeight: 700, color: 'var(--color-surface-800)' }}>{formatFCFA(agentBalance)}</span>
              </div>
              {depositAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginTop: '0.25rem', paddingTop: '0.25rem', borderTop: '1px solid var(--color-surface-200)' }}>
                  <span style={{ color: 'var(--color-surface-500)' }}>Solde après transaction :</span>
                  <span style={{ fontWeight: 700, color: depositAmount > agentBalance ? 'var(--color-error-600)' : 'var(--color-success-600)' }}>
                    {formatFCFA(agentBalance - depositAmount)}
                  </span>
                </div>
              )}
            </div>

            <button
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
              disabled={depositAmount < 100 || depositAmount > agentBalance}
              onClick={handleAmountSubmit}
            >
              Continuer · {depositAmount > 0 ? formatFCFA(depositAmount) : '—'}
            </button>
          </motion.div>
        )}

        {/* Step 3: PIN Agent */}
        {step === 'pin' && selectedClient && (
          <motion.div key="pin" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-surface-500)', marginBottom: '0.25rem' }}>Validation Dépôt</p>
              <h3 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--color-primary-700)' }}>{formatFCFA(depositAmount)}</h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-surface-500)', marginTop: '0.25rem' }}>
                Entrez votre code PIN Agent pour valider le transfert de float vers <strong>{selectedClient.nom}</strong>.
              </p>
            </div>

            {/* PIN Dots */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
              {[0, 1, 2, 3].map(i => (
                <div
                  key={i}
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    border: '2px solid var(--color-primary-500)',
                    background: agentPin.length > i ? 'var(--color-primary-600)' : 'transparent',
                    transition: 'all 0.1s ease',
                  }}
                />
              ))}
            </div>

            {/* Virtual PinPad */}
            <div className="pinpad" style={{ marginBottom: '1.5rem', width: '100%', maxWidth: '280px' }}>
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                <button key={num} className="pinpad-btn" onClick={() => handlePinClick(num)}>
                  {num}
                </button>
              ))}
              <button className="pinpad-btn pinpad-btn-special" onClick={handlePinDelete}>
                ⌫
              </button>
              <button className="pinpad-btn" onClick={() => handlePinClick('0')}>
                0
              </button>
              <button
                className="pinpad-btn pinpad-btn-special"
                onClick={handlePinSubmit}
                disabled={agentPin.length !== 4}
                style={{
                  color: agentPin.length === 4 ? 'var(--color-primary-600)' : undefined,
                  fontWeight: agentPin.length === 4 ? 800 : undefined,
                }}
              >
                ✓
              </button>
            </div>

            <p style={{ fontSize: '0.75rem', color: 'var(--color-surface-400)' }}> PIN de démo Modibo : 1234 </p>
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
            <p style={{ fontWeight: 700, fontSize: '1.125rem', marginBottom: '0.5rem' }}>Transaction en cours...</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-surface-500)' }}>
              Écriture comptable dans le grand livre et mise à jour des soldes...
            </p>
          </motion.div>
        )}

        {/* Step 5: Success */}
        {step === 'success' && selectedClient && (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', paddingTop: '2rem' }}>
            <div style={{ position: 'relative', width: 'fit-content', margin: '0 auto 1.5rem' }}>
              <svg className="checkmark-svg" viewBox="0 0 52 52">
                <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none" />
                <path className="checkmark-check" fill="none" d="m14.1 27.2 7.1 7.2 16.7-16.8" />
              </svg>
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.6, type: 'spring', stiffness: 200 }}
                style={{
                  position: 'absolute', bottom: -5, right: -5,
                  background: 'var(--color-accent-400)',
                  color: 'var(--color-accent-950)',
                  width: 26, height: 26, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Sparkles size={14} />
              </motion.div>
            </div>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--color-success-600)' }}>
              Dépôt validé !
            </h2>
            <p className="amount-display" style={{ fontSize: '1.75rem', color: 'var(--color-primary-700)', marginBottom: '0.25rem' }}>
              {formatFCFA(depositAmount)}
            </p>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-surface-500)', marginBottom: '1.5rem' }}>
              Crédités avec succès au compte de <strong>{selectedClient.nom}</strong>
            </p>

            <div className="card" style={{ padding: '1rem', background: 'var(--color-surface-50)', marginBottom: '2rem', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.375rem', fontSize: '0.8125rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-surface-500)' }}>Bénéficiaire :</span>
                <span style={{ fontWeight: 600, color: 'var(--color-surface-800)' }}>{selectedClient.nom}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-surface-500)' }}>Téléphone :</span>
                <span style={{ fontWeight: 600, color: 'var(--color-surface-800)', fontFamily: 'monospace' }}>{selectedClient.telephone}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-surface-500)' }}>Référence :</span>
                <span style={{ fontWeight: 600, color: 'var(--color-surface-800)', fontFamily: 'monospace' }}>{reference}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-surface-500)' }}>Frais de service :</span>
                <span style={{ fontWeight: 600, color: 'var(--color-success-600)' }}>Gratuit (0 FCFA)</span>
              </div>
            </div>

            <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={() => navigate('/agent')}>
              Retour à l'accueil
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
