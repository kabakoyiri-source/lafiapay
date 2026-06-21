# 🇲🇱 LafiaPay — Plateforme de Paiement Digital Closed-Loop (Prototype)

LafiaPay est un prototype haute-fidélité de démonstration d'une plateforme de paiement en circuit fermé (closed-loop) conçue spécifiquement pour le contexte économique malien. 

Dans de nombreuses villes du Mali (comme Bamako), le commerce quotidien souffre d'un manque chronique de petite monnaie métallique. LafiaPay apporte une solution en permettant aux clients de numériser leur monnaie fiduciaire via un rechargement Mobile Money (simulé) et de payer instantanément les commerçants partenaires par simple scan de QR Code.

> [!WARNING]
> **Avertissement de sécurité & légal :** Ce projet est un prototype de démonstration académique/portfolio. Aucune transaction financière réelle n'est effectuée, aucun argent réel n'est engagé. Les intégrations bancaires et opérateurs sont simulées.

---

## 🏗️ Architecture du Projet

LafiaPay regroupe trois espaces applicatifs distincts sécurisés au sein d'une Unique Single Page Application (SPA) avec routage basé sur les rôles utilisateur :

```mermaid
graph TD
    User([Utilisateur]) -->|Connexion| Router{Vérificateur de Rôle}
    Router -->|Rôle: Client| ClientSpace[Espace Client (Mobile-First)]
    Router -->|Rôle: Commerçant| MerchantSpace[Espace Commerçant (Mobile-First)]
    Router -->|Rôle: Admin| AdminSpace[Espace Admin (Desktop-First)]
    
    ClientSpace -->|Scanner QR / PIN| Payment[Module de Paiement Closed-Loop]
    ClientSpace -->|Recharger Mobile Money| Recharge[Module de Dépôt / Retrait]
    
    MerchantSpace -->|Générer QR Code| QRGen[QR Code de Caisse]
    MerchantSpace -->|Payer Partenaire| Suppliers[Module Fournisseurs]
    
    AdminSpace -->|Surveillance| Analytics[KPIs & Tableaux de Bord]
    AdminSpace -->|Audit Bancaire| Reconciliation[Module de Réconciliation BCEAO]
    AdminSpace -->|Triage Kanban| Disputes[Module de Litiges]
    AdminSpace -->|Limites Reg.| Compliance[Alerte Conformité & KYC]
    
    Payment & Recharge & Reconciliation & Disputes -->|Base de Données / Mock| Store[(Supabase Ledger / localStorage)]
```

---

## 🛠️ Stack Technique

- **Framework :** React 19 + TypeScript + Vite 8
- **Design System & CSS :** Tailwind CSS v4 (thème configuré via `@theme` variables)
- **Base de Données & Auth :** Supabase (avec mode **Mock automatique** fonctionnel hors-ligne utilisant `localStorage` et événements réactifs en mémoire)
- **Librairie Graphique :** Recharts (courbes d'analyse des flux de volume, répartition des ventes par catégorie, barres des top commerces)
- **Scanner QR :** `html5-qrcode` & `qrcode.react`
- **Animations :** Framer Motion (transitions de pages fluides, modales, volets coulissants et animations de chargement)
- **Icônes :** Lucide-React

---

## 🔑 Identifiants de Démonstration (Quick Connect)

La page de connexion intègre un module de **Connexion Rapide** qui remplit automatiquement les champs pour tester les différents profils :

1. **Espace Client :**
   - Téléphone : `+223 70 00 00 01`
   - Code PIN : `1234`
2. **Espace Commerçant :**
   - Téléphone : `+223 70 00 00 02`
   - Code PIN : `1234`
3. **Espace Administrateur :**
   - E-mail : `admin@demo.com`
   - Mot de passe : `Demo2026!`

---

## 🚀 Installation locale

### 1. Cloner et installer les dépendances
```bash
# Installer les dépendances npm
npm install
```

### 2. Configuration d'environnement (Optionnel)
Par défaut, si les clés d'API Supabase ne sont pas détectées, l'application s'initialise automatiquement en **Mode Mock local**. Tous les tableaux de bord et transactions fonctionneront directement dans la mémoire de votre navigateur (persistance `localStorage` pour la session).

Si vous souhaitez connecter une vraie instance Supabase :
1. Créez un projet sur [Supabase](https://supabase.com/).
2. Créez un fichier `.env` à la racine :
   ```env
   VITE_SUPABASE_URL=votre_url_supabase
   VITE_SUPABASE_ANON_KEY=votre_cle_anonyme
   ```
3. Exécutez le script SQL `supabase/schema.sql` dans le SQL Editor de Supabase pour créer la structure des tables.
4. Exécutez le script `supabase/seed.sql` pour pré-peupler la base de données.

### 3. Lancer le serveur de développement
```bash
npm run dev
```
L'application sera accessible localement à l'adresse fournie dans la console (généralement `http://localhost:5173`).

---

## 🔒 Réglementation & Conformité (BCEAO / UMOA)

Dans le cadre des directives sur la monnaie électronique dans l'Union Monétaire Ouest-Africaine (UMOA) :
- **Compte de cantonnement :** LafiaPay intègre un tableau d'audit de réconciliation comparant en temps réel la monnaie électronique virtuelle émise avec les réserves fiduciaires déposées sur un compte de cantonnement séquestre à la **BCEAO**.
- **Plafonds KYC :**
  - **Niveau 1 :** Limite de solde à 200 000 FCFA (identification simplifiée).
  - **Niveau 2 :** Limite à 1 000 000 FCFA (pièce d'identité requise).
  - **Niveau 3 :** Limite à 5 000 000 FCFA (commerçants, documentation complète exigée).
