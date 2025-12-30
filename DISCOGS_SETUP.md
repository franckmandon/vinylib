# Configuration de l'API Discogs

Pour utiliser l'authentification Discogs et améliorer la récupération des données, vous devez configurer un Personal Access Token.

## Étapes de configuration

1. **Générer un Personal Access Token** :
   - Allez sur https://www.discogs.com/settings/developers
   - Connectez-vous à votre compte Discogs
   - Cliquez sur "Generate new token"
   - Copiez le token généré

2. **Créer le fichier `.env.local`** à la racine du projet avec le contenu suivant :

```env
# Discogs Personal Access Token
# Obtenez votre token sur : https://www.discogs.com/settings/developers
DISCOGS_TOKEN=votre_personal_access_token_ici
```

3. **Redémarrer le serveur de développement** après avoir créé le fichier `.env.local` :

```bash
npm run dev
```

## Avantages de l'authentification

Avec le Personal Access Token configuré, l'application :
- ✅ Utilise une authentification simple et directe
- ✅ A accès à des limites de requêtes plus élevées
- ✅ Peut récupérer plus de données détaillées
- ✅ Fonctionne même sans le token (mode non authentifié avec limites réduites)

## Vérification

Une fois configuré, vous devriez voir dans les logs du serveur :
```
✅ Using Personal Access Token authentication
```

Au lieu de :
```
⚠️ No token found, using unauthenticated request
```

