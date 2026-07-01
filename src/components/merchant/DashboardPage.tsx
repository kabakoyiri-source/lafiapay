// ============================================================================
// LafiaPay — Merchant Dashboard
// QR code, revenue stats, real-time payment feed
// ============================================================================

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Download, TrendingUp, DollarSign, ShoppingBag, ArrowDownLeft, LogOut, ArrowUpRight, ShieldCheck, Landmark, Send } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { mockStore } from '../../lib/mockData';
import { formatFCFA, CATEGORY_INFO } from '../../types';
import type { Transaction } from '../../types';
import { supabase, IS_MOCK_MODE } from '../../lib/supabase';

export default function MerchantDashboard() {
  const { profile, compte, updateBalance, commercant, signOut } = useAuth();
  const [recentPayments, setRecentPayments] = useState<Transaction[]>([]);
  const [isAgentActive, setIsAgentActive] = useState(commercant?.est_agent || false);

  // Cash-In Modal states
  const [showCashInModal, setShowCashInModal] = useState(false);
  const [clientPhone, setClientPhone] = useState('');
  const [cashInAmount, setCashInAmount] = useState('');
  const [cashInPin, setCashInPin] = useState('');
  const [foundClient, setFoundClient] = useState<any>(null);
  const [cashInStep, setCashInStep] = useState<'phone' | 'amount' | 'pin' | 'processing' | 'success'>('phone');
  const [cashInRef, setCashInRef] = useState('');
  const [cashInError, setCashInError] = useState('');

  // Withdrawal Modal states
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawPhone, setWithdrawPhone] = useState(profile?.telephone || '');
  const [withdrawOperator, setWithdrawOperator] = useState<'orange_money' | 'moov_money' | 'wave'>('orange_money');
  const [withdrawPin, setWithdrawPin] = useState('');
  const [withdrawStep, setWithdrawStep] = useState<'amount' | 'pin' | 'processing' | 'success'>('amount');
  const [withdrawRef, setWithdrawRef] = useState('');
  const [withdrawError, setWithdrawError] = useState('');

  // Pay Merchant Modal states
  const [showPayModal, setShowPayModal] = useState(false);
  const [payMerchantPhone, setPayMerchantPhone] = useState('');
  const [payMerchantAmount, setPayMerchantAmount] = useState('');
  const [payMerchantPin, setPayMerchantPin] = useState('');
  const [foundMerchant, setFoundMerchant] = useState<any>(null);
  const [payMerchantStep, setPayMerchantStep] = useState<'phone' | 'amount' | 'pin' | 'processing' | 'success'>('phone');
  const [payMerchantRef, setPayMerchantRef] = useState('');
  const [payMerchantError, setPayMerchantError] = useState('');

  // Transfer Modal states
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferPhone, setTransferPhone] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferPin, setTransferPin] = useState('');
  const [foundRecipient, setFoundRecipient] = useState<any>(null);
  const [transferStep, setTransferStep] = useState<'phone' | 'amount' | 'pin' | 'processing' | 'success'>('phone');
  const [transferRef, setTransferRef] = useState('');
  const [transferError, setTransferError] = useState('');
  const [transferFrais, setTransferFrais] = useState(0);
  const [transferTotalDebited, setTransferTotalDebited] = useState(0);

  // Get merchant transactions
  const allTxns = useMemo(() =>
    mockStore.getTransactionsForMerchant(profile?.id || ''),
    [profile?.id]
  );

  useEffect(() => {
    setRecentPayments(allTxns.slice(0, 10));
  }, [allTxns]);

  // Subscribe to new payments
  useEffect(() => {
    const unsub = mockStore.subscribe(() => {
      const updated = mockStore.getTransactionsForMerchant(profile?.id || '');
      setRecentPayments(updated.slice(0, 10));
    });
    return unsub;
  }, [profile?.id]);

  // Handle agent toggle
  const handleToggleAgent = async (checked: boolean) => {
    setIsAgentActive(checked);
    if (commercant) {
      commercant.est_agent = checked;
      if (!IS_MOCK_MODE) {
        await supabase
          .from('commercants')
          .update({ est_agent: checked })
          .eq('id', profile?.id);
      }
    }
  };

  // Cash-In Lookup
  const handleVerifyClient = async () => {
    if (!clientPhone.trim()) return;
    setCashInError('');
    
    // Live lookup in Supabase
    let client = null;
    if (IS_MOCK_MODE) {
      client = mockStore.findProfileByPhone(clientPhone);
    } else {
      const { data } = await supabase.from('profiles').select('*');
      if (data) {
        mockStore.profiles = data;
        client = mockStore.findProfileByPhone(clientPhone);
      }
    }

    if (client && client.role === 'client') {
      setFoundClient(client);
      setCashInStep('amount');
    } else {
      setCashInError('Aucun compte client actif trouvé pour ce numéro.');
    }
  };

  // Cash-In Execute
  const handleExecuteCashIn = async () => {
    if (cashInPin !== '1234' && cashInPin !== profile?.pin_hash) {
      setCashInError('Code PIN incorrect.');
      setCashInPin('');
      return;
    }
    
    setCashInStep('processing');
    setCashInError('');
    await new Promise(r => setTimeout(r, 1500));

    const montant = Number(cashInAmount);
    if (montant > (compte?.solde ?? 0)) {
      setCashInError('Solde float insuffisant.');
      setCashInStep('amount');
      return;
    }

    try {
      const ref = `LP-A${Math.floor(100000 + Math.random() * 900000)}`;
      
      // Perform balance updates
      updateBalance(-montant);
      mockStore.updateBalance(foundClient.id, montant);
      
      if (!IS_MOCK_MODE) {
        await supabase.from('comptes').update({
          solde: (compte?.solde ?? 0) - montant,
          updated_at: new Date().toISOString()
        }).eq('profile_id', profile?.id);

        const { data: destCompte } = await supabase.from('comptes').select('solde').eq('profile_id', foundClient.id).maybeSingle();
        const currentDestSolde = destCompte ? destCompte.solde : 0;
        await supabase.from('comptes').update({
          solde: currentDestSolde + montant,
          updated_at: new Date().toISOString()
        }).eq('profile_id', foundClient.id);
      }

      // Add transaction log
      const txn: Transaction = {
        id: `txn-${Date.now()}`,
        type: 'depot',
        client_id: foundClient.id,
        commercant_id: null,
        agent_id: profile?.id,
        montant,
        montant_brut: montant,
        montant_net: montant,
        frais: 0,
        statut: 'reussie',
        operateur_mobile_money: null,
        reference: ref,
        created_at: new Date().toISOString(),
        client_nom: foundClient.nom
      };
      mockStore.addTransaction(txn);

      if (!IS_MOCK_MODE) {
        await supabase.from('transactions').insert({
          id: txn.id,
          type: 'depot',
          client_id: foundClient.id,
          agent_id: profile?.id,
          montant,
          montant_brut: montant,
          montant_net: montant,
          frais: 0,
          statut: 'reussie',
          reference: ref,
          created_at: txn.created_at
        });
      }

      setCashInRef(ref);
      setCashInStep('success');
    } catch (err) {
      setCashInError('Erreur de connexion avec le serveur.');
      setCashInStep('amount');
    }
  };

  // Withdraw Execute
  const handleExecuteWithdraw = async () => {
    if (withdrawPin !== '1234' && withdrawPin !== profile?.pin_hash) {
      setWithdrawError('Code PIN incorrect.');
      setWithdrawPin('');
      return;
    }

    setWithdrawStep('processing');
    setWithdrawError('');
    await new Promise(r => setTimeout(r, 1500));

    const montant = Number(withdrawAmount);
    if (montant > (compte?.solde ?? 0)) {
      setWithdrawError('Solde insuffisant.');
      setWithdrawStep('amount');
      return;
    }

    try {
      const ref = `LP-W${Math.floor(100000 + Math.random() * 900000)}`;
      
      // Perform balance updates
      updateBalance(-montant);
      
      if (!IS_MOCK_MODE) {
        await supabase.from('comptes').update({
          solde: (compte?.solde ?? 0) - montant,
          updated_at: new Date().toISOString()
        }).eq('profile_id', profile?.id);
      }

      // Add transaction log
      const txn: Transaction = {
        id: `txn-${Date.now()}`,
        type: 'transfert',
        client_id: profile?.id || '',
        commercant_id: null,
        destinataire_id: 'system-withdrawal',
        montant,
        montant_brut: montant,
        montant_net: montant,
        frais: 0,
        statut: 'reussie',
        operateur_mobile_money: withdrawOperator,
        reference: ref,
        created_at: new Date().toISOString(),
        client_nom: profile?.nom
      };
      mockStore.addTransaction(txn);

      if (!IS_MOCK_MODE) {
        await supabase.from('transactions').insert({
          id: txn.id,
          type: 'transfert',
          client_id: profile?.id,
          destinataire_id: 'system-withdrawal',
          montant,
          montant_brut: montant,
          montant_net: montant,
          frais: 0,
          statut: 'reussie',
          operateur_mobile_money: withdrawOperator,
          reference: ref,
          created_at: txn.created_at
        });
      }

      setWithdrawRef(ref);
      setWithdrawStep('success');
    } catch (err) {
      setWithdrawError('Erreur de connexion.');
      setWithdrawStep('amount');
    }
  };

  // Pay Merchant Lookup
  const handleVerifyMerchant = async () => {
    if (!payMerchantPhone.trim()) return;
    setPayMerchantError('');
    
    let mProfile = null;
    let mDetails = null;

    if (IS_MOCK_MODE) {
      mProfile = mockStore.findProfileByPhone(payMerchantPhone);
      if (mProfile && mProfile.role === 'commercant') {
        mDetails = mockStore.getCommerçant(mProfile.id);
      }
    } else {
      const { data: pData } = await supabase.from('profiles').select('*');
      if (pData) {
        mockStore.profiles = pData;
        mProfile = mockStore.findProfileByPhone(payMerchantPhone);
      }
      if (mProfile && mProfile.role === 'commercant') {
        const { data: mData } = await supabase.from('commercants').select('*').eq('id', mProfile.id).maybeSingle();
        if (mData) mDetails = mData;
      }
    }

    if (mProfile && mProfile.role === 'commercant' && mDetails) {
      setFoundMerchant({ ...mProfile, ...mDetails });
      setPayMerchantStep('amount');
    } else {
      setPayMerchantError('Aucun compte commerçant trouvé pour ce numéro.');
    }
  };

  // Pay Merchant Execute
  const handleExecutePayMerchant = async () => {
    if (payMerchantPin !== '1234' && payMerchantPin !== profile?.pin_hash) {
      setPayMerchantError('Code PIN incorrect.');
      setPayMerchantPin('');
      return;
    }
    
    setPayMerchantStep('processing');
    setPayMerchantError('');
    await new Promise(r => setTimeout(r, 1500));

    const montant = Number(payMerchantAmount);
    if (montant > (compte?.solde ?? 0)) {
      setPayMerchantError('Solde disponible insuffisant.');
      setPayMerchantStep('amount');
      return;
    }

    try {
      const ref = `LP-P${Math.floor(100000 + Math.random() * 900000)}`;
      
      // Perform balance updates (0% fee!)
      updateBalance(-montant);
      mockStore.updateBalance(foundMerchant.id, montant);
      
      if (!IS_MOCK_MODE) {
        await supabase.from('comptes').update({
          solde: (compte?.solde ?? 0) - montant,
          updated_at: new Date().toISOString()
        }).eq('profile_id', profile?.id);

        const { data: destCompte } = await supabase.from('comptes').select('solde').eq('profile_id', foundMerchant.id).maybeSingle();
        const currentDestSolde = destCompte ? destCompte.solde : 0;
        await supabase.from('comptes').update({
          solde: currentDestSolde + montant,
          updated_at: new Date().toISOString()
        }).eq('profile_id', foundMerchant.id);
      }

      // Add transaction log
      const txn: Transaction = {
        id: `txn-${Date.now()}`,
        type: 'paiement',
        client_id: profile?.id || '',
        commercant_id: foundMerchant.id,
        destinataire_id: null,
        agent_id: null,
        montant,
        montant_brut: montant,
        montant_net: montant,
        frais: 0,
        statut: 'reussie',
        operateur_mobile_money: null,
        reference: ref,
        created_at: new Date().toISOString(),
        client_nom: profile?.nom,
        commercant_nom: foundMerchant.nom,
        commercant_boutique: foundMerchant.nom_boutique
      };
      mockStore.addTransaction(txn);

      if (!IS_MOCK_MODE) {
        await supabase.from('transactions').insert({
          id: txn.id,
          type: 'paiement',
          client_id: profile?.id,
          commercant_id: foundMerchant.id,
          montant,
          montant_brut: montant,
          montant_net: montant,
          frais: 0,
          statut: 'reussie',
          reference: ref,
          created_at: txn.created_at
        });
      }

      setPayMerchantRef(ref);
      setPayMerchantStep('success');
    } catch (err) {
      setPayMerchantError('Erreur lors de la transaction.');
      setPayMerchantStep('amount');
    }
  };

  // Transfer Lookup
  const handleVerifyRecipient = async () => {
    if (!transferPhone.trim()) return;
    setTransferError('');
    
    let profile = null;
    if (IS_MOCK_MODE) {
      profile = mockStore.findProfileByPhone(transferPhone);
    } else {
      const { data } = await supabase.from('profiles').select('*');
      if (data) {
        mockStore.profiles = data;
        profile = mockStore.findProfileByPhone(transferPhone);
      }
    }

    if (profile && profile.role === 'client') {
      setFoundRecipient(profile);
      setTransferStep('amount');
    } else {
      setTransferError('Aucun compte client actif trouvé pour ce numéro.');
    }
  };

  // Transfer Execute
  const handleExecuteTransfer = async () => {
    if (transferPin !== '1234' && transferPin !== profile?.pin_hash) {
      setTransferError('Code PIN incorrect.');
      setTransferPin('');
      return;
    }
    
    setTransferStep('processing');
    setTransferError('');
    await new Promise(r => setTimeout(r, 1500));

    const montant = Number(transferAmount);
    const frais = Math.round(montant * 0.01);
    const totalDebited = montant + frais;

    if (totalDebited > (compte?.solde ?? 0)) {
      setTransferError('Solde disponible insuffisant (montant + 1% frais).');
      setTransferStep('amount');
      return;
    }

    try {
      const ref = `LP-T${Math.floor(100000 + Math.random() * 900000)}`;
      
      // Perform balance updates (1% fee!)
      updateBalance(-totalDebited);
      mockStore.updateBalance(foundRecipient.id, montant);
      
      if (!IS_MOCK_MODE) {
        await supabase.from('comptes').update({
          solde: (compte?.solde ?? 0) - totalDebited,
          updated_at: new Date().toISOString()
        }).eq('profile_id', profile?.id);

        const { data: destCompte } = await supabase.from('comptes').select('solde').eq('profile_id', foundRecipient.id).maybeSingle();
        const currentDestSolde = destCompte ? destCompte.solde : 0;
        await supabase.from('comptes').update({
          solde: currentDestSolde + montant,
          updated_at: new Date().toISOString()
        }).eq('profile_id', foundRecipient.id);
      }

      // Add transaction log
      const txn: Transaction = {
        id: `txn-${Date.now()}`,
        type: 'transfert',
        client_id: profile?.id || '',
        commercant_id: null,
        destinataire_id: foundRecipient.id,
        agent_id: null,
        montant,
        montant_brut: totalDebited,
        montant_net: montant,
        frais,
        statut: 'reussie',
        operateur_mobile_money: null,
        reference: ref,
        created_at: new Date().toISOString(),
        client_nom: profile?.nom
      };
      mockStore.addTransaction(txn);

      if (!IS_MOCK_MODE) {
        await supabase.from('transactions').insert({
          id: txn.id,
          type: 'transfert',
          client_id: profile?.id,
          destinataire_id: foundRecipient.id,
          montant,
          montant_brut: totalDebited,
          montant_net: montant,
          frais,
          statut: 'reussie',
          reference: ref,
          created_at: txn.created_at
        });
      }

      setTransferRef(ref);
      setTransferFrais(frais);
      setTransferTotalDebited(totalDebited);
      setTransferStep('success');
    } catch (err) {
      setTransferError('Erreur lors du transfert.');
      setTransferStep('amount');
    }
  };

  // Subscribe to new payments
  useEffect(() => {
    const unsub = mockStore.subscribe(() => {
      const updated = mockStore.getTransactionsForMerchant(profile?.id || '');
      setRecentPayments(updated.slice(0, 10));
    });
    return unsub;
  }, [profile?.id]);

  // Revenue calculations
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const revenueToday = allTxns.filter(t => new Date(t.created_at) >= todayStart && t.statut === 'reussie')
    .reduce((s, t) => s + (t.montant_net !== undefined ? t.montant_net : t.montant - Math.round(t.montant * 0.005)), 0);
  const revenueWeek = allTxns.filter(t => new Date(t.created_at) >= weekStart && t.statut === 'reussie')
    .reduce((s, t) => s + (t.montant_net !== undefined ? t.montant_net : t.montant - Math.round(t.montant * 0.005)), 0);
  const revenueMonth = allTxns.filter(t => new Date(t.created_at) >= monthStart && t.statut === 'reussie')
    .reduce((s, t) => s + (t.montant_net !== undefined ? t.montant_net : t.montant - Math.round(t.montant * 0.005)), 0);

  // Chart data (last 7 days)
  const chartData = useMemo(() => {
    const days: { date: string; montant: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toLocaleDateString('fr-FR', { weekday: 'short' });
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      const total = allTxns
        .filter(t => {
          const td = new Date(t.created_at);
          return td >= dayStart && td < dayEnd && t.statut === 'reussie';
        })
        .reduce((s, t) => s + (t.montant_net !== undefined ? t.montant_net : t.montant - Math.round(t.montant * 0.005)), 0);
      days.push({ date: dayStr, montant: total });
    }
    return days;
  }, [allTxns]);

  const downloadQR = () => {
    const svg = document.getElementById('merchant-qr-code');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx!.fillStyle = 'white';
      ctx!.fillRect(0, 0, 400, 400);
      ctx!.drawImage(img, 50, 50, 300, 300);
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `QR-${commercant?.nom_boutique || 'merchant'}.png`;
      a.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div style={{ padding: '1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
        <div>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-surface-500)' }}>Bonjour 👋</p>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{commercant?.nom_boutique || 'Ma Boutique'}</h1>
        </div>
        <button
          onClick={signOut}
          className="btn btn-secondary btn-icon btn-sm"
          style={{ borderRadius: '50%', color: 'var(--color-error-600)' }}
          title="Déconnexion"
        >
          <LogOut size={18} />
        </button>
      </div>

      {/* QR Code Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
        style={{ padding: '1.5rem', textAlign: 'center', marginBottom: '1rem' }}
      >
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-surface-500)', marginBottom: '0.75rem' }}>
          Votre QR Code de paiement
        </p>
        <div style={{
          display: 'inline-block', padding: '1rem', background: 'white',
          borderRadius: 'var(--radius-xl)', marginBottom: '0.75rem',
        }}>
          <QRCodeSVG
            id="merchant-qr-code"
            value={`LAFIAPAY:MERCHANT:${commercant?.qr_code_id || 'UNKNOWN'}`}
            size={180}
            level="H"
            fgColor="var(--color-primary-600)"
            bgColor="white"
          />
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--color-surface-400)', marginBottom: '0.75rem', fontFamily: 'monospace' }}>
          {commercant?.qr_code_id}
        </p>
        <button className="btn btn-secondary btn-sm" onClick={downloadQR}>
          <Download size={16} /> Télécharger pour impression
        </button>
      </motion.div>

      {/* Revenue Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}
      >
        {[
          { label: "Aujourd'hui", value: revenueToday, icon: DollarSign },
          { label: 'Semaine', value: revenueWeek, icon: TrendingUp },
          { label: 'Mois', value: revenueMonth, icon: ShoppingBag },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="card" style={{ padding: '0.75rem', textAlign: 'center' }}>
            <Icon size={18} style={{ color: 'var(--color-primary-500)', margin: '0 auto 0.25rem' }} />
            <div className="tabular-nums" style={{ fontSize: '0.875rem', fontWeight: 800 }}>
              {value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
            </div>
            <div style={{ fontSize: '0.625rem', color: 'var(--color-surface-500)' }}>{label}</div>
          </div>
        ))}
      </motion.div>

      {/* Solde */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="card gradient-primary"
        style={{ padding: '1.5rem', marginBottom: '1rem', color: 'white', position: 'relative', overflow: 'hidden' }}
      >
        <p style={{ fontSize: '0.875rem', opacity: 0.8, marginBottom: '0.25rem' }}>Solde disponible</p>
        <div className="amount-display" style={{ fontSize: '1.75rem', fontWeight: 800 }}>{formatFCFA(compte?.solde ?? 0)}</div>
      </motion.div>

      {/* Options & Quick Actions Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
        className="card"
        style={{ padding: '1.25rem', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700 }}>Options de commerce</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-surface-500)' }}>Activez les services d'agent pour votre boutique</p>
          </div>
          <div
            onClick={() => handleToggleAgent(!isAgentActive)}
            style={{
              width: '46px', height: '24px', background: isAgentActive ? 'var(--color-primary-600)' : 'var(--color-surface-300)',
              borderRadius: '12px', padding: '2px', cursor: 'pointer', transition: 'background-color 0.2s',
              display: 'flex', justifyContent: isAgentActive ? 'flex-end' : 'flex-start'
            }}
          >
            <motion.div layout style={{ width: '20px', height: '20px', background: 'white', borderRadius: '50%', boxShadow: 'var(--shadow-sm)' }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {isAgentActive && (
            <button
              className="btn btn-primary"
              onClick={() => {
                setCashInStep('phone');
                setClientPhone('');
                setCashInAmount('');
                setCashInPin('');
                setFoundClient(null);
                setCashInError('');
                setShowCashInModal(true);
              }}
              style={{ flex: '1 1 120px', gap: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40px' }}
            >
              <ArrowUpRight size={16} /> Dépôt Client
            </button>
          )}
          <button
            className="btn btn-secondary"
            onClick={() => {
              setPayMerchantStep('phone');
              setPayMerchantPhone('');
              setPayMerchantAmount('');
              setPayMerchantPin('');
              setFoundMerchant(null);
              setPayMerchantError('');
              setShowPayModal(true);
            }}
            style={{ flex: '1 1 120px', gap: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40px', background: 'var(--color-primary-50)', color: 'var(--color-primary-700)', borderColor: 'var(--color-primary-100)' }}
          >
            <ArrowUpRight size={16} /> Payer Marchand
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setTransferStep('phone');
              setTransferPhone('');
              setTransferAmount('');
              setTransferPin('');
              setFoundRecipient(null);
              setTransferError('');
              setShowTransferModal(true);
            }}
            style={{ flex: '1 1 120px', gap: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40px', background: 'var(--color-accent-50)', color: 'var(--color-accent-700)', borderColor: 'var(--color-accent-100)' }}
          >
            <Send size={16} /> Transférer
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setWithdrawStep('amount');
              setWithdrawAmount('');
              setWithdrawPin('');
              setWithdrawError('');
              setShowWithdrawModal(true);
            }}
            style={{ flex: '1 1 120px', gap: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40px' }}
          >
            <Landmark size={16} /> Retirer des fonds
          </button>
        </div>
      </motion.div>

      {/* Revenue Chart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card"
        style={{ padding: '1rem', marginBottom: '1rem' }}
      >
        <h3 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.75rem' }}>Revenus (7 jours)</h3>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-surface-200)" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--color-surface-400)" />
            <YAxis tick={{ fontSize: 11 }} stroke="var(--color-surface-400)" />
            <Tooltip
              formatter={(value: any) => [formatFCFA(Number(value)), 'Revenus']}
              contentStyle={{
                borderRadius: 12, border: 'none', boxShadow: 'var(--shadow-lg)',
                fontSize: '0.8125rem',
              }}
            />
            <Bar dataKey="montant" fill="var(--color-primary-500)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Recent Payments */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <h3 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.75rem' }}>Derniers paiements reçus</h3>
        {recentPayments.length === 0 ? (
          <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📥</div>
            <p style={{ color: 'var(--color-surface-500)', fontSize: '0.875rem' }}>Aucun paiement reçu</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {recentPayments.map((txn, i) => (
              <motion.div
                key={txn.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="card"
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem' }}
              >
                <div className="category-icon" style={{ background: 'var(--color-success-100)' }}>
                  <ArrowDownLeft size={18} style={{ color: 'var(--color-success-600)' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{txn.client_nom || 'Client'}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-surface-500)' }}>
                    {new Date(txn.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    {` · Brut: ${formatFCFA(txn.montant_brut || txn.montant)} · Commission: ${formatFCFA(txn.frais || Math.round(txn.montant * 0.005))}`}
                  </div>
                </div>
                <span className="tabular-nums" style={{ fontWeight: 700, color: 'var(--color-success-600)', fontSize: '0.9375rem' }} title="Net reçu">
                  +{formatFCFA(txn.montant_net !== undefined ? txn.montant_net : txn.montant - Math.round(txn.montant * 0.005))}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* ============================================================ */}
      {/* Modal: Cash-In Dépôt Client */}
      {/* ============================================================ */}
      <AnimatePresence>
        {showCashInModal && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(4px)'
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="card"
              style={{ width: '90%', maxWidth: '380px', padding: '1.5rem', background: 'white', display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Dépôt Client (Cash-In)</h3>
                <button onClick={() => setShowCashInModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.25rem', color: 'var(--color-surface-400)' }}>&times;</button>
              </div>

              {cashInError && (
                <div style={{ padding: '0.625rem', borderRadius: 'var(--radius-md)', background: 'var(--color-error-100)', color: 'var(--color-error-700)', fontSize: '0.75rem', fontWeight: 600 }}>
                  {cashInError}
                </div>
              )}

              {/* Step 1: Phone lookup */}
              {cashInStep === 'phone' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-surface-500)' }}>Saisissez le numéro de téléphone du client bénéficiaire.</p>
                  <input
                    className="input-field"
                    type="tel"
                    placeholder="Ex: +223 70 00 00 01"
                    value={clientPhone}
                    onChange={e => setClientPhone(e.target.value)}
                  />
                  <button className="btn btn-primary" onClick={handleVerifyClient} style={{ height: '40px' }}>Continuer</button>
                </div>
              )}

              {/* Step 2: Amount entry */}
              {cashInStep === 'amount' && foundClient && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ padding: '0.75rem', background: 'var(--color-surface-50)', borderRadius: 'var(--radius-lg)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-surface-400)' }}>Bénéficiaire</div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{foundClient.nom}</div>
                    <div style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>{foundClient.telephone}</div>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Montant à déposer (FCFA)</label>
                    <input
                      className="input-field"
                      type="number"
                      placeholder="Ex: 5000"
                      value={cashInAmount}
                      onChange={e => setCashInAmount(e.target.value)}
                    />
                  </div>
                  <button className="btn btn-primary" onClick={() => setCashInStep('pin')} style={{ height: '40px' }}>Suivant</button>
                </div>
              )}

              {/* Step 3: PIN Code */}
              {cashInStep === 'pin' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-surface-500)' }}>Entrez votre code PIN de validation pour autoriser le transfert float de {formatFCFA(Number(cashInAmount))}.</p>
                  <input
                    className="input-field"
                    type="password"
                    maxLength={4}
                    placeholder="••••"
                    value={cashInPin}
                    onChange={e => setCashInPin(e.target.value)}
                    style={{ textAlign: 'center', letterSpacing: '0.5rem', fontSize: '1.25rem' }}
                  />
                  <button className="btn btn-primary" onClick={handleExecuteCashIn} style={{ height: '40px' }}>Valider le dépôt</button>
                </div>
              )}

              {/* Step 4: Processing */}
              {cashInStep === 'processing' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', padding: '2rem 0' }}>
                  <div style={{ width: '40px', height: '40px', border: '3px solid var(--color-surface-200)', borderTopColor: 'var(--color-primary-600)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>Traitement du dépôt en cours...</p>
                </div>
              )}

              {/* Step 5: Success */}
              {cashInStep === 'success' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', textAlign: 'center', padding: '1rem 0' }}>
                  <div style={{ width: '56px', height: '56px', background: 'var(--color-success-100)', color: 'var(--color-success-600)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem' }}>✓</div>
                  <div>
                    <h4 style={{ fontWeight: 800, fontSize: '1.125rem', color: 'var(--color-success-700)' }}>Dépôt effectué !</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-surface-500)', marginTop: '0.25rem' }}>{formatFCFA(Number(cashInAmount))} déposés sur le compte de {foundClient?.nom}.</p>
                    <p style={{ fontSize: '0.6875rem', color: 'var(--color-surface-400)', marginTop: '0.5rem', fontFamily: 'monospace' }}>Réf: {cashInRef}</p>
                  </div>
                  <button className="btn btn-secondary" onClick={() => setShowCashInModal(false)} style={{ width: '100%', height: '38px' }}>Fermer</button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================ */}
      {/* Modal: Retrait Commerçant */}
      {/* ============================================================ */}
      <AnimatePresence>
        {showWithdrawModal && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(4px)'
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="card"
              style={{ width: '90%', maxWidth: '380px', padding: '1.5rem', background: 'white', display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Retrait d'argent</h3>
                <button onClick={() => setShowWithdrawModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.25rem', color: 'var(--color-surface-400)' }}>&times;</button>
              </div>

              {withdrawError && (
                <div style={{ padding: '0.625rem', borderRadius: 'var(--radius-md)', background: 'var(--color-error-100)', color: 'var(--color-error-700)', fontSize: '0.75rem', fontWeight: 600 }}>
                  {withdrawError}
                </div>
              )}

              {/* Step 1: Form entry */}
              {withdrawStep === 'amount' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="input-group">
                    <label className="input-label">Opérateur Mobile Money</label>
                    <select
                      className="input-field"
                      value={withdrawOperator}
                      onChange={e => setWithdrawOperator(e.target.value as any)}
                    >
                      <option value="orange_money">Orange Money Mali</option>
                      <option value="moov_money">Moov Money (Sotelma)</option>
                      <option value="wave">Wave Mali</option>
                    </select>
                  </div>

                  <div className="input-group">
                    <label className="input-label">Numéro Mobile Money de réception</label>
                    <input
                      className="input-field"
                      type="tel"
                      placeholder="+223 7X XX XX XX"
                      value={withdrawPhone}
                      onChange={e => setWithdrawPhone(e.target.value)}
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">Montant à retirer (FCFA)</label>
                    <input
                      className="input-field"
                      type="number"
                      placeholder="Ex: 10000"
                      value={withdrawAmount}
                      onChange={e => setWithdrawAmount(e.target.value)}
                    />
                  </div>

                  <button className="btn btn-primary" onClick={() => setWithdrawStep('pin')} style={{ height: '40px' }}>Continuer</button>
                </div>
              )}

              {/* Step 2: PIN Validation */}
              {withdrawStep === 'pin' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-surface-500)' }}>Entrez votre code PIN de validation pour autoriser le retrait de {formatFCFA(Number(withdrawAmount))} vers votre Mobile Money.</p>
                  <input
                    className="input-field"
                    type="password"
                    maxLength={4}
                    placeholder="••••"
                    value={withdrawPin}
                    onChange={e => setWithdrawPin(e.target.value)}
                    style={{ textAlign: 'center', letterSpacing: '0.5rem', fontSize: '1.25rem' }}
                  />
                  <button className="btn btn-primary" onClick={handleExecuteWithdraw} style={{ height: '40px' }}>Valider le retrait</button>
                </div>
              )}

              {/* Step 3: Processing */}
              {withdrawStep === 'processing' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', padding: '2rem 0' }}>
                  <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid var(--color-surface-200)', borderTopColor: 'var(--color-primary-600)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>Traitement du retrait...</p>
                </div>
              )}

              {/* Step 4: Success */}
              {withdrawStep === 'success' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', textAlign: 'center', padding: '1rem 0' }}>
                  <div style={{ width: '56px', height: '56px', background: 'var(--color-success-100)', color: 'var(--color-success-600)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem' }}>✓</div>
                  <div>
                    <h4 style={{ fontWeight: 800, fontSize: '1.125rem', color: 'var(--color-success-700)' }}>Retrait validé !</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-surface-500)', marginTop: '0.25rem' }}>{formatFCFA(Number(withdrawAmount))} transférés vers votre compte {withdrawOperator === 'orange_money' ? 'Orange Money' : withdrawOperator === 'moov_money' ? 'Moov Money' : 'Wave'}.</p>
                    <p style={{ fontSize: '0.6875rem', color: 'var(--color-surface-400)', marginTop: '0.5rem', fontFamily: 'monospace' }}>Réf: {withdrawRef}</p>
                  </div>
                  <button className="btn btn-secondary" onClick={() => setShowWithdrawModal(false)} style={{ width: '100%', height: '38px' }}>Fermer</button>
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* Pay Merchant Modal */}
        {showPayModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="card"
              style={{ width: '90%', maxWidth: '380px', padding: '1.5rem', background: 'white', display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Paiement Marchand (0% frais)</h3>
                <button onClick={() => setShowPayModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.25rem', color: 'var(--color-surface-400)' }}>&times;</button>
              </div>

              {payMerchantError && (
                <div style={{ padding: '0.625rem', borderRadius: 'var(--radius-md)', background: 'var(--color-error-100)', color: 'var(--color-error-700)', fontSize: '0.75rem', fontWeight: 600 }}>
                  {payMerchantError}
                </div>
              )}

              {/* Step 1: Telephone */}
              {payMerchantStep === 'phone' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="input-group">
                    <label className="input-label">Numéro de téléphone du commerçant</label>
                    <input
                      className="input-field"
                      type="tel"
                      placeholder="Ex: +223 70 00 00 02"
                      value={payMerchantPhone}
                      onChange={e => setPayMerchantPhone(e.target.value)}
                    />
                  </div>
                  <button className="btn btn-primary" onClick={handleVerifyMerchant} style={{ height: '40px' }}>Vérifier</button>
                </div>
              )}

              {/* Step 2: Amount */}
              {payMerchantStep === 'amount' && foundMerchant && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ background: 'var(--color-surface-50)', padding: '0.75rem', borderRadius: 'var(--radius-lg)', fontSize: '0.8125rem' }}>
                    <p style={{ fontWeight: 600 }}>Commerçant destinataire :</p>
                    <p style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--color-primary-700)', marginTop: '0.125rem' }}>{foundMerchant.nom_boutique}</p>
                    <p style={{ color: 'var(--color-surface-500)', fontSize: '0.75rem' }}>Gérant : {foundMerchant.nom} · {foundMerchant.telephone}</p>
                  </div>

                  <div className="input-group">
                    <label className="input-label">Montant à envoyer (FCFA)</label>
                    <input
                      className="input-field"
                      type="number"
                      placeholder="Ex: 5000"
                      value={payMerchantAmount}
                      onChange={e => setPayMerchantAmount(e.target.value)}
                    />
                  </div>
                  <button className="btn btn-primary" onClick={() => setPayMerchantStep('pin')} style={{ height: '40px' }}>Continuer</button>
                </div>
              )}

              {/* Step 3: PIN */}
              {payMerchantStep === 'pin' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-surface-500)' }}>Entrez votre code PIN de validation pour autoriser le transfert de {formatFCFA(Number(payMerchantAmount))} vers {foundMerchant?.nom_boutique}.</p>
                  <input
                    className="input-field"
                    type="password"
                    maxLength={4}
                    placeholder="••••"
                    value={payMerchantPin}
                    onChange={e => setPayMerchantPin(e.target.value)}
                    style={{ textAlign: 'center', letterSpacing: '0.5rem', fontSize: '1.25rem' }}
                  />
                  <button className="btn btn-primary" onClick={handleExecutePayMerchant} style={{ height: '40px' }}>Valider le paiement</button>
                </div>
              )}

              {/* Step 4: Processing */}
              {payMerchantStep === 'processing' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', padding: '2rem 0' }}>
                  <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid var(--color-surface-200)', borderTopColor: 'var(--color-primary-600)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>Exécution du transfert...</p>
                </div>
              )}

              {/* Step 5: Success */}
              {payMerchantStep === 'success' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', textAlign: 'center', padding: '1rem 0' }}>
                  <div style={{ width: '56px', height: '56px', background: 'var(--color-success-100)', color: 'var(--color-success-600)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem' }}>✓</div>
                  <div>
                    <h4 style={{ fontWeight: 800, fontSize: '1.125rem', color: 'var(--color-success-700)' }}>Transfert réussi !</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-surface-500)', marginTop: '0.25rem' }}>{formatFCFA(Number(payMerchantAmount))} envoyés avec succès à {foundMerchant?.nom_boutique}.</p>
                    <p style={{ fontSize: '0.6875rem', color: 'var(--color-surface-400)', marginTop: '0.5rem', fontFamily: 'monospace' }}>Réf: {payMerchantRef}</p>
                  </div>
                  <button className="btn btn-secondary" onClick={() => setShowPayModal(false)} style={{ width: '100%', height: '38px' }}>Fermer</button>
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* Transfer Modal */}
        {showTransferModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="card"
              style={{ width: '90%', maxWidth: '380px', padding: '1.5rem', background: 'white', display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Transférer à un proche (1% frais)</h3>
                <button onClick={() => setShowTransferModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.25rem', color: 'var(--color-surface-400)' }}>&times;</button>
              </div>

              {transferError && (
                <div style={{ padding: '0.625rem', borderRadius: 'var(--radius-md)', background: 'var(--color-error-100)', color: 'var(--color-error-700)', fontSize: '0.75rem', fontWeight: 600 }}>
                  {transferError}
                </div>
              )}

              {/* Step 1: Telephone */}
              {transferStep === 'phone' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="input-group">
                    <label className="input-label">Numéro de téléphone du destinataire</label>
                    <input
                      className="input-field"
                      type="tel"
                      placeholder="Ex: +223 70 00 00 01"
                      value={transferPhone}
                      onChange={e => setTransferPhone(e.target.value)}
                    />
                  </div>
                  <button className="btn btn-primary" onClick={handleVerifyRecipient} style={{ height: '40px' }}>Vérifier</button>
                </div>
              )}

              {/* Step 2: Amount */}
              {transferStep === 'amount' && foundRecipient && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ background: 'var(--color-surface-50)', padding: '0.75rem', borderRadius: 'var(--radius-lg)', fontSize: '0.8125rem' }}>
                    <p style={{ fontWeight: 600 }}>Destinataire trouvé :</p>
                    <p style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--color-primary-700)', marginTop: '0.125rem' }}>{foundRecipient.nom}</p>
                    <p style={{ color: 'var(--color-surface-500)', fontSize: '0.75rem' }}>Téléphone : {foundRecipient.telephone}</p>
                  </div>

                  <div className="input-group">
                    <label className="input-label">Montant à transférer (FCFA)</label>
                    <input
                      className="input-field"
                      type="number"
                      placeholder="Ex: 5000"
                      value={transferAmount}
                      onChange={e => setTransferAmount(e.target.value)}
                    />
                    <p style={{ fontSize: '0.6875rem', color: 'var(--color-surface-400)', marginTop: '0.25rem' }}>Frais applicables : 1% ({formatFCFA(Number(transferAmount) * 0.01)})</p>
                  </div>
                  <button className="btn btn-primary" onClick={() => setTransferStep('pin')} style={{ height: '40px' }}>Continuer</button>
                </div>
              )}

              {/* Step 3: PIN */}
              {transferStep === 'pin' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-surface-500)' }}>Entrez votre code PIN de validation pour autoriser le transfert de {formatFCFA(Number(transferAmount))} (+ {formatFCFA(Number(transferAmount) * 0.01)} de frais) vers {foundRecipient?.nom}.</p>
                  <input
                    className="input-field"
                    type="password"
                    maxLength={4}
                    placeholder="••••"
                    value={transferPin}
                    onChange={e => setTransferPin(e.target.value)}
                    style={{ textAlign: 'center', letterSpacing: '0.5rem', fontSize: '1.25rem' }}
                  />
                  <button className="btn btn-primary" onClick={handleExecuteTransfer} style={{ height: '40px' }}>Valider le transfert</button>
                </div>
              )}

              {/* Step 4: Processing */}
              {transferStep === 'processing' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', padding: '2rem 0' }}>
                  <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid var(--color-surface-200)', borderTopColor: 'var(--color-primary-600)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>Exécution du transfert...</p>
                </div>
              )}

              {/* Step 5: Success */}
              {transferStep === 'success' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', textAlign: 'center', padding: '1rem 0' }}>
                  <div style={{ width: '56px', height: '56px', background: 'var(--color-success-100)', color: 'var(--color-success-600)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem' }}>✓</div>
                  <div>
                    <h4 style={{ fontWeight: 800, fontSize: '1.125rem', color: 'var(--color-success-700)' }}>Transfert réussi !</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-surface-500)', marginTop: '0.25rem' }}>{formatFCFA(Number(transferAmount))} envoyés avec succès à {foundRecipient?.nom}.</p>
                    <p style={{ fontSize: '0.6875rem', color: 'var(--color-surface-400)', marginTop: '0.25rem' }}>Frais déduits : {formatFCFA(transferFrais)} · Total débité : {formatFCFA(transferTotalDebited)}</p>
                    <p style={{ fontSize: '0.6875rem', color: 'var(--color-surface-400)', marginTop: '0.5rem', fontFamily: 'monospace' }}>Réf: {transferRef}</p>
                  </div>
                  <button className="btn btn-secondary" onClick={() => setShowTransferModal(false)} style={{ width: '100%', height: '38px' }}>Fermer</button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
