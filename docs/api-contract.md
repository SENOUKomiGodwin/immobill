# Contrat d'API Immobill - Backend REST

Ce document définit le contrat d'API pour le backend REST qui remplacera le service Base44. Toutes les routes doivent respecter ce contrat pour que le front fonctionne sans modification.

## Conventions générales

- **Base URL**: `http://localhost:3000/api` (configurable via `API_BASE_URL`)
- **Format de réponse JSON**: Toutes les réponses sont en JSON
- **Format d'erreur**: `{ code: string, message: string, details?: any }` (messages en français)
- **Authentification**: JWT access token (15 min) via header `Authorization: Bearer <token>` + refresh token en cookie httpOnly
- **Pagination**: Les requêtes de liste supportent `?page=1&limit=50` (défaut: page=1, limit=50)
- **Tri**: `?sort=created_date` ou `?sort=-created_date` pour décroissant
- **Filtrage par propriétaire**: Toutes les requêtes sont automatiquement filtrées par `created_by_id` sauf pour le rôle admin
- **Champs standards**: Chaque enregistrement a `id`, `created_date`, `updated_date`, `created_by_id`
- **Montants**: Entiers (FCFA sans décimales)
- **Dates**: Format ISO 8601 (`YYYY-MM-DD` pour les dates, `YYYY-MM-DDTHH:mm:ss.sssZ` pour les timestamps)

---

## Authentification

### POST /auth/register
Inscription d'un nouvel utilisateur.

**Request Body:**
```json
{
  "email": "string (required, email)",
  "password": "string (required, min 8 chars)",
  "full_name": "string (optional)"
}
```

**Response 201:**
```json
{
  "id": "string",
  "email": "string",
  "full_name": "string",
  "role": "user"
}
```

**Response 400:** `{ code: "INVALID_EMAIL", message: "Email invalide" }`
**Response 409:** `{ code: "EMAIL_EXISTS", message: "Cet email est déjà utilisé" }`

---

### POST /auth/login
Connexion d'un utilisateur.

**Request Body:**
```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

**Response 200:**
```json
{
  "access_token": "string",
  "user": {
    "id": "string",
    "email": "string",
    "full_name": "string",
    "role": "admin|user"
  }
}
```

**Set-Cookie:** `refresh_token=<token>; HttpOnly; Secure; SameSite=Strict; Path=/api/auth/refresh`

**Response 401:** `{ code: "INVALID_CREDENTIALS", message: "Email ou mot de passe incorrect" }`
**Response 429:** `{ code: "TOO_MANY_ATTEMPTS", message: "Trop de tentatives, réessayez dans X minutes" }`

---

### POST /auth/logout
Déconnexion.

**Headers:** `Authorization: Bearer <token>`

**Response 204:** No content

**Set-Cookie:** `refresh_token=; HttpOnly; Secure; SameSite=Strict; Path=/api/auth/refresh; Max-Age=0`

---

### POST /auth/refresh
Rafraîchissement du token d'accès via cookie httpOnly.

**Cookies:** `refresh_token=<token>`

**Response 200:**
```json
{
  "access_token": "string",
  "user": {
    "id": "string",
    "email": "string",
    "full_name": "string",
    "role": "admin|user"
  }
}
```

**Response 401:** `{ code: "INVALID_REFRESH_TOKEN", message: "Token de rafraîchissement invalide" }`

---

### GET /auth/me
Récupération de l'utilisateur authentifié.

**Headers:** `Authorization: Bearer <token>`

**Response 200:**
```json
{
  "id": "string",
  "email": "string",
  "full_name": "string",
  "role": "admin|user"
}
```

**Response 401:** `{ code: "UNAUTHORIZED", message: "Non authentifié" }`

---

### POST /auth/forgot-password
Demande de réinitialisation de mot de passe.

**Request Body:**
```json
{
  "email": "string (required)"
}
```

**Response 200:** `{ message: "Si un compte existe avec cet email, un lien de réinitialisation sera envoyé" }`

Note: Toujours retourner 200 pour éviter l'énumération d'emails.

---

### POST /auth/reset-password
Réinitialisation du mot de passe avec token.

**Request Body:**
```json
{
  "token": "string (required)",
  "new_password": "string (required, min 8 chars)"
}
```

**Response 200:** `{ message: "Mot de passe réinitialisé avec succès" }`

**Response 400:** `{ code: "INVALID_TOKEN", message: "Token invalide ou expiré" }`

---

## Entités CRUD

### Property (Biens)

#### GET /properties
Liste des biens du propriétaire.

**Query Params:** `?page=1&limit=50&sort=name`

**Response 200:**
```json
{
  "items": [
    {
      "id": "string",
      "name": "string",
      "type": "Immeuble|Maison|Résidence|Boutique|Terrain",
      "address": "string",
      "city": "string",
      "notes": "string",
      "created_date": "string",
      "updated_date": "string",
      "created_by_id": "string"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 50
}
```

---

#### GET /properties/:id
Détail d'un bien.

**Response 200:** (même format qu'un item de la liste)

**Response 404:** `{ code: "NOT_FOUND", message: "Bien introuvable" }`

---

#### POST /properties
Création d'un bien.

**Request Body:**
```json
{
  "name": "string (required)",
  "type": "Immeuble|Maison|Résidence|Boutique|Terrain (default: Immeuble)",
  "address": "string",
  "city": "string",
  "notes": "string"
}
```

**Response 201:** (bien créé avec id, created_date, etc.)

**Response 400:** `{ code: "VALIDATION_ERROR", message: "...", details: {...} }`

---

#### PUT /properties/:id
Modification d'un bien.

**Request Body:** (même que POST, tous les champs optionnels)

**Response 200:** (bien modifié)

**Response 404:** `{ code: "NOT_FOUND", message: "Bien introuvable" }`

---

#### DELETE /properties/:id
Suppression d'un bien.

**Response 204:** No content

**Response 404:** `{ code: "NOT_FOUND", message: "Bien introuvable" }`
**Response 409:** `{ code: "HAS_UNITS", message: "Ce bien contient des unités et ne peut pas être supprimé" }`

---

### Unit (Unités)

#### GET /units
Liste des unités.

**Query Params:** `?property_id=<id>&page=1&limit=50&sort=label`

**Response 200:**
```json
{
  "items": [
    {
      "id": "string",
      "property_id": "string",
      "label": "string",
      "type": "Appartement|Studio|Chambre|Boutique|Autre",
      "surface": "number",
      "rent_amount": "number",
      "charges_amount": "number",
      "status": "Libre|Occupé",
      "created_date": "string",
      "updated_date": "string",
      "created_by_id": "string"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 50
}
```

---

#### POST /units
Création d'une unité.

**Request Body:**
```json
{
  "property_id": "string (required)",
  "label": "string (required)",
  "type": "Appartement|Studio|Chambre|Boutique|Autre (default: Appartement)",
  "surface": "number",
  "rent_amount": "number",
  "charges_amount": "number",
  "status": "Libre|Occupé (default: Libre)"
}
```

**Response 201:** (unité créée)

---

#### POST /units/bulk
Création en masse d'unités (pour la fonctionnalité "créer N unités").

**Request Body:**
```json
{
  "units": [
    {
      "property_id": "string (required)",
      "label": "string (required)",
      "type": "Appartement|Studio|Chambre|Boutique|Autre",
      "surface": "number",
      "rent_amount": "number",
      "charges_amount": "number",
      "status": "Libre|Occupé"
    }
  ]
}
```

**Response 201:**
```json
{
  "items": [ /* unités créées */ ],
  "count": 5
}
```

---

#### PUT /units/:id
Modification d'une unité.

**Request Body:** (même que POST, tous les champs optionnels)

**Response 200:** (unité modifiée)

---

#### DELETE /units/:id
Suppression d'une unité.

**Response 204:** No content

**Response 409:** `{ code: "HAS_ACTIVE_LEASE", message: "Cette unité a un bail actif et ne peut pas être supprimée" }`

---

### Tenant (Locataires)

#### GET /tenants
Liste des locataires.

**Query Params:** `?page=1&limit=50&sort=full_name`

**Response 200:**
```json
{
  "items": [
    {
      "id": "string",
      "full_name": "string",
      "phone": "string",
      "email": "string",
      "id_number": "string",
      "city": "string",
      "rent_amount": "number",
      "advance_amount": "number",
      "advance_months": "number",
      "notes": "string",
      "created_date": "string",
      "updated_date": "string",
      "created_by_id": "string"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 50
}
```

---

#### POST /tenants
Création d'un locataire.

**Request Body:**
```json
{
  "full_name": "string (required)",
  "phone": "string",
  "email": "string",
  "id_number": "string",
  "city": "string",
  "rent_amount": "number",
  "advance_amount": "number",
  "advance_months": "number",
  "notes": "string"
}
```

**Response 201:** (locataire créé)

---

#### PUT /tenants/:id
Modification d'un locataire.

**Response 200:** (locataire modifié)

---

#### DELETE /tenants/:id
Suppression d'un locataire.

**Response 204:** No content

**Response 409:** `{ code: "HAS_ACTIVE_LEASE", message: "Ce locataire a un bail actif et ne peut pas être supprimé" }`

---

### Lease (Baux)

#### GET /leases
Liste des baux.

**Query Params:** `?status=Actif&property_id=<id>&page=1&limit=50&sort=-created_date`

**Response 200:**
```json
{
  "items": [
    {
      "id": "string",
      "unit_id": "string",
      "unit_label": "string",
      "property_id": "string",
      "property_name": "string",
      "tenant_id": "string",
      "tenant_name": "string",
      "tenant_phone": "string",
      "start_date": "string (YYYY-MM-DD)",
      "end_date": "string (YYYY-MM-DD)",
      "rent_amount": "number",
      "charges_amount": "number",
      "deposit_amount": "number",
      "due_day": "number (1-28)",
      "grace_days": "number",
      "penalty_enabled": "boolean",
      "status": "Actif|Terminé",
      "notes": "string",
      "created_date": "string",
      "updated_date": "string",
      "created_by_id": "string"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 50
}
```

---

#### POST /leases
Création d'un bail.

**Règle métier:** Génère automatiquement les échéances (RentDue) pour la durée du bail (12 mois ou jusqu'à end_date). Change le statut de l'unité à "Occupé". Garantit un seul bail actif par unité (erreur 409 si conflit).

**Request Body:**
```json
{
  "unit_id": "string (required)",
  "tenant_id": "string (required)",
  "start_date": "string (YYYY-MM-DD, required)",
  "end_date": "string (YYYY-MM-DD, optional)",
  "rent_amount": "number",
  "charges_amount": "number",
  "deposit_amount": "number",
  "due_day": "number (1-28, default: 5)",
  "grace_days": "number (default: 0)",
  "penalty_enabled": "boolean (default: false)",
  "notes": "string"
}
```

**Response 201:**
```json
{
  "lease": { /* bail créé */ },
  "rent_dues": [ /* échéances générées */ ]
}
```

**Response 409:** `{ code: "UNIT_ALREADY_LEASED", message: "Cette unité a déjà un bail actif" }`

---

#### PUT /leases/:id
Modification d'un bail (seuls certains champs modifiables, pas unit_id/tenant_id).

**Request Body:**
```json
{
  "end_date": "string",
  "rent_amount": "number",
  "charges_amount": "number",
  "deposit_amount": "number",
  "due_day": "number",
  "grace_days": "number",
  "penalty_enabled": "boolean",
  "notes": "string"
}
```

**Response 200:** (bail modifié)

---

#### PUT /leases/:id/terminate
Clôture d'un bail (fin de bail).

**Règle métier:** Le bail passe à "Terminé", l'unité repasse à "Libre", les échéances futures non payées sont annulées (statut "Annulé").

**Request Body:**
```json
{
  "reason": "string (required)"
}
```

**Response 200:**
```json
{
  "lease": { /* bail terminé */ },
  "unit": { /* unité passée à Libre */ },
  "cancelled_dues": 5
}
```

---

#### DELETE /leases/:id
Suppression d'un bail (seulement si sans paiements).

**Response 204:** No content

**Response 409:** `{ code: "HAS_PAYMENTS", message: "Ce bail a des paiements et ne peut pas être supprimé" }`

---

### RentDue (Échéances)

#### GET /rent-dues
Liste des échéances.

**Query Params:** `?lease_id=<id>&period=2024-01&page=1&limit=50&sort=due_date`

**Response 200:**
```json
{
  "items": [
    {
      "id": "string",
      "lease_id": "string",
      "tenant_id": "string",
      "tenant_name": "string",
      "tenant_phone": "string",
      "unit_id": "string",
      "unit_label": "string",
      "property_id": "string",
      "property_name": "string",
      "period": "string (YYYY-MM)",
      "due_date": "string (YYYY-MM-DD)",
      "amount_due": "number",
      "amount_paid": "number",
      "status": "Attente|Partiel|Payé|Retard|Annulé",
      "computed_status": "paid|partial|late|pending",
      "days_late": "number",
      "created_date": "string",
      "updated_date": "string",
      "created_by_id": "string"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 50
}
```

Note: `status` est le champ stocké (maintenu pour compatibilité), `computed_status` est calculé par le serveur avec le délai de grâce.

---

#### POST /rent-dues/bulk
Création en masse d'échéances (utilisé à la création du bail).

**Request Body:**
```json
{
  "rent_dues": [
    {
      "lease_id": "string (required)",
      "period": "string (YYYY-MM, required)",
      "due_date": "string (YYYY-MM-DD, required)",
      "amount_due": "number (required)",
      "tenant_id": "string",
      "tenant_name": "string",
      "tenant_phone": "string",
      "unit_id": "string",
      "unit_label": "string",
      "property_id": "string",
      "property_name": "string"
    }
  ]
}
```

**Response 201:**
```json
{
  "items": [ /* échéances créées */ ],
  "count": 12
}
```

**Response 409:** `{ code: "DUPLICATE_PERIOD", message: "Une échéance existe déjà pour cette période" }` (UNIQUE constraint sur lease_id + period)

---

#### PUT /rent-dues/:id
Modification d'une échéance (limité, principalement pour les corrections).

**Request Body:**
```json
{
  "amount_due": "number"
}
```

**Response 200:** (échéance modifiée)

Note: `amount_paid` est recalculé automatiquement à chaque paiement, ne pas le modifier manuellement.

---

#### DELETE /rent-dues/:id
Suppression d'une échéance (seulement si sans paiements).

**Response 204:** No content

**Response 409:** `{ code: "HAS_PAYMENTS", message: "Cette échéance a des paiements et ne peut pas être supprimée" }`

---

### Payment (Paiements)

#### GET /payments
Liste des paiements.

**Query Params:** `?lease_id=<id>&due_id=<id>&page=1&limit=50&sort=-payment_date`

**Response 200:**
```json
{
  "items": [
    {
      "id": "string",
      "due_id": "string",
      "lease_id": "string",
      "tenant_id": "string",
      "tenant_name": "string",
      "unit_label": "string",
      "property_name": "string",
      "period": "string (YYYY-MM)",
      "amount": "number",
      "payment_date": "string (YYYY-MM-DD)",
      "method": "Espèces|Mobile money|Virement|Chèque",
      "reference": "string",
      "receipt_number": "string",
      "note": "string",
      "cancelled": "boolean",
      "cancellation_reason": "string",
      "created_date": "string",
      "updated_date": "string",
      "created_by_id": "string"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 50
}
```

---

#### POST /payments
Création d'un paiement.

**Règle métier:** Transactionnel : création du paiement ET recalcul de amount_paid de l'échéance dans une seule transaction. Vérifie que le paiement ne dépasse pas le solde restant de l'échéance (erreur 422). Génère automatiquement le numéro de quittance (Q-AAAA-NNNN).

**Request Body:**
```json
{
  "due_id": "string (required)",
  "amount": "number (required, > 0)",
  "payment_date": "string (YYYY-MM-DD, required)",
  "method": "Espèces|Mobile money|Virement|Chèque (default: Espèces)",
  "reference": "string",
  "note": "string"
}
```

**Response 201:**
```json
{
  "payment": { /* paiement créé avec receipt_number */ },
  "rent_due": { /* échéance mise à jour avec amount_paid recalculé */ }
}
```

**Response 422:** `{ code: "PAYMENT_EXCEEDS_BALANCE", message: "Le montant du paiement dépasse le solde restant de l'échéance", details: { remaining: 50000 } }`

---

#### PUT /payments/:id/cancel
Annulation d'un paiement (remplacement de DELETE).

**Règle métier:** Inverse l'effet sur l'échéance (recalcule amount_paid), exige un motif, écrit une ligne dans audit_log.

**Request Body:**
```json
{
  "reason": "string (required)"
}
```

**Response 200:**
```json
{
  "payment": { /* paiement annulé avec cancelled=true */ },
  "rent_due": { /* échéance mise à jour */ }
}
```

---

### Expense (Dépenses)

#### GET /expenses
Liste des dépenses.

**Query Params:** `?property_id=<id>&paid=true&page=1&limit=50&sort=-expense_date`

**Response 200:**
```json
{
  "items": [
    {
      "id": "string",
      "property_id": "string",
      "property_name": "string",
      "label": "string",
      "category": "Plomberie|Peinture|Électricité|Taxes|Assurance|Gardiennage|Réparation|Autre",
      "vendor": "string",
      "amount": "number",
      "expense_date": "string (YYYY-MM-DD)",
      "paid": "boolean",
      "refacture": "boolean",
      "recovered_amount": "number",
      "receipt_uri": "string",
      "note": "string",
      "cancelled": "boolean",
      "cancellation_reason": "string",
      "created_date": "string",
      "updated_date": "string",
      "created_by_id": "string"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 50
}
```

---

#### POST /expenses
Création d'une dépense.

**Request Body:**
```json
{
  "label": "string (required)",
  "category": "Plomberie|Peinture|Électricité|Taxes|Assurance|Gardiennage|Réparation|Autre (default: Autre)",
  "property_id": "string",
  "vendor": "string",
  "amount": "number (required, > 0)",
  "expense_date": "string (YYYY-MM-DD, required)",
  "paid": "boolean (default: true)",
  "refacture": "boolean (default: false)",
  "recovered_amount": "number",
  "note": "string",
  "receipt_uri": "string"
}
```

**Response 201:** (dépense créée)

---

#### PUT /expenses/:id
Modification d'une dépense.

**Request Body:** (même que POST, tous les champs optionnels)

**Response 200:** (dépense modifiée)

---

#### PUT /expenses/:id/cancel
Annulation d'une dépense (remplacement de DELETE).

**Règle métier:** Exige un motif, écrit une ligne dans audit_log.

**Request Body:**
```json
{
  "reason": "string (required)"
}
```

**Response 200:**
```json
{
  "expense": { /* dépense annulée avec cancelled=true */ }
}
```

---

## Dashboard et Bilans

### GET /dashboard
Données du tableau de bord (calculées en SQL, sans limite de 500 enregistrements).

**Response 200:**
```json
{
  "stats": [
    {
      "label": "Loyers encaissés",
      "value": 1500000,
      "delta": 12.5,
      "previous": 1333333,
      "tone": "money",
      "hint": "Aucun encaissement le mois dernier"
    },
    {
      "label": "Impayés",
      "value": 250000,
      "delta": null,
      "tone": "money",
      "hint": "2 échéance(s) en retard"
    },
    {
      "label": "Unités occupées",
      "value": 8,
      "delta": null,
      "tone": "count",
      "suffix": "/ 10",
      "hint": "2 unité(s) libre(s)"
    },
    {
      "label": "Locataires actifs",
      "value": 8,
      "delta": null,
      "tone": "count",
      "hint": "8 bail(aux) enregistré(s)"
    }
  ],
  "revenue": {
    "total": 9000000,
    "delta": 5.2,
    "previous": 8550000,
    "caption": "Encaissements des 6 derniers mois",
    "points": [
      { "label": "mai", "value": 1500000 },
      { "label": "juin", "value": 1600000 },
      { "label": "juil", "value": 1400000 },
      { "label": "août", "value": 1550000 },
      { "label": "sept.", "value": 1700000 },
      { "label": "oct.", "value": 1250000 }
    ]
  },
  "occupancy": [
    { "label": "Appartement", "value": 6, "color": "#0A24E9" },
    { "label": "Studio", "value": 2, "color": "#5C9764" },
    { "label": "Boutique", "value": 2, "color": "#F0913A" }
  ],
  "weekly": [
    { "day": "Lun", "value": 0 },
    { "day": "Mar", "value": 150000 },
    { "day": "Mer", "value": 0 },
    { "day": "Jeu", "value": 200000 },
    { "day": "Ven", "value": 0 },
    { "day": "Sam", "value": 0 },
    { "day": "Dim", "value": 0 }
  ],
  "collection": {
    "rate": 85,
    "target": 80
  },
  "overdue": [
    {
      "id": "string",
      "tenant": "Kossi Adjovi",
      "unit": "Appt 3 · Résidence Agoè",
      "days": 15,
      "amount": 150000
    }
  ],
  "payments": [
    {
      "id": "string",
      "tenant": "Kossi Adjovi",
      "unit": "Appt 3",
      "amount": 150000,
      "method": "Mobile money",
      "date": "2024-10-28",
      "status": "Payé"
    }
  ]
}
```

---

### GET /bilans
Bilans financiers (calculés en SQL, sans limite de 500 enregistrements).

**Query Params:** `?period=2024-10`

**Response 200:**
```json
{
  "period": "2024-10",
  "revenue": 1500000,
  "spent": 350000,
  "net": 1150000,
  "expected": 1600000,
  "collected": 1500000,
  "rate": 94,
  "active_leases": 8,
  "series": [
    {
      "label": "mai",
      "revenus": 1500000,
      "depenses": 300000
    },
    {
      "label": "juin",
      "revenus": 1600000,
      "depenses": 400000
    },
    /* ... 6 derniers mois */
  ],
  "by_property": [
    {
      "name": "Résidence Agoè",
      "expected": 1000000,
      "collected": 950000,
      "expenses": 200000,
      "net": 750000
    }
  ]
}
```

---

## Relances

### GET /reminders
Liste des impayés avec messages de relance prêts à envoyer.

**Query Params:** `?tier=1` (palier de relance: 1=J+1, 7=J+7, 15=J+15)

**Response 200:**
```json
{
  "items": [
    {
      "due_id": "string",
      "tenant_name": "string",
      "tenant_phone": "string",
      "unit_label": "string",
      "property_name": "string",
      "period": "string (YYYY-MM)",
      "days_late": "number",
      "amount_due": "number",
      "amount_paid": "number",
      "remaining": "number",
      "message": "string (message de relance prêt à copier)"
    }
  ],
  "total": 5
}
```

---

### POST /reminders
Enregistrement d'une relance envoyée.

**Règle métier:** Une seule relance par échéance et par palier (J+1, J+7, J+15).

**Request Body:**
```json
{
  "due_id": "string (required)",
  "tier": "number (required, 1|7|15)",
  "method": "string (WhatsApp|SMS|Email)",
  "message": "string"
}
```

**Response 201:**
```json
{
  "id": "string",
  "due_id": "string",
  "tier": "number",
  "method": "string",
  "sent_at": "string",
  "created_by_id": "string"
}
```

**Response 409:** `{ code: "ALREADY_REMINDED", message: "Une relance a déjà été envoyée pour ce palier" }`

---

### GET /reminders/history
Historique des relances pour une échéance.

**Query Params:** `?due_id=<id>`

**Response 200:**
```json
{
  "items": [
    {
      "id": "string",
      "due_id": "string",
      "tier": "number",
      "method": "string",
      "sent_at": "string",
      "created_by_id": "string"
    }
  ]
}
```

---

## Fichiers

### POST /files
Upload d'un fichier (justificatif de dépense, pièce d'identité).

**Request:** `multipart/form-data`

**Form Data:**
- `file`: fichier (PDF, JPG, PNG, max 5 Mo)
- `category`: `expense_receipt|tenant_id` (optionnel)

**Response 201:**
```json
{
  "file_uri": "string",
  "file_name": "string",
  "file_size": "number",
  "content_type": "string"
}
```

**Response 400:** `{ code: "INVALID_FILE_TYPE", message: "Type de fichier non autorisé" }`
**Response 413:** `{ code: "FILE_TOO_LARGE", message: "Le fichier dépasse 5 Mo" }`

---

### GET /files/:id/url
Génération d'une URL signée pour accéder à un fichier.

**Query Params:** `?expires_in=300` (secondes, défaut: 300)

**Response 200:**
```json
{
  "signed_url": "string",
  "expires_at": "string (ISO timestamp)"
}
```

**Response 404:** `{ code: "FILE_NOT_FOUND", message: "Fichier introuvable" }`

---

## Audit Log

### GET /audit-log
Journal d'audit (annulations de paiements/dépenses, modifications sensibles).

**Query Params:** `?entity_type=Payment&entity_id=<id>&page=1&limit=50&sort=-created_date`

**Response 200:**
```json
{
  "items": [
    {
      "id": "string",
      "user_id": "string",
      "user_name": "string",
      "action": "string (payment_cancelled|expense_cancelled|lease_terminated)",
      "entity_type": "string",
      "entity_id": "string",
      "before": "object",
      "after": "object",
      "reason": "string",
      "created_at": "string"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 50
}
```

---

## Codes d'erreur standards

| Code HTTP | Code erreur | Message (français) |
|----------|-------------|-------------------|
| 400 | VALIDATION_ERROR | Erreur de validation |
| 400 | INVALID_EMAIL | Email invalide |
| 400 | INVALID_TOKEN | Token invalide ou expiré |
| 401 | UNAUTHORIZED | Non authentifié |
| 401 | INVALID_CREDENTIALS | Email ou mot de passe incorrect |
| 401 | INVALID_REFRESH_TOKEN | Token de rafraîchissement invalide |
| 403 | FORBIDDEN | Accès refusé |
| 404 | NOT_FOUND | Ressource introuvable |
| 409 | EMAIL_EXISTS | Cet email est déjà utilisé |
| 409 | UNIT_ALREADY_LEASED | Cette unité a déjà un bail actif |
| 409 | HAS_UNITS | Ce bien contient des unités |
| 409 | HAS_ACTIVE_LEASE | Ce locataire/unité a un bail actif |
| 409 | HAS_PAYMENTS | Cette ressource a des paiements |
| 409 | DUPLICATE_PERIOD | Une échéance existe déjà pour cette période |
| 409 | ALREADY_REMINDED | Une relance a déjà été envoyée |
| 413 | FILE_TOO_LARGE | Le fichier dépasse 5 Mo |
| 422 | PAYMENT_EXCEEDS_BALANCE | Le paiement dépasse le solde restant |
| 422 | INVALID_FILE_TYPE | Type de fichier non autorisé |
| 429 | TOO_MANY_ATTEMPTS | Trop de tentatives, réessayez dans X minutes |
| 500 | INTERNAL_ERROR | Erreur interne du serveur |

---

## OpenAPI Schema

Un squelette OpenAPI 3.0 sera généré dans `backend/openapi.yaml` pour documenter ce contrat automatiquement dans Swagger UI (`/docs`).
