// ============================================================================
// LafiaPay — Register Page
// Full 3-step registration: Info → OTP Verification → PIN Creation
// Premium design with glassmorphism, progress bar, and animations
// ============================================================================

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Phone, User, Store, MapPin, Tag,
  Shield, Wallet, Zap, Check, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { generateOTP, verifyOTP, getDemoOTPCode } from '../../lib/otpService';
import { mockStore } from '../../lib/mockData';
import type { UserRole, CommerceCategory } from '../../types';

type Step = 'info' | 'otp' | 'pin' | 'success';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const { showToast } = useToast();

  const [step, setStep] = useState<Step>('info');
  const [loading, setLoading] = useState(false);

  // Step 1 — Info
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [role, setRole] = useState<UserRole>('client');
  const [nomBoutique, setNomBoutique] = useState('');
  const [categorie, setCategorie] = useState<CommerceCategory>('alimentation');
  const [ville, setVille] = useState('Bamako');

  // Step 2 — OTP
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [otpTimer, setOtpTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Step 3 — PIN
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [pinStep, setPinStep] = useState<'create' | 'confirm'>('create');

  // OTP countdown timer
  useEffect(() => {
    if (step !== 'otp' || otpTimer <= 0) {
      if (otpTimer <= 0) setCanResend(true);
      return;
    }
    const interval = setInterval(() => {
      setOtpTimer(prev => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [step, otpTimer]);

  const progressPercent = step === 'info' ? 33 : step === 'otp' ? 66 : step === 'pin' ? 90 : 100;

  // ========================================================================
  // Step 1 → Step 2: Send OTP
  // ========================================================================
  const handleSendOTP = async () => {
    if (!nom.trim() || !telephone.trim()) {
      showToast({ type: 'error', title: 'Champs requis', message: 'Veuillez remplir tous les champs' });
      return;
    }
    if (role === 'commercant' && !nomBoutique.trim()) {
      showToast({ type: 'error', title: 'Nom de boutique requis', message: 'Veuillez saisir le nom de votre commerce' });
      return;
    }

    // Check if phone already registered
    const existing = mockStore.findProfileByPhone(telephone);
    if (existing) {
      showToast({ type: 'error', title: 'Numéro déjà enregistré', message: 'Ce numéro de téléphone est déjà associé à un compte LafiaPay.' });
      return;
    }

    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    
    generateOTP(telephone, 'inscription');
    
    setOtpTimer(60);
    setCanResend(false);
    setOtpDigits(['', '', '', '', '', '']);
    setStep('otp');
    setLoading(false);

    showToast({
      type: 'success',
      title: 'Code envoyé !',
      message: `Un SMS avec le code de vérification a été envoyé au ${telephone}`,
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

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all 6 digits entered
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
      const digits = pasted.split('');
      setOtpDigits(digits);
      setTimeout(() => verifyOTPCode(pasted), 200);
    }
  };

  const verifyOTPCode = async (code: string) => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));

    const valid = verifyOTP(telephone, code, 'inscription');
    if (valid) {
      showToast({ type: 'success', title: 'Code vérifié ✓', message: 'Numéro de téléphone confirmé' });
      setStep('pin');
    } else {
      showToast({ type: 'error', title: 'Code incorrect', message: 'Vérifiez le code et réessayez' });
      setOtpDigits(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    }
    setLoading(false);
  };

  const handleResendOTP = () => {
    generateOTP(telephone, 'inscription');
    setOtpTimer(60);
    setCanResend(false);
    setOtpDigits(['', '', '', '', '', '']);
    showToast({ type: 'success', title: 'Code renvoyé', message: `Nouveau code envoyé au ${telephone}` });
  };

  // ========================================================================
  // Step 3: PIN Entry
  // ========================================================================
  const handlePinKey = (key: string) => {
    if (pinStep === 'create') {
      if (key === 'delete') {
        setPin(prev => prev.slice(0, -1));
      } else if (pin.length < 4) {
        const newPin = pin + key;
        setPin(newPin);
        if (newPin.length === 4) {
          setTimeout(() => {
            setPinStep('confirm');
          }, 300);
        }
      }
    } else {
      if (key === 'delete') {
        setPinConfirm(prev => prev.slice(0, -1));
      } else if (pinConfirm.length < 4) {
        const newConfirm = pinConfirm + key;
        setPinConfirm(newConfirm);
        if (newConfirm.length === 4) {
          setTimeout(() => handleCreateAccount(newConfirm), 400);
        }
      }
    }
  };

  // ========================================================================
  // Final: Create Account
  // ========================================================================
  const handleCreateAccount = async (confirmPin: string) => {
    if (pin !== confirmPin) {
      showToast({ type: 'error', title: 'PINs différents', message: 'Les deux codes PIN ne correspondent pas. Recommencez.' });
      setPin('');
      setPinConfirm('');
      setPinStep('create');
      return;
    }

    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));

    // Register in mock store
    const success = await signUp({
      telephone,
      nom,
      pin,
      role,
      nom_boutique: nomBoutique || undefined,
      categorie: categorie || undefined,
      ville: ville || undefined,
    });

    if (success) {
      setStep('success');
      showToast({ type: 'success', title: 'Compte créé !', message: `Bienvenue sur LafiaPay, ${nom} !` });
    } else {
      showToast({ type: 'error', title: 'Erreur', message: 'Impossible de créer le compte. Réessayez.' });
    }
    setLoading(false);
  };

  // ========================================================================
  // Render
  // ========================================================================
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
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="gradient-hero"
          style={{
            padding: '2rem 1.5rem 1.75rem',
            borderRadius: '0 0 2rem 2rem',
            color: 'white',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <button
              onClick={() => step === 'info' ? navigate('/') : step === 'otp' ? setStep('info') : step === 'pin' ? setStep('otp') : null}
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: 'none',
                borderRadius: '50%',
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'white',
              }}
            >
              <ArrowLeft size={18} />
            </button>
            <h1 style={{ fontSize: '1.375rem', fontWeight: 800 }}>
              {step === 'success' ? 'Bienvenue !' : 'Créer un compte'}
            </h1>
          </div>

          {/* Progress bar */}
          {step !== 'success' && (
            <div style={{
              background: 'rgba(255,255,255,0.2)',
              borderRadius: 'var(--radius-full)',
              height: 6,
              overflow: 'hidden',
            }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.4 }}
                style={{
                  height: '100%',
                  background: 'var(--color-accent-400)',
                  borderRadius: 'var(--radius-full)',
                }}
              />
            </div>
          )}

          {/* Step labels */}
          {step !== 'success' && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '0.5rem',
              fontSize: '0.6875rem',
              opacity: 0.7,
            }}>
              <span style={{ fontWeight: step === 'info' ? 700 : 400 }}>Informations</span>
              <span style={{ fontWeight: step === 'otp' ? 700 : 400 }}>Vérification</span>
              <span style={{ fontWeight: step === 'pin' ? 700 : 400 }}>Code PIN</span>
            </div>
          )}
        </motion.div>

        {/* Content */}
        <div style={{ padding: '1.5rem', flex: 1 }}>
          <AnimatePresence mode="wait">

            {/* ============================================================ */}
            {/* Step 1: Information */}
            {/* ============================================================ */}
            {step === 'info' && (
              <motion.div
                key="info"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                {/* Role selector */}
                <div style={{
                  display: 'flex',
                  background: 'var(--color-surface-100)',
                  borderRadius: 'var(--radius-xl)',
                  padding: '0.25rem',
                  marginBottom: '1.5rem',
                }}>
                  {([
                    { value: 'client' as UserRole, icon: User, label: 'Client' },
                    { value: 'commercant' as UserRole, icon: Store, label: 'Commerçant' },
                  ] as const).map(({ value, icon: Icon, label }) => (
                    <button
                      key={value}
                      onClick={() => setRole(value)}
                      style={{
                        flex: 1,
                        padding: '0.625rem',
                        borderRadius: 'var(--radius-lg)',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        transition: 'all 0.2s',
                        background: role === value ? 'white' : 'transparent',
                        color: role === value ? 'var(--color-primary-700)' : 'var(--color-surface-500)',
                        boxShadow: role === value ? 'var(--shadow-sm)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.375rem',
                      }}
                    >
                      <Icon size={16} />
                      {label}
                    </button>
                  ))}
                </div>

                {/* Name */}
                <div className="input-group" style={{ marginBottom: '1rem' }}>
                  <label className="input-label">Nom complet</label>
                  <div style={{ position: 'relative' }}>
                    <User size={18} style={{
                      position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)',
                      color: 'var(--color-surface-400)',
                    }} />
                    <input
                      className="input-field"
                      style={{ paddingLeft: '2.75rem' }}
                      type="text"
                      placeholder="Ex: Amadou Diallo"
                      value={nom}
                      onChange={e => setNom(e.target.value)}
                    />
                  </div>
                </div>

                {/* Phone */}
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
                      placeholder="+223 7X XX XX XX"
                      value={telephone}
                      onChange={e => setTelephone(e.target.value)}
                    />
                  </div>
                </div>

                {/* Merchant-specific fields */}
                <AnimatePresence>
                  {role === 'commercant' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div className="input-group" style={{ marginBottom: '1rem' }}>
                        <label className="input-label">Nom de la boutique</label>
                        <div style={{ position: 'relative' }}>
                          <Store size={18} style={{
                            position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)',
                            color: 'var(--color-surface-400)',
                          }} />
                          <input
                            className="input-field"
                            style={{ paddingLeft: '2.75rem' }}
                            type="text"
                            placeholder="Ex: Supermarché Lafia"
                            value={nomBoutique}
                            onChange={e => setNomBoutique(e.target.value)}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                        <div className="input-group" style={{ flex: 1 }}>
                          <label className="input-label">Catégorie</label>
                          <div style={{ position: 'relative' }}>
                            <Tag size={18} style={{
                              position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)',
                              color: 'var(--color-surface-400)',
                            }} />
                            <select
                              className="input-field"
                              style={{ paddingLeft: '2.75rem' }}
                              value={categorie}
                              onChange={e => setCategorie(e.target.value as CommerceCategory)}
                            >
                              <option value="alimentation">Alimentation</option>
                              <option value="restauration">Restauration</option>
                              <option value="transport">Transport</option>
                              <option value="services">Services</option>
                              <option value="habillement">Habillement</option>
                              <option value="sante">Santé</option>
                              <option value="autre">Autre</option>
                            </select>
                          </div>
                        </div>

                        <div className="input-group" style={{ flex: 1 }}>
                          <label className="input-label">Ville</label>
                          <div style={{ position: 'relative' }}>
                            <MapPin size={18} style={{
                              position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)',
                              color: 'var(--color-surface-400)',
                            }} />
                            <input
                              className="input-field"
                              style={{ paddingLeft: '2.75rem' }}
                              type="text"
                              placeholder="Bamako"
                              value={ville}
                              onChange={e => setVille(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  className="btn btn-primary btn-lg"
                  style={{ width: '100%', marginTop: '0.5rem' }}
                  onClick={handleSendOTP}
                  disabled={loading}
                >
                  {loading ? (
                    <span className="animate-pulse-soft">Envoi en cours...</span>
                  ) : (
                    <>Recevoir le code SMS <ChevronRight size={18} /></>
                  )}
                </button>

                {/* Demo hint */}
                <div style={{
                  marginTop: '1.25rem',
                  padding: '0.75rem',
                  background: 'var(--color-accent-50)',
                  border: '1.5px dashed var(--color-accent-400)',
                  borderRadius: 'var(--radius-lg)',
                  display: 'flex',
                  gap: '0.5rem',
                  alignItems: 'flex-start',
                }}>
                  <Zap size={16} style={{ color: 'var(--color-accent-600)', flexShrink: 0, marginTop: 2 }} />
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-accent-800)', lineHeight: 1.4 }}>
                    <strong>Mode démo :</strong> Le code de vérification sera toujours <code style={{
                      background: 'var(--color-accent-200)',
                      padding: '0.125rem 0.375rem',
                      borderRadius: 4,
                      fontWeight: 700,
                      fontSize: '0.8125rem',
                    }}>{getDemoOTPCode()}</code>
                  </p>
                </div>

                {/* Login link */}
                <p style={{
                  textAlign: 'center',
                  marginTop: '1.5rem',
                  fontSize: '0.875rem',
                  color: 'var(--color-surface-500)',
                }}>
                  Déjà un compte ?{' '}
                  <button
                    onClick={() => navigate('/')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-primary-600)',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                    }}
                  >
                    Se connecter
                  </button>
                </p>
              </motion.div>
            )}

            {/* ============================================================ */}
            {/* Step 2: OTP Verification */}
            {/* ============================================================ */}
            {step === 'otp' && (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                style={{ textAlign: 'center' }}
              >
                <div style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: 'var(--color-primary-50)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem',
                }}>
                  <Shield size={28} style={{ color: 'var(--color-primary-600)' }} />
                </div>

                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                  Vérification SMS
                </h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-surface-500)', marginBottom: '2rem' }}>
                  Entrez le code à 6 chiffres envoyé au <br />
                  <strong style={{ color: 'var(--color-primary-700)' }}>{telephone}</strong>
                </p>

                {/* OTP Input Grid */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    marginBottom: '1.5rem',
                  }}
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
                        width: 48,
                        height: 56,
                        textAlign: 'center',
                        fontSize: '1.5rem',
                        fontWeight: 700,
                        borderRadius: 'var(--radius-xl)',
                        border: `2px solid ${digit ? 'var(--color-primary-500)' : 'var(--color-surface-200)'}`,
                        background: digit ? 'var(--color-primary-50)' : 'var(--color-surface-50)',
                        outline: 'none',
                        transition: 'all 0.2s',
                        color: 'var(--color-primary-700)',
                        caretColor: 'var(--color-primary-600)',
                      }}
                      onFocus={e => {
                        e.target.style.borderColor = 'var(--color-primary-500)';
                        e.target.style.boxShadow = '0 0 0 3px rgba(var(--color-primary-500-rgb, 16, 185, 129), 0.2)';
                      }}
                      onBlur={e => {
                        e.target.style.borderColor = digit ? 'var(--color-primary-500)' : 'var(--color-surface-200)';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  ))}
                </div>

                {/* Timer / Resend */}
                <div style={{ marginBottom: '2rem' }}>
                  {canResend ? (
                    <button
                      onClick={handleResendOTP}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-primary-600)',
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontSize: '0.875rem',
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
                  padding: '0.75rem',
                  background: 'var(--color-accent-50)',
                  border: '1.5px dashed var(--color-accent-400)',
                  borderRadius: 'var(--radius-lg)',
                  fontSize: '0.75rem',
                  color: 'var(--color-accent-800)',
                }}>
                  💡 <strong>Démo :</strong> Tapez <code style={{
                    background: 'var(--color-accent-200)',
                    padding: '0.125rem 0.375rem',
                    borderRadius: 4,
                    fontWeight: 700,
                  }}>{getDemoOTPCode()}</code> comme code de vérification
                </div>
              </motion.div>
            )}

            {/* ============================================================ */}
            {/* Step 3: PIN Creation */}
            {/* ============================================================ */}
            {step === 'pin' && (
              <motion.div
                key="pin"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                style={{ textAlign: 'center', paddingTop: '0.5rem' }}
              >
                <div style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: pinStep === 'confirm' ? 'var(--color-accent-50)' : 'var(--color-primary-50)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem',
                }}>
                  <Wallet size={28} style={{ color: pinStep === 'confirm' ? 'var(--color-accent-600)' : 'var(--color-primary-600)' }} />
                </div>

                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.25rem' }}>
                  {pinStep === 'create' ? 'Créez votre code PIN' : 'Confirmez votre PIN'}
                </h2>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-surface-500)', marginBottom: '1.5rem' }}>
                  {pinStep === 'create'
                    ? 'Ce code servira à sécuriser vos transactions'
                    : 'Retapez le même code pour confirmer'}
                </p>

                {/* PIN Dots */}
                <div className="pin-dots" style={{ marginBottom: '2rem' }}>
                  {[0, 1, 2, 3].map(i => (
                    <div
                      key={i}
                      className={`pin-dot ${i < (pinStep === 'create' ? pin : pinConfirm).length ? 'filled' : ''}`}
                    />
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
              </motion.div>
            )}

            {/* ============================================================ */}
            {/* Step 4: Success */}
            {/* ============================================================ */}
            {step === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ textAlign: 'center', paddingTop: '2rem' }}
              >
                <svg className="checkmark-svg" viewBox="0 0 52 52" style={{ margin: '0 auto 1.5rem' }}>
                  <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none" />
                  <path className="checkmark-check" fill="none" d="m14.1 27.2 7.1 7.2 16.7-16.8" />
                </svg>

                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--color-success-600)' }}>
                  Compte créé avec succès !
                </h2>
                <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-surface-700)', marginBottom: '0.25rem' }}>
                  Bienvenue, {nom} 🎉
                </p>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-surface-500)', marginBottom: '2rem' }}>
                  Votre portefeuille LafiaPay est prêt. Rendez-vous chez un agent pour faire votre premier dépôt.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <button
                    className="btn btn-primary btn-lg"
                    style={{ width: '100%' }}
                    onClick={() => {
                      // Already logged in via signUp
                      const route = role === 'commercant' ? '/merchant' : '/client';
                      navigate(route, { replace: true });
                    }}
                  >
                    Accéder à mon espace
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
