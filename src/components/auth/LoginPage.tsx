// ============================================================================
// LafiaPay — Login Page
// Premium login with demo quick-connect buttons
// ============================================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Lock, Mail, Eye, EyeOff, Wallet, Shield, Zap, User, Store, Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import type { UserRole } from '../../types';

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const { showToast } = useToast();

  const [loginMode, setLoginMode] = useState<'phone' | 'email'>('phone');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 800)); // Simulated delay
    
    const success = loginMode === 'phone'
      ? await signIn(phone, pin)
      : await signIn(email, password);

    if (success) {
      showToast({ type: 'success', title: 'Connexion réussie', message: 'Bienvenue sur LafiaPay !' });
    } else {
      showToast({ type: 'error', title: 'Échec de connexion', message: 'Identifiants incorrects' });
    }
    setLoading(false);
  };

  const handleDemoLogin = async (role: UserRole) => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    
    const success = await signIn('', '', role);
    if (success) {
      showToast({ type: 'success', title: 'Mode démo activé', message: `Connecté en tant que ${role}` });
    }
    setLoading(false);
  };

  // Redirect happens in App.tsx via useEffect watching auth state

  return (
    <div className="mobile-frame-wrapper" style={{ minHeight: '100vh' }}>
      <div style={{
        width: '100%',
        maxWidth: 430,
        margin: '0 auto',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="gradient-hero"
          style={{
            padding: '3rem 1.5rem 2.5rem',
            borderRadius: '0 0 2rem 2rem',
            textAlign: 'center',
            color: 'white',
          }}
        >
          {/* Logo */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            style={{
              width: 80,
              height: 80,
              borderRadius: '1.5rem',
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            <Wallet size={36} strokeWidth={2.5} />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            style={{
              fontSize: '2rem',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              marginBottom: '0.25rem',
            }}
          >
            LafiaPay
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            style={{ fontSize: '0.9375rem', opacity: 0.8 }}
          >
            Paiement digital en circuit fermé
          </motion.p>

          {/* Feature pills */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '0.5rem',
              marginTop: '1.25rem',
              flexWrap: 'wrap',
            }}
          >
            {[
              { icon: Zap, label: 'Instantané' },
              { icon: Shield, label: 'Sécurisé' },
              { icon: Wallet, label: 'Sans cash' },
            ].map(({ icon: Icon, label }) => (
              <span
                key={label}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  padding: '0.375rem 0.75rem',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(255, 255, 255, 0.12)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}
              >
                <Icon size={14} /> {label}
              </span>
            ))}
          </motion.div>
        </motion.div>

        {/* Login Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          style={{ padding: '1.5rem', flex: 1 }}
        >
          {/* Tab Switch */}
          <div style={{
            display: 'flex',
            background: 'var(--color-surface-100)',
            borderRadius: 'var(--radius-xl)',
            padding: '0.25rem',
            marginBottom: '1.5rem',
          }}>
            {(['phone', 'email'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setLoginMode(mode)}
                style={{
                  flex: 1,
                  padding: '0.625rem',
                  borderRadius: 'var(--radius-lg)',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                  background: loginMode === mode ? 'white' : 'transparent',
                  color: loginMode === mode ? 'var(--color-primary-700)' : 'var(--color-surface-500)',
                  boxShadow: loginMode === mode ? 'var(--shadow-sm)' : 'none',
                }}
              >
                {mode === 'phone' ? '📱 Téléphone' : '✉️ Email'}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {loginMode === 'phone' ? (
              <motion.div
                key="phone"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="input-group" style={{ marginBottom: '1rem' }}>
                  <label className="input-label">Numéro de téléphone</label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={18} style={{
                      position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)',
                      color: 'var(--color-surface-400)',
                    }} />
                    <input
                      className="input-field"
                      style={{ paddingLeft: '2.75rem' }}
                      type="tel"
                      placeholder="+223 70 00 00 01"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                    />
                  </div>
                </div>
                <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="input-label">Code PIN</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={18} style={{
                      position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)',
                      color: 'var(--color-surface-400)',
                    }} />
                    <input
                      className="input-field"
                      style={{ paddingLeft: '2.75rem' }}
                      type="password"
                      maxLength={4}
                      placeholder="••••"
                      value={pin}
                      onChange={e => setPin(e.target.value)}
                    />
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="email"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="input-group" style={{ marginBottom: '1rem' }}>
                  <label className="input-label">Email</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={18} style={{
                      position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)',
                      color: 'var(--color-surface-400)',
                    }} />
                    <input
                      className="input-field"
                      style={{ paddingLeft: '2.75rem' }}
                      type="email"
                      placeholder="admin@demo.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="input-label">Mot de passe</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={18} style={{
                      position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)',
                      color: 'var(--color-surface-400)',
                    }} />
                    <input
                      className="input-field"
                      style={{ paddingLeft: '2.75rem', paddingRight: '2.75rem' }}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Demo2026!"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--color-surface-400)',
                      }}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginBottom: '1.5rem' }}
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <span className="animate-pulse-soft">Connexion...</span>
            ) : (
              'Se connecter'
            )}
          </button>

          {/* Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1.5rem',
          }}>
            <div style={{ flex: 1, height: 1, background: 'var(--color-surface-200)' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--color-surface-400)', fontWeight: 600 }}>
              CONNEXION RAPIDE DÉMO
            </span>
            <div style={{ flex: 1, height: 1, background: 'var(--color-surface-200)' }} />
          </div>

          {/* Demo Quick Login Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { role: 'client' as UserRole, icon: User, label: 'Client Demo', sub: 'Amadou Diallo · 25 750 FCFA', color: 'var(--color-primary-600)' },
              { role: 'commercant' as UserRole, icon: Store, label: 'Commerçant Demo', sub: 'Épicerie Sogoniko · 185 000 FCFA', color: 'var(--color-success-600)' },
              { role: 'admin' as UserRole, icon: Settings, label: 'Admin Demo', sub: 'Tableau de bord complet', color: 'var(--color-accent-600)' },
            ].map(({ role, icon: Icon, label, sub, color }) => (
              <motion.button
                key={role}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleDemoLogin(role)}
                disabled={loading}
                className="card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.875rem',
                  padding: '0.875rem 1.125rem',
                  cursor: 'pointer',
                  border: '1px solid var(--color-surface-200)',
                  textAlign: 'left',
                  width: '100%',
                }}
              >
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 'var(--radius-lg)',
                  background: `${color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Icon size={22} style={{ color }} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{label}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-surface-500)', marginTop: '0.125rem' }}>{sub}</div>
                </div>
                <Zap size={16} style={{ marginLeft: 'auto', color: 'var(--color-accent-500)' }} />
              </motion.button>
            ))}
          </div>

          {/* Register link */}
          <p style={{
            textAlign: 'center',
            marginTop: '1.5rem',
            fontSize: '0.875rem',
            color: 'var(--color-surface-500)',
          }}>
            Pas de compte ?{' '}
            <button
              onClick={() => navigate('/register')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-primary-600)',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '0.875rem',
              }}
            >
              S'inscrire
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
