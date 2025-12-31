import { Vinyl } from "@/types/vinyl";
import { User } from "@/types/user";
import { randomUUID } from "crypto";
import { createClient } from "redis";
import bcrypt from "bcryptjs";

const VINYLS_KEY = "vinyls:collection";
const USERS_KEY = "users:collection";

// Initialize Redis client (singleton pattern for serverless)
let redisClient: ReturnType<typeof createClient> | null = null;
let isConnecting = false;

async function getRedisClient(): Promise<ReturnType<typeof createClient> | null> {
  // In serverless environments, connections may be reused but we should reconnect if needed
  // Return existing client if available and connected
  if (redisClient) {
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
    });

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
    const pathModule = require("path");
    path = pathModule;
    dataFilePath = pathModule.join(process.cwd(), "data", "vinyls.json");
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
  vinyl: Omit<Vinyl, "id" | "createdAt" | "updatedAt" | "username" | "owners">,
  userId: string
): Promise<Vinyl> {
  // Get user to populate username
  const user = await getUserById(userId);
  if (!user) {
    throw new Error("User not found");
  }
  
  const vinyls = await getVinyls();
  
  // Check for duplicate by EAN if EAN is provided
  if (vinyl.ean && vinyl.ean.trim()) {
    const eanToSearch = vinyl.ean.trim();
    const existingVinyl = vinyls.find(
      (v) => v.ean && v.ean.trim() === eanToSearch
    );
    
    if (existingVinyl) {
      // Check if user already owns this vinyl
      const alreadyOwns = existingVinyl.owners?.some(o => o.userId === userId) || 
                         existingVinyl.userId === userId;
      
      if (alreadyOwns) {
        throw new Error("You already own this vinyl");
      }
      
      // Add user to owners list
      if (!existingVinyl.owners) {
        existingVinyl.owners = [];
        // Add the original owner to the list
        if (existingVinyl.userId && existingVinyl.username) {
          existingVinyl.owners.push({
            userId: existingVinyl.userId,
            username: existingVinyl.username,
            addedAt: existingVinyl.createdAt,
          });
        }
      }
      
      // Add the new owner
      existingVinyl.owners.push({
        userId: user.id,
        username: user.username,
        addedAt: new Date().toISOString(),
      });
      
      // Update the vinyl
      existingVinyl.updatedAt = new Date().toISOString();
      
      // Save and return
      await saveVinyls(vinyls);
      return existingVinyl;
    }
  }
  
  // No duplicate found, create new vinyl
  const newVinyl: Vinyl = {
    ...vinyl,
    userId,
    username: user.username,
    owners: [{
      userId: user.id,
      username: user.username,
      addedAt: new Date().toISOString(),
    }],
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

export async function deleteVinyl(id: string, userId?: string): Promise<boolean> {
  const vinyls = await getVinyls();
  const vinylIndex = vinyls.findIndex((v) => v.id === id);
  
  if (vinylIndex === -1) {
    return false;
  }
  
  const vinyl = vinyls[vinylIndex];
  
  // If userId is provided, remove only that user from owners (partial deletion)
  if (userId) {
    // Collect all owner IDs (from userId field and owners array)
    const allOwnerIds = new Set<string>();
    if (vinyl.userId) {
      allOwnerIds.add(vinyl.userId);
    }
    if (vinyl.owners) {
      vinyl.owners.forEach(o => allOwnerIds.add(o.userId));
    }
    
    // If there's only one owner total, delete the vinyl completely
    if (allOwnerIds.size <= 1) {
      vinyls.splice(vinylIndex, 1);
      await saveVinyls(vinyls);
      return true;
    }
    
    // Multiple owners: remove user from owners array if present
    if (vinyl.owners) {
      vinyl.owners = vinyl.owners.filter(o => o.userId !== userId);
    }
    
    // If the user being removed is the primary userId, transfer ownership
    if (vinyl.userId === userId) {
      if (vinyl.owners && vinyl.owners.length > 0) {
        // Transfer to first owner in array
        const newPrimaryOwner = vinyl.owners[0];
        vinyl.userId = newPrimaryOwner.userId;
        vinyl.username = newPrimaryOwner.username;
        // Remove the new primary owner from owners array (since they're now the primary)
        vinyl.owners = vinyl.owners.filter(o => o.userId !== newPrimaryOwner.userId);
      } else {
        // No other owners, delete completely (shouldn't happen due to size check, but safety)
        vinyls.splice(vinylIndex, 1);
        await saveVinyls(vinyls);
        return true;
      }
    }
    
    vinyl.updatedAt = new Date().toISOString();
    await saveVinyls(vinyls);
    return true;
  }
  
  // No userId provided: delete vinyl completely (backward compatibility)
  vinyls.splice(vinylIndex, 1);
  await saveVinyls(vinyls);
  return true;
}

// User management functions
async function getUsers(): Promise<User[]> {
  const client = await getRedisClient();
  if (client) {
    try {
      const data = await client.get(USERS_KEY);
      if (!data) {
        return [];
      }
      return JSON.parse(data);
    } catch (error) {
      console.error("Error reading users from Redis:", error);
      return [];
    }
  }

  // Fallback to file system for local development
  if (useFileSystem && fs && path) {
    const usersFilePath = path.join(getDataDir(), "users.json");
    if (!fs.existsSync(usersFilePath)) {
      return [];
    }
    try {
      const fileData = fs.readFileSync(usersFilePath, "utf8");
      return JSON.parse(fileData);
    } catch (error) {
      console.error("Error reading users data:", error);
      return [];
    }
  }

  return [];
}

async function saveUsers(users: User[]): Promise<void> {
  const client = await getRedisClient();
  if (client) {
    try {
      await client.set(USERS_KEY, JSON.stringify(users));
    } catch (error) {
      console.error("Error saving users to Redis:", error);
      throw error;
    }
    return;
  }

  // Fallback to file system for local development
  if (useFileSystem && fs && path) {
    const usersFilePath = path.join(getDataDir(), "users.json");
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2), "utf8");
  }
}

// Clear all data functions
export async function clearAllVinyls(): Promise<void> {
  const client = await getRedisClient();
  if (client) {
    try {
      await client.del(VINYLS_KEY);
    } catch (error) {
      console.error("Error clearing vinyls from Redis:", error);
      throw error;
    }
    return;
  }

  // Fallback to file system for local development
  if (useFileSystem && fs && dataFilePath) {
    if (fs.existsSync(dataFilePath)) {
      fs.writeFileSync(dataFilePath, JSON.stringify([], null, 2), "utf8");
    }
  }
}

export async function clearAllUsers(): Promise<void> {
  const client = await getRedisClient();
  if (client) {
    try {
      await client.del(USERS_KEY);
    } catch (error) {
      console.error("Error clearing users from Redis:", error);
      throw error;
    }
    return;
  }

  // Fallback to file system for local development
  if (useFileSystem && fs && path) {
    const usersFilePath = path.join(getDataDir(), "users.json");
    if (fs.existsSync(usersFilePath)) {
      fs.writeFileSync(usersFilePath, JSON.stringify([], null, 2), "utf8");
    }
  }
}

export async function clearAllData(): Promise<void> {
  await Promise.all([
    clearAllVinyls(),
    clearAllUsers(),
  ]);
}

export async function createUser(
  email: string,
  username: string,
  password: string
): Promise<User> {
  const users = await getUsers();

  // Check if user already exists
  if (users.some((u) => u.email === email)) {
    throw new Error("User with this email already exists");
  }
  if (users.some((u) => u.username === username)) {
    throw new Error("User with this username already exists");
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  const newUser: User = {
    id: randomUUID(),
    email,
    username,
    password: passwordHash,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  users.push(newUser);
  await saveUsers(users);
  return newUser;
}

export async function getUserById(id: string): Promise<User | undefined> {
  const users = await getUsers();
  return users.find((u) => u.id === id);
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const users = await getUsers();
  return users.find((u) => u.email === email);
}

export async function getUserByUsername(username: string): Promise<User | undefined> {
  const users = await getUsers();
  return users.find((u) => u.username === username);
}

export async function verifyUser(
  emailOrUsername: string,
  password: string
): Promise<User | null> {
  try {
    const users = await getUsers();
    const user = users.find(
      (u) => u.email === emailOrUsername || u.username === emailOrUsername
    );

    if (!user) {
      return null;
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return null;
    }

    return user;
  } catch (error) {
    console.error("[verifyUser] Error:", error);
    return null;
  }
}

export async function getUserPublic(id: string): Promise<{ id: string; username: string; email: string } | null> {
  const user = await getUserById(id);
  if (!user) {
    return null;
  }
  return {
    id: user.id,
    username: user.username,
    email: user.email,
  };
}

export async function deleteUser(userId: string): Promise<boolean> {
  try {
    // Get user's vinyls
    const userVinyls = await getUserVinyls(userId);
    
    // Remove user from all vinyls (or delete vinyls if user is the only owner)
    for (const vinyl of userVinyls) {
      await deleteVinyl(vinyl.id, userId);
    }
    
    // Remove user from users list
    const users = await getUsers();
    const filteredUsers = users.filter(u => u.id !== userId);
    
    if (filteredUsers.length === users.length) {
      // User not found
      return false;
    }
    
    await saveUsers(filteredUsers);
    
    // Remove user's reset tokens
    const tokens = await getResetTokens();
    const filteredTokens = tokens.filter(t => t.userId !== userId);
    await saveResetTokens(filteredTokens);
    
    return true;
  } catch (error) {
    console.error("Error deleting user:", error);
    return false;
  }
}

// Password reset functions
const RESET_TOKENS_KEY = "reset_tokens:collection";

async function getResetTokens(): Promise<Array<{ token: string; userId: string; email: string; expiresAt: string }>> {
  const client = await getRedisClient();
  if (client) {
    try {
      const data = await client.get(RESET_TOKENS_KEY);
      if (!data) {
        return [];
      }
      return JSON.parse(data);
    } catch (error) {
      console.error("Error reading reset tokens from Redis:", error);
      return [];
    }
  }

  // Fallback to file system for local development
  if (useFileSystem && fs && path) {
    const tokensFilePath = path.join(getDataDir(), "reset_tokens.json");
    if (!fs.existsSync(tokensFilePath)) {
      return [];
    }
    try {
      const fileData = fs.readFileSync(tokensFilePath, "utf8");
      return JSON.parse(fileData);
    } catch (error) {
      console.error("Error reading reset tokens data:", error);
      return [];
    }
  }

  return [];
}

async function saveResetTokens(tokens: Array<{ token: string; userId: string; email: string; expiresAt: string }>): Promise<void> {
  const client = await getRedisClient();
  if (client) {
    try {
      await client.set(RESET_TOKENS_KEY, JSON.stringify(tokens));
    } catch (error) {
      console.error("Error saving reset tokens to Redis:", error);
      throw error;
    }
    return;
  }

  // Fallback to file system for local development
  if (useFileSystem && fs && path) {
    const tokensFilePath = path.join(getDataDir(), "reset_tokens.json");
    fs.writeFileSync(tokensFilePath, JSON.stringify(tokens, null, 2), "utf8");
  }
}

export async function createResetToken(email: string): Promise<string | null> {
  const user = await getUserByEmail(email);
  if (!user) {
    // Don't reveal if user exists or not for security
    return null;
  }

  const tokens = await getResetTokens();
  
  // Remove expired tokens
  const now = new Date().getTime();
  const validTokens = tokens.filter(t => new Date(t.expiresAt).getTime() > now);
  
  // Generate new token
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
  
  validTokens.push({
    token,
    userId: user.id,
    email: user.email,
    expiresAt: expiresAt.toISOString(),
  });
  
  await saveResetTokens(validTokens);
  return token;
}

export async function validateResetToken(token: string): Promise<{ userId: string; email: string } | null> {
  const tokens = await getResetTokens();
  const now = new Date().getTime();
  
  const tokenData = tokens.find(t => t.token === token);
  if (!tokenData) {
    return null;
  }
  
  // Check if token is expired
  if (new Date(tokenData.expiresAt).getTime() <= now) {
    // Remove expired token
    const validTokens = tokens.filter(t => t.token !== token);
    await saveResetTokens(validTokens);
    return null;
  }
  
  return {
    userId: tokenData.userId,
    email: tokenData.email,
  };
}

export async function resetPassword(token: string, newPassword: string): Promise<boolean> {
  try {
    console.log("resetPassword called with token:", token.substring(0, 8) + "...");
    
    const tokenData = await validateResetToken(token);
    if (!tokenData) {
      console.log("Token validation failed");
      return false;
    }
    
    console.log("Token validated for user:", tokenData.userId);
    
    const user = await getUserById(tokenData.userId);
    if (!user) {
      console.log("User not found:", tokenData.userId);
      return false;
    }
    
    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);
    
    // Update user password
    const users = await getUsers();
    const userIndex = users.findIndex(u => u.id === user.id);
    if (userIndex === -1) {
      console.log("User index not found");
      return false;
    }
    
    users[userIndex].password = passwordHash;
    users[userIndex].updatedAt = new Date().toISOString();
    await saveUsers(users);
    
    console.log("Password updated successfully");
    
    // Remove used token
    const tokens = await getResetTokens();
    const validTokens = tokens.filter(t => t.token !== token);
    await saveResetTokens(validTokens);
    
    console.log("Token removed");
    
    return true;
  } catch (error) {
    console.error("Error in resetPassword:", error);
    return false;
  }
}

// Get user's vinyls (including vinyls where user is in owners list)
export async function getUserVinyls(userId: string): Promise<Vinyl[]> {
  const vinyls = await getVinyls();
  return vinyls.filter((v) => 
    v.userId === userId || 
    v.owners?.some(o => o.userId === userId)
  );
}

// Get public vinyls (for non-logged-in users) - deduplicated by EAN
export async function getPublicVinyls(limit: number = 50): Promise<Vinyl[]> {
  const vinyls = await getVinyls();
  
  // Deduplicate by EAN - keep only one vinyl per EAN
  const uniqueVinyls = new Map<string, Vinyl>();
  
  for (const vinyl of vinyls) {
    if (vinyl.ean && vinyl.ean.trim()) {
      const ean = vinyl.ean.trim();
      if (!uniqueVinyls.has(ean)) {
        uniqueVinyls.set(ean, vinyl);
      } else {
        // Merge owners if duplicate found
        const existing = uniqueVinyls.get(ean)!;
        if (vinyl.owners) {
          if (!existing.owners) {
            existing.owners = [];
            if (existing.userId) {
              const user = await getUserById(existing.userId);
              if (user) {
                existing.username = user.username;
                existing.owners.push({
                  userId: existing.userId,
                  username: user.username,
                  addedAt: existing.createdAt,
                });
              }
            }
          }
          // Add owners from duplicate vinyl
          for (const owner of vinyl.owners) {
            if (!existing.owners.some(o => o.userId === owner.userId)) {
              existing.owners.push(owner);
            }
          }
        }
      }
    } else {
      // Vinyls without EAN are kept as-is
      uniqueVinyls.set(vinyl.id, vinyl);
    }
  }
  
  // Convert map to array, sort by createdAt descending and limit
  const sorted = Array.from(uniqueVinyls.values())
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
  
  // Populate username/owners if not present
  for (const vinyl of sorted) {
    // Ensure owners array exists
    if (!vinyl.owners) {
      vinyl.owners = [];
      if (vinyl.userId) {
        const user = await getUserById(vinyl.userId);
        if (user) {
          vinyl.username = user.username;
          vinyl.owners.push({
            userId: user.id,
            username: user.username,
            addedAt: vinyl.createdAt,
          });
        }
      }
    } else {
      // Populate missing usernames in owners
      for (const owner of vinyl.owners) {
        if (!owner.username) {
          const user = await getUserById(owner.userId);
          if (user) {
            owner.username = user.username;
          }
        }
      }
    }
  }
  
  return sorted;
}
