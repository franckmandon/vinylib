# Vérification après changement des serveurs DNS vers OVH

## ✅ État actuel

Vous avez changé les serveurs DNS pour utiliser ceux d'OVH. Les enregistrements Resend sont toujours en "Pending" dans Resend, ce qui est normal car :

1. **La propagation des serveurs DNS** peut prendre quelques heures
2. **Resend vérifie périodiquement** mais on peut forcer la vérification
3. **Les enregistrements dans OVH** doivent être corrects

## 🔍 Vérifications à faire

### 1. Vérifier que les serveurs DNS sont bien propagés

Utilisez [DNS Checker](https://dnschecker.org/) pour vérifier que les serveurs DNS ont changé :

1. Allez sur [https://dnschecker.org/](https://dnschecker.org/)
2. Sélectionnez **NS** (Name Servers)
3. Tapez : `vinyl.report`
4. Cliquez sur **Search**
5. Vérifiez que plusieurs serveurs DNS montrent :
   - `dns110.ovh.net`
   - `ns110.ovh.net`

Si vous voyez encore `ns1.vercel-dns.com` et `ns2.vercel-dns.com`, la propagation n'est pas encore terminée. Attendez encore.

### 2. Vérifier les enregistrements dans OVH

Dans OVH → **Zone DNS** de `vinyl.report`, vérifiez que vous avez bien les 3 enregistrements :

#### ✅ Enregistrement DKIM (TXT) :
- **Sous-domaine** : `resend._domainkey`
- **Type** : `TXT`
- **Cible** : `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBIQKBgQCrTAawZlAlgQ5tyctEPC1Eb9yKdVMomqtTi+BJJ9noOmu6MZ6267dhiTQm42Yr1Sv1TAEcReGGg7bDzpbVGyrg73rEYzsdPx2DlbNzwtCTWJ5o+o6BfKuxANvA9OvljiiriUfGxL9KaOR3YusrAC7IJAZU2OjzxlwDWt4UNJimDwIDAQAB`

#### ✅ Enregistrement SPF MX :
- **Sous-domaine** : `send`
- **Type** : `MX`
- **Cible** : `feedback-smtp.eu-west-1.amazonses.com`
- **Priorité** : `10`

#### ✅ Enregistrement SPF TXT :
- **Sous-domaine** : `send`
- **Type** : `TXT`
- **Cible** : `v=spf1 include:amazonses.com ~all`

### 3. Vérifier la propagation des enregistrements

Une fois que les serveurs DNS sont propagés (étape 1), vérifiez que les enregistrements Resend sont visibles :

#### Pour le DKIM :
- [DNS Checker](https://dnschecker.org/)
- Tapez : `resend._domainkey.vinyl.report`
- Type : **TXT**
- Vérifiez que plusieurs serveurs montrent la valeur correcte

#### Pour le SPF MX :
- [DNS Checker](https://dnschecker.org/)
- Tapez : `send.vinyl.report`
- Type : **MX**
- Vérifiez que plusieurs serveurs montrent `feedback-smtp.eu-west-1.amazonses.com` (priorité 10)

#### Pour le SPF TXT :
- [DNS Checker](https://dnschecker.org/)
- Tapez : `send.vinyl.report`
- Type : **TXT**
- Vérifiez que plusieurs serveurs montrent `v=spf1 include:amazonses.com ~all`

### 4. Forcer la vérification dans Resend

Une fois que les enregistrements sont propagés (vérifiés avec DNS Checker) :

1. Dans Resend → **Domains** → Cliquez sur `vinyl.report`
2. Cliquez sur le bouton **Verify DNS Records** (ou **Vérifier les enregistrements DNS**)
3. Resend va re-vérifier tous les enregistrements
4. Les statuts devraient passer de "Pending" à "Verified"

## ⏱️ Délais normaux

- **Propagation des serveurs DNS** : 1-4 heures (parfois jusqu'à 48h)
- **Propagation des enregistrements DNS** : 5-30 minutes après que les serveurs DNS sont propagés
- **Vérification Resend** : Immédiate une fois que les enregistrements sont propagés

## 🔄 Si les enregistrements ne sont toujours pas visibles après 4 heures

### Vérifier dans OVH

1. **Vérifiez que les enregistrements sont bien présents** dans la Zone DNS
2. **Vérifiez le format exact** :
   - Le sous-domaine doit être exactement `resend._domainkey` (pas `resend._domainkey.vinyl.report`)
   - Le sous-domaine doit être exactement `send` (pas `send.vinyl.report`)
   - Les valeurs doivent être exactement comme indiqué ci-dessus

### Re-vérifier les serveurs DNS

1. Utilisez DNS Checker pour vérifier que les serveurs DNS sont bien ceux d'OVH
2. Si vous voyez encore les serveurs Vercel, la propagation n'est pas terminée

### Forcer la propagation

Parfois, il faut forcer la propagation :

1. Dans OVH, **modifiez légèrement un enregistrement** (ajoutez un espace puis supprimez-le)
2. **Sauvegardez**
3. Cela force OVH à re-propager les enregistrements
4. Attendez 10-15 minutes
5. Vérifiez avec DNS Checker

## ✅ Checklist de vérification

- [ ] Les serveurs DNS sont bien `dns110.ovh.net` et `ns110.ovh.net` (vérifié avec DNS Checker)
- [ ] Les 3 enregistrements Resend sont présents dans OVH Zone DNS
- [ ] Le format des enregistrements est correct (noms sans `.vinyl.report`)
- [ ] Les enregistrements sont propagés (vérifiés avec DNS Checker)
- [ ] J'ai cliqué sur "Verify DNS Records" dans Resend
- [ ] Les statuts sont passés à "Verified"

## 🎯 Prochaines étapes

Une fois que tout est "Verified" dans Resend :

1. **Configurez les variables d'environnement sur Vercel** :
   - `RESEND_API_KEY` : Votre clé API Resend
   - `RESEND_FROM_EMAIL` : `noreply@vinyl.report`
   - `NEXTAUTH_URL` : `https://vinyl.report`

2. **Redéployez l'application** sur Vercel

3. **Testez les emails** :
   - Créez un compte test
   - Testez la réinitialisation de mot de passe

