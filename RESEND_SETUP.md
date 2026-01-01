# Configuration Resend pour la Production

Ce guide vous explique comment configurer Resend pour envoyer des emails de bienvenue et de réinitialisation de mot de passe en production.

## 📋 Prérequis

- Un compte Resend (gratuit jusqu'à 3,000 emails/mois)
- Votre domaine `vinyl.report` configuré
- Accès au dashboard Vercel pour configurer les variables d'environnement

## 🔧 Étapes de Configuration

### 1. Créer un compte Resend

1. Allez sur [https://resend.com](https://resend.com)
2. Créez un compte gratuit
3. Vérifiez votre email

### 2. Obtenir votre API Key

1. Dans le dashboard Resend, allez dans **API Keys**
2. Cliquez sur **Create API Key**
3. Donnez-lui un nom (ex: "Vinyl Report Production")
4. **Copiez la clé API** (vous ne pourrez plus la voir après)

### 3. Vérifier votre domaine

Pour envoyer des emails depuis `vinyl.report`, vous devez vérifier votre domaine :

1. Dans le dashboard Resend, allez dans **Domains**
2. Cliquez sur **Add Domain**
3. Entrez `vinyl.report`
4. Resend vous donnera des enregistrements DNS à ajouter :
   - **DKIM** : 3 enregistrements CNAME (ou TXT selon la configuration)
   - **SPF** : 1 enregistrement TXT
   - **DMARC** : 1 enregistrement TXT (optionnel mais recommandé)

5. **IMPORTANT - Ajouter les enregistrements DKIM dans OVH** :
   
   **Étape 1 : Copier les enregistrements depuis Resend**
   - Dans Resend, cliquez sur votre domaine `vinyl.report`
   - Vous verrez la section "DKIM Records" avec 3 enregistrements
   - Chaque enregistrement aura :
     - Un **Nom/Name** (ex: `resend._domainkey`)
     - Un **Type** (CNAME ou TXT)
     - Une **Valeur/Value** (ex: `resend._domainkey.resend.com`)
   
   **Étape 2 : Ajouter dans OVH**
   - Connectez-vous à votre compte OVH
   - Allez dans **Web Cloud** → **Domaines** → `vinyl.report`
   - Cliquez sur **Zone DNS**
   - Pour chaque enregistrement DKIM :
     - Cliquez sur **Ajouter une entrée**
     - **Sous-domaine** : Entrez le nom de l'enregistrement (ex: `resend._domainkey`)
       - ⚠️ **Important** : Si Resend indique `resend._domainkey.vinyl.report`, entrez seulement `resend._domainkey`
     - **Type** : Sélectionnez **CNAME** (ou **TXT** si Resend indique TXT)
     - **Cible** : Entrez la valeur complète fournie par Resend (ex: `resend._domainkey.resend.com`)
     - Cliquez sur **Valider**
   
   **Exemple concret** :
   Si Resend vous donne :
   ```
   Name: resend._domainkey
   Type: CNAME
   Value: resend._domainkey.resend.com
   ```
   
   Dans OVH, vous ajoutez :
   - **Sous-domaine** : `resend._domainkey`
   - **Type** : `CNAME`
   - **Cible** : `resend._domainkey.resend.com`
   
   **Répétez pour les 3 enregistrements DKIM**

6. **Ajouter l'enregistrement SPF** :
   - Dans Resend, copiez l'enregistrement SPF (TXT)
   - Dans OVH, ajoutez :
     - **Sous-domaine** : `@` (ou laissez vide pour le domaine racine)
     - **Type** : `TXT`
     - **Cible** : La valeur SPF fournie par Resend (ex: `v=spf1 include:resend.com ~all`)

7. **Vérifier la propagation** :
   - Attendez 5-10 minutes après avoir ajouté les enregistrements
   - Dans Resend, cliquez sur **Verify DNS Records**
   - Resend vérifiera automatiquement les enregistrements
   - Si ça ne fonctionne pas, attendez jusqu'à 48h (généralement quelques minutes suffisent)

8. **Vérifier manuellement** (optionnel) :
   - Utilisez un outil comme [MXToolbox](https://mxtoolbox.com/spf.aspx) ou [DNS Checker](https://dnschecker.org/)
   - Vérifiez que les enregistrements DKIM sont bien propagés
   - Tapez : `resend._domainkey.vinyl.report` (ou le nom exact de votre enregistrement)

9. Une fois vérifié, votre domaine apparaîtra comme "Verified" dans Resend

### 4. Configurer les variables d'environnement sur Vercel

1. Allez sur [https://vercel.com](https://vercel.com)
2. Sélectionnez votre projet `vtek`
3. Allez dans **Settings** → **Environment Variables**
4. Ajoutez les variables suivantes :

#### Variables requises :

```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Remplacez `re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx` par votre vraie clé API Resend.

#### Variables optionnelles (recommandées) :

```
RESEND_FROM_EMAIL=noreply@vinyl.report
```

Ou si vous préférez un format avec nom :
```
RESEND_FROM_EMAIL=Vinyl Report <noreply@vinyl.report>
```

**Note** : Si vous n'avez pas encore vérifié votre domaine, utilisez temporairement :
```
RESEND_FROM_EMAIL=onboarding@resend.dev
```

Mais cela ne fonctionnera que pour les tests. En production, vous devez utiliser votre domaine vérifié.

#### Variable déjà configurée :

```
NEXTAUTH_URL=https://vinyl.report
```

Assurez-vous que cette variable est bien configurée pour que les liens dans les emails fonctionnent correctement.

### 5. Redéployer l'application

Après avoir ajouté les variables d'environnement :

1. Allez dans **Deployments** sur Vercel
2. Cliquez sur **Redeploy** sur le dernier déploiement
3. Ou faites un nouveau commit pour déclencher un nouveau déploiement

## ✅ Vérification

### Tester l'email de bienvenue

1. Créez un nouveau compte utilisateur sur `https://vinyl.report/register`
2. Vérifiez que l'email de bienvenue arrive dans la boîte de réception
3. Vérifiez aussi les spams au cas où

### Tester l'email de réinitialisation

1. Allez sur `https://vinyl.report/forgot-password`
2. Entrez l'email d'un utilisateur existant
3. Vérifiez que l'email de réinitialisation arrive
4. Cliquez sur le lien et vérifiez qu'il fonctionne

## 🔍 Dépannage

### Erreur "Missing required DKIM record"

Si vous voyez cette erreur dans Resend :

1. **Vérifiez que vous avez ajouté TOUS les enregistrements DKIM** :
   - Resend nécessite généralement 3 enregistrements DKIM
   - Vérifiez dans OVH que les 3 sont bien présents
   - Le nom doit être exactement celui fourni par Resend (ex: `resend._domainkey`)

2. **Vérifiez le format dans OVH** :
   - **Sous-domaine** : Ne mettez QUE le nom, pas le domaine complet
     - ✅ Correct : `resend._domainkey`
     - ❌ Incorrect : `resend._domainkey.vinyl.report`
   - **Type** : Doit être **CNAME** (ou TXT si Resend le spécifie)
   - **Cible** : Doit être la valeur complète fournie par Resend

3. **Vérifiez la propagation DNS** :
   - Attendez au moins 5-10 minutes après avoir ajouté les enregistrements
   - Utilisez [DNS Checker](https://dnschecker.org/) pour vérifier la propagation mondiale
   - Tapez le nom complet : `resend._domainkey.vinyl.report`
   - Vérifiez que tous les serveurs DNS montrent la bonne valeur

4. **Vérifiez dans Resend** :
   - Allez dans **Domains** → Cliquez sur `vinyl.report`
   - Regardez la section "DKIM Records"
   - Vérifiez que les noms et valeurs correspondent exactement à ce que vous avez dans OVH

5. **Si ça ne fonctionne toujours pas** :
   - Supprimez tous les enregistrements DKIM dans OVH
   - Attendez 5 minutes
   - Re-ajoutez-les un par un en vérifiant chaque fois
   - Cliquez sur "Verify DNS Records" dans Resend après chaque ajout

### Les emails ne partent pas

1. **Vérifiez les logs Vercel** :
   - Allez dans **Deployments** → Sélectionnez un déploiement → **Functions** → Regardez les logs
   - Cherchez les erreurs liées à `[email]` dans les logs

2. **Vérifiez les variables d'environnement** :
   - Assurez-vous que `RESEND_API_KEY` est bien configurée
   - Vérifiez qu'il n'y a pas d'espaces avant/après la valeur

3. **Vérifiez le domaine** :
   - Dans Resend, vérifiez que votre domaine est bien "Verified"
   - Si ce n'est pas le cas, vérifiez que tous les enregistrements DNS sont corrects
   - **L'erreur DKIM doit être résolue avant de pouvoir envoyer des emails**

4. **Vérifiez les limites** :
   - Dans Resend, allez dans **Usage** pour voir si vous avez atteint la limite
   - Le plan gratuit permet 3,000 emails/mois

### Les emails arrivent en spam

1. **Vérifiez les enregistrements DNS** :
   - DKIM, SPF et DMARC doivent être correctement configurés
   - Utilisez un outil comme [MXToolbox](https://mxtoolbox.com/) pour vérifier

2. **Attendez la propagation** :
   - Les enregistrements DNS peuvent prendre jusqu'à 48h pour se propager
   - Vérifiez régulièrement dans Resend si le domaine est vérifié

### Erreur "Domain not verified"

- Assurez-vous que votre domaine est bien vérifié dans Resend
- Vérifiez que `RESEND_FROM_EMAIL` utilise votre domaine vérifié (ex: `noreply@vinyl.report`)
- Si vous utilisez encore `onboarding@resend.dev`, cela fonctionne mais les emails peuvent être marqués comme spam

## 📧 Format des emails

Les emails sont déjà configurés avec :
- **Email de bienvenue** : Envoyé lors de l'inscription
- **Email de réinitialisation** : Envoyé lors de la demande de changement de mot de passe

Les deux emails sont en HTML avec un design moderne et responsive.

## 🔐 Sécurité

- Ne partagez jamais votre `RESEND_API_KEY`
- Ne commitez jamais les clés API dans Git
- Utilisez toujours les variables d'environnement
- Limitez les permissions de votre clé API dans Resend si possible

## 📚 Ressources

- [Documentation Resend](https://resend.com/docs)
- [Guide de vérification de domaine Resend](https://resend.com/docs/dashboard/domains/introduction)
- [Dashboard Resend](https://resend.com/emails)

