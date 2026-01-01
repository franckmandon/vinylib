# Vérification des enregistrements DNS Resend

## ✅ État actuel

Les enregistrements DNS sont bien ajoutés dans Vercel, mais Resend les affiche encore en "Pending". Voici comment vérifier et résoudre le problème.

## 🔍 Vérification étape par étape

### 1. Vérifier la propagation DNS

Utilisez ces outils pour vérifier que les enregistrements sont bien propagés :

#### Pour le DKIM :
- [DNS Checker](https://dnschecker.org/)
  - Tapez : `resend._domainkey.vinyl.report`
  - Type : **TXT**
  - Cliquez sur **Search**
  - Vérifiez que plusieurs serveurs DNS (au moins 5-10) montrent la valeur correcte commençant par `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBIQKBgQCrTAawZlAlgQ5tyctEPC1Eb9yKdVMomqtTi+BJJ9noOmu6MZ6267dhiTQm42Yr1Sv1TAEcReGGg7bDzpbVGyrg73rEYzsdPx2DlbNzwtCTWJ5o+o6BfKuxANvA9OvljiiriUfGxL9KaOR3YusrAC7IJAZU2OjzxlwDWt4UNJimDwIDAQAB`

#### Pour le SPF MX :
- [DNS Checker](https://dnschecker.org/)
  - Tapez : `send.vinyl.report`
  - Type : **MX**
  - Cliquez sur **Search**
  - Vérifiez que plusieurs serveurs montrent : `feedback-smtp.eu-west-1.amazonses.com` avec priorité 10

#### Pour le SPF TXT :
- [DNS Checker](https://dnschecker.org/)
  - Tapez : `send.vinyl.report`
  - Type : **TXT**
  - Cliquez sur **Search**
  - Vérifiez que plusieurs serveurs montrent : `v=spf1 include:amazonses.com ~all`

### 2. Vérifier le format dans Vercel

Dans Vercel, vérifiez que les enregistrements sont exactement comme suit :

#### DKIM (TXT) :
- **Name** : `resend._domainkey` (sans `.vinyl.report`)
- **Type** : `TXT`
- **Value** : `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBIQKBgQCrTAawZlAlgQ5tyctEPC1Eb9yKdVMomqtTi+BJJ9noOmu6MZ6267dhiTQm42Yr1Sv1TAEcReGGg7bDzpbVGyrg73rEYzsdPx2DlbNzwtCTWJ5o+o6BfKuxANvA9OvljiiriUfGxL9KaOR3YusrAC7IJAZU2OjzxlwDWt4UNJimDwIDAQAB`
  - ⚠️ Doit commencer par `p=`
  - ⚠️ Doit être la valeur complète (très longue)

#### SPF MX :
- **Name** : `send` (sans `.vinyl.report`)
- **Type** : `MX`
- **Value** : `feedback-smtp.eu-west-1.amazonses.com`
- **Priority** : `10`

#### SPF TXT :
- **Name** : `send` (sans `.vinyl.report`)
- **Type** : `TXT`
- **Value** : `v=spf1 include:amazonses.com ~all`
  - ⚠️ Doit être exactement cette valeur, avec les guillemets si nécessaire

### 3. Forcer la vérification dans Resend

1. Dans Resend, allez dans **Domains** → Cliquez sur `vinyl.report`
2. Cliquez sur le bouton **Verify DNS Records** (ou **Vérifier les enregistrements DNS**)
3. Resend va re-vérifier tous les enregistrements

### 4. Si ça ne fonctionne toujours pas

#### Vérifier les erreurs courantes :

1. **Le nom contient le domaine complet** :
   - ❌ Mauvais : `resend._domainkey.vinyl.report`
   - ✅ Bon : `resend._domainkey`

2. **La valeur DKIM n'a pas le préfixe `p=`** :
   - ❌ Mauvais : `MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBIQKBgQCrTAawZlAlgQ5tyctEPC1Eb9yKdVMomqtTi+BJJ9noOmu6MZ6267dhiTQm42Yr1Sv1TAEcReGGg7bDzpbVGyrg73rEYzsdPx2DlbNzwtCTWJ5o+o6BfKuxANvA9OvljiiriUfGxL9KaOR3YusrAC7IJAZU2OjzxlwDWt4UNJimDwIDAQAB`
   - ✅ Bon : `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBIQKBgQCrTAawZlAlgQ5tyctEPC1Eb9yKdVMomqtTi+BJJ9noOmu6MZ6267dhiTQm42Yr1Sv1TAEcReGGg7bDzpbVGyrg73rEYzsdPx2DlbNzwtCTWJ5o+o6BfKuxANvA9OvljiiriUfGxL9KaOR3YusrAC7IJAZU2OjzxlwDWt4UNJimDwIDAQAB`

3. **La valeur SPF TXT est incorrecte** :
   - ❌ Mauvais : `spf1 include:amazonses.com ~all`
   - ✅ Bon : `v=spf1 include:amazonses.com ~all`

#### Actions à prendre :

1. **Supprimer et re-ajouter les enregistrements** :
   - Dans Vercel, supprimez les 3 enregistrements
   - Attendez 5 minutes
   - Re-ajoutez-les un par un en vérifiant chaque fois le format

2. **Vérifier avec un outil de ligne de commande** (si vous avez accès) :
   ```bash
   # Vérifier DKIM
   dig TXT resend._domainkey.vinyl.report
   
   # Vérifier SPF MX
   dig MX send.vinyl.report
   
   # Vérifier SPF TXT
   dig TXT send.vinyl.report
   ```

3. **Attendre plus longtemps** :
   - La propagation DNS peut prendre jusqu'à 48h
   - Généralement c'est beaucoup plus rapide (5-30 minutes)
   - Si après 2-3 heures ça ne fonctionne toujours pas, il y a probablement un problème de format

## ⏱️ Délais normaux

- **Propagation DNS** : 5 minutes à 2 heures (généralement)
- **Vérification Resend** : Immédiate une fois que les enregistrements sont propagés

## 📞 Si le problème persiste

Si après avoir vérifié tout ça et attendu plusieurs heures, les enregistrements sont toujours en "Pending" :

1. Vérifiez les logs dans Resend (s'il y en a)
2. Contactez le support Resend avec :
   - Le nom de votre domaine
   - Les valeurs exactes de vos enregistrements DNS
   - Les résultats de DNS Checker montrant que les enregistrements sont propagés

