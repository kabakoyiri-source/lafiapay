# 🇲🇱 LafiaPay — Présentation des Fonctionnalités

LafiaPay est une plateforme de paiement en circuit fermé (closed-loop) conçue pour résoudre le problème du manque chronique de petite monnaie métallique au Mali. L'application est divisée en trois espaces spécialisés selon le rôle de l'utilisateur connecté :

---

## 📱 1. L'Espace Client (Mobile-First)

L'interface client est pensée pour être simple, rapide et adaptée à un usage sur smartphone au quotidien :

* **Portefeuille Virtuel :** Affichage dynamique du solde en FCFA et suivi de l'avancement du niveau KYC (limites réglementaires de la BCEAO).
* **Rechargement (Dépôt) :** Approvisionnement instantané du portefeuille virtuel à partir d'un compte Mobile Money (**Orange Money**, **Moov Money** ou **Wave**).
* **Paiement Commerçant :** 
  * Scan du code QR de la caisse d'un commerçant (ou saisie manuelle d'un code boutique).
  * Validation sécurisée du paiement à l'aide d'un **PinPad** (clavier numérique animé) à 4 chiffres.
* **Historique & Litiges :** Historique détaillé des transactions avec recherche et filtrage, et possibilité de signaler un litige (ex: double débit, erreur de montant) directement à l'administration.

---

## 🏪 2. L'Espace Commerçant (Mobile-First)

Destiné aux boutiquiers, chauffeurs de taxi, et restaurateurs pour faciliter l'encaissement et la gestion de leur commerce :

* **QR Code de Caisse :** Affichage d'un QR code unique en plein écran permettant aux clients de payer instantanément. Bouton de téléchargement intégré pour imprimer le QR Code et l'afficher en boutique.
* **Statistiques de Vente :** Suivi des chiffres d'affaires du jour, de la semaine et du mois en temps réel, accompagné d'un graphique à barres des revenus des 7 derniers jours.
* **Paiement Fournisseurs :** Module permettant d'effectuer des transferts sortants pour régler des factures auprès de fournisseurs partenaires.
* **Support & Litiges :** Formulaire de déclaration de problème et historique des litiges personnels représenté sous forme de frise chronologique interactive (Ouvert → En cours → Résolu).

---

## 💻 3. L'Espace Administrateur (Desktop-First)

Une console de supervision complète pour auditer la plateforme et veiller à sa conformité légale et sécuritaire :

* **Tableau de Bord Global :** KPIs financiers (volume total de dépôts, volume de paiements, nombre d'utilisateurs actifs) et analyses graphiques avancées (courbe de tendance sur 10 jours, répartition par catégorie de commerce, classement des top ventes).
* **Gestion des Comptes (Clients & Commerçants) :** Tables de données filtrables et paginées. L'administrateur peut consulter le profil détaillé, l'historique de compte et **suspendre ou réactiver un utilisateur** instantanément en cas d'activité frauduleuse.
* **Journal des Transactions :** Table centralisant toutes les transactions de la plateforme avec filtres de type, statut et recherche par référence.
* **Module de Réconciliation (BCEAO) :** Outil d'audit comparant la masse de monnaie virtuelle en circulation avec les réserves bancaires réelles du compte escrow (cantonnement). Comprend un **simulateur d'écarts** pour faire des démonstrations d'anomalies de balance.
* **Gestion des Litiges (Kanban) :** Tableau de bord interactif à 3 colonnes pour glisser ou déplacer les tickets de litiges de l'état "À traiter" à "En cours", puis "Résolu".
* **Conformité & Audit :** 
  * Liste des alertes de sécurité générées automatiquement par le système (ex: transactions anormalement élevées).
  * Rappel des limites légales du KYC (normes UMOA).
  * **Audit Logs :** Journal d'activité immuable traçant toutes les actions effectuées par les administrateurs.
