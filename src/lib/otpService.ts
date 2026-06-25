// ============================================================================
// LafiaPay — OTP Service
// Manages OTP generation, storage (localStorage-backed), and verification.
// Demo mode: all demo accounts + new numbers use '123456' as valid OTP.
// ============================================================================

export interface OTPRecord {
  id: string;
  telephone: string;
  code: string;
  type: 'inscription' | 'connexion' | 'transaction';
  used: boolean;
  expires_at: string;
  created_at: string;
}

const OTP_STORAGE_KEY = 'lafiapay-otps';
const OTP_EXPIRY_MINUTES = 5;
const DEMO_OTP_CODE = '123456';

// ============================================================================
// Internal: Load / Save from localStorage
// ============================================================================

function loadOTPs(): OTPRecord[] {
  try {
    const raw = localStorage.getItem(OTP_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveOTPs(otps: OTPRecord[]): void {
  localStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(otps));
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Generate and store a new OTP for the given phone number.
 * In demo mode, always generates '123456' so users know what to type.
 * Returns the generated code (in production this would be sent via SMS).
 */
export function generateOTP(
  telephone: string,
  type: OTPRecord['type'] = 'connexion'
): string {
  const otps = loadOTPs();

  // Invalidate any previous unused OTP for this phone + type
  otps.forEach(o => {
    if (o.telephone === telephone && o.type === type && !o.used) {
      o.used = true;
    }
  });

  const now = new Date();
  const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000);

  const newOTP: OTPRecord = {
    id: `otp-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    telephone,
    code: DEMO_OTP_CODE, // In production: Math.floor(100000 + Math.random() * 900000).toString()
    type,
    used: false,
    expires_at: expiresAt.toISOString(),
    created_at: now.toISOString(),
  };

  otps.push(newOTP);
  saveOTPs(otps);

  console.info(
    `%c📱 OTP envoyé à ${telephone}: ${newOTP.code} (expire à ${expiresAt.toLocaleTimeString()})`,
    'color: #10B981; font-weight: bold;'
  );

  return newOTP.code;
}

/**
 * Verify an OTP code for the given phone number and type.
 * Returns true if the code matches, is not expired, and not yet used.
 * Marks the OTP as used on successful verification.
 */
export function verifyOTP(
  telephone: string,
  code: string,
  type: OTPRecord['type'] = 'connexion'
): boolean {
  const otps = loadOTPs();
  const now = new Date();

  const matchIndex = otps.findIndex(
    o =>
      o.telephone === telephone &&
      o.code === code &&
      o.type === type &&
      !o.used &&
      new Date(o.expires_at) > now
  );

  if (matchIndex === -1) return false;

  // Mark as used
  otps[matchIndex].used = true;
  saveOTPs(otps);
  return true;
}

/**
 * Check if a phone number has a pending (valid, unused) OTP.
 */
export function hasPendingOTP(
  telephone: string,
  type: OTPRecord['type'] = 'connexion'
): boolean {
  const otps = loadOTPs();
  const now = new Date();
  return otps.some(
    o =>
      o.telephone === telephone &&
      o.type === type &&
      !o.used &&
      new Date(o.expires_at) > now
  );
}

/**
 * Clear all OTPs (useful for dev reset).
 */
export function clearAllOTPs(): void {
  localStorage.removeItem(OTP_STORAGE_KEY);
}

/**
 * Get the demo OTP code (for UI hints).
 */
export function getDemoOTPCode(): string {
  return DEMO_OTP_CODE;
}
