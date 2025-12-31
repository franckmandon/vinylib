/**
 * Script pour nettoyer uniquement Redis
 * Utilise dotenv pour charger les variables d'environnement
 */

const { createClient } = require('redis');
const fs = require('fs');
const path = require('path');

// Charger dotenv si disponible
try {
  require('dotenv').config({ path: '.env.local' });
  require('dotenv').config({ path: '.env.development.local' });
  require('dotenv').config({ path: '.env' });
} catch (e) {
  // dotenv n'est pas installé, on charge manuellement
  const envFiles = ['.env.local', '.env.development.local', '.env'];
  for (const envFile of envFiles) {
    try {
      const envPath = path.join(process.cwd(), envFile);
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
          line = line.trim();
          if (!line || line.startsWith('#')) return;
          const match = line.match(/^([^#=]+)=(.*)$/);
          if (match) {
            const key = match[1].trim();
            let value = match[2].trim();
            value = value.replace(/^["']|["']$/g, '');
            process.env[key] = value;
          }
        });
      }
    } catch (e) {
      // Continue
    }
  }
}

const VINYLS_KEY = "vinyls:collection";
const USERS_KEY = "users:collection";
const RESET_TOKENS_KEY = "reset_tokens:collection";

async function clearRedis() {
  console.log('🗑️  Nettoyage de Redis...\n');
  
  const redisUrl =
    process.env.REDIS_URL ||
    process.env.UPSTASH_REDIS_REDIS_URL ||
    process.env.STORAGE_URL ||
    process.env.UPSTASH_REDIS_URL;

  if (!redisUrl) {
    console.log('❌ Aucune URL Redis trouvée dans les variables d\'environnement');
    console.log('   Variables recherchées: REDIS_URL, UPSTASH_REDIS_REDIS_URL, STORAGE_URL, UPSTASH_REDIS_URL');
    return;
  }

  try {
    console.log('📡 Connexion à Redis...');
    const maskedUrl = redisUrl.replace(/:[^:@]+@/, ':****@');
    console.log(`   URL: ${maskedUrl}\n`);
    
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

    // Supprimer les tokens de réinitialisation
    const tokensDeleted = await client.del(RESET_TOKENS_KEY);
    console.log(`✅ Tokens de réinitialisation supprimés (${tokensDeleted} clé(s) supprimée(s))`);

    // Essayer de trouver et supprimer d'autres clés liées
    try {
      const allKeys = await client.keys('*');
      const relatedKeys = allKeys.filter(key => 
        key.toLowerCase().includes('vinyl') || 
        key.toLowerCase().includes('user') ||
        key.toLowerCase().includes('reset')
      );
      if (relatedKeys.length > 0) {
        await client.del(relatedKeys);
        console.log(`✅ ${relatedKeys.length} clé(s) supplémentaire(s) supprimée(s)`);
      }
    } catch (keysError) {
      console.log('ℹ Impossible de scanner les clés supplémentaires');
    }

    await client.quit();
    console.log('\n✅ Connexion Redis fermée');
    console.log('\n' + '='.repeat(50));
    console.log('✅ REDIS NETTOYÉ AVEC SUCCÈS !');
    console.log('='.repeat(50) + '\n');
  } catch (error) {
    console.error('❌ Erreur avec Redis:', error.message);
    process.exit(1);
  }
}

clearRedis().catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});

