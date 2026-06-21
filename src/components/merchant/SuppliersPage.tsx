// ============================================================================
// LafiaPay — Merchant Suppliers Page
// Fictitious partner suppliers for ecosystem simulation
// ============================================================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, Package, Coffee, Wheat, Send, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { formatFCFA } from '../../types';

const SUPPLIERS = [
  { id: 's1', name: 'Grossiste Sahel Distribution', category: 'Alimentation générale', icon: Package, color: '#10B981', lastOrder: '15 juin 2026' },
  { id: 's2', name: 'Café Import Mali', category: 'Boissons & café', icon: Coffee, color: '#F59E0B', lastOrder: '12 juin 2026' },
  { id: 's3', name: 'Céréales du Niger', category: 'Céréales & grains', icon: Wheat, color: '#8B5CF6', lastOrder: '8 juin 2026' },
];

export default function SuppliersPage() {
  const { compte } = useAuth();
  const [payingId, setPayingId] = useState<string | null>(null);
  const [paidId, setPaidId] = useState<string | null>(null);

  const handlePay = async (id: string) => {
    setPayingId(id);
    await new Promise(r => setTimeout(r, 2000));
    setPayingId(null);
    setPaidId(id);
    setTimeout(() => setPaidId(null), 3000);
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h1 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>Fournisseurs partenaires</h1>
      <p style={{ fontSize: '0.8125rem', color: 'var(--color-surface-500)', marginBottom: '1.25rem' }}>
        Payez vos fournisseurs directement depuis votre solde LafiaPay
      </p>

      <div className="card gradient-primary" style={{ padding: '1rem', color: 'white', marginBottom: '1.25rem' }}>
        <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Solde disponible</div>
        <div className="amount-display" style={{ fontSize: '1.5rem' }}>{formatFCFA(compte?.solde ?? 0)}</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {SUPPLIERS.map((supplier, i) => {
          const Icon = supplier.icon;
          const isPaying = payingId === supplier.id;
          const isPaid = paidId === supplier.id;

          return (
            <motion.div
              key={supplier.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="card"
              style={{ padding: '1.25rem' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '0.75rem' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 'var(--radius-lg)',
                  background: `${supplier.color}15`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={22} style={{ color: supplier.color }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{supplier.name}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-surface-500)' }}>{supplier.category}</div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-surface-400)' }}>
                  Dernière commande : {supplier.lastOrder}
                </span>
                <AnimatePresence mode="wait">
                  {isPaid ? (
                    <motion.span
                      key="paid"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="badge badge-success"
                    >
                      <Check size={14} /> Payé
                    </motion.span>
                  ) : (
                    <motion.button
                      key="pay"
                      whileTap={{ scale: 0.95 }}
                      className="btn btn-primary btn-sm"
                      onClick={() => handlePay(supplier.id)}
                      disabled={isPaying}
                    >
                      {isPaying ? (
                        <span className="animate-pulse-soft">Envoi...</span>
                      ) : (
                        <><Send size={14} /> Payer</>
                      )}
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
