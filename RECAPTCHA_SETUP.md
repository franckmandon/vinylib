# Configuration reCAPTCHA v3

Ce document explique comment configurer reCAPTCHA v3 pour protéger les formulaires de l'application.

## 1. Obtenir les clés reCAPTCHA

1. Allez sur [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Cliquez sur "+" pour créer un nouveau site
3. Choisissez **reCAPTCHA v3**
4. Ajoutez votre domaine (ex: `localhost` pour le développement, `vinyl.report` pour la production)
5. Acceptez les conditions d'utilisation
6. Copiez la **Site Key** et la **Secret Key**

## 2. Configuration des variables d'environnement

### Développement local

Ajoutez les variables suivantes dans votre fichier `.env.local` :

```env
# reCAPTCHA Configuration
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=votre_site_key_ici
RECAPTCHA_SECRET_KEY=votre_secret_key_ici

# Optionnel: Seuil de score (0.0 à 1.0, par défaut 0.5)
# 1.0 = très probablement un humain, 0.0 = très probablement un bot
RECAPTCHA_SCORE_THRESHOLD=0.5

# Optionnel: URL de base pour la vérification (pour le développement local)
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Production (Vercel)

**IMPORTANT** : Les variables d'environnement doivent être configurées sur Vercel pour que reCAPTCHA fonctionne en production.

1. Allez sur [https://vercel.com](https://vercel.com)
2. Sélectionnez votre projet
3. Allez dans **Settings** → **Environment Variables**
4. Ajoutez les variables suivantes pour **Production**, **Preview**, et **Development** :

```
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=votre_site_key_ici
RECAPTCHA_SECRET_KEY=votre_secret_key_ici
```

**Note importante** :
- `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` doit être la même clé que celle utilisée en développement (celle qui a `vinyl.report` et `localhost` dans les domaines autorisés)
- `RECAPTCHA_SECRET_KEY` doit être la clé secrète correspondante
- Assurez-vous de sélectionner **Production**, **Preview**, et **Development** lors de l'ajout des variables

5. Après avoir ajouté les variables, **redéployez votre application** :
   - Allez dans **Deployments**
   - Cliquez sur **Redeploy** sur le dernier déploiement
   - Ou faites un nouveau commit pour déclencher un nouveau déploiement

## 3. Installation

Le package n'est pas nécessaire car nous utilisons directement l'API Google reCAPTCHA v3.

## 4. Fonctionnement

### Composants créés

- **`components/ReCaptchaProvider.tsx`** : Charge le script reCAPTCHA
- **`components/ReCaptchaWrapper.tsx`** : Wrapper client pour le provider
- **`hooks/useReCaptcha.ts`** : Hook pour exécuter reCAPTCHA et obtenir un token
- **`app/api/recaptcha/verify/route.ts`** : Route API pour vérifier le token côté serveur

### Formulaires protégés

Les formulaires suivants sont protégés par reCAPTCHA v3 :

1. **Formulaire de contact** (`/contact`)
   - Action: `contact_form`
   - Vérification dans `/api/contact`

2. **Formulaire d'inscription** (`/register`)
   - Action: `register`
   - Vérification dans `/api/auth/register`

3. **Formulaire de connexion** (`/login`)
   - Action: `login`
   - Le token est passé à NextAuth (nécessite configuration supplémentaire)

## 5. Mode développement

En mode développement (`NODE_ENV=development`), si la clé secrète n'est pas configurée, la vérification est ignorée pour faciliter le développement.

## 6. Mode production

En mode production, la vérification reCAPTCHA est **obligatoire**. Les requêtes sans token valide seront rejetées.

## 7. Score reCAPTCHA

reCAPTCHA v3 retourne un score de 0.0 à 1.0 :
- **1.0** : Très probablement un humain
- **0.5** : Seuil par défaut (configurable via `RECAPTCHA_SCORE_THRESHOLD`)
- **0.0** : Très probablement un bot

Les requêtes avec un score inférieur au seuil sont rejetées.

## 8. Actions reCAPTCHA

Chaque formulaire utilise une action spécifique pour le suivi :
- `contact_form` : Formulaire de contact
- `register` : Inscription
- `login` : Connexion

Ces actions apparaissent dans la console Google reCAPTCHA pour l'analyse.

## 9. Dépannage

### Le script reCAPTCHA ne se charge pas
- Vérifiez que `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` est défini
- Vérifiez la console du navigateur pour les erreurs
- Assurez-vous que le domaine est autorisé dans la console Google

### La vérification échoue toujours
- Vérifiez que `RECAPTCHA_SECRET_KEY` est défini
- Vérifiez les logs serveur pour les erreurs de vérification
- Assurez-vous que le domaine correspond à celui configuré dans Google

### Le score est toujours trop bas
- Ajustez `RECAPTCHA_SCORE_THRESHOLD` (par défaut 0.5)
- Vérifiez dans la console Google reCAPTCHA les scores moyens
- Certains comportements peuvent être considérés comme suspects (VPN, proxies, etc.)

### reCAPTCHA fonctionne en localhost mais pas en production
**C'est le problème le plus courant !** Les variables d'environnement ne sont pas automatiquement synchronisées entre votre machine locale et Vercel.

**Solution :**

1. **Vérifiez que les variables sont bien configurées sur Vercel** :
   - Allez sur [https://vercel.com](https://vercel.com)
   - Sélectionnez votre projet
   - Allez dans **Settings** → **Environment Variables**
   - Vérifiez que `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` et `RECAPTCHA_SECRET_KEY` sont présentes
   - **IMPORTANT** : Assurez-vous qu'elles sont activées pour **Production** (pas seulement Development ou Preview)

2. **Utilisez les mêmes clés** :
   - La même `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` doit être utilisée en local et en production
   - C'est pour cela que vous avez ajouté à la fois `localhost` et `vinyl.report` dans les domaines autorisés de Google reCAPTCHA

3. **Redéployez après avoir ajouté/modifié les variables** :
   - Les variables d'environnement ne sont appliquées qu'aux nouveaux déploiements
   - Allez dans **Deployments** sur Vercel
   - Cliquez sur **Redeploy** sur le dernier déploiement
   - Ou faites un nouveau commit pour déclencher un nouveau déploiement

4. **Vérifiez les logs Vercel** :
   - Allez dans **Deployments** → Sélectionnez un déploiement → **Logs**
   - Cherchez les erreurs liées à reCAPTCHA

5. **Vérifiez la console du navigateur en production** :
   - Ouvrez `https://vinyl.report` dans votre navigateur
   - Ouvrez la console développeur (F12)
   - Vérifiez s'il y a des erreurs reCAPTCHA

## 10. Documentation officielle

- [reCAPTCHA v3 Documentation](https://developers.google.com/recaptcha/docs/v3)
- [reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)

