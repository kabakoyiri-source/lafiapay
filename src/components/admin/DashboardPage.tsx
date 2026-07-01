// ============================================================================
// LafiaPay — Admin Dashboard Page
// Dynamic analytics dashboard featuring KPIs and interactive charts
// ============================================================================

import { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { ArrowDownLeft, ArrowUpRight, Store, Users, DollarSign, Activity } from 'lucide-react';
import { mockStore } from '../../lib/mockData';
import { formatFCFA, CATEGORY_INFO } from '../../types';

export default function DashboardPage() {
  const [, setTick] = useState(0);
  useEffect(() => {
    return mockStore.subscribe(() => setTick(t => t + 1));
  }, []);

  // Compute analytics dynamically from mockStore
  const stats = useMemo(() => {
    const txns = mockStore.transactions;
    const profiles = mockStore.profiles;

    const successfulTxns = txns.filter(t => t.statut === 'reussie');
    const deposits = successfulTxns.filter(t => t.type === 'depot');
    const payments = successfulTxns.filter(t => t.type === 'paiement');
    const transfers = successfulTxns.filter(t => t.type === 'transfert');

    const totalDeposits = deposits.reduce((acc, t) => acc + t.montant, 0);
    const totalPayments = payments.reduce((acc, t) => acc + t.montant, 0);
    const totalTransfers = transfers.reduce((acc, t) => acc + t.montant, 0);
    const totalFees = successfulTxns.reduce((acc, t) => acc + (t.frais || 0), 0);

    const activeClients = profiles.filter(p => p.role === 'client' && p.statut === 'actif').length;
    const activeMerchants = profiles.filter(p => p.role === 'commercant' && p.statut === 'actif').length;

    return {
      totalDeposits,
      totalPayments,
      totalTransfers,
      totalFees,
      activeClients,
      activeMerchants,
      totalTxnsCount: txns.length,
      successRate: (successfulTxns.length / txns.length) * 100,
    };
  }, [mockStore.transactions, mockStore.profiles]);

  // 1. Chart: 30-day transaction volume trend
  const volumeData = useMemo(() => {
    const txns = mockStore.transactions.filter(t => t.statut === 'reussie');
    const dailyMap: Record<string, { date: string; Dépôts: number; Paiements: number; Transferts: number }> = {};

    // Initialize last 10 days for a cleaner dashboard display
    const now = new Date();
    for (let i = 9; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
      const key = d.toISOString().split('T')[0];
      dailyMap[key] = { date: dateStr, Dépôts: 0, Paiements: 0, Transferts: 0 };
    }

    txns.forEach(t => {
      const key = t.created_at.split('T')[0];
      if (dailyMap[key]) {
        if (t.type === 'depot') {
          dailyMap[key].Dépôts += t.montant;
        } else if (t.type === 'paiement') {
          dailyMap[key].Paiements += t.montant;
        } else if (t.type === 'transfert') {
          dailyMap[key].Transferts += t.montant;
        }
      }
    });

    return Object.values(dailyMap);
  }, [mockStore.transactions]);

  // 2. Chart: Top 5 Merchants by sales volume
  const topMerchantsData = useMemo(() => {
    const payments = mockStore.transactions.filter(t => t.type === 'paiement' && t.statut === 'reussie');
    const merchantMap: Record<string, { name: string; volume: number }> = {};

    payments.forEach(p => {
      const boutiqueName = p.commercant_boutique || p.commercant_nom || 'Inconnu';
      if (!merchantMap[boutiqueName]) {
        merchantMap[boutiqueName] = { name: boutiqueName, volume: 0 };
      }
      merchantMap[boutiqueName].volume += p.montant;
    });

    return Object.values(merchantMap)
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 5);
  }, [mockStore.transactions]);

  // 3. Chart: Distribution of transaction volume by Category
  const categoryData = useMemo(() => {
    const payments = mockStore.transactions.filter(t => t.type === 'paiement' && t.statut === 'reussie');
    const catMap: Record<string, number> = {};

    payments.forEach(p => {
      const cat = p.commercant_categorie || 'autre';
      catMap[cat] = (catMap[cat] || 0) + p.montant;
    });

    return Object.entries(catMap).map(([key, value]) => {
      const info = CATEGORY_INFO[key as keyof typeof CATEGORY_INFO] || CATEGORY_INFO.autre;
      return {
        name: info.label,
        value,
        color: info.color,
      };
    });
  }, [mockStore.transactions]);

  const COLORS = ['#8B5CF6', '#F59E0B', '#10B981', '#EF4444', '#3B82F6', '#EC4899', '#6B7280'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
        {/* KPI: Chiffre d'Affaires */}
        <div className="kpi-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', border: '1px solid var(--color-accent-200)', background: 'linear-gradient(to bottom, white, var(--color-accent-50))' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-surface-500)' }}>Chiffre d'Affaires</span>
            <div style={{ padding: '0.5rem', borderRadius: 'var(--radius-lg)', background: 'var(--color-accent-100)', color: 'var(--color-accent-600)' }}>
              <DollarSign size={20} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: 'var(--color-accent-700)' }}>{formatFCFA(stats.totalFees)}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span className="kpi-change-up">↑ 15.6%</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-surface-500)' }}>Frais collectés</span>
          </div>
        </div>

        {/* KPI: Payments */}
        <div className="kpi-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-surface-500)' }}>Volume Paiements</span>
            <div style={{ padding: '0.5rem', borderRadius: 'var(--radius-lg)', background: 'var(--color-primary-100)', color: 'var(--color-primary-600)' }}>
              <ArrowUpRight size={20} />
            </div>
          </div>
          <div className="kpi-value">{formatFCFA(stats.totalPayments)}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span className="kpi-change-up">↑ 18.2%</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-surface-500)' }}>vs 30j précédents</span>
          </div>
        </div>

        {/* KPI: Active Clients */}
        <div className="kpi-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-surface-500)' }}>Clients Actifs</span>
            <div style={{ padding: '0.5rem', borderRadius: 'var(--radius-lg)', background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }}>
              <Users size={20} />
            </div>
          </div>
          <div className="kpi-value">{stats.activeClients}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span className="kpi-change-up">↑ 4.3%</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-surface-500)' }}>ce mois-ci</span>
          </div>
        </div>

        {/* KPI: Active Merchants */}
        <div className="kpi-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-surface-500)' }}>Commerçants</span>
            <div style={{ padding: '0.5rem', borderRadius: 'var(--radius-lg)', background: 'var(--color-accent-100)', color: 'var(--color-accent-600)' }}>
              <Store size={20} />
            </div>
          </div>
          <div className="kpi-value">{stats.activeMerchants}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span className="kpi-change-up">↑ 8.7%</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-surface-500)' }}>ce mois-ci</span>
          </div>
        </div>
      </div>

      {/* Primary Chart: Volume over time */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 800 }}>Flux des volumes de transactions (10 derniers jours)</h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-surface-500)' }}>Comparaison des dépôts physiques, paiements commerçants et transferts P2P</p>
          </div>
        </div>
        <div style={{ height: '300px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={volumeData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorDepots" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-success-500)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="var(--color-success-500)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorPaiements" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-primary-500)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="var(--color-primary-500)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorTransferts" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-accent-500)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="var(--color-accent-500)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-surface-200)" />
              <XAxis dataKey="date" stroke="var(--color-surface-500)" fontSize={12} tickLine={false} />
              <YAxis
                stroke="var(--color-surface-500)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={value => `${value / 1000}k`}
              />
              <Tooltip
                formatter={(value: any) => [formatFCFA(Number(value)), '']}
                contentStyle={{
                  background: 'white',
                  border: '1px solid var(--color-surface-200)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-md)',
                }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Area
                name="Dépôts Physiques"
                type="monotone"
                dataKey="Dépôts"
                stroke="var(--color-success-500)"
                fillOpacity={1}
                fill="url(#colorDepots)"
                strokeWidth={2}
              />
              <Area
                name="Paiements Commerçants"
                type="monotone"
                dataKey="Paiements"
                stroke="var(--color-primary-600)"
                fillOpacity={1}
                fill="url(#colorPaiements)"
                strokeWidth={2}
              />
              <Area
                name="Transferts P2P"
                type="monotone"
                dataKey="Transferts"
                stroke="var(--color-accent-600)"
                fillOpacity={1}
                fill="url(#colorTransferts)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Secondary Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Top Merchants Bar Chart */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.5rem' }}>Top 5 des commerces (Volume cumulé)</h2>
          <div style={{ height: '260px', width: '100%' }}>
            {topMerchantsData.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-surface-400)' }}>
                Aucune donnée
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topMerchantsData} layout="vertical" margin={{ top: 0, right: 10, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-surface-200)" />
                  <XAxis type="number" fontSize={11} stroke="var(--color-surface-500)" tickFormatter={value => `${value / 1000}k`} />
                  <YAxis type="category" dataKey="name" fontSize={11} stroke="var(--color-surface-500)" width={100} />
                  <Tooltip
                    formatter={(value: any) => [formatFCFA(Number(value)), 'Volume']}
                    contentStyle={{
                      background: 'white',
                      border: '1px solid var(--color-surface-200)',
                      borderRadius: 'var(--radius-md)',
                    }}
                  />
                  <Bar dataKey="volume" fill="var(--color-primary-500)" radius={[0, 4, 4, 0]} barSize={16}>
                    {topMerchantsData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Categories Pie Chart */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.5rem' }}>Paiements par catégorie métier</h2>
          <div style={{ display: 'flex', alignItems: 'center', height: '260px' }}>
            <div style={{ width: '50%', height: '100%' }}>
              {categoryData.length === 0 ? (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-surface-400)' }}>
                  Aucun
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => [formatFCFA(Number(value)), '']} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            {/* Custom Legend */}
            <div style={{ width: '50%', display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto', maxHeight: '200px', fontSize: '0.75rem', paddingLeft: '1rem' }}>
              {categoryData.map((item, index) => (
                <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color || COLORS[index % COLORS.length], flexShrink: 0 }} />
                  <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                  <span style={{ marginLeft: 'auto', color: 'var(--color-surface-500)', fontVariantNumeric: 'tabular-nums' }}>
                    {formatFCFA(item.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
