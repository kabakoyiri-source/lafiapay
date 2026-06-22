// ============================================================================
// LafiaPay — Protected Route Component
// Guards routes by authentication and role
// ============================================================================

import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import type { UserRole } from '../../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
      }}>
        <div className="animate-pulse-soft" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
        }}>
          <div style={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--color-primary-600), var(--color-accent-500))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '1.5rem',
            fontWeight: 800,
          }}>
            LP
          </div>
          <span style={{ color: 'var(--color-surface-500)', fontSize: '0.875rem' }}>
            Chargement...
          </span>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole && profile.role !== requiredRole) {
    // Redirect to the correct space
    const roleRoutes: Record<UserRole, string> = {
      client: '/client',
      commercant: '/merchant',
      admin: '/admin',
      agent: '/agent',
    };
    return <Navigate to={roleRoutes[profile.role]} replace />;
  }

  return <>{children}</>;
}
