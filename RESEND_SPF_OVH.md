# Configuration SPF Resend dans OVH - Guide Rapide

## 📋 Enregistrements SPF à ajouter

Resend nécessite **2 enregistrements** pour le sous-domaine `send` :

### 1. Enregistrement MX

- **Sous-domaine** : `send`
- **Type** : `MX`
- **Cible** : `feedback-smtp.eu-west-1.amazonses.com`
- **Priorité** : `10`
- **TTL** : `60` (ou valeur par défaut)

### 2. Enregistrement TXT (SPF)

- **Sous-domaine** : `send`
- **Type** : `TXT`
- **Cible** : `v=spf1 include:amazonses.com ~all`
- **TTL** : `60` (ou valeur par défaut)

## 🔧 Étapes dans OVH

### Étape 1 : Accéder à la Zone DNS

1. Connectez-vous à OVH : [https://www.ovh.com/manager](https://www.ovh.com/manager)
2. **Web Cloud** → **Domaines** → `vinyl.report`
3. Cliquez sur l'onglet **Zone DNS**

### Étape 2 : Ajouter l'enregistrement MX

1. Cliquez sur **Ajouter une entrée**

2. Remplissez :
   - **Sous-domaine** : `send`
   - **Type** : Sélectionnez **MX**
   - **Cible** : `feedback-smtp.eu-west-1.amazonses.com`
   - **Priorité** : `10`
   - **TTL** : `60` (ou laissez la valeur par défaut)

3. Cliquez sur **Valider**

### Étape 3 : Ajouter l'enregistrement TXT SPF

1. Cliquez sur **Ajouter une entrée**

2. Remplissez :
   - **Sous-domaine** : `send`
   - **Type** : Sélectionnez **TXT**
   - **Cible** : `v=spf1 include:amazonses.com ~all`
   - **TTL** : `60` (ou laissez la valeur par défaut)

3. Cliquez sur **Valider**

### Étape 4 : Vérifier

Dans la liste des enregistrements DNS, vous devriez voir :

1. **MX** pour `send` → `feedback-smtp.eu-west-1.amazonses.com` (priorité 10)
2. **TXT** pour `send` → `v=spf1 include:amazonses.com ~all`

### Étape 5 : Attendre et vérifier dans Resend

1. **Attendez 5-10 minutes** pour la propagation DNS

2. **Vérifiez avec un outil externe** (optionnel) :
   - [DNS Checker](https://dnschecker.org/) : Tapez `send.vinyl.report` (type MX et TXT)
   - [MXToolbox](https://mxtoolbox.com/) : Vérifiez les enregistrements MX et TXT

3. **Dans Resend** :
   - Allez dans **Domains** → Cliquez sur `vinyl.report`
   - Cliquez sur **Verify DNS Records**
   - Le statut SPF devrait passer à "verified"

## ⚠️ Points importants

- **Sous-domaine** : Entrez seulement `send`, pas `send.vinyl.report`
- **Type MX** : Assurez-vous de sélectionner **MX** et non **TXT** pour le premier enregistrement
- **Priorité** : Pour l'enregistrement MX, la priorité doit être `10`
- **Valeur SPF** : La valeur TXT doit être exactement `v=spf1 include:amazonses.com ~all`

## 🔍 Si ça ne fonctionne pas

1. Vérifiez que les 2 enregistrements sont bien présents dans OVH
2. Vérifiez que les valeurs sont exactement comme indiqué ci-dessus
3. Attendez au moins 10-15 minutes après l'ajout
4. Vérifiez avec DNS Checker que les enregistrements sont propagés
5. Dans Resend, cliquez à nouveau sur "Verify DNS Records"

## ✅ Résumé des enregistrements à ajouter

Au total, vous devez avoir **3 enregistrements** dans OVH pour Resend :

1. **DKIM** : TXT pour `resend._domainkey`
2. **SPF MX** : MX pour `send` → `feedback-smtp.eu-west-1.amazonses.com` (priorité 10)
3. **SPF TXT** : TXT pour `send` → `v=spf1 include:amazonses.com ~all`

Une fois ces 3 enregistrements ajoutés et vérifiés, votre domaine sera complètement configuré pour envoyer des emails via Resend.

