// ============================================================================
// LafiaPay — Mock Data Store
// Provides realistic demo data when Supabase is not connected.
// All data is stored in memory and resets on page reload.
// ============================================================================

import type {
  Profile,
  Commercant,
  Compte,
  Transaction,
  Litige,
  AuditLog,
  AlerteConformite,
  TransactionType,
  TransactionStatus,
  DisputeStatus,
  CommerceCategory,
  MobileMoneyOperator,
} from '../types';

// ============================================================================
// Helper: generate UUIDs
// ============================================================================
let counter = 0;
const uuid = (): string => {
  counter++;
  return `mock-${counter.toString().padStart(4, '0')}-${Math.random().toString(36).substring(2, 10)}`;
};

// ============================================================================
// Demo account IDs (stable references)
// ============================================================================
export const DEMO_CLIENT_ID = 'demo-client-001';
export const DEMO_MERCHANT_ID = 'demo-merchant-001';
export const DEMO_ADMIN_ID = 'demo-admin-001';

// ============================================================================
// Profiles — Clients
// ============================================================================
const clientProfiles: Profile[] = [
  { id: DEMO_CLIENT_ID, role: 'client', nom: 'Amadou Diallo', telephone: '+223 70 00 00 01', pin_hash: '1234', kyc_niveau: 2, statut: 'actif', created_at: '2026-01-15T08:30:00Z' },
  { id: 'cl-002', role: 'client', nom: 'Aminata Coulibaly', telephone: '+223 76 12 34 56', pin_hash: '5678', kyc_niveau: 1, statut: 'actif', created_at: '2026-02-03T10:15:00Z' },
  { id: 'cl-003', role: 'client', nom: 'Fatoumata Traoré', telephone: '+223 66 78 90 12', pin_hash: '9012', kyc_niveau: 3, statut: 'actif', created_at: '2026-01-28T14:20:00Z' },
  { id: 'cl-004', role: 'client', nom: 'Sékou Konaté', telephone: '+223 78 45 67 89', pin_hash: '3456', kyc_niveau: 1, statut: 'actif', created_at: '2026-03-10T09:00:00Z' },
  { id: 'cl-005', role: 'client', nom: 'Mariam Keïta', telephone: '+223 69 23 45 67', pin_hash: '7890', kyc_niveau: 2, statut: 'actif', created_at: '2026-02-18T16:45:00Z' },
  { id: 'cl-006', role: 'client', nom: 'Oumar Sangaré', telephone: '+223 74 56 78 90', pin_hash: '2345', kyc_niveau: 1, statut: 'suspendu', created_at: '2026-03-22T11:30:00Z' },
  { id: 'cl-007', role: 'client', nom: 'Awa Diarra', telephone: '+223 65 89 01 23', pin_hash: '6789', kyc_niveau: 2, statut: 'actif', created_at: '2026-01-05T07:15:00Z' },
  { id: 'cl-008', role: 'client', nom: 'Ibrahim Sacko', telephone: '+223 77 01 23 45', pin_hash: '0123', kyc_niveau: 1, statut: 'actif', created_at: '2026-04-01T13:00:00Z' },
  { id: 'cl-009', role: 'client', nom: 'Kadiatou Bagayoko', telephone: '+223 68 34 56 78', pin_hash: '4567', kyc_niveau: 3, statut: 'actif', created_at: '2026-02-10T10:30:00Z' },
  { id: 'cl-010', role: 'client', nom: 'Moussa Sissoko', telephone: '+223 73 67 89 01', pin_hash: '8901', kyc_niveau: 2, statut: 'actif', created_at: '2026-03-05T15:20:00Z' },
  { id: 'cl-011', role: 'client', nom: 'Djénéba Camara', telephone: '+223 64 90 12 34', pin_hash: '1357', kyc_niveau: 1, statut: 'actif', created_at: '2026-04-15T08:45:00Z' },
  { id: 'cl-012', role: 'client', nom: 'Boubacar Touré', telephone: '+223 79 12 34 56', pin_hash: '2468', kyc_niveau: 2, statut: 'actif', created_at: '2026-01-20T12:00:00Z' },
  { id: 'cl-013', role: 'client', nom: 'Rokia Maïga', telephone: '+223 67 45 67 89', pin_hash: '3579', kyc_niveau: 1, statut: 'actif', created_at: '2026-05-01T09:30:00Z' },
  { id: 'cl-014', role: 'client', nom: 'Souleymane Dembélé', telephone: '+223 72 78 90 12', pin_hash: '4680', kyc_niveau: 2, statut: 'actif', created_at: '2026-03-15T14:10:00Z' },
  { id: 'cl-015', role: 'client', nom: 'Oumou Sidibé', telephone: '+223 63 01 23 45', pin_hash: '5791', kyc_niveau: 1, statut: 'actif', created_at: '2026-05-10T11:25:00Z' },
  { id: 'cl-016', role: 'client', nom: 'Youssouf Kouyaté', telephone: '+223 75 34 56 78', pin_hash: '6802', kyc_niveau: 3, statut: 'actif', created_at: '2026-02-25T16:00:00Z' },
  { id: 'cl-017', role: 'client', nom: 'Assétou Doumbia', telephone: '+223 70 67 89 01', pin_hash: '7913', kyc_niveau: 1, statut: 'actif', created_at: '2026-04-08T07:50:00Z' },
];

// ============================================================================
// Profiles — Merchants
// ============================================================================
const merchantProfiles: Profile[] = [
  { id: DEMO_MERCHANT_ID, role: 'commercant', nom: 'Bakary Cissé', telephone: '+223 70 00 00 02', pin_hash: '1234', kyc_niveau: 3, statut: 'actif', created_at: '2026-01-10T09:00:00Z' },
  { id: 'mc-002', role: 'commercant', nom: 'Fanta Diakité', telephone: '+223 76 55 44 33', pin_hash: '5678', kyc_niveau: 2, statut: 'actif', created_at: '2026-01-25T10:00:00Z' },
  { id: 'mc-003', role: 'commercant', nom: 'Mamadou Bah', telephone: '+223 66 11 22 33', pin_hash: '9012', kyc_niveau: 3, statut: 'actif', created_at: '2026-02-05T11:00:00Z' },
  { id: 'mc-004', role: 'commercant', nom: 'Aïssata Koné', telephone: '+223 78 99 88 77', pin_hash: '3456', kyc_niveau: 2, statut: 'actif', created_at: '2026-02-20T08:30:00Z' },
  { id: 'mc-005', role: 'commercant', nom: 'Drissa Coulibaly', telephone: '+223 69 66 55 44', pin_hash: '7890', kyc_niveau: 3, statut: 'actif', created_at: '2026-03-01T09:45:00Z' },
  { id: 'mc-006', role: 'commercant', nom: 'Bintou Sanogo', telephone: '+223 74 33 22 11', pin_hash: '2345', kyc_niveau: 2, statut: 'actif', created_at: '2026-03-15T10:15:00Z' },
  { id: 'mc-007', role: 'commercant', nom: 'Adama Kanté', telephone: '+223 65 44 33 22', pin_hash: '6789', kyc_niveau: 3, statut: 'actif', created_at: '2026-03-28T11:30:00Z' },
  { id: 'mc-008', role: 'commercant', nom: 'Sira Sissoko', telephone: '+223 77 88 99 00', pin_hash: '0123', kyc_niveau: 2, statut: 'suspendu', created_at: '2026-04-05T14:00:00Z' },
  { id: 'mc-009', role: 'commercant', nom: 'Kassoum Traoré', telephone: '+223 68 77 66 55', pin_hash: '4567', kyc_niveau: 3, statut: 'actif', created_at: '2026-04-12T08:00:00Z' },
  { id: 'mc-010', role: 'commercant', nom: 'Nana Diabaté', telephone: '+223 73 22 11 00', pin_hash: '8901', kyc_niveau: 2, statut: 'actif', created_at: '2026-04-20T09:30:00Z' },
];

// ============================================================================
// Profiles — Admin
// ============================================================================
const adminProfiles: Profile[] = [
  { id: DEMO_ADMIN_ID, role: 'admin', nom: 'Admin LafiaPay', telephone: '+223 70 00 00 00', pin_hash: '0000', kyc_niveau: 3, statut: 'actif', created_at: '2026-01-01T00:00:00Z' },
];

// ============================================================================
// Merchant Details
// ============================================================================
const merchantDetails: Commercant[] = [
  { id: DEMO_MERCHANT_ID, nom_boutique: 'Épicerie Sogoniko', categorie: 'alimentation', ville: 'Bamako', qr_code_id: 'QR-EPICERIE-SOGO', avatar_url: '' },
  { id: 'mc-002', nom_boutique: 'Maquis Faso Kanu', categorie: 'restauration', ville: 'Bamako', qr_code_id: 'QR-FASO-KANU', avatar_url: '' },
  { id: 'mc-003', nom_boutique: 'Taxi Bamako Express', categorie: 'transport', ville: 'Bamako', qr_code_id: 'QR-TAXI-BMK', avatar_url: '' },
  { id: 'mc-004', nom_boutique: 'Salon Beauté Djouma', categorie: 'services', ville: 'Bamako', qr_code_id: 'QR-BEAUTE-DJOUMA', avatar_url: '' },
  { id: 'mc-005', nom_boutique: 'Supermarché Lafia', categorie: 'alimentation', ville: 'Bamako', qr_code_id: 'QR-SUPER-LAFIA', avatar_url: '' },
  { id: 'mc-006', nom_boutique: 'Couture Élégance', categorie: 'services', ville: 'Bamako', qr_code_id: 'QR-COUTURE-ELEG', avatar_url: '' },
  { id: 'mc-007', nom_boutique: 'Fast Food Bamako City', categorie: 'restauration', ville: 'Bamako', qr_code_id: 'QR-FF-BMKCITY', avatar_url: '' },
  { id: 'mc-008', nom_boutique: 'Pharmacie Santé Plus', categorie: 'sante', ville: 'Bamako', qr_code_id: 'QR-PHARMA-SP', avatar_url: '' },
  { id: 'mc-009', nom_boutique: 'Boutique Mode Sahel', categorie: 'habillement', ville: 'Bamako', qr_code_id: 'QR-MODE-SAHEL', avatar_url: '' },
  { id: 'mc-010', nom_boutique: 'Gargote Mama Fati', categorie: 'restauration', ville: 'Bamako', qr_code_id: 'QR-MAMA-FATI', avatar_url: '' },
];

// ============================================================================
// Accounts / Balances
// ============================================================================
const clientBalances: Record<string, number> = {
  [DEMO_CLIENT_ID]: 25750,
  'cl-002': 3200,
  'cl-003': 67500,
  'cl-004': 800,
  'cl-005': 15000,
  'cl-006': 0,
  'cl-007': 42300,
  'cl-008': 5500,
  'cl-009': 78000,
  'cl-010': 12450,
  'cl-011': 1500,
  'cl-012': 33200,
  'cl-013': 7800,
  'cl-014': 19600,
  'cl-015': 500,
  'cl-016': 55000,
  'cl-017': 2100,
};

const merchantBalances: Record<string, number> = {
  [DEMO_MERCHANT_ID]: 185000,
  'mc-002': 342500,
  'mc-003': 127800,
  'mc-004': 89300,
  'mc-005': 456700,
  'mc-006': 67200,
  'mc-007': 234100,
  'mc-008': 15000,
  'mc-009': 178900,
  'mc-010': 95600,
};

const allComptes: Compte[] = [
  ...Object.entries(clientBalances).map(([id, solde]) => ({
    id: `compte-${id}`,
    profile_id: id,
    solde,
    updated_at: new Date().toISOString(),
  })),
  ...Object.entries(merchantBalances).map(([id, solde]) => ({
    id: `compte-${id}`,
    profile_id: id,
    solde,
    updated_at: new Date().toISOString(),
  })),
];

// ============================================================================
// Generate realistic transactions over 30 days
// ============================================================================
const operators: MobileMoneyOperator[] = ['orange_money', 'moov_money', 'wave'];
const statuses: TransactionStatus[] = ['reussie', 'reussie', 'reussie', 'reussie', 'reussie', 'echouee', 'en_attente'];
const depotAmounts = [1000, 2000, 2500, 5000, 5000, 10000, 10000, 15000, 20000, 25000, 50000];
const paiementAmounts = [150, 250, 500, 750, 1000, 1500, 2000, 2500, 3000, 3500, 5000, 7500, 10000, 15000];

const allClientIds = clientProfiles.map(p => p.id);
const allMerchantIds = merchantProfiles.map(p => p.id);

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateTransactions(): Transaction[] {
  const txns: Transaction[] = [];
  const now = new Date();

  for (let i = 0; i < 250; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const hour = Math.random() < 0.6
      ? 12 + Math.floor(Math.random() * 10) // 60% between 12h-22h
      : Math.floor(Math.random() * 12); // 40% between 0h-12h
    const minute = Math.floor(Math.random() * 60);

    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);
    date.setHours(hour, minute, Math.floor(Math.random() * 60));

    const type: TransactionType = Math.random() < 0.35 ? 'depot' : 'paiement';
    const clientId = randomPick(allClientIds);
    const merchantId = type === 'paiement' ? randomPick(allMerchantIds) : null;
    const montant = type === 'depot' ? randomPick(depotAmounts) : randomPick(paiementAmounts);
    const statut = randomPick(statuses);

    const clientProfile = clientProfiles.find(p => p.id === clientId);
    const merchantProfile = merchantId ? merchantProfiles.find(p => p.id === merchantId) : null;
    const merchantDetail = merchantId ? merchantDetails.find(d => d.id === merchantId) : null;

    txns.push({
      id: uuid(),
      type,
      client_id: clientId,
      commercant_id: merchantId,
      montant,
      statut,
      operateur_mobile_money: type === 'depot' ? randomPick(operators) : null,
      reference: `LP-${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`,
      created_at: date.toISOString(),
      client_nom: clientProfile?.nom,
      commercant_nom: merchantProfile?.nom,
      commercant_boutique: merchantDetail?.nom_boutique,
      commercant_categorie: merchantDetail?.categorie,
    });
  }

  // Sort by date descending
  txns.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return txns;
}

// ============================================================================
// Disputes
// ============================================================================
function generateDisputes(transactions: Transaction[]): Litige[] {
  const successfulPayments = transactions.filter(t => t.type === 'paiement' && t.statut === 'reussie');
  const disputeStatuses: DisputeStatus[] = ['ouvert', 'ouvert', 'en_cours', 'en_cours', 'resolu'];

  return [
    {
      id: uuid(),
      transaction_id: successfulPayments[0]?.id || uuid(),
      declarant_id: successfulPayments[0]?.client_id || DEMO_CLIENT_ID,
      description: 'Montant débité supérieur au prix affiché en boutique. Le commerçant avait annoncé 2000 FCFA mais 3500 FCFA ont été prélevés.',
      statut: 'ouvert',
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      resolved_at: null,
      declarant_nom: clientProfiles.find(p => p.id === successfulPayments[0]?.client_id)?.nom,
      transaction_montant: successfulPayments[0]?.montant,
      transaction_reference: successfulPayments[0]?.reference,
    },
    {
      id: uuid(),
      transaction_id: successfulPayments[3]?.id || uuid(),
      declarant_id: successfulPayments[3]?.client_id || 'cl-003',
      description: 'Paiement effectué mais le commerçant dit ne pas avoir reçu la confirmation. Le montant a été débité de mon compte.',
      statut: 'en_cours',
      created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
      resolved_at: null,
      declarant_nom: clientProfiles.find(p => p.id === successfulPayments[3]?.client_id)?.nom,
      transaction_montant: successfulPayments[3]?.montant,
      transaction_reference: successfulPayments[3]?.reference,
    },
    {
      id: uuid(),
      transaction_id: successfulPayments[7]?.id || uuid(),
      declarant_id: DEMO_MERCHANT_ID,
      description: 'Client conteste un paiement validé. Le service a bien été rendu mais le client demande un remboursement.',
      statut: 'en_cours',
      created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
      resolved_at: null,
      declarant_nom: 'Bakary Cissé',
      transaction_montant: successfulPayments[7]?.montant,
      transaction_reference: successfulPayments[7]?.reference,
    },
    {
      id: uuid(),
      transaction_id: successfulPayments[12]?.id || uuid(),
      declarant_id: successfulPayments[12]?.client_id || 'cl-005',
      description: 'Double débit pour une même transaction. Le montant de 5000 FCFA a été prélevé deux fois.',
      statut: 'resolu',
      created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
      resolved_at: new Date(Date.now() - 10 * 86400000).toISOString(),
      declarant_nom: clientProfiles.find(p => p.id === successfulPayments[12]?.client_id)?.nom,
      transaction_montant: successfulPayments[12]?.montant,
      transaction_reference: successfulPayments[12]?.reference,
    },
    {
      id: uuid(),
      transaction_id: successfulPayments[18]?.id || uuid(),
      declarant_id: successfulPayments[18]?.client_id || 'cl-007',
      description: 'Recharge effectuée via Orange Money mais le solde LafiaPay n\'a pas été crédité après 24h.',
      statut: 'resolu',
      created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
      resolved_at: new Date(Date.now() - 17 * 86400000).toISOString(),
      declarant_nom: clientProfiles.find(p => p.id === successfulPayments[18]?.client_id)?.nom,
      transaction_montant: successfulPayments[18]?.montant,
      transaction_reference: successfulPayments[18]?.reference,
    },
  ];
}

// ============================================================================
// Compliance Alerts
// ============================================================================
function generateAlerts(transactions: Transaction[]): AlerteConformite[] {
  const largeTransactions = transactions.filter(t => t.montant >= 10000);
  return [
    {
      id: uuid(),
      transaction_id: largeTransactions[0]?.id || uuid(),
      niveau_criticite: 'eleve',
      description: 'Transaction de 50 000 FCFA détectée — dépasse le plafond KYC niveau 1. Vérification d\'identité requise.',
      statut: 'a_verifier',
      created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
      transaction_montant: 50000,
      transaction_reference: largeTransactions[0]?.reference,
    },
    {
      id: uuid(),
      transaction_id: largeTransactions[2]?.id || uuid(),
      niveau_criticite: 'moyen',
      description: 'Fréquence inhabituelle : 8 transactions en 30 minutes depuis le même compte client.',
      statut: 'a_verifier',
      created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
      transaction_montant: largeTransactions[2]?.montant,
      transaction_reference: largeTransactions[2]?.reference,
    },
    {
      id: uuid(),
      transaction_id: largeTransactions[5]?.id || uuid(),
      niveau_criticite: 'faible',
      description: 'Nouveau commerçant avec volume élevé dès la première semaine d\'activité. Surveillance recommandée.',
      statut: 'verifie',
      created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
      transaction_montant: largeTransactions[5]?.montant,
      transaction_reference: largeTransactions[5]?.reference,
    },
  ];
}

// ============================================================================
// Audit Log
// ============================================================================
const auditLogs: AuditLog[] = [
  { id: uuid(), admin_id: DEMO_ADMIN_ID, action: 'Suspension de compte', details: { target: 'cl-006', reason: 'Activité suspecte' }, created_at: new Date(Date.now() - 2 * 86400000).toISOString(), admin_nom: 'Admin LafiaPay' },
  { id: uuid(), admin_id: DEMO_ADMIN_ID, action: 'Vérification KYC approuvée', details: { target: 'cl-003', level: 3 }, created_at: new Date(Date.now() - 4 * 86400000).toISOString(), admin_nom: 'Admin LafiaPay' },
  { id: uuid(), admin_id: DEMO_ADMIN_ID, action: 'Litige résolu', details: { litige_id: 'Remboursement effectué' }, created_at: new Date(Date.now() - 10 * 86400000).toISOString(), admin_nom: 'Admin LafiaPay' },
  { id: uuid(), admin_id: DEMO_ADMIN_ID, action: 'Nouveau commerçant approuvé', details: { merchant: 'mc-007', boutique: 'Fast Food Bamako City' }, created_at: new Date(Date.now() - 12 * 86400000).toISOString(), admin_nom: 'Admin LafiaPay' },
  { id: uuid(), admin_id: DEMO_ADMIN_ID, action: 'Alerte conformité traitée', details: { alert_type: 'Transaction élevée', resolution: 'Identité vérifiée' }, created_at: new Date(Date.now() - 15 * 86400000).toISOString(), admin_nom: 'Admin LafiaPay' },
  { id: uuid(), admin_id: DEMO_ADMIN_ID, action: 'Paramètres plateforme modifiés', details: { setting: 'Plafond KYC niveau 1', old_value: 200000, new_value: 300000 }, created_at: new Date(Date.now() - 20 * 86400000).toISOString(), admin_nom: 'Admin LafiaPay' },
];

// ============================================================================
// Initialize & Export the Mock Data Store
// ============================================================================
const allTransactions = generateTransactions();
const allDisputes = generateDisputes(allTransactions);
const allAlerts = generateAlerts(allTransactions);

export interface MockDataStore {
  profiles: Profile[];
  commercants: Commercant[];
  comptes: Compte[];
  transactions: Transaction[];
  litiges: Litige[];
  auditLogs: AuditLog[];
  alertes: AlerteConformite[];
  // Mutation helpers
  addTransaction: (txn: Transaction) => void;
  updateBalance: (profileId: string, delta: number) => void;
  getBalance: (profileId: string) => number;
  getProfile: (id: string) => Profile | undefined;
  getCommerçant: (id: string) => Commercant | undefined;
  getCommerçantByQR: (qrCodeId: string) => Commercant | undefined;
  getTransactionsForUser: (userId: string) => Transaction[];
  getTransactionsForMerchant: (merchantId: string) => Transaction[];
  addDispute: (litige: Litige) => void;
  updateDisputeStatus: (id: string, statut: DisputeStatus) => void;
  listeners: Set<() => void>;
  subscribe: (listener: () => void) => () => void;
}

export const mockStore: MockDataStore = {
  profiles: [...clientProfiles, ...merchantProfiles, ...adminProfiles],
  commercants: [...merchantDetails],
  comptes: [...allComptes],
  transactions: [...allTransactions],
  litiges: [...allDisputes],
  auditLogs: [...auditLogs],
  alertes: [...allAlerts],
  listeners: new Set(),

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  },

  addTransaction(txn: Transaction) {
    this.transactions.unshift(txn);
    this.listeners.forEach(l => l());
  },

  updateBalance(profileId: string, delta: number) {
    const compte = this.comptes.find(c => c.profile_id === profileId);
    if (compte) {
      compte.solde = Math.max(0, compte.solde + delta);
      compte.updated_at = new Date().toISOString();
    }
    this.listeners.forEach(l => l());
  },

  getBalance(profileId: string): number {
    return this.comptes.find(c => c.profile_id === profileId)?.solde ?? 0;
  },

  getProfile(id: string): Profile | undefined {
    return this.profiles.find(p => p.id === id);
  },

  getCommerçant(id: string): Commercant | undefined {
    return this.commercants.find(c => c.id === id);
  },

  getCommerçantByQR(qrCodeId: string): Commercant | undefined {
    return this.commercants.find(c => c.qr_code_id === qrCodeId);
  },

  getTransactionsForUser(userId: string): Transaction[] {
    return this.transactions.filter(t => t.client_id === userId);
  },

  getTransactionsForMerchant(merchantId: string): Transaction[] {
    return this.transactions.filter(t => t.commercant_id === merchantId);
  },

  addDispute(litige: Litige) {
    this.litiges.unshift(litige);
    this.listeners.forEach(l => l());
  },

  updateDisputeStatus(id: string, statut: DisputeStatus) {
    const litige = this.litiges.find(l => l.id === id);
    if (litige) {
      litige.statut = statut;
      if (statut === 'resolu') {
        litige.resolved_at = new Date().toISOString();
      }
    }
    this.listeners.forEach(l => l());
  },
};
