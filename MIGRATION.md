# Guide de Migration - Base44 vers Backend NestJS

## État actuel

- ✅ Adaptateur HTTP temporaire créé (`src/api/backendAdapter.ts`)
- ✅ Frontend configuré pour utiliser l'adaptateur (via `base44Client.ts`)
- ✅ Backend NestJS avec tous les modules
- ✅ Tests Playwright pour le scénario de démonstration
- ✅ Docker Compose configuré
- ✅ README mis à jour avec l'historique du projet

## Étapes finales de migration

### 1. Démarrer le backend avec Docker Compose

**Prérequis**: Docker Desktop doit être installé et en cours d'exécution.

```bash
cd backend
docker-compose up -d
```

Cela va démarrer:
- PostgreSQL sur le port 5432
- MinIO (stockage fichiers) sur le port 9000
- Backend NestJS sur le port 3000

### 2. Tester le backend

```bash
# Le backend devrait être accessible sur http://localhost:3000
curl http://localhost:3000/health
```

### 3. Démarrer le frontend

```bash
npm run dev
```

Le frontend sera accessible sur `http://localhost:5173` et utilisera l'adaptateur pour communiquer avec le backend.

### 4. Créer un utilisateur de test

Via l'interface d'inscription ou directement via l'API:

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","full_name":"Test User"}'
```

### 5. Lancer les tests E2E

```bash
npm run test:e2e
```

Cela exécutera le scénario de démonstration complet:
- Connexion
- Création d'un bien
- Création d'un locataire
- Création d'une unité
- Création d'un bail
- Enregistrement d'un paiement
- Consultation de la quittance
- Création d'une dépense
- Consultation des bilans

### 6. Retirer l'ancien SDK Base44

Une fois le parcours validé:

```bash
# Supprimer les dépendances Base44
npm uninstall @base44/sdk @base44/vite-plugin

# Supprimer le dossier base44/
rm -rf base44/

# Supprimer les fichiers de configuration Base44
rm base44/config.jsonc
rm .env.local
```

### 7. Nettoyer le code

Supprimer ou commenter les références Base44 dans:
- `src/lib/app-params.ts` (si utilisé)
- `vite.config.js` (plugin Base44)
- Variables d'environnement liées à Base44

### 8. Finaliser l'adaptateur

Une fois la migration validée, l'adaptateur peut être simplifié ou remplacé par des appels API directs dans chaque composant si nécessaire.

## Structure finale

```
Immobill_typescript/
├── backend/              # Backend NestJS (indépendant)
│   ├── src/
│   ├── prisma/
│   ├── docker-compose.yml
│   └── Dockerfile
├── src/                  # Frontend React
│   ├── api/
│   │   ├── backendAdapter.ts  # Adaptateur temporaire
│   │   └── reportsClient.ts
│   ├── components/
│   ├── pages/
│   └── types/
├── e2e/                  # Tests E2E
└── README.md             # Documentation mise à jour
```

## Critères de réussite

- ✅ Le front fonctionne en pointant sur le backend NestJS
- ✅ Les 9 règles métier sont couvertes par des tests
- ✅ L'isolation des données est garantie par OwnerGuard
- ✅ `docker compose up` suffit pour lancer le backend en local
- ✅ README documente l'historique du projet

## Résolution de problèmes

### Backend ne démarre pas

1. Vérifier que Docker Desktop est en cours d'exécution
2. Vérifier que les ports 5432, 9000, 3000 sont disponibles
3. Consulter les logs: `docker-compose logs backend`

### Erreur de connexion frontend-backend

1. Vérifier que `VITE_API_BASE_URL` est correctement défini dans `.env`
2. Vérifier que le backend répond sur `http://localhost:3000`
3. Vérifier que le token JWT est correctement stocké dans localStorage

### Tests E2E échouent

1. Assurez-vous que le backend et le frontend sont démarrés
2. Créez un utilisateur de test avant de lancer les tests
3. Consultez le rapport HTML Playwright pour les détails
