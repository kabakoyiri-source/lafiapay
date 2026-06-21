// ============================================================================
// LafiaPay — Admin Audit Log Page
// Chronological table of administrative activities and changes
// ============================================================================

import { useState, useMemo } from 'react';
import { Search, ShieldAlert, FileText, Database } from 'lucide-react';
import { mockStore } from '../../lib/mockData';
import { formatDate } from '../../types';

export default function AuditLogPage() {
  const [search, setSearch] = useState('');

  // Tick for re-rendering on store mutations
  const [, setTick] = useState(0);
  useMemo(() => {
    return mockStore.subscribe(() => setTick(t => t + 1));
  }, []);

  const logs = useMemo(() => {
    return mockStore.auditLogs;
  }, [mockStore.auditLogs]);

  // Filter logs
  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      const s = search.toLowerCase();
      const matchSearch =
        l.action.toLowerCase().includes(s) ||
        (l.admin_nom && l.admin_nom.toLowerCase().includes(s)) ||
        JSON.stringify(l.details).toLowerCase().includes(s);

      return matchSearch;
    });
  }, [logs, search]);

  // Format details object to display nicely as a label list
  const formatDetails = (details: Record<string, unknown>) => {
    return Object.entries(details)
      .map(([key, val]) => {
        const formattedVal = typeof val === 'object' ? JSON.stringify(val) : String(val);
        return `${key}: ${formattedVal}`;
      })
      .join(', ');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Search Bar */}
      <div className="card" style={{ padding: '1.25rem 1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-surface-400)' }} />
          <input
            className="input-field"
            style={{ paddingLeft: '2.5rem', paddingTop: '0.8rem', paddingBottom: '0.8rem', fontSize: '0.875rem' }}
            placeholder="Rechercher par action, administrateur ou contenu de détail..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Logs Card */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Date & Heure</th>
                <th>Administrateur</th>
                <th>Action</th>
                <th>Détails de l'opération</th>
                <th style={{ width: '80px', textAlign: 'center' }}>Origine</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-surface-400)' }}>
                    Aucun log d'audit ne correspond à la recherche.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id}>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--color-surface-500)' }}>
                      {formatDate(log.created_at)}
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{
                          width: '24px', height: '24px', borderRadius: '50%',
                          backgroundColor: 'var(--color-surface-200)', color: 'var(--color-surface-700)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6875rem', fontWeight: 'bold'
                        }} className="dark:bg-dark-surface dark:text-dark-text">
                          {log.admin_nom ? log.admin_nom.charAt(0) : 'A'}
                        </div>
                        {log.admin_nom || 'Admin'}
                      </div>
                    </td>
                    <td style={{ fontWeight: 700 }}>
                      <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--color-surface-700)', fontFamily: 'monospace', maxWidth: '400px', wordBreak: 'break-all' }} className="dark:text-dark-text-muted">
                      {formatDetails(log.details)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="badge badge-neutral" style={{ fontSize: '0.625rem' }}>
                        Console
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
