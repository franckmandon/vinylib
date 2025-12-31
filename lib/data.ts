import { Vinyl } from "@/types/vinyl";
import { randomUUID } from "crypto";
import { createClient, RedisClientType } from "redis";

const VINYLS_KEY = "vinyls:collection";

// Initialize Redis client (singleton pattern for serverless)
let redisClient: RedisClientType | null = null;
let isConnecting = false;

async function getRedisClient(): Promise<RedisClientType | null> {
  // Return existing connected client
  if (redisClient?.isOpen) {
    return redisClient;
  }

  // Prevent multiple simultaneous connection attempts
  if (isConnecting) {
    // Wait a bit and retry
    await new Promise((resolve) => setTimeout(resolve, 100));
    return getRedisClient();
  }

  // Check for Redis URL environment variable
  const redisUrl =
    process.env.REDIS_URL ||
    process.env.UPSTASH_REDIS_REDIS_URL ||
    process.env.STORAGE_URL ||
    process.env.UPSTASH_REDIS_URL;

  if (!redisUrl) {
    return null;
  }

  try {
    isConnecting = true;
    redisClient = createClient({
      url: redisUrl,
    }) as RedisClientType;

    // Handle connection errors
    redisClient.on("error", (err) => {
      console.error("Redis Client Error:", err);
      redisClient = null;
    });

    await redisClient.connect();
    isConnecting = false;
    return redisClient;
  } catch (error) {
    console.error("Error connecting to Redis:", error);
    isConnecting = false;
    redisClient = null;
    return null;
  }
}

// Fallback to file system for local development
let useFileSystem = false;
let fs: typeof import("fs") | null = null;
let path: typeof import("path") | null = null;
let dataFilePath: string | null = null;

// Try to use file system only in local development
if (process.env.NODE_ENV !== "production" && typeof window === "undefined") {
  try {
    fs = require("fs");
    path = require("path");
    dataFilePath = path.join(process.cwd(), "data", "vinyls.json");
    useFileSystem = true;
  } catch {
    // File system not available
  }
}

function getDataDir(): string {
  if (!useFileSystem || !path) return "";
  const dir = path.join(process.cwd(), "data");
  if (!fs?.existsSync(dir)) {
    fs?.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export async function getVinyls(): Promise<Vinyl[]> {
  // Use Redis in production
  const client = await getRedisClient();
  if (client) {
    try {
      const data = await client.get(VINYLS_KEY);
      if (!data) {
        return [];
      }

      const vinyls: Vinyl[] = JSON.parse(data);

      // Migrate old data: convert year to releaseDate if needed
      const migrated = vinyls.map((vinyl) => {
        if ((vinyl as any).year && !vinyl.releaseDate) {
          vinyl.releaseDate = `${(vinyl as any).year}-01-01`;
          delete (vinyl as any).year;
        }
        return vinyl;
      });

      // Save migrated data if any changes were made
      if (JSON.stringify(vinyls) !== JSON.stringify(migrated)) {
        await saveVinyls(migrated);
      }

      return migrated;
    } catch (error) {
      console.error("Error reading vinyls from Redis:", error);
      return [];
    }
  }

  // Fallback to file system for local development
  if (useFileSystem && fs && dataFilePath) {
    getDataDir();
    if (!fs.existsSync(dataFilePath)) {
      return [];
    }
    try {
      const fileData = fs.readFileSync(dataFilePath, "utf8");
      const vinyls: any[] = JSON.parse(fileData);

      // Migrate old data
      const migrated = vinyls.map((vinyl) => {
        if (vinyl.year && !vinyl.releaseDate) {
          vinyl.releaseDate = `${vinyl.year}-01-01`;
          delete vinyl.year;
        }
        return vinyl;
      });

      if (JSON.stringify(vinyls) !== JSON.stringify(migrated)) {
        saveVinylsSync(migrated);
      }

      return migrated;
    } catch (error) {
      console.error("Error reading vinyls data:", error);
      return [];
    }
  }

  return [];
}

async function saveVinyls(vinyls: Vinyl[]): Promise<void> {
  // Use Redis in production
  const client = await getRedisClient();
  if (client) {
    try {
      await client.set(VINYLS_KEY, JSON.stringify(vinyls));
    } catch (error) {
      console.error("Error saving vinyls to Redis:", error);
      throw error;
    }
    return;
  }

  // Fallback to file system for local development
  if (useFileSystem && fs && dataFilePath) {
    saveVinylsSync(vinyls);
  }
}

function saveVinylsSync(vinyls: Vinyl[]): void {
  if (!useFileSystem || !fs || !dataFilePath) return;
  getDataDir();
  fs.writeFileSync(dataFilePath, JSON.stringify(vinyls, null, 2), "utf8");
}

export async function getVinylById(id: string): Promise<Vinyl | undefined> {
  const vinyls = await getVinyls();
  return vinyls.find((v) => v.id === id);
}

export async function addVinyl(
  vinyl: Omit<Vinyl, "id" | "createdAt" | "updatedAt">
): Promise<Vinyl> {
  const vinyls = await getVinyls();
  const newVinyl: Vinyl = {
    ...vinyl,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  vinyls.push(newVinyl);
  await saveVinyls(vinyls);
  return newVinyl;
}

export async function updateVinyl(
  id: string,
  updates: Partial<Vinyl>
): Promise<Vinyl | null> {
  const vinyls = await getVinyls();
  const index = vinyls.findIndex((v) => v.id === id);
  if (index === -1) {
    return null;
  }
  vinyls[index] = {
    ...vinyls[index],
    ...updates,
    id, // Ensure ID doesn't change
    updatedAt: new Date().toISOString(),
  };
  await saveVinyls(vinyls);
  return vinyls[index];
}

export async function deleteVinyl(id: string): Promise<boolean> {
  const vinyls = await getVinyls();
  const filtered = vinyls.filter((v) => v.id !== id);
  if (filtered.length === vinyls.length) {
    return false;
  }
  await saveVinyls(filtered);
  return true;
}
