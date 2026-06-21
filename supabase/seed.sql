-- ============================================================================
-- LafiaPay — Database Seed Data
-- Standard SQL seed script populating tables with demo portfolios.
-- Includes client, merchant, and admin profiles and initial transaction history.
-- ============================================================================

-- ============================================================================
-- 0. Seeding Auth Users (Required to satisfy public.profiles foreign key constraint)
-- ============================================================================

-- Clean up existing demo users from auth.users first (cascades to profiles, comptes, etc.)
delete from auth.users where id in (
  'e81a3ee6-e82b-4cde-a178-5e82103f0000', -- Admin
  'd52e3ee6-e82b-4cde-a178-5e82103f0001', -- Client Amadou
  'd52e3ee6-e82b-4cde-a178-5e82103f0012', -- Client Aminata
  'd52e3ee6-e82b-4cde-a178-5e82103f0013', -- Client Fatoumata
  'd52e3ee6-e82b-4cde-a178-5e82103f0014', -- Client Sékou
  'd52e3ee6-e82b-4cde-a178-5e82103f0015', -- Client Mariam
  'd52e3ee6-e82b-4cde-a178-5e82103f0016', -- Client Oumar
  'f63e3ee6-e82b-4cde-a178-5e82103f0002', -- Merchant Bakary
  'f63e3ee6-e82b-4cde-a178-5e82103f0022', -- Merchant Fanta
  'f63e3ee6-e82b-4cde-a178-5e82103f0023', -- Merchant Mamadou
  'f63e3ee6-e82b-4cde-a178-5e82103f0024'  -- Merchant Aïssata
);

-- Insert into auth.users
insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, phone, phone_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
values
-- Admin (email: admin@demo.com, password: Demo2026! in bcrypt)
('e81a3ee6-e82b-4cde-a178-5e82103f0000', '00000000-0000-0000-0000-000000000000', 'admin@demo.com', '$2a$10$Wd3r0qE.b7s9gQ11vH3NuuH7tBskb7tX7B8n2c29s7p7N5lJ5q9c6', now(), null, null, '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now(), 'authenticated', 'authenticated'),
-- Clients
('d52e3ee6-e82b-4cde-a178-5e82103f0001', '00000000-0000-0000-0000-000000000000', null, '', null, '+223 70 00 00 01', now(), '{"provider":"phone","providers":["phone"]}'::jsonb, '{}'::jsonb, now(), now(), 'authenticated', 'authenticated'),
('d52e3ee6-e82b-4cde-a178-5e82103f0012', '00000000-0000-0000-0000-000000000000', null, '', null, '+223 76 12 34 56', now(), '{"provider":"phone","providers":["phone"]}'::jsonb, '{}'::jsonb, now(), now(), 'authenticated', 'authenticated'),
('d52e3ee6-e82b-4cde-a178-5e82103f0013', '00000000-0000-0000-0000-000000000000', null, '', null, '+223 66 78 90 12', now(), '{"provider":"phone","providers":["phone"]}'::jsonb, '{}'::jsonb, now(), now(), 'authenticated', 'authenticated'),
('d52e3ee6-e82b-4cde-a178-5e82103f0014', '00000000-0000-0000-0000-000000000000', null, '', null, '+223 78 45 67 89', now(), '{"provider":"phone","providers":["phone"]}'::jsonb, '{}'::jsonb, now(), now(), 'authenticated', 'authenticated'),
('d52e3ee6-e82b-4cde-a178-5e82103f0015', '00000000-0000-0000-0000-000000000000', null, '', null, '+223 69 23 45 67', now(), '{"provider":"phone","providers":["phone"]}'::jsonb, '{}'::jsonb, now(), now(), 'authenticated', 'authenticated'),
('d52e3ee6-e82b-4cde-a178-5e82103f0016', '00000000-0000-0000-0000-000000000000', null, '', null, '+223 74 56 78 90', now(), '{"provider":"phone","providers":["phone"]}'::jsonb, '{}'::jsonb, now(), now(), 'authenticated', 'authenticated'),
-- Merchants
('f63e3ee6-e82b-4cde-a178-5e82103f0002', '00000000-0000-0000-0000-000000000000', null, '', null, '+223 70 00 00 02', now(), '{"provider":"phone","providers":["phone"]}'::jsonb, '{}'::jsonb, now(), now(), 'authenticated', 'authenticated'),
('f63e3ee6-e82b-4cde-a178-5e82103f0022', '00000000-0000-0000-0000-000000000000', null, '', null, '+223 76 55 44 33', now(), '{"provider":"phone","providers":["phone"]}'::jsonb, '{}'::jsonb, now(), now(), 'authenticated', 'authenticated'),
('f63e3ee6-e82b-4cde-a178-5e82103f0023', '00000000-0000-0000-0000-000000000000', null, '', null, '+223 66 11 22 33', now(), '{"provider":"phone","providers":["phone"]}'::jsonb, '{}'::jsonb, now(), now(), 'authenticated', 'authenticated'),
('f63e3ee6-e82b-4cde-a178-5e82103f0024', '00000000-0000-0000-0000-000000000000', null, '', null, '+223 78 99 88 77', now(), '{"provider":"phone","providers":["phone"]}'::jsonb, '{}'::jsonb, now(), now(), 'authenticated', 'authenticated');

-- ============================================================================
-- 1. Profiles Seed Data
-- ============================================================================

-- Clear existing public records
truncate public.alertes_conformite cascade;
truncate public.audit_logs cascade;
truncate public.litiges cascade;
truncate public.transactions cascade;
truncate public.comptes cascade;
truncate public.commercants cascade;
truncate public.profiles cascade;

-- Insert Admin
insert into public.profiles (id, role, nom, telephone, pin_hash, kyc_niveau, statut, created_at)
values ('e81a3ee6-e82b-4cde-a178-5e82103f0000', 'admin', 'Admin LafiaPay', '+223 70 00 00 00', '0000', 3, 'actif', now() - interval '90 days');

-- Insert Clients
insert into public.profiles (id, role, nom, telephone, pin_hash, kyc_niveau, statut, created_at)
values 
('d52e3ee6-e82b-4cde-a178-5e82103f0001', 'client', 'Amadou Diallo', '+223 70 00 00 01', '1234', 2, 'actif', now() - interval '60 days'),
('d52e3ee6-e82b-4cde-a178-5e82103f0012', 'client', 'Aminata Coulibaly', '+223 76 12 34 56', '5678', 1, 'actif', now() - interval '45 days'),
('d52e3ee6-e82b-4cde-a178-5e82103f0013', 'client', 'Fatoumata Traoré', '+223 66 78 90 12', '9012', 3, 'actif', now() - interval '40 days'),
('d52e3ee6-e82b-4cde-a178-5e82103f0014', 'client', 'Sékou Konaté', '+223 78 45 67 89', '3456', 1, 'actif', now() - interval '30 days'),
('d52e3ee6-e82b-4cde-a178-5e82103f0015', 'client', 'Mariam Keïta', '+223 69 23 45 67', '7890', 2, 'actif', now() - interval '25 days'),
('d52e3ee6-e82b-4cde-a178-5e82103f0016', 'client', 'Oumar Sangaré', '+223 74 56 78 90', '2345', 1, 'suspendu', now() - interval '20 days');

-- Insert Merchants Profiles
insert into public.profiles (id, role, nom, telephone, pin_hash, kyc_niveau, statut, created_at)
values 
('f63e3ee6-e82b-4cde-a178-5e82103f0002', 'commercant', 'Bakary Cissé', '+223 70 00 00 02', '1234', 3, 'actif', now() - interval '60 days'),
('f63e3ee6-e82b-4cde-a178-5e82103f0022', 'commercant', 'Fanta Diakité', '+223 76 55 44 33', '5678', 2, 'actif', now() - interval '50 days'),
('f63e3ee6-e82b-4cde-a178-5e82103f0023', 'commercant', 'Mamadou Bah', '+223 66 11 22 33', '9012', 3, 'actif', now() - interval '40 days'),
('f63e3ee6-e82b-4cde-a178-5e82103f0024', 'commercant', 'Aïssata Koné', '+223 78 99 88 77', '3456', 2, 'actif', now() - interval '35 days');

-- ============================================================================
-- 2. Merchants Specific Details
-- ============================================================================
insert into public.commercants (id, nom_boutique, categorie, ville, qr_code_id)
values 
('f63e3ee6-e82b-4cde-a178-5e82103f0002', 'Épicerie Sogoniko', 'alimentation', 'Bamako', 'QR-EPICERIE-SOGO'),
('f63e3ee6-e82b-4cde-a178-5e82103f0022', 'Maquis Faso Kanu', 'restauration', 'Bamako', 'QR-FASO-KANU'),
('f63e3ee6-e82b-4cde-a178-5e82103f0023', 'Taxi Bamako Express', 'transport', 'Bamako', 'QR-TAXI-BMK'),
('f63e3ee6-e82b-4cde-a178-5e82103f0024', 'Salon Beauté Djouma', 'services', 'Bamako', 'QR-BEAUTE-DJOUMA');

-- ============================================================================
-- 3. Wallets / Balances
-- ============================================================================
insert into public.comptes (profile_id, solde, updated_at)
values 
('d52e3ee6-e82b-4cde-a178-5e82103f0001', 25750.00, now()),
('d52e3ee6-e82b-4cde-a178-5e82103f0012', 3200.00, now()),
('d52e3ee6-e82b-4cde-a178-5e82103f0013', 67500.00, now()),
('d52e3ee6-e82b-4cde-a178-5e82103f0014', 800.00, now()),
('d52e3ee6-e82b-4cde-a178-5e82103f0015', 15000.00, now()),
('d52e3ee6-e82b-4cde-a178-5e82103f0016', 0.00, now()),
-- Merchants
('f63e3ee6-e82b-4cde-a178-5e82103f0002', 185000.00, now()),
('f63e3ee6-e82b-4cde-a178-5e82103f0022', 342500.00, now()),
('f63e3ee6-e82b-4cde-a178-5e82103f0023', 127800.00, now()),
('f63e3ee6-e82b-4cde-a178-5e82103f0024', 89300.00, now());

-- ============================================================================
-- 4. Transactions Ledger History
-- ============================================================================
insert into public.transactions (id, type, client_id, commercant_id, montant, statut, operateur_mobile_money, reference, created_at)
values
-- Recharges Dépôts (Mobile Money)
('9b1deb4d-3b7d-4bad-9bdd-2b0d7b3d0001', 'depot', 'd52e3ee6-e82b-4cde-a178-5e82103f0001', null, 25000.00, 'reussie', 'orange_money', 'LP-A9182736', now() - interval '10 days'),
('9b1deb4d-3b7d-4bad-9bdd-2b0d7b3d0002', 'depot', 'd52e3ee6-e82b-4cde-a178-5e82103f0012', null, 10000.00, 'reussie', 'wave', 'LP-W1827394', now() - interval '8 days'),
('9b1deb4d-3b7d-4bad-9bdd-2b0d7b3d0003', 'depot', 'd52e3ee6-e82b-4cde-a178-5e82103f0013', null, 75000.00, 'reussie', 'moov_money', 'LP-M2918237', now() - interval '12 days'),
('9b1deb4d-3b7d-4bad-9bdd-2b0d7b3d0004', 'depot', 'd52e3ee6-e82b-4cde-a178-5e82103f0014', null, 5000.00, 'reussie', 'orange_money', 'LP-A1028374', now() - interval '4 days'),
('9b1deb4d-3b7d-4bad-9bdd-2b0d7b3d0005', 'depot', 'd52e3ee6-e82b-4cde-a178-5e82103f0015', null, 20000.00, 'reussie', 'wave', 'LP-W9283741', now() - interval '5 days'),
-- Failed Recharge
('9b1deb4d-3b7d-4bad-9bdd-2b0d7b3d0006', 'depot', 'd52e3ee6-e82b-4cde-a178-5e82103f0001', null, 50000.00, 'echouee', 'orange_money', 'LP-A3928174', now() - interval '1 days'),

-- Payments
('9b1deb4d-3b7d-4bad-9bdd-2b0d7b3d0101', 'paiement', 'd52e3ee6-e82b-4cde-a178-5e82103f0001', 'f63e3ee6-e82b-4cde-a178-5e82103f0002', 3500.00, 'reussie', null, 'LP-P0293847', now() - interval '9 days'),
('9b1deb4d-3b7d-4bad-9bdd-2b0d7b3d0102', 'paiement', 'd52e3ee6-e82b-4cde-a178-5e82103f0001', 'f63e3ee6-e82b-4cde-a178-5e82103f0022', 12000.00, 'reussie', null, 'LP-P9283749', now() - interval '7 days'),
('9b1deb4d-3b7d-4bad-9bdd-2b0d7b3d0103', 'paiement', 'd52e3ee6-e82b-4cde-a178-5e82103f0012', 'f63e3ee6-e82b-4cde-a178-5e82103f0002', 2000.00, 'reussie', null, 'LP-P1293847', now() - interval '6 days'),
('9b1deb4d-3b7d-4bad-9bdd-2b0d7b3d0104', 'paiement', 'd52e3ee6-e82b-4cde-a178-5e82103f0013', 'f63e3ee6-e82b-4cde-a178-5e82103f0023', 5000.00, 'reussie', null, 'LP-P4928374', now() - interval '10 days'),
('9b1deb4d-3b7d-4bad-9bdd-2b0d7b3d0105', 'paiement', 'd52e3ee6-e82b-4cde-a178-5e82103f0013', 'f63e3ee6-e82b-4cde-a178-5e82103f0024', 2500.00, 'reussie', null, 'LP-P8291038', now() - interval '5 days'),
('9b1deb4d-3b7d-4bad-9bdd-2b0d7b3d0106', 'paiement', 'd52e3ee6-e82b-4cde-a178-5e82103f0015', 'f63e3ee6-e82b-4cde-a178-5e82103f0022', 4500.00, 'reussie', null, 'LP-P9203847', now() - interval '3 days'),
-- Failed Payment
('9b1deb4d-3b7d-4bad-9bdd-2b0d7b3d0107', 'paiement', 'd52e3ee6-e82b-4cde-a178-5e82103f0014', 'f63e3ee6-e82b-4cde-a178-5e82103f0002', 15000.00, 'echouee', null, 'LP-P8392019', now() - interval '2 days');

-- ============================================================================
-- 5. Disputes (Litiges)
-- ============================================================================
insert into public.litiges (id, transaction_id, declarant_id, description, statut, created_at, resolved_at)
values
('c78a3ee6-e82b-4cde-a178-5e82103f0001', '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3d0101', 'd52e3ee6-e82b-4cde-a178-5e82103f0001', 'Montant débité supérieur au prix affiché en boutique. Le commerçant avait annoncé 2000 FCFA mais 3500 FCFA ont été prélevés.', 'ouvert', now() - interval '2 days', null),
('c78a3ee6-e82b-4cde-a178-5e82103f0002', '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3d0104', 'd52e3ee6-e82b-4cde-a178-5e82103f0013', 'Double débit pour une même transaction. Le montant de 5000 FCFA a été prélevé deux fois.', 'resolu', now() - interval '5 days', now() - interval '3 days');

-- ============================================================================
-- 6. Audit Logs
-- ============================================================================
insert into public.audit_logs (id, admin_id, action, details, created_at)
values
('a12a3ee6-e82b-4cde-a178-5e82103f0001', 'e81a3ee6-e82b-4cde-a178-5e82103f0000', 'Suspension de compte', '{"target": "d52e3ee6-e82b-4cde-a178-5e82103f0016", "reason": "Activité suspecte"}'::jsonb, now() - interval '2 days'),
('a12a3ee6-e82b-4cde-a178-5e82103f0002', 'e81a3ee6-e82b-4cde-a178-5e82103f0000', 'Vérification KYC approuvée', '{"target": "d52e3ee6-e82b-4cde-a178-5e82103f0013", "level": 3}'::jsonb, now() - interval '4 days');

-- ============================================================================
-- 7. Compliance / Conformité Alerts
-- ============================================================================
insert into public.alertes_conformite (id, transaction_id, niveau_criticite, description, statut, created_at)
values
('d34a3ee6-e82b-4cde-a178-5e82103f0001', '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3d0006', 'eleve', 'Tentative de dépôt de 50 000 FCFA bloquée — dépasse le plafond KYC niveau 1.', 'a_verifier', now() - interval '1 days');
