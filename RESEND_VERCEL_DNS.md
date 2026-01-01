# Configuration Resend avec Vercel DNS

## ⚠️ Problème identifié

Votre domaine `vinyl.report` utilise les serveurs DNS de **Vercel** (`ns1.vercel-dns.com` et `ns2.vercel-dns.com`), pas ceux d'OVH.

Cela signifie que les enregistrements DNS que vous avez ajoutés dans OVH ne sont **pas pris en compte**. Vous devez les ajouter dans **Vercel** à la place.

## ✅ Solution : Ajouter les enregistrements dans Vercel

### Étape 1 : Accéder aux DNS Records dans Vercel

1. Allez sur [https://vercel.com](https://vercel.com)
2. Connectez-vous à votre compte
3. Sélectionnez votre projet `vtek`
4. Allez dans **Settings** → **Domains**
5. Cliquez sur `vinyl.report`
6. Allez dans l'onglet **DNS Records** (ou **Enregistrements DNS**)

### Étape 2 : Ajouter l'enregistrement DKIM

1. Cliquez sur **Add Record** (ou **Ajouter un enregistrement**)

2. Remplissez :
   - **Name** : `resend._domainkey`
   - **Type** : `TXT`
   - **Value** : `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBIQKBgQCrTAawZlAlgQ5tyctEPC1Eb9yKdVMomqtTi+BJJ9noOmu6MZ6267dhiTQm42Yr1Sv1TAEcReGGg7bDzpbVGyrg73rEYzsdPx2DlbNzwtCTWJ5o+o6BfKuxANvA9OvljiiriUfGxL9KaOR3YusrAC7IJAZU2OjzxlwDWt4UNJimDwIDAQAB`
   - **TTL** : Laissez la valeur par défaut

3. Cliquez sur **Save** (ou **Enregistrer**)

### Étape 3 : Ajouter l'enregistrement SPF MX

1. Cliquez sur **Add Record**

2. Remplissez :
   - **Name** : `send`
   - **Type** : `MX`
   - **Value** : `feedback-smtp.eu-west-1.amazonses.com`
   - **Priority** : `10`
   - **TTL** : `60` (ou valeur par défaut)

3. Cliquez sur **Save**

### Étape 4 : Ajouter l'enregistrement SPF TXT

1. Cliquez sur **Add Record**

2. Remplissez :
   - **Name** : `send`
   - **Type** : `TXT`
   - **Value** : `v=spf1 include:amazonses.com ~all`
   - **TTL** : `60` (ou valeur par défaut)

3. Cliquez sur **Save**

### Étape 5 : Vérifier

Vous devriez maintenant voir dans Vercel :

1. **TXT** pour `resend._domainkey` → La clé DKIM
2. **MX** pour `send` → `feedback-smtp.eu-west-1.amazonses.com` (priorité 10)
3. **TXT** pour `send` → `v=spf1 include:amazonses.com ~all`

### Étape 6 : Attendre et vérifier dans Resend

1. **Attendez 5-10 minutes** pour la propagation DNS

2. **Vérifiez avec un outil externe** (optionnel) :
   - [DNS Checker](https://dnschecker.org/)
   - Vérifiez `resend._domainkey.vinyl.report` (type TXT)
   - Vérifiez `send.vinyl.report` (type MX et TXT)

3. **Dans Resend** :
   - Allez dans **Domains** → Cliquez sur `vinyl.report`
   - Cliquez sur **Verify DNS Records**
   - Les statuts DKIM et SPF devraient passer à "Verified"

## 🔄 Alternative : Utiliser les serveurs DNS d'OVH

Si vous préférez utiliser les serveurs DNS d'OVH (et garder les enregistrements que vous avez déjà ajoutés) :

1. **Dans OVH** :
   - Allez dans **Web Cloud** → **Domaines** → `vinyl.report`
   - Allez dans l'onglet **Serveurs DNS**
   - Changez les serveurs DNS pour utiliser :
     - `dns110.ovh.net`
     - `ns110.ovh.net`
   - ⚠️ **Attention** : Cela peut affecter la configuration de votre domaine sur Vercel

2. **Attendez la propagation** (peut prendre jusqu'à 48h)

3. **Vérifiez dans Resend**

## ⚠️ Recommandation

Je recommande d'utiliser **l'option 1** (ajouter les enregistrements dans Vercel) car :
- Plus simple et plus rapide
- Pas de risque d'affecter la configuration Vercel
- Les enregistrements sont déjà dans OVH, vous pouvez les supprimer si vous voulez

## 📝 Note

Si vous avez ajouté les enregistrements dans OVH, vous pouvez les supprimer maintenant puisqu'ils ne sont pas utilisés (le domaine utilise les serveurs DNS de Vercel).

