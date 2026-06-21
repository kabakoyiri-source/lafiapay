// ============================================================================
// LafiaPay — Merchant Support Page
// Dispute form and timeline
// ============================================================================

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Clock, CheckCircle, Circle, Send } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { mockStore } from '../../lib/mockData';
import type { Litige } from '../../types';

export default function SupportPage() {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [description, setDescription] = useState('');

  const disputes = useMemo(() =>
    mockStore.litiges.filter(l => l.declarant_id === profile?.id),
    [profile?.id]
  );

  const handleSubmit = () => {
    if (!description.trim()) return;
    const litige: Litige = {
      id: `lit-${Date.now()}`,
      transaction_id: '',
      declarant_id: profile!.id,
      description: description.trim(),
      statut: 'ouvert',
      created_at: new Date().toISOString(),
      resolved_at: null,
      declarant_nom: profile!.nom,
    };
    mockStore.addDispute(litige);
    setDescription('');
    showToast({ type: 'success', title: 'Signalement envoyé', message: 'Notre équipe va traiter votre demande' });
  };

  const statusIcon = (status: string) => {
    if (status === 'resolu') return <CheckCircle size={18} style={{ color: 'var(--color-success-500)' }} />;
    if (status === 'en_cours') return <Clock size={18} style={{ color: 'var(--color-warning-500)' }} />;
    return <Circle size={18} style={{ color: 'var(--color-surface-400)' }} />;
  };

  const statusLabel = (status: string) => {
    if (status === 'resolu') return 'Résolu';
    if (status === 'en_cours') return 'En cours';
    return 'Ouvert';
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h1 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.25rem' }}>Support & Litiges</h1>

      {/* New Dispute Form */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangle size={18} style={{ color: 'var(--color-warning-500)' }} />
          Signaler un problème
        </h3>
        <textarea
          className="input-field"
          rows={3}
          placeholder="Décrivez votre problème en détail..."
          value={description}
          onChange={e => setDescription(e.target.value)}
          style={{ resize: 'vertical', paddingTop: '0.875rem', marginBottom: '0.75rem' }}
        />
        <button className="btn btn-primary" onClick={handleSubmit} disabled={!description.trim()}>
          <Send size={16} /> Envoyer
        </button>
      </div>

      {/* Disputes List */}
      <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '0.75rem' }}>
        Mes signalements ({disputes.length})
      </h3>

      {disputes.length === 0 ? (
        <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
          <p style={{ color: 'var(--color-surface-500)', fontSize: '0.875rem' }}>Aucun litige en cours</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {disputes.map((lit, i) => (
            <motion.div
              key={lit.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card"
              style={{ padding: '1rem' }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                {statusIcon(lit.statut)}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <span className={`badge badge-${lit.statut === 'resolu' ? 'success' : lit.statut === 'en_cours' ? 'warning' : 'neutral'}`}>
                      {statusLabel(lit.statut)}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-surface-400)' }}>
                      {new Date(lit.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--color-surface-600)', lineHeight: 1.4, marginTop: '0.375rem' }}>
                    {lit.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
