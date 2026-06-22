// ============================================================================
// LafiaPay — Merchant Dashboard
// QR code, revenue stats, real-time payment feed
// ============================================================================

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Download, TrendingUp, DollarSign, ShoppingBag, ArrowDownLeft, LogOut } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { mockStore } from '../../lib/mockData';
import { formatFCFA, CATEGORY_INFO } from '../../types';
import type { Transaction } from '../../types';

export default function MerchantDashboard() {
  const { profile, compte, commercant, signOut } = useAuth();
  const [recentPayments, setRecentPayments] = useState<Transaction[]>([]);

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
            value={commercant?.qr_code_id || 'LAFIAPAY-MERCHANT'}
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
        style={{ padding: '1rem 1.25rem', marginBottom: '1rem', color: 'white' }}
      >
        <p style={{ fontSize: '0.8125rem', opacity: 0.8 }}>Solde disponible</p>
        <div className="amount-display" style={{ fontSize: '1.5rem' }}>{formatFCFA(compte?.solde ?? 0)}</div>
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
    </div>
  );
}
