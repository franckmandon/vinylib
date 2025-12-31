# My Vinylib

Application web pour gérer votre collection de vinyles.

## Fonctionnalités

- 📀 Gestion complète de votre collection de vinyles
- 🔍 Recherche et filtrage par genre
- ⭐ Système de notation (1-5 étoiles)
- 📅 Dates de sortie complètes
- 🔗 Liens YouTube pour la découverte
- 📱 Scanner de code-barres (EAN/UPC) avec la caméra
- 🔄 Récupération automatique des données depuis Discogs
- 📝 Notes enrichies avec contenu Wikipedia

## Technologies

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Redis (Upstash) pour le stockage des données
- Discogs API
- Wikipedia API

## Déploiement

Ce projet est déployé sur [Vercel](https://vercel.com) avec Upstash Redis pour la persistance des données.

### Variables d'environnement

- `REDIS_URL` : URL de connexion Redis (configurée automatiquement via Vercel Marketplace)
- `DISCOGS_TOKEN` : Token d'accès personnel Discogs (obtenu sur https://www.discogs.com/settings/developers)

## Développement local

```bash
# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev

# Build de production
npm run build

# Démarrer en mode production
npm start
```


