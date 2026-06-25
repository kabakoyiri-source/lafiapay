// ============================================================================
// LafiaPay — Login Page
// Premium login with OTP flow + demo quick-connect buttons
// ============================================================================

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Lock, Mail, Eye, EyeOff, Wallet, Shield, Zap, User, Store, Settings, UserCheck } from 'lucide-react';
import Logo from '../common/Logo';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { generateOTP, verifyOTP, getDemoOTPCode } from '../../lib/otpService';
import { mockStore } from '../../lib/mockData';
import { supabase, IS_MOCK_MODE } from '../../lib/supabase';
import type { UserRole } from '../../types';

type LoginStep = 'credentials' | 'otp' | 'pin';

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn, signInWithPhone } = useAuth();
  const { showToast } = useToast();

  const [loginMode, setLoginMode] = useState<'phone' | 'email'>('phone');
  const [loginStep, setLoginStep] = useState<LoginStep>('credentials');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // OTP state
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [otpTimer, setOtpTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // OTP countdown timer
  useEffect(() => {
    if (loginStep !== 'otp' || otpTimer <= 0) {
      if (otpTimer <= 0) setCanResend(true);
      return;
    }
    const interval = setInterval(() => {
      setOtpTimer(prev => {
        if (prev <= 1) { setCanResend(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [loginStep, otpTimer]);

  // Sync profiles and accounts on mount
  useEffect(() => {
    mockStore.syncWithSupabase();
  }, []);

  // ========================================================================
  // Step 1: Phone → Send OTP
  // ========================================================================
  const handlePhoneLogin = async () => {
    if (!phone.trim()) {
      showToast({ type: 'error', title: 'Numéro requis', message: 'Veuillez saisir votre numéro de téléphone' });
      return;
    }

    setLoading(true);

    let profile = null;
    if (IS_MOCK_MODE) {
      profile = mockStore.findProfileByPhone(phone);
    } else {
      // Fetch fresh profiles directly from Supabase to catch recent mobile registrations
      const { data: profiles, error } = await supabase.from('profiles').select('*');
      if (profiles) {
        mockStore.profiles = profiles;
        profile = mockStore.findProfileByPhone(phone);
      } else if (error) {
        console.error('Error checking profiles in Supabase:', error);
      }
    }

    if (!profile) {
      setLoading(false);
      showToast({ type: 'error', title: 'Compte introuvable', message: 'Aucun compte associé à ce numéro. Inscrivez-vous d\'abord.' });
      return;
    }

    await new Promise(r => setTimeout(r, 600));

    generateOTP(phone, 'connexion');

    setOtpTimer(60);
    setCanResend(false);
    setOtpDigits(['', '', '', '', '', '']);
    setLoginStep('otp');
    setLoading(false);

    showToast({
      type: 'success',
      title: 'Code envoyé !',
      message: `Un SMS de vérification a été envoyé au ${phone}`,
    });
  };

  // ========================================================================
  // Step 2: Verify OTP
  // ========================================================================
  const handleOTPInput = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    const fullCode = newDigits.join('');
    if (fullCode.length === 6) {
      setTimeout(() => verifyOTPCode(fullCode), 200);
    }
  };

  const handleOTPKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOTPPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtpDigits(pasted.split(''));
      setTimeout(() => verifyOTPCode(pasted), 200);
    }
  };

  const verifyOTPCode = async (code: string) => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 500));

    const valid = verifyOTP(phone, code, 'connexion');
    if (valid) {
      showToast({ type: 'success', title: 'Code vérifié ✓', message: 'Saisissez votre code PIN' });
      setPin('');
      setLoginStep('pin');
    } else {
      showToast({ type: 'error', title: 'Code incorrect', message: 'Vérifiez le code et réessayez' });
      setOtpDigits(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    }
    setLoading(false);
  };

  const handleResendOTP = () => {
    generateOTP(phone, 'connexion');
    setOtpTimer(60);
    setCanResend(false);
    setOtpDigits(['', '', '', '', '', '']);
    showToast({ type: 'success', title: 'Code renvoyé', message: `Nouveau code envoyé au ${phone}` });
  };

  // ========================================================================
  // Step 3: PIN verification
  // ========================================================================
  const handlePinKey = (key: string) => {
    if (key === 'delete') {
      setPin(prev => prev.slice(0, -1));
    } else if (pin.length < 4) {
      const newPin = pin + key;
      setPin(newPin);
      if (newPin.length === 4) {
        setTimeout(() => handlePinLogin(newPin), 300);
      }
    }
  };

  const handlePinLogin = async (pinCode: string) => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));

    const success = await signInWithPhone(phone, pinCode);
    if (success) {
      showToast({ type: 'success', title: 'Connexion réussie', message: 'Bienvenue sur LafiaPay !' });
    } else {
      showToast({ type: 'error', title: 'PIN incorrect', message: 'Le code PIN ne correspond pas à ce compte' });
      setPin('');
    }
    setLoading(false);
  };

  // ========================================================================
  // Email login (legacy)
  // ========================================================================
  const handleEmailLogin = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    const success = await signIn(email, password);
    if (success) {
      showToast({ type: 'success', title: 'Connexion réussie', message: 'Bienvenue sur LafiaPay !' });
    } else {
      showToast({ type: 'error', title: 'Échec de connexion', message: 'Identifiants incorrects' });
    }
    setLoading(false);
  };

  // ========================================================================
  // Demo quick-login
  // ========================================================================
  const handleDemoLogin = async (role: UserRole) => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    const success = await signIn('', '', role);
    if (success) {
      showToast({ type: 'success', title: 'Mode démo activé', message: `Connecté en tant que ${role}` });
    }
    setLoading(false);
  };

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
              background: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              overflow: 'hidden',
            }}
          >
            <Logo size={70} />
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

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          style={{ padding: '1.5rem', flex: 1 }}
        >
          <AnimatePresence mode="wait">

            {/* ============================================================ */}
            {/* STEP: Credentials (Phone or Email) */}
            {/* ============================================================ */}
            {loginStep === 'credentials' && (
              <motion.div
                key="credentials"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, x: -20 }}
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

                {loginMode === 'phone' ? (
                  <div>
                    <div className="input-group" style={{ marginBottom: '1.5rem' }}>
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
                          onKeyDown={e => e.key === 'Enter' && handlePhoneLogin()}
                        />
                      </div>
                    </div>

                    <button
                      className="btn btn-primary btn-lg"
                      style={{ width: '100%', marginBottom: '1rem' }}
                      onClick={handlePhoneLogin}
                      disabled={loading}
                    >
                      {loading ? (
                        <span className="animate-pulse-soft">Envoi du code...</span>
                      ) : (
                        'Recevoir un code SMS'
                      )}
                    </button>

                    {/* Demo hint */}
                    <div style={{
                      padding: '0.625rem 0.75rem',
                      background: 'var(--color-accent-50)',
                      border: '1.5px dashed var(--color-accent-400)',
                      borderRadius: 'var(--radius-lg)',
                      marginBottom: '1.5rem',
                      display: 'flex',
                      gap: '0.5rem',
                      alignItems: 'center',
                    }}>
                      <Zap size={14} style={{ color: 'var(--color-accent-600)', flexShrink: 0 }} />
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-accent-800)', lineHeight: 1.3 }}>
                        <strong>Démo :</strong> Code OTP = <code style={{
                          background: 'var(--color-accent-200)',
                          padding: '0.0625rem 0.25rem',
                          borderRadius: 3,
                          fontWeight: 700,
                        }}>{getDemoOTPCode()}</code> · PIN = <code style={{
                          background: 'var(--color-accent-200)',
                          padding: '0.0625rem 0.25rem',
                          borderRadius: 3,
                          fontWeight: 700,
                        }}>1234</code>
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
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

                    <button
                      className="btn btn-primary btn-lg"
                      style={{ width: '100%', marginBottom: '1.5rem' }}
                      onClick={handleEmailLogin}
                      disabled={loading}
                    >
                      {loading ? (
                        <span className="animate-pulse-soft">Connexion...</span>
                      ) : (
                        'Se connecter'
                      )}
                    </button>
                  </div>
                )}

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
                    { role: 'agent' as UserRole, icon: UserCheck, label: 'Agent Demo', sub: 'Modibo Keïta · 500 000 FCFA', color: '#F59E0B' },
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
            )}

            {/* ============================================================ */}
            {/* STEP: OTP Verification */}
            {/* ============================================================ */}
            {loginStep === 'otp' && (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                style={{ textAlign: 'center' }}
              >
                <button
                  onClick={() => setLoginStep('credentials')}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--color-primary-600)', fontWeight: 600, fontSize: '0.875rem',
                    marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.25rem',
                  }}
                >
                  ← Retour
                </button>

                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: 'var(--color-primary-50)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 1rem',
                }}>
                  <Shield size={24} style={{ color: 'var(--color-primary-600)' }} />
                </div>

                <h2 style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: '0.375rem' }}>
                  Vérification SMS
                </h2>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-surface-500)', marginBottom: '1.75rem' }}>
                  Code envoyé au <strong style={{ color: 'var(--color-primary-700)' }}>{phone}</strong>
                </p>

                {/* OTP Input */}
                <div
                  style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}
                  onPaste={handleOTPPaste}
                >
                  {otpDigits.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOTPInput(i, e.target.value)}
                      onKeyDown={e => handleOTPKeyDown(i, e)}
                      autoFocus={i === 0}
                      disabled={loading}
                      style={{
                        width: 44, height: 52, textAlign: 'center',
                        fontSize: '1.375rem', fontWeight: 700,
                        borderRadius: 'var(--radius-lg)',
                        border: `2px solid ${digit ? 'var(--color-primary-500)' : 'var(--color-surface-200)'}`,
                        background: digit ? 'var(--color-primary-50)' : 'var(--color-surface-50)',
                        outline: 'none', transition: 'all 0.2s',
                        color: 'var(--color-primary-700)',
                      }}
                    />
                  ))}
                </div>

                {/* Timer / Resend */}
                <div style={{ marginBottom: '1.5rem' }}>
                  {canResend ? (
                    <button
                      onClick={handleResendOTP}
                      style={{
                        background: 'none', border: 'none',
                        color: 'var(--color-primary-600)', fontWeight: 700,
                        cursor: 'pointer', fontSize: '0.875rem',
                      }}
                    >
                      Renvoyer le code
                    </button>
                  ) : (
                    <p style={{ fontSize: '0.8125rem', color: 'var(--color-surface-400)' }}>
                      Renvoyer dans <strong>{otpTimer}s</strong>
                    </p>
                  )}
                </div>

                {/* Demo hint */}
                <div style={{
                  padding: '0.625rem',
                  background: 'var(--color-accent-50)',
                  border: '1.5px dashed var(--color-accent-400)',
                  borderRadius: 'var(--radius-lg)',
                  fontSize: '0.75rem',
                  color: 'var(--color-accent-800)',
                }}>
                  💡 Code démo : <code style={{
                    background: 'var(--color-accent-200)',
                    padding: '0.125rem 0.375rem',
                    borderRadius: 4, fontWeight: 700,
                  }}>{getDemoOTPCode()}</code>
                </div>
              </motion.div>
            )}

            {/* ============================================================ */}
            {/* STEP: PIN Entry */}
            {/* ============================================================ */}
            {loginStep === 'pin' && (
              <motion.div
                key="pin"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                style={{ textAlign: 'center', paddingTop: '0.5rem' }}
              >
                <button
                  onClick={() => setLoginStep('otp')}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--color-primary-600)', fontWeight: 600, fontSize: '0.875rem',
                    marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.25rem',
                  }}
                >
                  ← Retour
                </button>

                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: 'var(--color-primary-50)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 1rem',
                }}>
                  <Lock size={24} style={{ color: 'var(--color-primary-600)' }} />
                </div>

                <h2 style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: '0.25rem' }}>
                  Saisissez votre PIN
                </h2>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-surface-500)', marginBottom: '1.5rem' }}>
                  Code à 4 chiffres pour <strong>{phone}</strong>
                </p>

                {/* PIN Dots */}
                <div className="pin-dots" style={{ marginBottom: '2rem' }}>
                  {[0, 1, 2, 3].map(i => (
                    <div key={i} className={`pin-dot ${i < pin.length ? 'filled' : ''}`} />
                  ))}
                </div>

                {/* PIN Pad */}
                <div className="pin-pad">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'delete'].map(key =>
                    key === '' ? <div key="empty" /> :
                    <motion.button
                      key={key}
                      whileTap={{ scale: 0.85 }}
                      className="pin-key"
                      onClick={() => handlePinKey(key)}
                      disabled={loading}
                    >
                      {key === 'delete' ? '⌫' : key}
                    </motion.button>
                  )}
                </div>

                {/* Demo hint */}
                <p style={{
                  marginTop: '1.5rem', fontSize: '0.75rem',
                  color: 'var(--color-accent-700)',
                }}>
                  💡 PIN démo : <code style={{
                    background: 'var(--color-accent-100)',
                    padding: '0.125rem 0.375rem',
                    borderRadius: 4, fontWeight: 700,
                  }}>1234</code>
                </p>
              </motion.div>
            )}

          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
