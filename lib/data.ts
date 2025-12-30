import { Vinyl } from "@/types/vinyl";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

const dataFilePath = path.join(process.cwd(), "data", "vinyls.json");

export function getDataDir(): string {
  const dir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export function getVinyls(): Vinyl[] {
  getDataDir();
  if (!fs.existsSync(dataFilePath)) {
    return [];
  }
  try {
    const fileData = fs.readFileSync(dataFilePath, "utf8");
    const vinyls: any[] = JSON.parse(fileData);
    
    // Migrate old data: convert year to releaseDate if needed
    const migrated = vinyls.map((vinyl) => {
      if (vinyl.year && !vinyl.releaseDate) {
        // Convert year to releaseDate (use January 1st of that year)
        vinyl.releaseDate = `${vinyl.year}-01-01`;
        delete vinyl.year;
      }
      return vinyl;
    });
    
    // Save migrated data if any changes were made
    if (JSON.stringify(vinyls) !== JSON.stringify(migrated)) {
      saveVinyls(migrated);
    }
    
    return migrated;
  } catch (error) {
    console.error("Error reading vinyls data:", error);
    return [];
  }
}

export function saveVinyls(vinyls: Vinyl[]): void {
  getDataDir();
  fs.writeFileSync(dataFilePath, JSON.stringify(vinyls, null, 2), "utf8");
}

export function getVinylById(id: string): Vinyl | undefined {
  const vinyls = getVinyls();
  return vinyls.find((v) => v.id === id);
}

export function addVinyl(vinyl: Omit<Vinyl, "id" | "createdAt" | "updatedAt">): Vinyl {
  const vinyls = getVinyls();
  const newVinyl: Vinyl = {
    ...vinyl,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  vinyls.push(newVinyl);
  saveVinyls(vinyls);
  return newVinyl;
}

export function updateVinyl(id: string, updates: Partial<Vinyl>): Vinyl | null {
  const vinyls = getVinyls();
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
  saveVinyls(vinyls);
  return vinyls[index];
}

export function deleteVinyl(id: string): boolean {
  const vinyls = getVinyls();
  const filtered = vinyls.filter((v) => v.id !== id);
  if (filtered.length === vinyls.length) {
    return false;
  }
  saveVinyls(filtered);
  return true;
}


