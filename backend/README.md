# Immobill Backend

Backend REST pour Immobill - Gestion locative, construit avec NestJS, Prisma et PostgreSQL.

## Stack technique

- **Framework**: NestJS 10 avec TypeScript strict
- **ORM**: Prisma 5
- **Base de données**: PostgreSQL 16
- **Stockage fichiers**: MinIO (S3-compatible)
- **Authentification**: JWT + Argon2
- **Validation**: class-validator + class-transformer
- **Documentation API**: Swagger/OpenAPI
- **Tests**: Jest + Supertest
- **CI**: GitHub Actions

## Prérequis

- Node.js 20+
- Docker & Docker Compose
- npm ou pnpm

## Installation

1. Cloner le dépôt et naviguer vers le dossier backend :
```bash
cd backend
```

2. Installer les dépendances :
```bash
npm install
```

3. Copier le fichier d'environnement :
```bash
cp env.example .env
```

4. Démarrer les services Docker (PostgreSQL + MinIO) :
```bash
docker-compose up -d
```

5. Générer le client Prisma :
```bash
npm run prisma:generate
```

6. Exécuter les migrations :
```bash
npm run prisma:migrate
```

## Commandes disponibles

### Développement
```bash
npm run start:dev      # Mode watch avec rechargement automatique
npm run start:debug    # Mode debug
npm run start          # Build + start
```

### Build
```bash
npm run build          # Compilation TypeScript
```

### Tests
```bash
npm run test           # Tests unitaires
npm run test:watch     # Tests en mode watch
npm run test:cov        # Tests avec couverture
npm run test:e2e        # Tests end-to-end
```

### Linting
```bash
npm run lint           # ESLint avec auto-correction
npm run format         # Prettier
```

### Prisma
```bash
npm run prisma:generate    # Générer le client Prisma
npm run prisma:migrate     # Créer et appliquer une migration
npm run prisma:migrate:deploy  # Déployer les migrations (prod)
npm run prisma:studio      # OUI Prisma Studio
npm run prisma:seed        # Peupler la base de données
```

## Structure du projet

```
backend/
├── src/
│   ├── modules/          # Modules fonctionnels
│   │   ├── health/      # Health check
│   │   ├── auth/        # Authentification
│   │   ├── properties/  # Gestion des biens
│   │   ├── units/       # Gestion des unités
│   │   ├── tenants/     # Gestion des locataires
│   │   ├── leases/      # Gestion des baux
│   │   ├── rent-dues/   # Gestion des échéances
│   │   ├── payments/    # Gestion des paiements
│   │   ├── expenses/    # Gestion des dépenses
│   │   ├── dashboard/   # Tableau de bord
│   │   ├── reports/     # Bilans financiers
│   │   ├── reminders/   # Relances
│   │   └── files/       # Gestion des fichiers
│   ├── common/          # Code partagé (guards, decorators, filters)
│   ├── config/          # Configuration
│   ├── auth/            # Stratégies Passport
│   ├── app.module.ts    # Module racine
│   └── main.ts          # Point d'entrée
├── prisma/
│   ├── schema.prisma    # Schéma Prisma
│   └── migrations/      # Migrations
├── test/                # Tests
├── docker-compose.yml   # Services Docker
└── package.json
```

## API Documentation

Une fois l'application démarrée, accédez à la documentation Swagger :

```
http://localhost:3000/api/docs
```

## Health Check

```bash
curl http://localhost:3000/api/health
```

Réponse attendue :
```json
{
  "status": "ok",
  "timestamp": "2024-10-28T12:00:00.000Z",
  "service": "immobill-backend",
  "version": "1.0.0"
}
```

## Configuration

Variables d'environnement (voir `env.example`) :

- `DATABASE_URL`: Chaîne de connexion PostgreSQL
- `JWT_SECRET`: Clé secrète pour les tokens JWT
- `JWT_EXPIRATION`: Durée de validité du token d'accès (défaut: 15m)
- `JWT_REFRESH_EXPIRATION`: Durée de validité du refresh token (défaut: 7d)
- `MINIO_ENDPOINT`: Endpoint MinIO
- `MINIO_PORT`: Port MinIO
- `MINIO_ACCESS_KEY`: Clé d'accès MinIO
- `MINIO_SECRET_KEY`: Secret MinIO
- `MINIO_BUCKET`: Bucket MinIO
- `PORT`: Port du serveur (défaut: 3000)
- `API_PREFIX`: Préfixe des routes API (défaut: api)
- `FRONTEND_URL`: URL du frontend pour CORS

## Règles métier

Le backend implémente les règles métier suivantes :

1. **Paiement transactionnel** : création du paiement et recalcul de l'échéance dans une seule transaction
2. **Numérotation des quittances** : séquentielle, unique par propriétaire et par année (Q-AAAA-NNNN)
3. **Fin de bail** : passage à Terminé, unité repasse à Libre, annulation des échéances futures
4. **Un seul bail actif par unité** : garanti par index unique partiel
5. **Échéances générées côté serveur** : idempotent avec UNIQUE (lease_id, period)
6. **Statut calculé** : computed_status et days_late calculés par le serveur
7. **Annulation avec motif** : écriture dans audit_log
8. **Dashboard et bilans en SQL** : sans limite de 500 enregistrements
9. **Relances** : une seule par échéance et par palier (J+1, J+7, J+15)

## TypeScript Strict

Le projet utilise `strict: true` avec les règles suivantes :
- `noImplicitAny`: interdit `any`
- `strictNullChecks`: vérification stricte des null
- `strictBindCallApply`: vérification stricte des bind/call/apply
- `forceConsistentCasingInFileNames`: cohérence de casse
- `noFallthroughCasesInSwitch`: pas de fallthrough dans switch

## CI/CD

GitHub Actions automatise :
- Installation des dépendances
- Génération du client Prisma
- Exécution des migrations
- Linting
- Tests
- Build
