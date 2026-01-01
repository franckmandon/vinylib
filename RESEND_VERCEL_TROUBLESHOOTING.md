# Dépannage : Enregistrements DNS non propagés dans Vercel

## 🔍 Diagnostic

Si les enregistrements ne sont pas visibles dans DNS Checker, cela peut être dû à :

1. **Format incorrect dans Vercel**
2. **Enregistrements mal configurés**
3. **Délai de propagation (normal)**
4. **Problème avec la zone DNS Vercel**

## ✅ Vérifications dans Vercel

### 1. Vérifier que les enregistrements sont bien sauvegardés

Dans Vercel → Settings → Domains → `vinyl.report` → DNS Records :

1. **Vérifiez que les 3 enregistrements sont bien présents** dans la liste
2. **Vérifiez qu'ils ne sont pas en erreur** (pas de message d'erreur rouge)
3. **Vérifiez le format exact** de chaque enregistrement

### 2. Format exact requis

#### Enregistrement DKIM (TXT) :

Dans Vercel, l'enregistrement doit être :
- **Name** : `resend._domainkey`
  - ⚠️ **IMPORTANT** : Ne doit PAS contenir `.vinyl.report`
  - ⚠️ Vercel peut parfois ajouter automatiquement le domaine, vérifiez que ce n'est pas le cas
  
- **Type** : `TXT`

- **Value** : `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBIQKBgQCrTAawZlAlgQ5tyctEPC1Eb9yKdVMomqtTi+BJJ9noOmu6MZ6267dhiTQm42Yr1Sv1TAEcReGGg7bDzpbVGyrg73rEYzsdPx2DlbNzwtCTWJ5o+o6BfKuxANvA9OvljiiriUfGxL9KaOR3YusrAC7IJAZU2OjzxlwDWt4UNJimDwIDAQAB`
  - ⚠️ Doit commencer par `p=`
  - ⚠️ Doit être la valeur complète (très longue chaîne)
  - ⚠️ Pas de guillemets autour de la valeur

#### Enregistrement SPF MX :

- **Name** : `send`
  - ⚠️ Ne doit PAS contenir `.vinyl.report`
  
- **Type** : `MX`

- **Value** : `feedback-smtp.eu-west-1.amazonses.com`
  - ⚠️ Pas de priorité dans la valeur, la priorité est un champ séparé

- **Priority** : `10`
  - ⚠️ Doit être un champ séparé, pas dans la valeur

#### Enregistrement SPF TXT :

- **Name** : `send`
  - ⚠️ Ne doit PAS contenir `.vinyl.report`

- **Type** : `TXT`

- **Value** : `v=spf1 include:amazonses.com ~all`
  - ⚠️ Doit être exactement cette valeur
  - ⚠️ Pas de guillemets autour

### 3. Problèmes courants dans Vercel

#### Problème 1 : Le nom contient le domaine complet

Si dans Vercel vous voyez `resend._domainkey.vinyl.report` au lieu de `resend._domainkey` :

1. **Supprimez l'enregistrement**
2. **Re-ajoutez-le** en mettant SEULEMENT `resend._domainkey` dans le champ Name
3. Vercel ajoutera automatiquement le domaine, mais le nom stocké doit être juste `resend._domainkey`

#### Problème 2 : La valeur DKIM est tronquée

Si la valeur DKIM semble coupée ou incomplète :

1. **Copiez la valeur complète depuis Resend**
2. **Collez-la entièrement** dans Vercel
3. Vérifiez qu'elle commence bien par `p=` et se termine par `IDAQAB`

#### Problème 3 : L'enregistrement MX n'a pas de priorité

Pour l'enregistrement MX :

1. Assurez-vous qu'il y a un champ **Priority** séparé
2. Mettez `10` dans ce champ
3. La valeur doit être seulement `feedback-smtp.eu-west-1.amazonses.com` (sans la priorité)

### 4. Vérifier avec la ligne de commande (si possible)

Si vous avez accès à un terminal, vous pouvez vérifier directement :

```bash
# Vérifier DKIM
dig TXT resend._domainkey.vinyl.report @8.8.8.8

# Vérifier SPF MX
dig MX send.vinyl.report @8.8.8.8

# Vérifier SPF TXT
dig TXT send.vinyl.report @8.8.8.8
```

Si ces commandes ne retournent rien, les enregistrements ne sont pas encore propagés.

## 🔧 Actions à prendre

### Option 1 : Vérifier et corriger le format

1. **Dans Vercel**, vérifiez chaque enregistrement un par un
2. **Comparez avec les valeurs exactes** ci-dessus
3. **Corrigez** si nécessaire
4. **Attendez 10-15 minutes**
5. **Re-vérifiez** avec DNS Checker

### Option 2 : Supprimer et re-ajouter

Si vous n'êtes pas sûr du format :

1. **Supprimez les 3 enregistrements** dans Vercel
2. **Attendez 5 minutes**
3. **Re-ajoutez-les un par un** en suivant exactement le format ci-dessus
4. **Vérifiez chaque enregistrement** après l'ajout
5. **Attendez 10-15 minutes**
6. **Vérifiez** avec DNS Checker

### Option 3 : Vérifier la zone DNS Vercel

1. Dans Vercel → Settings → Domains → `vinyl.report`
2. Vérifiez que le domaine est bien configuré
3. Vérifiez qu'il n'y a pas d'erreurs ou d'avertissements
4. Si nécessaire, re-configurer le domaine

## ⏱️ Délais normaux

- **Ajout dans Vercel** : Immédiat
- **Propagation DNS** : 5-30 minutes (parfois jusqu'à 2 heures)
- **Visibilité dans DNS Checker** : 10-30 minutes généralement

## 🚨 Si ça ne fonctionne toujours pas après 2 heures

1. **Vérifiez les logs Vercel** pour voir s'il y a des erreurs
2. **Contactez le support Vercel** avec :
   - Le nom de votre domaine
   - Les enregistrements que vous essayez d'ajouter
   - Le fait qu'ils ne sont pas propagés après 2 heures

3. **Alternative** : Utilisez les serveurs DNS d'OVH à la place :
   - Changez les serveurs DNS dans OVH pour utiliser ceux d'OVH
   - Ajoutez les enregistrements dans OVH (que vous avez déjà fait)
   - Cela peut prendre jusqu'à 48h pour la propagation des serveurs DNS

