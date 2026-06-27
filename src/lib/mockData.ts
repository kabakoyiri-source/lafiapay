// ============================================================================
// LafiaPay — Mock Data Store (Persisted)
// Provides realistic demo data when Supabase is not connected.
// Data is persisted in localStorage and survives page reloads.
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
  UserRole,
} from '../types';
import { hasPersistedData, loadPersistedData, persistData } from './persistedStore';
import { supabase, IS_MOCK_MODE } from './supabase';

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
export const DEMO_AGENT_ID = 'demo-agent-001';

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
// Profiles — Agent
// ============================================================================
const agentProfiles: Profile[] = [
  { id: DEMO_AGENT_ID, role: 'agent', nom: 'Modibo Keïta', telephone: '+223 70 00 00 03', pin_hash: '1234', kyc_niveau: 3, statut: 'actif', created_at: '2026-01-10T09:00:00Z' },
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

const agentBalances: Record<string, number> = {
  [DEMO_AGENT_ID]: 500000,
};

function buildAllComptes(): Compte[] {
  return [
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
    ...Object.entries(agentBalances).map(([id, solde]) => ({
      id: `compte-${id}`,
      profile_id: id,
      solde,
      updated_at: new Date().toISOString(),
    })),
  ];
}

// ============================================================================
// Generate realistic transactions over 30 days
// ============================================================================
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

    // Dépôt (20%), Transfert (25%), Paiement (55%)
    const rand = Math.random();
    const type: TransactionType = rand < 0.20 ? 'depot' : rand < 0.45 ? 'transfert' : 'paiement';
    
    const clientId = randomPick(allClientIds);
    const merchantId = type === 'paiement' ? randomPick(allMerchantIds) : null;
    let destinataireId: string | null = null;

    let rawAmount = 0;
    let frais = 0;
    let montantBrut = 0;
    let montantNet = 0;

    if (type === 'depot') {
      rawAmount = randomPick(depotAmounts);
      frais = 0;
      montantBrut = rawAmount;
      montantNet = rawAmount;
    } else if (type === 'paiement') {
      rawAmount = randomPick(paiementAmounts);
      frais = Math.round(rawAmount * 0.005); // 0.5% fee on merchant
      montantBrut = rawAmount;
      montantNet = rawAmount - frais;
    } else {
      // transfert
      rawAmount = randomPick(paiementAmounts);
      frais = Math.round(rawAmount * 0.01); // 1% fee on sender
      montantBrut = rawAmount + frais;
      montantNet = rawAmount;

      // Pick a different client as recipient
      let rec = randomPick(allClientIds);
      while (rec === clientId) {
        rec = randomPick(allClientIds);
      }
      destinataireId = rec;
    }

    const statut = randomPick(statuses);

    const clientProfile = clientProfiles.find(p => p.id === clientId);
    const merchantProfile = merchantId ? merchantProfiles.find(p => p.id === merchantId) : null;
    const merchantDetail = merchantId ? merchantDetails.find(d => d.id === merchantId) : null;
    const destinataireProfile = destinataireId ? clientProfiles.find(p => p.id === destinataireId) : null;

    txns.push({
      id: uuid(),
      type,
      client_id: clientId,
      commercant_id: merchantId,
      destinataire_id: destinataireId,
      agent_id: type === 'depot' ? DEMO_AGENT_ID : null,
      montant: rawAmount,
      montant_brut: montantBrut,
      montant_net: montantNet,
      frais,
      statut,
      operateur_mobile_money: null, // Deprecated: recharges are agent physical cash deposits
      reference: `LP-${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`,
      created_at: date.toISOString(),
      client_nom: clientProfile?.nom,
      commercant_nom: merchantProfile?.nom,
      commercant_boutique: merchantDetail?.nom_boutique,
      commercant_categorie: merchantDetail?.categorie,
      destinataire_nom: destinataireProfile?.nom,
      agent_nom: type === 'depot' ? 'Modibo Keïta' : undefined,
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
// Initialize data — from localStorage or fresh seed
// ============================================================================
function initializeData() {
  const persisted = loadPersistedData();
  
  if (persisted) {
    console.info(
      '%c💾 LafiaPay — Données restaurées depuis le stockage local',
      'color: #3B82F6; font-size: 13px; font-weight: bold;'
    );
    return {
      profiles: persisted.profiles as Profile[],
      commercants: persisted.commercants as Commercant[],
      comptes: persisted.comptes as Compte[],
      transactions: persisted.transactions as Transaction[],
      litiges: persisted.litiges as Litige[],
      auditLogs: persisted.auditLogs as AuditLog[],
      alertes: persisted.alertes as AlerteConformite[],
    };
  }

  // Fresh seed
  console.info(
    '%c🌱 LafiaPay — Initialisation avec les données de démonstration',
    'color: #10B981; font-size: 13px; font-weight: bold;'
  );
  
  const transactions = generateTransactions();
  const disputes = generateDisputes(transactions);
  const alerts = generateAlerts(transactions);

  return {
    profiles: [...clientProfiles, ...merchantProfiles, ...adminProfiles, ...agentProfiles],
    commercants: [...merchantDetails],
    comptes: buildAllComptes(),
    transactions,
    litiges: disputes,
    auditLogs: [...auditLogs],
    alertes: alerts,
  };
}

const initialData = initializeData();

// ============================================================================
// Store Interface & Export
// ============================================================================
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
  findProfileByPhone: (phone: string) => Profile | undefined;
  getCommerçant: (id: string) => Commercant | undefined;
  getCommerçantByQR: (qrCodeId: string) => Commercant | undefined;
  getTransactionsForUser: (userId: string) => Transaction[];
  getTransactionsForMerchant: (merchantId: string) => Transaction[];
  addDispute: (litige: Litige) => void;
  updateDisputeStatus: (id: string, statut: DisputeStatus) => void;
  // Registration
  registerUser: (data: RegisterData) => Profile;
  // Sync
  syncWithSupabase: () => Promise<void>;
  // Persistence
  persist: () => void;
  resetStore: () => void;
  listeners: Set<() => void>;
  subscribe: (listener: () => void) => () => void;
}

export interface RegisterData {
  telephone: string;
  nom: string;
  pin: string;
  role: UserRole;
  nom_boutique?: string;
  categorie?: CommerceCategory;
  ville?: string;
}

export const mockStore: MockDataStore = {
  profiles: initialData.profiles,
  commercants: initialData.commercants,
  comptes: initialData.comptes,
  transactions: initialData.transactions,
  litiges: initialData.litiges,
  auditLogs: initialData.auditLogs,
  alertes: initialData.alertes,
  listeners: new Set(),

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  },

  persist() {
    persistData({
      profiles: this.profiles,
      commercants: this.commercants,
      comptes: this.comptes,
      transactions: this.transactions,
      litiges: this.litiges,
      auditLogs: this.auditLogs,
      alertes: this.alertes,
    });
  },

  addTransaction(txn: Transaction) {
    this.transactions.unshift(txn);
    this.persist();
    if (!IS_MOCK_MODE) {
      supabase.from('transactions').insert({
        id: txn.id,
        type: txn.type,
        client_id: txn.client_id,
        commercant_id: txn.commercant_id,
        destinataire_id: txn.destinataire_id,
        agent_id: txn.agent_id,
        montant: txn.montant,
        montant_brut: txn.montant_brut,
        montant_net: txn.montant_net,
        frais: txn.frais,
        statut: txn.statut,
        reference: txn.reference,
        created_at: txn.created_at
      }).then(({ error }) => {
        if (error) console.error('Error inserting txn to Supabase:', error);
      });
    }
    this.listeners.forEach(l => l());
  },

  updateBalance(profileId: string, delta: number) {
    const compte = this.comptes.find(c => c.profile_id === profileId);
    if (compte) {
      compte.solde = Math.max(0, compte.solde + delta);
      compte.updated_at = new Date().toISOString();
      if (!IS_MOCK_MODE) {
        supabase.from('comptes').update({
          solde: compte.solde,
          updated_at: compte.updated_at
        }).eq('profile_id', profileId).then(({ error }) => {
          if (error) console.error('Error updating balance in Supabase:', error);
        });
      }
    }
    this.persist();
    this.listeners.forEach(l => l());
  },

  getBalance(profileId: string): number {
    return this.comptes.find(c => c.profile_id === profileId)?.solde ?? 0;
  },

  getProfile(id: string): Profile | undefined {
    return this.profiles.find(p => p.id === id);
  },

  findProfileByPhone(phone: string): Profile | undefined {
    const clean = phone.replace(/\D/g, '');
    return this.profiles.find(p => {
      const pClean = p.telephone.replace(/\D/g, '');
      if (clean.length >= 8 && pClean.length >= 8) {
        return clean.slice(-8) === pClean.slice(-8);
      }
      return clean === pClean;
    });
  },

  getCommerçant(id: string): Commercant | undefined {
    return this.commercants.find(c => c.id === id);
  },

  getCommerçantByQR(qrCodeId: string): Commercant | undefined {
    return this.commercants.find(c => c.qr_code_id === qrCodeId);
  },

  getTransactionsForUser(userId: string): Transaction[] {
    return this.transactions.filter(t => t.client_id === userId || t.destinataire_id === userId || t.agent_id === userId);
  },

  getTransactionsForMerchant(merchantId: string): Transaction[] {
    return this.transactions.filter(t => t.commercant_id === merchantId);
  },

  addDispute(litige: Litige) {
    this.litiges.unshift(litige);
    this.persist();
    if (!IS_MOCK_MODE) {
      supabase.from('litiges').insert({
        id: litige.id,
        transaction_id: litige.transaction_id,
        declarant_id: litige.declarant_id,
        description: litige.description,
        statut: litige.statut,
        created_at: litige.created_at
      });
    }
    this.listeners.forEach(l => l());
  },

  updateDisputeStatus(id: string, statut: DisputeStatus) {
    const litige = this.litiges.find(l => l.id === id);
    if (litige) {
      litige.statut = statut;
      if (statut === 'resolu') {
        litige.resolved_at = new Date().toISOString();
      }
      if (!IS_MOCK_MODE) {
        supabase.from('litiges').update({
          statut: statut,
          resolved_at: litige.resolved_at
        }).eq('id', id);
      }
    }
    this.persist();
    this.listeners.forEach(l => l());
  },

  registerUser(data: RegisterData): Profile {
    const newId = `mock-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    
    const newProfile: Profile = {
      id: newId,
      role: data.role,
      nom: data.nom,
      telephone: data.telephone,
      pin_hash: data.pin,
      kyc_niveau: 1,
      statut: 'actif',
      created_at: new Date().toISOString(),
    };

    this.profiles.push(newProfile);

    // Create account with 0 balance
    const newCompte: Compte = {
      id: `compte-${newId}`,
      profile_id: newId,
      solde: 0,
      updated_at: new Date().toISOString(),
    };
    this.comptes.push(newCompte);

    // If merchant, create merchant details
    if (data.role === 'commercant' && data.nom_boutique) {
      const qrId = `QR-${data.nom_boutique.toUpperCase().replace(/\s+/g, '-').substring(0, 15)}-${Math.floor(Math.random() * 1000)}`;
      const newMerchant: Commercant = {
        id: newId,
        nom_boutique: data.nom_boutique,
        categorie: data.categorie || 'autre',
        ville: data.ville || 'Bamako',
        qr_code_id: qrId,
        avatar_url: '',
      };
      this.commercants.push(newMerchant);
    }

    this.persist();

    // If real Supabase mode, insert profile row
    if (!IS_MOCK_MODE) {
      supabase.auth.signUp({
        email: `${data.telephone.replace(/\s+/g, '')}@lafiapay.com`,
        password: data.pin
      }).then(({ data: authData, error }) => {
        if (error) {
          console.error('Error signing up in Supabase:', error);
          return;
        }
        if (authData.user) {
          const realId = authData.user.id;
          newProfile.id = realId;
          newCompte.profile_id = realId;
          newCompte.id = `compte-${realId}`;
          if (data.role === 'commercant') {
            const idx = this.commercants.findIndex(m => m.id === newId);
            if (idx !== -1) this.commercants[idx].id = realId;
          }

          // Insert into profiles
          supabase.from('profiles').insert({
            id: realId,
            role: data.role,
            nom: data.nom,
            telephone: data.telephone,
            pin_hash: data.pin,
            kyc_niveau: 1,
            statut: 'actif'
          }).then(() => {
            // Insert into comptes
            supabase.from('comptes').insert({
              profile_id: realId,
              solde: 0.0,
              updated_at: new Date().toISOString()
            });

            // Insert into commercants if needed
            if (data.role === 'commercant' && data.nom_boutique) {
              const qrId = `QR-${data.nom_boutique.toUpperCase().replace(/\s+/g, '-').substring(0, 15)}-${Math.floor(Math.random() * 1000)}`;
              supabase.from('commercants').insert({
                id: realId,
                nom_boutique: data.nom_boutique,
                categorie: data.categorie || 'autre',
                ville: data.ville || 'Bamako',
                qr_code_id: qrId
              });
            }
          });
        }
      });
    }

    this.listeners.forEach(l => l());

    console.info(
      `%c✅ Nouveau compte créé: ${data.nom} (${data.role}) — ${data.telephone}`,
      'color: #10B981; font-weight: bold;'
    );

    return newProfile;
  },

  async syncWithSupabase() {
    if (IS_MOCK_MODE) return;
    try {
      // 1. Profiles
      const { data: profiles } = await supabase.from('profiles').select('*');
      if (profiles) {
        const demoProfs = [...clientProfiles, ...merchantProfiles, ...adminProfiles, ...agentProfiles];
        const mergedProfiles = [...demoProfs];
        profiles.forEach(p => {
          if (!mergedProfiles.some(m => m.id === p.id)) {
            mergedProfiles.push(p);
          }
        });
        this.profiles = mergedProfiles;
      }
      
      // 2. Commercants
      const { data: commercants } = await supabase.from('commercants').select('*');
      if (commercants) {
        const mergedComms = [...merchantDetails];
        commercants.forEach(c => {
          if (!mergedComms.some(m => m.id === c.id)) {
            mergedComms.push(c);
          }
        });
        this.commercants = mergedComms;
      }

      // 3. Comptes (balances)
      const { data: comptes } = await supabase.from('comptes').select('*');
      if (comptes) {
        const demoComptes = buildAllComptes();
        const mergedComptes = [...demoComptes];
        comptes.forEach(c => {
          const idx = mergedComptes.findIndex(m => m.profile_id === c.profile_id);
          if (idx !== -1) {
            mergedComptes[idx] = c;
          } else {
            mergedComptes.push(c);
          }
        });
        this.comptes = mergedComptes;
      }

      // 4. Transactions
      const { data: txns } = await supabase.from('transactions').select('*').order('created_at', { ascending: false });
      if (txns) {
        this.transactions = txns.map(tx => ({
          ...tx,
          client_nom: this.profiles.find(p => p.id === tx.client_id)?.nom,
          commercant_nom: tx.commercant_id ? this.profiles.find(p => p.id === tx.commercant_id)?.nom : undefined,
          commercant_boutique: tx.commercant_id ? this.commercants.find(m => m.id === tx.commercant_id)?.nom_boutique : undefined,
          commercant_categorie: tx.commercant_id ? this.commercants.find(m => m.id === tx.commercant_id)?.categorie : undefined,
        }));
      }

      // 5. Litiges
      const { data: disputes } = await supabase.from('litiges').select('*');
      if (disputes) {
        this.litiges = disputes.map(d => ({
          ...d,
          declarant_nom: this.profiles.find(p => p.id === d.declarant_id)?.nom,
          transaction_montant: this.transactions.find(t => t.id === d.transaction_id)?.montant,
          transaction_reference: this.transactions.find(t => t.id === d.transaction_id)?.reference,
        }));
      }

      this.listeners.forEach(l => l());
      console.info('⚡ LafiaPay — Supabase sync completed!');
    } catch (err) {
      console.error('Failed to sync with Supabase:', err);
    }
  },

  resetStore() {
    // Clear localStorage and reload fresh data
    import('./persistedStore').then(({ clearPersistedData }) => {
      clearPersistedData();
      window.location.reload();
    });
  },
};

// If Supabase is connected, load data from Supabase asynchronously
if (!IS_MOCK_MODE) {
  mockStore.syncWithSupabase();

  // Subscribe to realtime database changes
  supabase
    .channel('supabase_realtime_sync')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, async (payload) => {
      if (payload.eventType === 'INSERT') {
        const newTx = payload.new as any;
        const exists = mockStore.transactions.some(t => t.id === newTx.id);
        if (!exists) {
          mockStore.transactions.unshift({
            ...newTx,
            client_nom: mockStore.getProfile(newTx.client_id)?.nom,
            commercant_nom: newTx.commercant_id ? mockStore.getProfile(newTx.commercant_id)?.nom : undefined,
            commercant_boutique: newTx.commercant_id ? mockStore.getCommerçant(newTx.commercant_id)?.nom_boutique : undefined,
            commercant_categorie: newTx.commercant_id ? mockStore.getCommerçant(newTx.commercant_id)?.categorie : undefined,
          });
        }
      } else if (payload.eventType === 'UPDATE') {
        const updated = payload.new as any;
        const idx = mockStore.transactions.findIndex(t => t.id === updated.id);
        if (idx !== -1) {
          mockStore.transactions[idx] = { ...mockStore.transactions[idx], ...updated };
        }
      }
      mockStore.listeners.forEach(l => l());
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'comptes' }, (payload) => {
      if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
        const updated = payload.new as any;
        const idx = mockStore.comptes.findIndex(c => c.id === updated.id);
        if (idx !== -1) {
          mockStore.comptes[idx] = { ...mockStore.comptes[idx], ...updated };
        } else {
          mockStore.comptes.push(updated);
        }
      }
      mockStore.listeners.forEach(l => l());
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload) => {
      if (payload.eventType === 'INSERT') {
        const newProf = payload.new as any;
        if (!mockStore.profiles.some(p => p.id === newProf.id)) {
          mockStore.profiles.push(newProf);
        }
      } else if (payload.eventType === 'UPDATE') {
        const updated = payload.new as any;
        const idx = mockStore.profiles.findIndex(p => p.id === updated.id);
        if (idx !== -1) {
          mockStore.profiles[idx] = { ...mockStore.profiles[idx], ...updated };
        }
      }
      mockStore.listeners.forEach(l => l());
    })
    .subscribe();
}

// Persist initial seed data if it wasn't already persisted
if (!hasPersistedData()) {
  mockStore.persist();
}
