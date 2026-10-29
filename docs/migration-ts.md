# Migration TypeScript – état d'avancement

Migration **incrémentale** : `allowJs: true`, `checkJs: false`, `strict: true`. Seuls les fichiers `.ts` et `.tsx` sont vérifiés, donc chaque fichier converti doit être strict dès sa conversion.

## Fait (M1 à M4)
- `tsconfig.json` (alias `@/*`), script `npm run typecheck` (`tsc --noEmit`), ESLint TypeScript (`no-explicit-any` en erreur).
- `src/types/entities.ts` : types des 8 entités, dérivés de `base44/entities/*.jsonc` (champs en snake_case).
- Convertis : `api/base44Client`, `lib/{app-params,authReturnTo,db,format,query-client,rent,ui,utils}`, `lib/AuthContext.tsx`, `hooks/{use-mobile,use-size,useDashboardData}`.
- Tests de caractérisation (`npm test`, Node >= 22.6) : 18 tests sur `rent.ts` et `format.ts`, qui figent le comportement actuel.
- 15 dépendances inutilisées retirées de `package.json` (voir l'audit). Lancer `npm install` pour mettre à jour `package-lock.json`.

## Reste à faire
- M5 : composants partagés (`components/common`, `layout`, `ui` à régénérer avec `tsx: true`).
- M6 : pages et composants métier par blocs (auth, biens, locataires et baux, paiements, dépenses, dashboard et bilans).
- M7 : retirer `allowJs`, règle `no-explicit-any` sur tout le projet. M8 : vérification finale.

## Commandes
```
npm install
npm run typecheck
npm test
npm run build
```

## Notes
- `jsconfig.json` est conservé tant que des fichiers `.jsx` existent (certains outils s'en servent pour l'alias `@`). À supprimer en M7.
- Les écarts avec le cahier des charges (numérotation des quittances, fin de bail, etc.) ne sont pas corrigés ici : voir l'audit M0.
