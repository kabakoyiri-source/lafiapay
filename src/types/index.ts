// ============================================================================
// LafiaPay — Type Definitions
// All entity types used throughout the application
// ============================================================================

/** User roles in the platform */
export type UserRole = 'client' | 'commercant' | 'admin';

/** Account status */
export type AccountStatus = 'actif' | 'suspendu';

/** Transaction types */
export type TransactionType = 'depot' | 'paiement';

/** Transaction status */
export type TransactionStatus = 'reussie' | 'echouee' | 'en_attente';

/** Dispute status */
export type DisputeStatus = 'ouvert' | 'en_cours' | 'resolu';

/** KYC levels */
export type KYCLevel = 1 | 2 | 3;

/** Compliance alert criticality */
export type AlertCriticality = 'faible' | 'moyen' | 'eleve';

/** Mobile Money operators */
export type MobileMoneyOperator = 'orange_money' | 'moov_money' | 'wave';

/** Commerce categories for merchants */
export type CommerceCategory =
  | 'alimentation'
  | 'restauration'
  | 'transport'
  | 'services'
  | 'habillement'
  | 'sante'
  | 'autre';

// ============================================================================
// Database Entities
// ============================================================================

/** User profile extending Supabase auth.users */
export interface Profile {
  id: string;
  role: UserRole;
  nom: string;
  telephone: string;
  pin_hash: string;
  kyc_niveau: KYCLevel;
  statut: AccountStatus;
  created_at: string;
  avatar_url?: string;
}

/** Merchant details (extends Profile) */
export interface Commercant {
  id: string;
  nom_boutique: string;
  categorie: CommerceCategory;
  ville: string;
  qr_code_id: string;
  avatar_url?: string;
}

/** Account / balance record */
export interface Compte {
  id: string;
  profile_id: string;
  solde: number;
  updated_at: string;
}

/** Transaction record */
export interface Transaction {
  id: string;
  type: TransactionType;
  client_id: string;
  commercant_id: string | null;
  montant: number;
  statut: TransactionStatus;
  operateur_mobile_money: MobileMoneyOperator | null;
  reference: string;
  created_at: string;
  // Joined fields (for display)
  client_nom?: string;
  commercant_nom?: string;
  commercant_boutique?: string;
  commercant_categorie?: CommerceCategory;
}

/** Dispute / litigation record */
export interface Litige {
  id: string;
  transaction_id: string;
  declarant_id: string;
  description: string;
  statut: DisputeStatus;
  created_at: string;
  resolved_at: string | null;
  // Joined fields
  declarant_nom?: string;
  transaction_montant?: number;
  transaction_reference?: string;
}

/** Audit log entry */
export interface AuditLog {
  id: string;
  admin_id: string;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
  // Joined
  admin_nom?: string;
}

/** Compliance alert */
export interface AlerteConformite {
  id: string;
  transaction_id: string;
  niveau_criticite: AlertCriticality;
  description: string;
  statut: string;
  created_at: string;
  // Joined
  transaction_montant?: number;
  transaction_reference?: string;
}

// ============================================================================
// UI / App State Types
// ============================================================================

/** Auth context state */
export interface AuthState {
  user: { id: string; email?: string } | null;
  profile: Profile | null;
  compte: Compte | null;
  commercant: Commercant | null;
  loading: boolean;
  isDemo: boolean;
}

/** Navigation item for sidebar/bottom nav */
export interface NavItem {
  label: string;
  icon: string;
  path: string;
  badge?: number;
}

/** KPI card data */
export interface KPIData {
  label: string;
  value: number | string;
  change: number; // percentage change vs previous period
  trend: 'up' | 'down' | 'neutral';
  prefix?: string;
  suffix?: string;
}

/** Chart data point */
export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

/** Quick recharge amounts */
export const QUICK_AMOUNTS = [1000, 2500, 5000, 10000] as const;

/** FCFA currency formatter */
export const formatFCFA = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' FCFA';
};

/** Format date in French */
export const formatDate = (dateStr: string): string => {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr));
};

/** Generate a transaction reference */
export const generateReference = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'LP-';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/** Category display info */
export const CATEGORY_INFO: Record<CommerceCategory, { label: string; emoji: string; color: string }> = {
  alimentation: { label: 'Alimentation', emoji: '🛒', color: '#10B981' },
  restauration: { label: 'Restauration', emoji: '🍽️', color: '#F59E0B' },
  transport: { label: 'Transport', emoji: '🚕', color: '#3B82F6' },
  services: { label: 'Services', emoji: '✂️', color: '#8B5CF6' },
  habillement: { label: 'Habillement', emoji: '👕', color: '#EC4899' },
  sante: { label: 'Santé', emoji: '💊', color: '#EF4444' },
  autre: { label: 'Autre', emoji: '📦', color: '#6B7280' },
};

/** Operator display info */
export const OPERATOR_INFO: Record<MobileMoneyOperator, { label: string; color: string; bgColor: string }> = {
  orange_money: { label: 'Orange Money', color: '#FFFFFF', bgColor: '#FF6600' },
  moov_money: { label: 'Moov Money', color: '#FFFFFF', bgColor: '#0066CC' },
  wave: { label: 'Wave', color: '#FFFFFF', bgColor: '#1A1A2E' },
};
