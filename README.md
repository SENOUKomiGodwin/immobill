# Immobill - Gestion Locative

Application de gestion locative pour les propriétaires indépendants. Permet de gérer les biens, locataires, baux, loyers, dépenses et générer des quittances et bilans.

## 🚀 Démarrage rapide

### Prérequis

- Node.js 18+
- Docker et Docker Compose
- PostgreSQL (géré par Docker Compose)

### Installation

```bash
# Installer les dépendances
npm install

# Installer les dépendances backend
cd backend
npm install
cd ..

# Lancer le backend avec Docker Compose
cd backend
docker-compose up -d
cd ..

# Lancer le frontend en développement
npm run dev
```

L'application sera accessible sur `http://localhost:5173`.

### Structure du projet

```
Immobill_typescript/
├── backend/          # Backend NestJS
│   ├── src/
│   │   ├── modules/   # Modules métier (expenses, payments, leases, etc.)
│   │   ├── auth/      # Authentification JWT
│   │   └── common/    # Services communs (Prisma, guards)
│   ├── prisma/        # Schéma de base de données
│   └── docker-compose.yml
├── src/              # Frontend React + Vite
│   ├── api/          # Clients API
│   ├── components/   # Composants UI
│   ├── pages/        # Pages de l'application
│   ├── hooks/        # Hooks React personnalisés
│   ├── lib/          # Utilitaires et helpers
│   └── types/        # Types TypeScript
└── e2e/              # Tests E2E Playwright
```

## 📊 Fonctionnalités

- **Gestion des biens**: Création et gestion des propriétés
- **Gestion des locataires**: Base de données locataires avec informations de contact
- **Gestion des unités**: Unités locatives (appartements, studios, etc.)
- **Gestion des baux**: Contrats de location avec dates, montants et conditions
- **Échéancier**: Génération automatique des échéances de loyer
- **Paiements**: Encaissement des loyers avec quittances
- **Dépenses**: Suivi des charges et travaux avec possibilité de refacturation
- **Relances**: Système de relances des impayés par palier (J+1, J+7, J+15)
- **Bilans**: Rapports mensuels et annuels avec filtrage par bien
- **Dashboard**: Vue d'ensemble avec KPIs et graphiques

## 🧪 Tests

### Tests unitaires

```bash
# Tests frontend
npm test

# Tests backend
cd backend
npm test
```

### Tests E2E (Playwright)

```bash
# Lancer les tests E2E
npm run test:e2e

# Lancer les tests E2E avec UI
npm run test:e2e:ui
```

## 🔐 Règles métier

1. **Isolation des données**: Chaque utilisateur ne peut accéder qu'à ses propres données
2. **Calculs de loyer**: Les montants sont calculés côté serveur avec validation
3. **Quittances**: Disponibles uniquement pour les échéances entièrement soldées
4. **Annulation motivée**: Toute suppression nécessite un motif enregistré
5. **Relances par palier**: Relances automatiques à J+1, J+7, J+15 jours de retard
6. **Refacturation**: Possibilité de refacturer certaines dépenses aux locataires
7. **Concurrency**: Les paiements utilisent des transactions pour éviter les doublons
8. **Audit**: Journal d'audit pour les actions sensibles (annulations)
9. **Consistance**: Calculs SQL côté serveur pour garantir la précision

## 📝 Historique du projet

### Prototype initial (Base44)

Le projet a commencé comme une application Base44, utilisant:
- Frontend: React + Vite
- Backend: Base44 (no-code/low-code)
- Base de données: Gérée par Base44
- SDK: @base44/sdk pour l'accès aux données

Le prototype fournissait une interface de gestion locative complète mais dépendait entièrement de la plateforme Base44.

### Migration TypeScript

Pour améliorer la maintenabilité et la robustesse, le projet a été migré vers TypeScript:
- Ajout de types stricts pour toutes les entités
- Typage des composants React
- Validation des données avec Zod
- Meilleure expérience de développement avec autocomplétion

### Nouveau backend NestJS

Pour atteindre une autonomie complète et répondre aux exigences de production:
- **Backend NestJS**: API REST complète avec TypeScript
- **Base de données PostgreSQL**: Base de données relationnelle robuste
- **ORM Prisma**: Gestion de schéma et migrations
- **Authentification JWT**: Sécurité basée sur tokens
- **Guard OwnerFilter**: Isolation stricte des données entre utilisateurs
- **Docker Compose**: Déploiement local simplifié (`docker-compose up`)

### Adaptateur temporaire

Pour faciliter la transition du frontend Base44 vers le nouveau backend:
- Création d'un adaptateur HTTP (`backendAdapter.ts`)
- Interface compatible avec le SDK Base44
- Remplacement progressif des appels Base44
- Maintien de la compatibilité pendant la migration

## 🔧 Configuration

### Variables d'environnement

Créer un fichier `.env` à la racine du projet:

```env
# Frontend
VITE_API_BASE_URL=http://localhost:3000

# Backend (dans backend/.env)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/immobill
JWT_SECRET=your-secret-key-here
JWT_EXPIRATION=7d
```

### Base de données

La base de données est gérée par Prisma. Pour appliquer les migrations:

```bash
cd backend
npx prisma migrate dev
npx prisma generate
```

Pour visualiser et éditer les données:

```bash
npx prisma studio
```

## 🚢 Déploiement

### Docker Compose (Production)

```bash
cd backend
docker-compose -f docker-compose.prod.yml up -d
```

### Docker Compose (Développement)

```bash
cd backend
docker-compose up -d
```

### Build production

```bash
# Frontend
npm run build

# Backend
cd backend
npm run build
npm run start:prod
```

## 📚 Documentation technique

- [API Documentation](./backend/API.md) - Documentation des endpoints REST
- [Database Schema](./backend/prisma/schema.prisma) - Schéma de base de données
- [Entity Types](./src/types/entities.ts) - Types TypeScript des entités

## 🤝 Contribution

Ce projet utilise une approche de gestion d'état basée sur les requêtes serveur. Toute modification des règles métier doit être accompagnée de tests unitaires.

## 📄 Licence

UNLICENSED
