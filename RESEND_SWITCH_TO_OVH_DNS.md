# Changer les serveurs DNS pour utiliser OVH

## 🎯 Solution : Utiliser les serveurs DNS d'OVH

Puisque vous avez déjà ajouté les enregistrements dans OVH et qu'ils ne fonctionnent pas avec Vercel DNS, la meilleure solution est de changer les serveurs DNS pour utiliser ceux d'OVH.

## ⚠️ Important avant de commencer

**Changer les serveurs DNS peut temporairement affecter votre site** :
- Le site peut être inaccessible pendant quelques minutes à quelques heures
- Les enregistrements DNS existants (comme ceux pour Vercel) peuvent être affectés
- La propagation peut prendre jusqu'à 48h (généralement beaucoup plus rapide)

## 🔧 Étapes pour changer les serveurs DNS

### Étape 1 : Dans OVH - Changer les serveurs DNS

1. Connectez-vous à OVH : [https://www.ovh.com/manager](https://www.ovh.com/manager)
2. Allez dans **Web Cloud** → **Domaines**
3. Cliquez sur `vinyl.report`
4. Allez dans l'onglet **Serveurs DNS** (ou **DNS Servers**)

5. **Remplacez les serveurs DNS actuels** (ceux de Vercel) par ceux d'OVH :
   - Supprimez : `ns1.vercel-dns.com`
   - Supprimez : `ns2.vercel-dns.com`
   - Ajoutez : `dns110.ovh.net`
   - Ajoutez : `ns110.ovh.net`

6. Cliquez sur **Valider** ou **Confirmer**

### Étape 2 : Dans Vercel - Reconfigurer le domaine

Une fois les serveurs DNS changés, vous devez reconfigurer le domaine dans Vercel :

1. Allez sur [vercel.com](https://vercel.com)
2. Sélectionnez votre projet `vtek`
3. Allez dans **Settings** → **Domains**
4. Cliquez sur `vinyl.report`
5. Vérifiez que le domaine est toujours configuré
6. Si nécessaire, **supprimez et re-ajoutez le domaine** :
   - Supprimez `vinyl.report`
   - Re-ajoutez-le
   - Vercel vous donnera de nouveaux enregistrements DNS à ajouter dans OVH

### Étape 3 : Ajouter les enregistrements Vercel dans OVH

Vercel a besoin de certains enregistrements DNS pour fonctionner. Après avoir changé les serveurs DNS, vous devrez ajouter ces enregistrements dans OVH :

1. Dans Vercel, après avoir re-ajouté le domaine, vous verrez les enregistrements DNS requis
2. Ajoutez ces enregistrements dans OVH (Zone DNS)
3. Généralement, ce sont des enregistrements A ou CNAME pour pointer vers Vercel

### Étape 4 : Vérifier les enregistrements Resend dans OVH

Vérifiez que vos 3 enregistrements Resend sont toujours présents dans OVH :

1. Dans OVH → **Zone DNS** de `vinyl.report`
2. Vérifiez que vous avez :
   - **TXT** pour `resend._domainkey` → La clé DKIM
   - **MX** pour `send` → `feedback-smtp.eu-west-1.amazonses.com` (priorité 10)
   - **TXT** pour `send` → `v=spf1 include:amazonses.com ~all`

### Étape 5 : Attendre la propagation

1. **Attendez 30 minutes à 2 heures** pour la propagation des serveurs DNS
2. Vérifiez avec [DNS Checker](https://dnschecker.org/) que les serveurs DNS ont changé
3. Vérifiez que les enregistrements Resend sont propagés

### Étape 6 : Vérifier dans Resend

1. Dans Resend → **Domains** → `vinyl.report`
2. Cliquez sur **Verify DNS Records**
3. Les statuts DKIM et SPF devraient passer à "Verified"

## 🔄 Alternative : Garder Vercel DNS mais corriger les enregistrements

Si vous préférez garder les serveurs DNS de Vercel, vous pouvez :

1. **Supprimer les enregistrements Resend dans Vercel**
2. **Attendre 10 minutes**
3. **Re-ajoutez-les un par un** en vérifiant très attentivement le format
4. **Vérifiez avec DNS Checker** après chaque ajout

Mais après 24h sans propagation, il est probable qu'il y ait un problème avec Vercel DNS pour ces enregistrements spécifiques.

## ✅ Recommandation

Je recommande de **changer pour les serveurs DNS d'OVH** car :
- Vous avez déjà les enregistrements correctement configurés dans OVH
- C'est plus fiable pour les enregistrements personnalisés
- Vous gardez le contrôle total sur votre zone DNS
- Les enregistrements Resend devraient fonctionner immédiatement une fois les serveurs DNS propagés

## 📝 Notes importantes

- **Le site peut être temporairement inaccessible** pendant la propagation (généralement quelques minutes)
- **Les enregistrements DNS de Vercel** devront être reconfigurés dans OVH
- **La propagation complète** peut prendre jusqu'à 48h, mais généralement c'est beaucoup plus rapide (30 minutes à 2 heures)

