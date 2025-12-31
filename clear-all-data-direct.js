/**
 * Script direct pour supprimer TOUTES les données (vinyls et utilisateurs)
 * Exécutez: node clear-all-data-direct.js
 */

const { createClient } = require('redis');
const fs = require('fs');
const path = require('path');

// Charger les variables d'environnement depuis tous les fichiers .env disponibles
// L'ordre est important : les fichiers suivants écrasent les précédents
const envFiles = ['.env.local', '.env.development.local', '.env.production.local', '.env'];
let envLoaded = false;

for (const envFile of envFiles) {
  try {
    const envPath = path.join(process.cwd(), envFile);
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      envContent.split('\n').forEach(line => {
        // Ignorer les lignes vides et les commentaires
        line = line.trim();
        if (!line || line.startsWith('#')) return;
        
        const match = line.match(/^([^#=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          let value = match[2].trim();
          // Retirer les guillemets
          value = value.replace(/^["']|["']$/g, '');
          process.env[key] = value;
        }
      });
      console.log(`✅ Variables chargées depuis ${envFile}`);
      envLoaded = true;
    }
  } catch (e) {
    // Continue to next file
  }
}

if (envLoaded) {
  console.log(`   REDIS_URL: ${process.env.REDIS_URL ? 'Trouvé ✓' : 'Non trouvé ✗'}\n`);
} else {
  console.log('ℹ Aucun fichier .env trouvé, utilisation des variables d\'environnement système\n');
}

const VINYLS_KEY = "vinyls:collection";
const USERS_KEY = "users:collection";

async function clearAllData() {
  console.log('🗑️  Suppression de toutes les données...\n');
  
  let redisCleared = false;
  
  // Essayer Redis d'abord
  const redisUrl =
    process.env.REDIS_URL ||
    process.env.UPSTASH_REDIS_REDIS_URL ||
    process.env.STORAGE_URL ||
    process.env.UPSTASH_REDIS_URL;

  if (redisUrl) {
    try {
      console.log('📡 Connexion à Redis...');
      const maskedUrl = redisUrl.replace(/:[^:@]+@/, ':****@');
      console.log(`   URL: ${maskedUrl}`);
      
      const client = createClient({ url: redisUrl });
      
      client.on('error', (err) => {
        console.error('❌ Erreur Redis:', err);
      });

      await client.connect();
      console.log('✅ Connecté à Redis\n');

      // Supprimer les vinyls
      const vinylsDeleted = await client.del(VINYLS_KEY);
      console.log(`✅ Vinyls supprimés (${vinylsDeleted} clé(s) supprimée(s))`);

      // Supprimer les utilisateurs
      const usersDeleted = await client.del(USERS_KEY);
      console.log(`✅ Utilisateurs supprimés (${usersDeleted} clé(s) supprimée(s))`);

      // Essayer de trouver et supprimer d'autres clés liées
      try {
        const allKeys = await client.keys('*');
        const relatedKeys = allKeys.filter(key => 
          key.toLowerCase().includes('vinyl') || 
          key.toLowerCase().includes('user')
        );
        if (relatedKeys.length > 0) {
          await client.del(relatedKeys);
          console.log(`✅ ${relatedKeys.length} clé(s) supplémentaire(s) supprimée(s)`);
        }
      } catch (keysError) {
        console.log('ℹ Impossible de scanner les clés supplémentaires');
      }

      await client.quit();
      console.log('✅ Connexion Redis fermée\n');
      redisCleared = true;
    } catch (error) {
      console.error('❌ Erreur avec Redis:', error.message);
      console.log('ℹ Passage aux fichiers locaux...\n');
    }
  } else {
    console.log('ℹ Aucune URL Redis trouvée dans les variables d\'environnement');
    console.log('ℹ Passage aux fichiers locaux...\n');
  }

  // Nettoyer les fichiers locaux
  const dataDir = path.join(process.cwd(), 'data');
  
  // Créer le répertoire data s'il n'existe pas
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  const vinylsFile = path.join(dataDir, 'vinyls.json');
  const usersFile = path.join(dataDir, 'users.json');

  // Supprimer/créer vinyls.json vide
  fs.writeFileSync(vinylsFile, JSON.stringify([], null, 2), 'utf8');
  console.log('✅ Fichier vinyls.json vidé');

  // Supprimer/créer users.json vide
  fs.writeFileSync(usersFile, JSON.stringify([], null, 2), 'utf8');
  console.log('✅ Fichier users.json vidé');

  console.log('\n' + '='.repeat(50));
  console.log('✅ TOUTES LES DONNÉES ONT ÉTÉ SUPPRIMÉES !');
  console.log('='.repeat(50));
  
  if (redisCleared) {
    console.log('\n📡 Base de données Redis nettoyée');
  }
  console.log('📁 Fichiers locaux nettoyés');
  console.log('\n⚠️  Note: Si vous utilisez Vercel, les données Redis ont été supprimées.');
  console.log('   Rafraîchissez votre application pour voir les changements.\n');
}

clearAllData().catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});

