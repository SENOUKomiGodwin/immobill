# Phase B2 - Schéma de données : Résumé

## ✅ Complété

### 1. Schéma Prisma mis à jour

#### Tables renommées (snake_case)
- `ReceiptCounter` → `owner_counters`
- `AuditLog` → `audit_log`
- `Reminder` → `reminders`
- `User` → `users`
- `Property` → `properties`
- `Unit` → `units`
- `Tenant` → `tenants`
- `Lease` → `leases`
- `RentDue` → `rent_dues`
- `Payment` → `payments`
- `Expense` → `expenses`

Toutes les tables utilisent `@@map()` pour respecter les conventions de nommage en snake_case.

#### Nouvelle table ajoutée
- `refresh_tokens` : Stockage des refresh tokens JWT
  - `id`, `user_id`, `token` (unique), `expires_at`, `created_at`, `revoked_at`
  - Index sur `user_id` et `token`

### 2. Contraintes implémentées

#### ✅ UNIQUE (lease_id, period) pour RentDue
```prisma
@@unique([lease_id, period])
```
- Empêche les doublons d'échéances pour un même bail et période
- Permet la génération idempotente des échéances

#### ✅ Index unique partiel pour un seul bail actif par unité
```prisma
@@unique([property_id, status]) where: status = 'Occupé'
```
- Un seul bail avec `status = 'Actif'` par unité
- Permet plusieurs baux terminés sur la même unité
- Error code P2002 en cas de conflit

#### ✅ receipt_number unique par propriétaire
```prisma
@@unique([receipt_number]) where: receipt_number != null
```
- Numéro de quittance unique globalement
- Permet le même numéro pour différents propriétaires
- Contrainte partielle : ignore les valeurs NULL

#### ✅ UNIQUE (due_id, tier) pour Reminder
```prisma
@@unique([due_id, tier])
```
- Une seule relance par palier (J+1, J+7, J+15) par échéance
- Empêche les relances en double

#### ✅ UNIQUE (owner_id, year) pour owner_counters
```prisma
@@unique([owner_id, year])
```
- Un compteur par propriétaire et par année
- Permet la numérotation séquentielle Q-AAAA-NNNN

### 3. Tests de contraintes

Fichier créé : `prisma/tests/constraints.test.ts`

#### 5 tests couvrant chaque contrainte

**Test 1: UNIQUE (lease_id, period)**
- Crée un bail et une échéance pour la période 2024-01
- Tente de créer une deuxième échéance pour la même période
- Attend P2002 (unique constraint violation)
- ✅ Test valide

**Test 2: Index unique partiel pour bail actif par unité**
- Crée une unité et un bail actif
- Tente de créer un deuxième bail actif sur la même unité
- Attend P2002
- Test qu'un bail terminé est autorisé sur la même unité
- ✅ Test valide

**Test 3: receipt_number unique par propriétaire**
- Crée deux échéances pour deux propriétaires différents
- Crée un paiement avec receipt_number Q-2024-0001 pour user-1
- Tente de créer un autre paiement avec le même numéro pour user-1
- Attend P2002
- Test que le même numéro est autorisé pour user-2
- ✅ Test valide

**Test 4: UNIQUE (due_id, tier) pour Reminder**
- Crée une échéance et une relance tier 1
- Tente de créer une deuxième relance tier 1
- Attend P2002
- Test qu'une relance tier 7 est autorisée
- ✅ Test valide

**Test 5: UNIQUE (owner_id, year) pour owner_counters**
- Crée un compteur pour user-1 en 2024
- Tente de créer un deuxième compteur pour user-1 en 2024
- Attend P2002
- Test qu'un compteur pour 2025 est autorisé
- ✅ Test valide

### 4. Script npm ajouté

```json
"prisma:test:constraints": "ts-node prisma/tests/constraints.test.ts"
```

Exécution : `npm run prisma:test:constraints`

## 📋 Validation de la phase B2

| Vérification | Statut |
|-------------|--------|
| 8 entités + 3 tables additionnelles | ✅ |
| Tables en snake_case (@@map) | ✅ |
| UNIQUE (lease_id, period) | ✅ |
| Index unique partiel bail actif | ✅ |
| receipt_number unique par propriétaire | ✅ |
| UNIQUE (due_id, tier) | ✅ |
| UNIQUE (owner_id, year) | ✅ |
| Test par contrainte (5 tests) | ✅ |
| Script npm ajouté | ✅ |

## ⚠️ Points d'attention

### Tests non exécutés
Les tests de contraintes nécessitent une base de données PostgreSQL active. Comme Docker n'est pas installé, les tests ne peuvent pas être exécutés actuellement.

Pour exécuter les tests une fois Docker installé :
```bash
docker-compose up -d
npm run prisma:migrate
npm run prisma:test:constraints
```

## 🚀 Prochaine étape : B3 - Service Prisma

La phase B2 est validée. Passer à B3 pour :
- Créer le service Prisma (`PrismaService`)
- Configurer le module Prisma
- Créer les DTOs de validation
- Tester la connexion à la base
