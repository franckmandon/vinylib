/**
 * Script to clear all data from Redis and local files
 * 
 * Usage:
 *   node scripts/clear-all-data.js
 * 
 * Or with Redis URL:
 *   REDIS_URL="your-redis-url" node scripts/clear-all-data.js
 */

const { createClient } = require('redis');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const VINYLS_KEY = "vinyls:collection";
const USERS_KEY = "users:collection";

async function clearAllData() {
  let redisCleared = false;
  
  // Try Redis first
  const redisUrl =
    process.env.REDIS_URL ||
    process.env.UPSTASH_REDIS_REDIS_URL ||
    process.env.STORAGE_URL ||
    process.env.UPSTASH_REDIS_URL;

  if (redisUrl) {
    try {
      console.log('Connecting to Redis...');
      console.log('Redis URL:', redisUrl.replace(/:[^:@]+@/, ':****@')); // Hide password
      
      const client = createClient({ url: redisUrl });
      
      client.on('error', (err) => {
        console.error('Redis Client Error:', err);
      });

      await client.connect();
      console.log('✓ Connected to Redis');

      // Delete vinyls
      const vinylsDeleted = await client.del(VINYLS_KEY);
      console.log(`✓ Deleted vinyls key (${vinylsDeleted} key(s) deleted)`);

      // Delete users
      const usersDeleted = await client.del(USERS_KEY);
      console.log(`✓ Deleted users key (${usersDeleted} key(s) deleted)`);

      // Try to find and delete any other related keys
      try {
        const allKeys = await client.keys('*');
        const relatedKeys = allKeys.filter(key => 
          key.includes('vinyl') || key.includes('user')
        );
        if (relatedKeys.length > 0) {
          await client.del(relatedKeys);
          console.log(`✓ Deleted ${relatedKeys.length} additional related key(s)`);
        }
      } catch (keysError) {
        console.log('ℹ Could not scan for additional keys (non-fatal)');
      }

      await client.quit();
      console.log('✓ Redis connection closed');
      redisCleared = true;
    } catch (error) {
      console.error('✗ Error with Redis:', error.message);
    }
  } else {
    console.log('ℹ No Redis URL found in environment variables');
  }

  // Clear local files
  const dataDir = path.join(process.cwd(), 'data');
  
  // Create data directory if it doesn't exist
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  const vinylsFile = path.join(dataDir, 'vinyls.json');
  const usersFile = path.join(dataDir, 'users.json');

  if (fs.existsSync(vinylsFile)) {
    fs.writeFileSync(vinylsFile, JSON.stringify([], null, 2), 'utf8');
    console.log('✓ Cleared local vinyls.json');
  } else {
    // Create empty file
    fs.writeFileSync(vinylsFile, JSON.stringify([], null, 2), 'utf8');
    console.log('✓ Created empty vinyls.json');
  }

  if (fs.existsSync(usersFile)) {
    fs.writeFileSync(usersFile, JSON.stringify([], null, 2), 'utf8');
    console.log('✓ Cleared local users.json');
  } else {
    // Create empty file
    fs.writeFileSync(usersFile, JSON.stringify([], null, 2), 'utf8');
    console.log('✓ Created empty users.json');
  }

  console.log('\n✅ All data cleared successfully!');
  if (redisCleared) {
    console.log('   Redis database has been cleared.');
  }
  console.log('   Local files have been cleared.');
  console.log('\n⚠️  Note: If you are using Vercel, you may need to clear the cache or redeploy.');
}

clearAllData().catch(console.error);

