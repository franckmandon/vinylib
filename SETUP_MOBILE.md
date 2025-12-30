# Guide pour accéder à My Vinylib depuis votre iPhone

## Problème : HTTPS requis pour la caméra sur iOS

Safari sur iPhone nécessite HTTPS pour accéder à la caméra. Voici plusieurs solutions simples :

## Solution 1 : Cloudflare Tunnel (GRATUIT et SIMPLE) ⭐ Recommandé

1. **Installer Cloudflare Tunnel** :
   ```bash
   brew install cloudflare/cloudflare/cloudflared
   ```

2. **Démarrer votre serveur** :
   ```bash
   npm run dev:network
   ```

3. **Dans un autre terminal, créer le tunnel HTTPS** :
   ```bash
   cloudflared tunnel --url http://localhost:3000
   ```

4. **Utiliser l'URL HTTPS** affichée (ex: `https://xxxxx.trycloudflare.com`) sur votre iPhone

## Solution 2 : Serveo (SANS INSTALLATION)

1. **Démarrer votre serveur** :
   ```bash
   npm run dev:network
   ```

2. **Dans un autre terminal** :
   ```bash
   ssh -R 80:localhost:3000 serveo.net
   ```

3. **Utiliser l'URL fournie** sur votre iPhone

## Solution 3 : localtunnel (via npm)

1. **Installer localtunnel** :
   ```bash
   npm install -g localtunnel
   ```

2. **Démarrer votre serveur** :
   ```bash
   npm run dev:network
   ```

3. **Dans un autre terminal** :
   ```bash
   lt --port 3000
   ```

4. **Utiliser l'URL HTTPS** affichée sur votre iPhone

## Solution 4 : Utiliser votre Mac comme serveur HTTPS local

Si vous préférez rester en local, vous pouvez configurer un certificat auto-signé, mais c'est plus complexe.

## Notes importantes

- ✅ La bibliothèque `html5-qrcode` supporte nativement les codes EAN-13 sur iOS Safari
- ✅ Assurez-vous d'autoriser l'accès à la caméra dans Safari (Réglages > Safari > Caméra)
- ✅ Un bon éclairage facilite la lecture des codes-barres sur les vinyles
- ⚠️ HTTPS est obligatoire pour la caméra sur iOS (sauf localhost)

## Test rapide

Une fois que vous avez une URL HTTPS, testez sur votre iPhone :
1. Ouvrez Safari
2. Allez sur l'URL HTTPS
3. Cliquez sur "Ajouter un vinyle"
4. Cliquez sur "Scan Barcode"
5. Autorisez l'accès à la caméra
6. Scannez un code-barres EAN-13

