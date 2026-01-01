# Configuration DKIM Resend dans OVH - Guide Pas à Pas

## 📋 Informations de votre enregistrement DKIM

D'après Resend, voici ce que vous devez ajouter :

- **Type** : TXT
- **Nom** : `resend._domainkey`
- **Valeur** : `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCrTAawZlAlgQ5tyctEPC1Eb9yKdVMomqtTi+BJJ9noOmu6MZ6267dhiTQm42Yr1Sv1TAEcReGGg7bDzpbVGyrg73rEYzsdPx2DlbNzwtCTWJ5o+o6BfKuxANvA9OvIjiiriUfGxL9KaOR3YusrAC7IJAZU2OjzxIwDWt4UNJimDwIDAQAB`

## 🔧 Étapes dans OVH

### Étape 1 : Accéder à la Zone DNS

1. Connectez-vous à votre compte OVH : [https://www.ovh.com/manager](https://www.ovh.com/manager)
2. Allez dans **Web Cloud** → **Domaines**
3. Cliquez sur `vinyl.report`
4. Cliquez sur l'onglet **Zone DNS**

### Étape 2 : Ajouter l'enregistrement DKIM

1. Cliquez sur le bouton **Ajouter une entrée** (ou **Add an entry**)

2. Remplissez le formulaire :
   - **Sous-domaine** : `resend._domainkey`
     - ⚠️ **IMPORTANT** : Ne mettez QUE `resend._domainkey`, pas `resend._domainkey.vinyl.report`
   
   - **Type** : Sélectionnez **TXT**
   
   - **Cible** : Collez la valeur complète :
     ```
     p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCrTAawZlAlgQ5tyctEPC1Eb9yKdVMomqtTi+BJJ9noOmu6MZ6267dhiTQm42Yr1Sv1TAEcReGGg7bDzpbVGyrg73rEYzsdPx2DlbNzwtCTWJ5o+o6BfKuxANvA9OvIjiiriUfGxL9KaOR3YusrAC7IJAZU2OjzxIwDWt4UNJimDwIDAQAB
     ```
     - ⚠️ **IMPORTANT** : Copiez-collez la valeur EXACTEMENT comme indiqué, avec le préfixe `p=`
   
   - **TTL** : Laissez la valeur par défaut (généralement 3600)

3. Cliquez sur **Valider** ou **Confirmer**

### Étape 3 : Vérifier l'ajout

1. Dans la liste des enregistrements DNS, vous devriez voir :
   - **Type** : TXT
   - **Sous-domaine** : `resend._domainkey`
   - **Cible** : La longue chaîne commençant par `p=`

2. Si vous ne voyez pas l'enregistrement, attendez quelques secondes et actualisez la page

### Étape 4 : Attendre la propagation DNS

1. **Attendez 5-10 minutes** après avoir ajouté l'enregistrement
2. La propagation DNS peut prendre jusqu'à 48h, mais généralement c'est beaucoup plus rapide

### Étape 5 : Vérifier la propagation

Vous pouvez vérifier que l'enregistrement est bien propagé avec ces outils :

1. **DNS Checker** : [https://dnschecker.org/](https://dnschecker.org/)
   - Tapez : `resend._domainkey.vinyl.report`
   - Sélectionnez le type : **TXT**
   - Cliquez sur **Search**
   - Vérifiez que plusieurs serveurs DNS montrent la valeur correcte

2. **MXToolbox** : [https://mxtoolbox.com/TXTLookup.aspx](https://mxtoolbox.com/TXTLookup.aspx)
   - Tapez : `resend._domainkey.vinyl.report`
   - Cliquez sur **TXT Lookup**

### Étape 6 : Vérifier dans Resend

1. Retournez dans le dashboard Resend
2. Allez dans **Domains** → Cliquez sur `vinyl.report`
3. Cliquez sur le bouton **Verify DNS Records** (ou **Vérifier les enregistrements DNS**)
4. Resend vérifiera automatiquement si l'enregistrement DKIM est présent
5. Le statut devrait passer de "pending" à "verified" une fois que tout est correct

## ⚠️ Erreurs courantes à éviter

### ❌ Erreur 1 : Mettre le domaine complet dans "Sous-domaine"
- **Mauvais** : `resend._domainkey.vinyl.report`
- **Bon** : `resend._domainkey`

### ❌ Erreur 2 : Oublier le préfixe `p=` dans la valeur
- **Mauvais** : `MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCrTAawZlAlgQ5tyctEPC1Eb9yKdVMomqtTi+BJJ9noOmu6MZ6267dhiTQm42Yr1Sv1TAEcReGGg7bDzpbVGyrg73rEYzsdPx2DlbNzwtCTWJ5o+o6BfKuxANvA9OvIjiiriUfGxL9KaOR3YusrAC7IJAZU2OjzxIwDWt4UNJimDwIDAQAB`
- **Bon** : `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCrTAawZlAlgQ5tyctEPC1Eb9yKdVMomqtTi+BJJ9noOmu6MZ6267dhiTQm42Yr1Sv1TAEcReGGg7bDzpbVGyrg73rEYzsdPx2DlbNzwtCTWJ5o+o6BfKuxANvA9OvIjiiriUfGxL9KaOR3YusrAC7IJAZU2OjzxIwDWt4UNJimDwIDAQAB`

### ❌ Erreur 3 : Utiliser CNAME au lieu de TXT
- **Mauvais** : Type = CNAME
- **Bon** : Type = TXT

## 🔍 Si ça ne fonctionne toujours pas

1. **Vérifiez que l'enregistrement est bien présent dans OVH** :
   - Retournez dans la Zone DNS
   - Cherchez `resend._domainkey` dans la liste
   - Vérifiez que le type est TXT et que la valeur est correcte

2. **Supprimez et re-ajoutez l'enregistrement** :
   - Supprimez l'enregistrement existant
   - Attendez 5 minutes
   - Re-ajoutez-le en suivant exactement les étapes ci-dessus

3. **Vérifiez avec un outil externe** :
   - Utilisez DNS Checker pour voir si l'enregistrement est propagé
   - Si vous ne voyez rien après 30 minutes, il y a peut-être un problème avec OVH

4. **Contactez le support OVH** si nécessaire

## 📧 Configuration SPF (nécessaire pour l'envoi)

Resend nécessite également des enregistrements SPF pour activer l'envoi d'emails. Voici ce que vous devez ajouter :

### Enregistrements SPF à ajouter

D'après Resend, vous devez ajouter **2 enregistrements** pour le sous-domaine `send` :

#### 1. Enregistrement MX

- **Sous-domaine** : `send`
- **Type** : `MX`
- **Cible** : `feedback-smtp.eu-west-1.amazonses.com`
- **Priorité** : `10`
- **TTL** : `60` (ou laissez la valeur par défaut)

#### 2. Enregistrement TXT (SPF)

- **Sous-domaine** : `send`
- **Type** : `TXT`
- **Cible** : `v=spf1 include:amazonses.com ~all`
- **TTL** : `60` (ou laissez la valeur par défaut)

### Étapes dans OVH pour ajouter le SPF

1. **Ajouter l'enregistrement MX** :
   - Cliquez sur **Ajouter une entrée**
   - **Sous-domaine** : `send`
   - **Type** : Sélectionnez **MX**
   - **Cible** : `feedback-smtp.eu-west-1.amazonses.com`
   - **Priorité** : `10`
   - Cliquez sur **Valider**

2. **Ajouter l'enregistrement TXT SPF** :
   - Cliquez sur **Ajouter une entrée**
   - **Sous-domaine** : `send`
   - **Type** : Sélectionnez **TXT**
   - **Cible** : `v=spf1 include:amazonses.com ~all`
   - Cliquez sur **Valider**

3. **Vérifier les enregistrements** :
   - Vous devriez voir dans la liste :
     - Un enregistrement MX pour `send` pointant vers `feedback-smtp.eu-west-1.amazonses.com`
     - Un enregistrement TXT pour `send` avec la valeur `v=spf1 include:amazonses.com ~all`

4. **Attendre la propagation** (5-10 minutes)

5. **Vérifier dans Resend** :
   - Retournez dans Resend → **Domains** → `vinyl.report`
   - Cliquez sur **Verify DNS Records**
   - Le statut SPF devrait passer à "verified"

## ✅ Une fois vérifié

Une fois que Resend affiche "Verified" pour le DKIM ET le SPF :
- Vous pourrez envoyer des emails depuis `noreply@vinyl.report` (ou tout autre email @vinyl.report)
- Les emails auront une meilleure délivrabilité
- Le domaine sera marqué comme vérifié dans Resend
- L'envoi d'emails sera activé

