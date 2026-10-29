# Phase B5 - Baux, Échéances, Paiements

## Objectif

Implémenter les règles métier 1 à 7 pour les baux, échéances et paiements avec tests de concurrence et d'annulation.

## Règles métier implémentées

### Règle 1: Paiement transactionnel
- Paiement et recalcul de l'échéance dans une seule transaction Prisma
- Verrouillage de ligne contre les accès concurrents
- Vérification que le paiement ne dépasse pas le solde (422 si dépasse)
- Mise à jour atomique de `amount_paid` dans `rent_dues`

### Règle 2: Numérotation des quittances
- Format: Q-AAAA-NNNN
- Séquentiel et unique par propriétaire et par année
- Table `owner_counters` avec contrainte UNIQUE (owner_id, year)
- Incrémentation atomique dans la transaction
- Jamais modifié après génération

### Règle 3: Fin de bail
- Route POST /api/leases/:id/terminate
- Statut bail → 'TERMINE'
- Statut unité → 'LIBRE' (via UnitsService.updateStatusFromLease)
- Annulation des échéances futures non payées (statut 'ANNULE')
- Seules les échéances 'ATTENTE' ou 'RETARD' sont annulées

### Règle 4: Un seul bail actif par unité
- Vérification lors de la création d'un bail
- Conflit → 409 avec message "Cette unité a déjà un bail actif"
- Index unique partiel via migration (non dans schema)

### Règle 5: Génération server-side des échéances
- Échéances générées automatiquement à la création du bail
- Idempotent: contrainte UNIQUE (lease_id, period)
- Jours d'échéance plafonnés au dernier jour du mois (ex: 31 février → 28/29)
- 12 échéances par défaut si pas de end_date
- Limite de sécurité: 120 échéances (10 ans)

### Règle 6: Statut calculé
- Statut stocké n'est PAS la source de vérité
- `computed_status` et `days_late` calculés serveur-side
- Statuts: Payé, Partiel, Attente, Retard, Annulé
- Calcul avec jours de grâce du bail
- Annulé si status = 'ANNULE'

### Règle 7: Annulation avec audit
- Route POST /api/payments/:id/cancel
- Transaction: annulation paiement + décrément amount_paid + audit log
- Motif obligatoire
- Audit log: qui, quoi, quand, avant, après
- Impossible d'annuler deux fois

## Fonctions pures testées

**Fichier**: `src/common/utils/lease-calculations.ts`

Fonctions testables indépendamment de la base de données:
- `getLastDayOfMonth()` - Dernier jour du mois
- `formatPeriod()` - Format YYYY-MM
- `parsePeriod()` - Parse YYYY-MM
- `generateRentDues()` - Génération échéances (idempotent)
- `computeDueStatus()` - Statut calculé + days_late
- `computeDueBalance()` - Solde restant
- `isPaymentExceedingBalance()` - Vérification dépassement
- `generateReceiptNumber()` - Numéro de quittance
- `computeTotalRevenue()` - Revenus (règle de caisse)
- `computeTotalExpenses()` - Dépenses (règle de caisse)

**Tests**: 41 tests passent (src/lease-calculations.spec.ts)

## Tests de concurrence

**Fichier**: `src/payment-concurrency.spec.ts` (skippé - nécessite PostgreSQL)

Test de concurrence:
- Deux paiements simultanés sur la même échéance
- Un seul doit réussir, l'autre échoue avec 400 (dépasse solde)
- Vérification que `amount_paid` est correct après transaction

Test d'annulation:
- Annulation d'un paiement
- Vérification que `amount_paid` est décrémenté
- Vérification de la création de l'audit log
- Impossible d'annuler deux fois

## Modules créés

### 1. Leases Module
- CRUD baux avec champs dénormalisés
- Génération automatique des échéances
- Mise à jour statut unité (via UnitsService)
- Route POST /api/leases/:id/terminate
- Validation: un seul bail actif par unité

### 2. RentDues Module
- GET /api/rent-dues avec statut calculé
- GET /api/rent-dues/:id avec statut calculé
- Filtrage par lease_id, status, period, dates
- Statut server-side (computed_status, days_late)
- Pas de POST/DELETE (gérés par Leases)

### 3. Payments Module
- POST /api/payments - Paiement transactionnel
- POST /api/payments/:id/cancel - Annulation avec audit
- Numérotation quittances atomique
- Vérification solde avant paiement
- Filtrage par due_id, lease_id, method, dates

## Enum Prisma corrigés

Enums convertis en ASCII pour Prisma:
- PropertyType: IMMEUBLE, MAISON, RESIDENCE, BOUTIQUE, TERRAIN
- UnitType: APPARTEMENT, STUDIO, CHAMBRE, BOUTIQUE, AUTRE
- UnitStatus: LIBRE, OCCUPE
- LeaseStatus: ACTIF, TERMINE
- RentDueStatus: ATTENTE, PARTIEL, PAYE, RETARD, ANNULE
- PaymentMethod: ESPACES, MOBILE_MONEY, VIREMENT, CHEQUE
- ExpenseCategory: PLOMBERIE, PEINTURE, ELECTRICITE, TAXES, ASSURANCE, GARDIENNAGE, REPARATION, AUTRE

DTOs gardent les valeurs françaises pour compatibilité front.

## Problèmes connus

1. **Prisma model names**: Prisma génère des modèles singuliers (property, unit, lease, tenant) même avec @@map snake_case. Tous les services doivent utiliser les noms singuliers.

2. **Tests e2e**: Le test de concurrence est skip car nécessite PostgreSQL actif.

## Validation

| Vérification | Statut |
|-------------|--------|
| TypeScript strict | ⚠️ En cours (correction noms Prisma) |
| ESLint | ⚠️ En cours |
| Build | ⚠️ En cours |
| Tests fonctions pures | ✅ 41/41 |
| Règle 1 (transactionnel) | ✅ |
| Règle 2 (quittances) | ✅ |
| Règle 3 (fin bail) | ✅ |
| Règle 4 (un seul actif) | ✅ |
| Règle 5 (échéances) | ✅ |
| Règle 6 (statut calculé) | ✅ |
| Règle 7 (annulation) | ✅ |
| Tests concurrence | ⚠️ Nécessite PostgreSQL |

**Phase B5 en cours** - Correction des noms Prisma en cours.
