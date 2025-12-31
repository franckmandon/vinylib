# Guide de déploiement Vercel - Étape par étape

## Étape 1 : Préparer le code sur GitHub

### 1.1 Commiter les changements

```bash
# Ajouter tous les fichiers modifiés
git add .

# Créer un commit
git commit -m "Clean up project for Vercel deployment"

# Pousser sur GitHub
git push origin main
```

## Étape 2 : Créer un compte Vercel

1. Allez sur **https://vercel.com**
2. Cliquez sur **"Sign Up"** (en haut à droite)
3. Choisissez **"Continue with GitHub"**
4. Autorisez Vercel à accéder à votre compte GitHub

## Étape 3 : Importer votre projet

1. Une fois connecté, cliquez sur **"Add New Project"** (ou **"New Project"**)
2. Vous verrez la liste de vos repositories GitHub
3. Trouvez **`vinylib`** (ou le nom de votre repo)
4. Cliquez sur **"Import"** à côté de votre repo

## Étape 4 : Configurer le projet

### 4.1 Configuration du projet

Vercel détecte automatiquement Next.js, donc :
- **Framework Preset** : Next.js (détecté automatiquement)
- **Root Directory** : `./` (par défaut)
- **Build Command** : `npm run build` (par défaut)
- **Output Directory** : `.next` (par défaut)

**Ne changez rien**, laissez les valeurs par défaut.

### 4.2 Variables d'environnement

**IMPORTANT** : Avant de déployer, ajoutez votre token Discogs :

1. Dans la section **"Environment Variables"**
2. Cliquez sur **"Add"** ou **"Add Variable"**
3. Ajoutez :
   - **Name** : `DISCOGS_TOKEN`
   - **Value** : Votre token Discogs (celui que vous avez dans `.env.local`)
4. Cliquez sur **"Add"** ou **"Save"**

⚠️ **Ne cliquez pas encore sur "Deploy" !**

## Étape 5 : Déployer

1. Une fois la variable d'environnement ajoutée
2. Cliquez sur **"Deploy"** (en bas de la page)
3. Attendez 2-3 minutes pendant que Vercel :
   - Installe les dépendances
   - Build votre application
   - Déploie sur leur infrastructure

## Étape 6 : Vérifier le déploiement

1. Une fois le déploiement terminé, vous verrez :
   - ✅ **"Congratulations! Your project has been deployed"**
   - Une URL comme : `https://vinylib-xxxxx.vercel.app`

2. Cliquez sur cette URL pour tester votre application

3. Testez les fonctionnalités :
   - Ajouter un vinyle
   - Scanner un code-barres
   - Rechercher un EAN

## Étape 7 : Configurer le domaine personnalisé (optionnel)

Si vous voulez utiliser `vinyl.report` :

1. Dans votre projet Vercel, allez dans **"Settings"** → **"Domains"**
2. Cliquez sur **"Add Domain"**
3. Entrez : `vinyl.report`
4. Vercel vous donnera des instructions DNS

### Configuration DNS

Dans votre espace client OVH (pour le domaine uniquement) :

1. Allez dans **"Domaines"** → **`vinyl.report`**
2. Cliquez sur **"Zone DNS"**
3. Ajoutez/modifiez un enregistrement **CNAME** :
   - **Sous-domaine** : `@` (ou laissez vide pour le domaine racine)
   - **Cible** : `cname.vercel-dns.com` (Vercel vous donnera la valeur exacte)
4. Sauvegardez

**Note** : La propagation DNS peut prendre jusqu'à 24h, mais généralement c'est beaucoup plus rapide (quelques minutes).

## Étape 8 : Mises à jour automatiques

À chaque fois que vous faites un `git push` sur GitHub, Vercel déploie automatiquement votre application !

## Dépannage

### Le build échoue

1. Vérifiez les logs de build dans Vercel
2. Assurez-vous que `npm run build` fonctionne localement :
   ```bash
   npm run build
   ```

### L'application ne trouve pas les données Discogs

1. Vérifiez que la variable `DISCOGS_TOKEN` est bien configurée dans Vercel
2. Allez dans **Settings** → **Environment Variables**
3. Vérifiez que `DISCOGS_TOKEN` est présent

### Le domaine ne fonctionne pas

1. Vérifiez la configuration DNS dans OVH
2. Utilisez un outil comme https://dnschecker.org pour vérifier la propagation
3. Attendez quelques minutes (propagation DNS)

## Support

- Documentation Vercel : https://vercel.com/docs
- Support Vercel : support@vercel.com

