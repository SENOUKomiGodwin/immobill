# Phase B4 - Biens, Unités, Locataires

## Objectif

Implémenter le CRUD complet pour Properties, Units et Tenants avec filtres, tri, pagination, isolation par propriétaire, et statut d'unité dérivé du bail (jamais modifiable manuellement).

## Composants créés

### 1. PrismaModule global

**Fichier**: `src/common/prisma/prisma.module.ts`

- Module global (`@Global()`) pour PrismaService
- Exporté automatiquement dans tous les modules
- Résout les dépendances circulaires

### 2. Properties Module

**Fichiers créés**:
- `src/modules/properties/properties.module.ts`
- `src/modules/properties/properties.controller.ts`
- `src/modules/properties/properties.service.ts`
- `src/modules/properties/dto/property.dto.ts`

**Routes implémentées**:
- `POST /api/properties` - Créer un bien
- `GET /api/properties` - Lister les biens (avec filtres, tri, pagination)
- `GET /api/properties/:id` - Récupérer un bien
- `PATCH /api/properties/:id` - Modifier un bien
- `DELETE /api/properties/:id` - Supprimer un bien

**DTOs**:
- `CreatePropertyDto`: name, type, address (optional), city (optional), notes (optional)
- `UpdatePropertyDto`: Tous les champs optionnels
- `QueryPropertyDto`: search, type, page, limit, sort

**Enums**:
- `PropertyType`: Immeuble, Maison, Résidence, Boutique, Terrain

**Fonctionnalités**:
- Isolation par propriétaire via `ownerFilter`
- Recherche textuelle sur name, address, city
- Filtrage par type
- Tri (défaut: -created_date)
- Pagination (défaut: page=1, limit=50)
- Protection: suppression impossible si l'unité a des unités

### 3. Units Module

**Fichiers créés**:
- `src/modules/units/units.module.ts`
- `src/modules/units/units.controller.ts`
- `src/modules/units/units.service.ts`
- `src/modules/units/dto/unit.dto.ts`

**Routes implémentées**:
- `POST /api/units` - Créer une unité
- `GET /api/units` - Lister les unités (avec filtres, tri, pagination)
- `GET /api/units/:id` - Récupérer une unité
- `PATCH /api/units/:id` - Modifier une unité
- `DELETE /api/units/:id` - Supprimer une unité

**DTOs**:
- `CreateUnitDto`: property_id, label, type, surface (optional), rent_amount (optional), charges_amount (optional)
- `UpdateUnitDto`: Tous les champs optionnels sauf status
- `QueryUnitDto`: search, type, status, property_id, page, limit, sort

**Enums**:
- `UnitType`: Appartement, Studio, Chambre, Boutique, Autre
- `UnitStatus`: Libre, Occupé

**Règle métier importante**:
- **Status NON modifiable manuellement**: Le statut Occupé vient du bail actif, jamais d'une modification directe
- `CreateUnitDto` et `UpdateUnitDto` n'incluent pas le champ `status`
- Le service a une méthode `updateStatusFromLease()` appelée par le module Leases
- Status initial: toujours 'Libre' à la création

**Fonctionnalités**:
- Isolation par propriétaire
- Recherche textuelle sur label
- Filtrage par type, status, property_id
- Tri (défaut: -created_date)
- Pagination
- Inclusion de la propriété parente dans les réponses
- Protection: suppression impossible si l'unité a un bail actif
- Méthode interne `updateStatusFromLease()` pour mise à jour depuis le bail

### 4. Tenants Module

**Fichiers créés**:
- `src/modules/tenants/tenants.module.ts`
- `src/modules/tenants/tenants.controller.ts`
- `src/modules/tenants/tenants.service.ts`
- `src/modules/tenants/dto/tenant.dto.ts`

**Routes implémentées**:
- `POST /api/tenants` - Créer un locataire
- `GET /api/tenants` - Lister les locataires (avec filtres, tri, pagination)
- `GET /api/tenants/:id` - Récupérer un locataire
- `PATCH /api/tenants/:id` - Modifier un locataire
- `DELETE /api/tenants/:id` - Supprimer un locataire

**DTOs**:
- `CreateTenantDto`: full_name, phone (optional), email (optional), id_number (optional), city (optional), rent_amount (optional), advance_amount (optional), advance_months (optional), notes (optional)
- `UpdateTenantDto`: Tous les champs optionnels
- `QueryTenantDto`: search, page, limit, sort

**Fonctionnalités**:
- Isolation par propriétaire
- Recherche textuelle sur full_name, phone, email, id_number
- Tri (défaut: -created_date)
- Pagination
- Protection: suppression impossible si le locataire a un bail actif

### 5. Typage amélioré

**Fichier**: `src/common/types/express.d.ts`

- Ajout de l'interface `RequestWithOwnerFilter` pour typage strict
- Remplacement de `(request as any).ownerFilter` par `request.ownerFilter`
- Suppression de tous les `any` dans les services

## Conformité au contrat API

### Properties
- ✅ POST /properties - Création avec validation
- ✅ GET /properties - Liste avec filtres/tri/pagination
- ✅ GET /properties/:id - Récupération isolée
- ✅ PATCH /properties/:id - Modification isolée
- ✅ DELETE /properties/:id - Suppression protégée
- ✅ Enums en français (Immeuble, Maison, etc.)

### Units
- ✅ POST /units - Création avec vérification property
- ✅ GET /units - Liste avec filtres/tri/pagination/inclusion property
- ✅ GET /units/:id - Récupération isolée avec property
- ✅ PATCH /units/:id - Modification isolée
- ✅ DELETE /units/:id - Suppression protégée
- ✅ Status NON modifiable manuellement
- ✅ Enums en français (Appartement, Studio, Libre, Occupé)

### Tenants
- ✅ POST /tenants - Création
- ✅ GET /tenants - Liste avec filtres/tri/pagination
- ✅ GET /tenants/:id - Récupération isolée
- ✅ PATCH /tenants/:id - Modification isolée
- ✅ DELETE /tenants/:id - Suppression protégée

## Validation

| Vérification | Statut |
|-------------|--------|
| TypeScript strict | ✅ |
| ESLint (no-any) | ✅ |
| Build | ✅ |
| PrismaModule global | ✅ |
| Properties CRUD | ✅ |
| Units CRUD | ✅ |
| Tenants CRUD | ✅ |
| Isolation par propriétaire | ✅ |
| Filtres/tri/pagination | ✅ |
| Status unité non modifiable | ✅ |
| Protection suppression avec dépendances | ✅ |

## Points clés

1. **Status d'unité**: Le statut Occupé est dérivé du bail actif, jamais modifiable manuellement via l'API. Une méthode interne `updateStatusFromLease()` est fournie pour le module Leases.

2. **PrismaModule global**: Marqué `@Global()` pour éviter les imports répétitifs et les dépendances circulaires.

3. **Typage strict**: Suppression de tous les `any` via l'interface `RequestWithOwnerFilter`.

4. **Protection**: Suppression impossible pour:
   - Properties avec des unités
   - Units avec un bail actif
   - Tenants avec un bail actif

5. **Inclusions**: Units incluent les données de la property parente dans les réponses GET.

## Prochaine phase (B5)

La phase B5 devrait implémenter:
- CRUD pour Leases
- Génération server-side des échéances (RentDue)
- Règle: un seul bail actif par unité (index unique partiel)
- Règle: statut d'unité mis à jour depuis le bail
- Règle: annulation des échéances futures à la fin du bail

**Phase B4 validée.**
