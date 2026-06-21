-- ============================================================================
-- LafiaPay — Database Schema
-- Supabase PostgreSQL schema with Row-Level Security (RLS) policies.
-- Targets BCEAO & UMOA compliant digital wallet ledger system.
-- ============================================================================

-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- Define Enums/Allowed check constraints
-- Roles: client, commercant (commerçant), admin (administrateur)
-- Statuses: actif, suspendu
-- Tx types: depot (recharge), paiement (commerçant)
-- Tx statuses: reussie (réussie), echouee (échouée), en_attente (en attente)
-- Dispute statuses: ouvert, en_cours, resolu
-- Operators: orange_money, moov_money, wave
-- Categories: alimentation, restauration, transport, services, habillement, sante, autre

-- ============================================================================
-- Tables Definitions
-- ============================================================================

-- 1. Profiles (extending auth.users)
create table public.profiles (
    id uuid references auth.users on delete cascade primary key,
    role text not null check (role in ('client', 'commercant', 'admin')),
    nom text not null,
    telephone text not null unique,
    pin_hash text not null, -- 4-digit PIN representation
    kyc_niveau integer not null default 1 check (kyc_niveau in (1, 2, 3)),
    statut text not null default 'actif' check (statut in ('actif', 'suspendu')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    avatar_url text
);

-- 2. Merchant Specifics
create table public.commercants (
    id uuid references public.profiles on delete cascade primary key,
    nom_boutique text not null,
    categorie text not null check (categorie in ('alimentation', 'restauration', 'transport', 'services', 'habillement', 'sante', 'autre')),
    ville text not null,
    qr_code_id text not null unique,
    avatar_url text
);

-- 3. Accounts / Wallet Ledger balances
create table public.comptes (
    id uuid default gen_random_uuid() primary key,
    profile_id uuid references public.profiles on delete cascade not null,
    solde numeric(12, 2) not null default 0.00 check (solde >= 0.00),
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Transactions Ledger
create table public.transactions (
    id uuid default gen_random_uuid() primary key,
    type text not null check (type in ('depot', 'paiement')),
    client_id uuid references public.profiles on delete restrict not null,
    commercant_id uuid references public.profiles on delete restrict, -- Null for mobile money deposits
    montant numeric(12, 2) not null check (montant > 0.00),
    statut text not null default 'en_attente' check (statut in ('reussie', 'echouee', 'en_attente')),
    operateur_mobile_money text check (operateur_mobile_money in ('orange_money', 'moov_money', 'wave')), -- Null for client-merchant payments
    reference text not null unique,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Disputes (Litiges)
create table public.litiges (
    id uuid default gen_random_uuid() primary key,
    transaction_id uuid references public.transactions on delete restrict not null,
    declarant_id uuid references public.profiles on delete restrict not null,
    description text not null,
    statut text not null default 'ouvert' check (statut in ('ouvert', 'en_cours', 'resolu')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    resolved_at timestamp with time zone
);

-- 6. Audit Logs
create table public.audit_logs (
    id uuid default gen_random_uuid() primary key,
    admin_id uuid references public.profiles on delete restrict not null,
    action text not null,
    details jsonb not null default '{}'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Compliance / Conformité Alerts
create table public.alertes_conformite (
    id uuid default gen_random_uuid() primary key,
    transaction_id uuid references public.transactions on delete cascade not null,
    niveau_criticite text not null check (niveau_criticite in ('faible', 'moyen', 'eleve')),
    description text not null,
    statut text not null default 'a_verifier' check (statut in ('a_verifier', 'verifie')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================================================
-- Performance Indices
-- ============================================================================
create index idx_profiles_role on public.profiles(role);
create index idx_profiles_telephone on public.profiles(telephone);
create index idx_comptes_profile on public.comptes(profile_id);
create index idx_transactions_client on public.transactions(client_id);
create index idx_transactions_merchant on public.transactions(commercant_id);
create index idx_transactions_reference on public.transactions(reference);
create index idx_litiges_status on public.litiges(statut);
create index idx_alerts_criticality on public.alertes_conformite(niveau_criticite);

-- ============================================================================
-- Supabase Row-Level Security (RLS) policies
-- ============================================================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.commercants enable row level security;
alter table public.comptes enable row level security;
alter table public.transactions enable row level security;
alter table public.litiges enable row level security;
alter table public.audit_logs enable row level security;
alter table public.alertes_conformite enable row level security;

-- Policies for Profiles
create policy "Allow public read access to profiles" on public.profiles
    for select using (true);

create policy "Allow users to update their own profile" on public.profiles
    for update using (auth.uid() = id);

create policy "Allow admins complete control over profiles" on public.profiles
    for all using (
        exists (
            select 1 from public.profiles 
            where profiles.id = auth.uid() and profiles.role = 'admin'
        )
    );

-- Policies for Commercants (Merchants details)
create policy "Allow public read access to merchants" on public.commercants
    for select using (true);

create policy "Allow merchants to update their own shop info" on public.commercants
    for update using (auth.uid() = id);

-- Policies for Comptes (Wallet balances)
create policy "Allow users to read their own balance account" on public.comptes
    for select using (auth.uid() = profile_id);

create policy "Allow admins full access on accounts" on public.comptes
    for all using (
        exists (
            select 1 from public.profiles 
            where profiles.id = auth.uid() and profiles.role = 'admin'
        )
    );

-- Policies for Transactions
create policy "Allow users to read their own client transactions" on public.transactions
    for select using (
        auth.uid() = client_id or auth.uid() = commercant_id
    );

create policy "Allow clients to create deposits and payments" on public.transactions
    for insert with check (
        auth.uid() = client_id
    );

create policy "Allow admins complete transaction management" on public.transactions
    for all using (
        exists (
            select 1 from public.profiles 
            where profiles.id = auth.uid() and profiles.role = 'admin'
        )
    );

-- Policies for Litiges (Disputes)
create policy "Allow users to read their own disputes" on public.litiges
    for select using (
        auth.uid() = declarant_id or 
        exists (
            select 1 from public.transactions 
            where transactions.id = transaction_id and transactions.commercant_id = auth.uid()
        )
    );

create policy "Allow clients/merchants to file a dispute" on public.litiges
    for insert with check (
        auth.uid() = declarant_id
    );

create policy "Allow admins full audit and management of disputes" on public.litiges
    for all using (
        exists (
            select 1 from public.profiles 
            where profiles.id = auth.uid() and profiles.role = 'admin'
        )
    );

-- Policies for Audit Logs (Admin only)
create policy "Allow only admins access to audit logs" on public.audit_logs
    for all using (
        exists (
            select 1 from public.profiles 
            where profiles.id = auth.uid() and profiles.role = 'admin'
        )
    );

-- Policies for Compliance Alerts (Admin only)
create policy "Allow only admins access to compliance alerts" on public.alertes_conformite
    for all using (
        exists (
            select 1 from public.profiles 
            where profiles.id = auth.uid() and profiles.role = 'admin'
        )
    );

-- ============================================================================
-- Enable Realtime
-- ============================================================================
begin;
  -- remove the publication if it exists
  drop publication if exists supabase_realtime;
  -- create a new publication with our tables
  create publication supabase_realtime for table public.transactions, public.litiges, public.comptes;
commit;
