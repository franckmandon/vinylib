import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserVinyls } from "@/lib/data";
import { Vinyl } from "@/types/vinyl";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface DashboardStats {
  // Main stats
  totalVinyls: number;
  estimatedValue: number;
  totalInvested: number;
  collectionStartDate: string | null;
  collectionAgeMonths: number;
  currentStreak: number;
  
  // Value stats
  highestValue: number;
  lowestValue: number;
  averageValue: number;
  valueOverTime: Array<{ month: string; value: number }>;
  
  // Acquisition stats
  addedThisMonth: number;
  acquisitionsByMonth: Array<{ month: string; count: number }>;
  investmentsByMonth: Array<{ month: string; amount: number }>;
  latestAdditions: Array<{
    id: string;
    artist: string;
    album: string;
    albumArt?: string;
    addedAt: string;
  }>;
  
  // Distributions
  genreDistribution: Array<{ genre: string; count: number }>;
  decadeDistribution: Array<{ decade: string; count: number }>;
  conditionDistribution: Array<{ condition: string; count: number }>;
  topLabels: Array<{ label: string; count: number }>;
  
  // Artists
  topArtists: Array<{ artist: string; count: number }>;
  discographyStatus: Array<{
    artist: string;
    owned: number;
    missing: number;
    isComplete: boolean;
  }>;
  
  // Rarity
  rarestVinyl: {
    id: string;
    artist: string;
    album: string;
    ownerCount: number;
  } | null;
  rarityDistribution: Array<{ rarity: string; count: number }>;
  
  // Timeline
  releaseYearTimeline: Array<{ year: number; count: number }>;
  
  // Comparisons
  estimatedWeight: number; // in kg
  estimatedLength: number; // in meters
  
  // To do
  missingCoverArt: number;
  missingDescription: number;
  missingData: Array<{ id: string; artist: string; album: string; missingFields: string[] }>;
  
  // Badges
  badges: {
    collector: { level: number; name: string };
    treasureHunter: { level: number; name: string };
    timeTraveler: boolean;
    completionist: { level: number; name: string };
  };
}

function getDecade(year: number | undefined): string {
  if (!year) return "Unknown";
  const decade = Math.floor(year / 10) * 10;
  return `${decade}s`;
}

function calculateStreak(vinyls: Vinyl[], userId: string): number {
  // Get all added dates for the user
  const addedDates = new Set<string>();
  
  for (const vinyl of vinyls) {
    // Check if user owns this vinyl
    const isOwner = vinyl.userId === userId || vinyl.owners?.some(o => o.userId === userId);
    if (!isOwner) continue;
    
    // Get the date when user added this vinyl
    let addedAt: string;
    if (vinyl.userId === userId) {
      addedAt = vinyl.createdAt;
    } else {
      const owner = vinyl.owners?.find(o => o.userId === userId);
      addedAt = owner?.addedAt || vinyl.createdAt;
    }
    
    const date = new Date(addedAt);
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    addedDates.add(dateStr);
  }
  
  // Sort dates descending
  const sortedDates = Array.from(addedDates).sort((a, b) => b.localeCompare(a));
  
  // Calculate consecutive days
  if (sortedDates.length === 0) return 0;
  
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < sortedDates.length; i++) {
    const date = new Date(sortedDates[i]);
    date.setHours(0, 0, 0, 0);
    
    const expectedDate = new Date(today);
    expectedDate.setDate(today.getDate() - i);
    
    if (date.getTime() === expectedDate.getTime()) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}

function getCollectionStartDate(vinyls: Vinyl[], userId: string): string | null {
  let earliestDate: Date | null = null;
  
  for (const vinyl of vinyls) {
    const isOwner = vinyl.userId === userId || vinyl.owners?.some(o => o.userId === userId);
    if (!isOwner) continue;
    
    let addedAt: string;
    if (vinyl.userId === userId) {
      addedAt = vinyl.createdAt;
    } else {
      const owner = vinyl.owners?.find(o => o.userId === userId);
      addedAt = owner?.addedAt || vinyl.createdAt;
    }
    
    const date = new Date(addedAt);
    if (!earliestDate || date < earliestDate) {
      earliestDate = date;
    }
  }
  
  return earliestDate ? earliestDate.toISOString() : null;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const allVinyls = await getUserVinyls(userId);
    
    if (allVinyls.length === 0) {
      return NextResponse.json({
        totalVinyls: 0,
        estimatedValue: 0,
        totalInvested: 0,
        collectionStartDate: null,
        collectionAgeMonths: 0,
        currentStreak: 0,
        highestValue: 0,
        lowestValue: 0,
        averageValue: 0,
        valueOverTime: [],
        addedThisMonth: 0,
        acquisitionsByMonth: [],
        investmentsByMonth: [],
        latestAdditions: [],
        genreDistribution: [],
        decadeDistribution: [],
        conditionDistribution: [],
        topLabels: [],
        topArtists: [],
        discographyStatus: [],
        rarestVinyl: null,
        rarityDistribution: [],
        releaseYearTimeline: [],
        estimatedWeight: 0,
        estimatedLength: 0,
        missingCoverArt: 0,
        missingDescription: 0,
        missingData: [],
        badges: {
          collector: { level: 0, name: "Novice" },
          treasureHunter: { level: 0, name: "Starter" },
          timeTraveler: false,
          completionist: { level: 0, name: "Beginner" },
        },
      });
    }

    // Filter vinyls owned by this user
    const userVinyls = allVinyls.filter(v => 
      v.userId === userId || v.owners?.some(o => o.userId === userId)
    );

    // Get user-specific data for each vinyl
    const vinylsWithUserData = userVinyls.map(vinyl => {
      let purchasePrice = 0;
      let addedAt = vinyl.createdAt;
      let condition = vinyl.condition;
      
      if (vinyl.userId === userId) {
        // User is primary owner
        const owner = vinyl.owners?.find(o => o.userId === userId);
        purchasePrice = owner?.purchasePrice || 0;
        addedAt = owner?.addedAt || vinyl.createdAt;
        condition = owner?.condition || vinyl.condition || condition;
      } else {
        // User is in owners array
        const owner = vinyl.owners?.find(o => o.userId === userId);
        if (owner) {
          purchasePrice = owner.purchasePrice || 0;
          addedAt = owner.addedAt;
          condition = owner.condition || condition;
        }
      }
      
      return {
        ...vinyl,
        purchasePrice,
        addedAt,
        condition,
      };
    });

    // Main stats
    const totalVinyls = vinylsWithUserData.length;
    const totalInvested = vinylsWithUserData.reduce((sum, v) => sum + (v.purchasePrice || 0), 0);
    const estimatedValue = totalInvested; // For now, use purchase price as estimated value
    
    const collectionStartDate = getCollectionStartDate(userVinyls, userId);
    const collectionAgeMonths = collectionStartDate 
      ? Math.floor((Date.now() - new Date(collectionStartDate).getTime()) / (1000 * 60 * 60 * 24 * 30))
      : 0;
    
    const currentStreak = calculateStreak(userVinyls, userId);

    // Value stats
    const prices = vinylsWithUserData.map(v => v.purchasePrice || 0).filter(p => p > 0);
    const highestValue = prices.length > 0 ? Math.max(...prices) : 0;
    const lowestValue = prices.length > 0 ? Math.min(...prices) : 0;
    const averageValue = prices.length > 0 ? Math.round((prices.reduce((a, b) => a + b, 0) / prices.length) * 100) / 100 : 0;

    // Value over time (by month)
    const valueByMonth = new Map<string, number>();
    vinylsWithUserData.forEach(vinyl => {
      const date = new Date(vinyl.addedAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const current = valueByMonth.get(monthKey) || 0;
      valueByMonth.set(monthKey, current + (vinyl.purchasePrice || 0));
    });
    
    // Calculate cumulative value
    const sortedMonths = Array.from(valueByMonth.keys()).sort();
    let cumulativeValue = 0;
    const valueOverTime = sortedMonths.map(month => {
      cumulativeValue += valueByMonth.get(month) || 0;
      return { month, value: Math.round(cumulativeValue * 100) / 100 };
    });

    // Acquisition stats
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const addedThisMonth = vinylsWithUserData.filter(v => {
      const date = new Date(v.addedAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      return monthKey === thisMonth;
    }).length;

    const acquisitionsByMonthMap = new Map<string, number>();
    vinylsWithUserData.forEach(vinyl => {
      const date = new Date(vinyl.addedAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      acquisitionsByMonthMap.set(monthKey, (acquisitionsByMonthMap.get(monthKey) || 0) + 1);
    });
    
    const acquisitionsByMonth = Array.from(acquisitionsByMonthMap.entries())
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));

    const investmentsByMonthMap = new Map<string, number>();
    vinylsWithUserData.forEach(vinyl => {
      if (vinyl.purchasePrice && vinyl.purchasePrice > 0) {
        const date = new Date(vinyl.addedAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        investmentsByMonthMap.set(monthKey, (investmentsByMonthMap.get(monthKey) || 0) + (vinyl.purchasePrice || 0));
      }
    });
    
    const investmentsByMonth = Array.from(investmentsByMonthMap.entries())
      .map(([month, amount]) => ({ month, amount: Math.round(amount * 100) / 100 }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Latest additions (5-10)
    const latestAdditions = vinylsWithUserData
      .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
      .slice(0, 10)
      .map(v => ({
        id: v.id,
        artist: v.artist,
        album: v.album,
        albumArt: v.albumArt,
        addedAt: v.addedAt,
      }));

    // Genre distribution
    const genreMap = new Map<string, number>();
    vinylsWithUserData.forEach(vinyl => {
      if (vinyl.genre) {
        genreMap.set(vinyl.genre, (genreMap.get(vinyl.genre) || 0) + 1);
      }
    });
    const genreDistribution = Array.from(genreMap.entries())
      .map(([genre, count]) => ({ genre, count }))
      .sort((a, b) => b.count - a.count);

    // Decade distribution
    const decadeMap = new Map<string, number>();
    vinylsWithUserData.forEach(vinyl => {
      if (vinyl.releaseDate) {
        const year = new Date(vinyl.releaseDate).getFullYear();
        const decade = getDecade(year);
        decadeMap.set(decade, (decadeMap.get(decade) || 0) + 1);
      }
    });
    const decadeDistribution = Array.from(decadeMap.entries())
      .map(([decade, count]) => ({ decade, count }))
      .sort((a, b) => {
        // Sort by decade number
        const decadeA = parseInt(a.decade) || 0;
        const decadeB = parseInt(b.decade) || 0;
        return decadeB - decadeA;
      });

    // Condition distribution
    const conditionMap = new Map<string, number>();
    vinylsWithUserData.forEach(vinyl => {
      const condition = vinyl.condition || "Unknown";
      conditionMap.set(condition, (conditionMap.get(condition) || 0) + 1);
    });
    const conditionDistribution = Array.from(conditionMap.entries())
      .map(([condition, count]) => ({ condition, count }))
      .sort((a, b) => b.count - a.count);

    // Top labels
    const labelMap = new Map<string, number>();
    vinylsWithUserData.forEach(vinyl => {
      if (vinyl.label) {
        labelMap.set(vinyl.label, (labelMap.get(vinyl.label) || 0) + 1);
      }
    });
    const topLabels = Array.from(labelMap.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Top artists
    const artistMap = new Map<string, number>();
    vinylsWithUserData.forEach(vinyl => {
      artistMap.set(vinyl.artist, (artistMap.get(vinyl.artist) || 0) + 1);
    });
    const topArtists = Array.from(artistMap.entries())
      .map(([artist, count]) => ({ artist, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Discography status (simplified - would need external API for full discography)
    const discographyStatus: Array<{ artist: string; owned: number; missing: number; isComplete: boolean }> = [];
    // For now, we'll mark as complete if user has 5+ albums from same artist
    // In a real implementation, you'd fetch discography from external API
    artistMap.forEach((count, artist) => {
      if (count >= 5) {
        discographyStatus.push({
          artist,
          owned: count,
          missing: 0, // Would need external API
          isComplete: false, // Would need external API to determine
        });
      }
    });

    // Rarity (based on owner count)
    const ownerCountMap = new Map<string, number>();
    allVinyls.forEach(vinyl => {
      let count = 0;
      if (vinyl.userId) count++;
      if (vinyl.owners) count += vinyl.owners.length;
      ownerCountMap.set(vinyl.id, count);
    });

    const userVinylRarity = vinylsWithUserData
      .map(v => ({
        id: v.id,
        artist: v.artist,
        album: v.album,
        ownerCount: ownerCountMap.get(v.id) || 1,
      }))
      .sort((a, b) => a.ownerCount - b.ownerCount);

    const rarestVinyl = userVinylRarity.length > 0 ? userVinylRarity[0] : null;

    // Rarity distribution
    const rarityMap = new Map<string, number>();
    userVinylRarity.forEach(v => {
      let rarity = "Common";
      if (v.ownerCount === 1) rarity = "Unique";
      else if (v.ownerCount <= 3) rarity = "Rare";
      else if (v.ownerCount <= 10) rarity = "Uncommon";
      rarityMap.set(rarity, (rarityMap.get(rarity) || 0) + 1);
    });
    const rarityDistribution = Array.from(rarityMap.entries())
      .map(([rarity, count]) => ({ rarity, count }));

    // Release year timeline
    const yearMap = new Map<number, number>();
    vinylsWithUserData.forEach(vinyl => {
      if (vinyl.releaseDate) {
        const year = new Date(vinyl.releaseDate).getFullYear();
        yearMap.set(year, (yearMap.get(year) || 0) + 1);
      }
    });
    const releaseYearTimeline = Array.from(yearMap.entries())
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => a.year - b.year);

    // Comparisons
    // Average vinyl weight: ~180g = 0.18kg
    const estimatedWeight = Math.round((totalVinyls * 0.18) * 100) / 100;
    // Average vinyl diameter: 30cm, stacked: ~2mm per vinyl
    const estimatedLength = Math.round((totalVinyls * 0.002) * 100) / 100;

    // To do
    const missingCoverArt = vinylsWithUserData.filter(v => !v.albumArt).length;
    const missingDescription = vinylsWithUserData.filter(v => !v.notes || v.notes.trim() === "").length;
    
    const missingData = vinylsWithUserData
      .map(v => {
        const missingFields: string[] = [];
        if (!v.albumArt) missingFields.push("Cover Art");
        if (!v.notes || v.notes.trim() === "") missingFields.push("Description");
        if (!v.releaseDate) missingFields.push("Release Date");
        if (!v.genre) missingFields.push("Genre");
        if (!v.label) missingFields.push("Label");
        return missingFields.length > 0 ? {
          id: v.id,
          artist: v.artist,
          album: v.album,
          missingFields,
        } : null;
      })
      .filter((v): v is { id: string; artist: string; album: string; missingFields: string[] } => v !== null)
      .slice(0, 20);

    // Badges
    const collectorLevel = totalVinyls < 10 ? 0 : totalVinyls < 50 ? 1 : totalVinyls < 100 ? 2 : totalVinyls < 500 ? 3 : 4;
    const collectorNames = ["Novice", "Collector", "Enthusiast", "Expert", "Master"];
    
    const treasureHunterLevel = estimatedValue < 100 ? 0 : estimatedValue < 500 ? 1 : estimatedValue < 1000 ? 2 : estimatedValue < 5000 ? 3 : 4;
    const treasureHunterNames = ["Starter", "Investor", "Collector", "Curator", "Treasure Hunter"];
    
    // Time Traveler: at least one vinyl per decade
    const decades = new Set(decadeDistribution.map(d => d.decade).filter(d => d !== "Unknown"));
    const timeTraveler = decades.size >= 5; // At least 5 different decades
    
    // Completionist: number of complete discographies
    const completionistCount = discographyStatus.filter(d => d.isComplete).length;
    const completionistLevel = completionistCount < 1 ? 0 : completionistCount < 3 ? 1 : completionistCount < 5 ? 2 : 3;
    const completionistNames = ["Beginner", "Completer", "Completionist", "Master Completer"];

    const stats: DashboardStats = {
      totalVinyls,
      estimatedValue: Math.round(estimatedValue * 100) / 100,
      totalInvested: Math.round(totalInvested * 100) / 100,
      collectionStartDate,
      collectionAgeMonths,
      currentStreak,
      highestValue: Math.round(highestValue * 100) / 100,
      lowestValue: Math.round(lowestValue * 100) / 100,
      averageValue: Math.round(averageValue * 100) / 100,
      valueOverTime,
      addedThisMonth,
      acquisitionsByMonth,
      investmentsByMonth,
      latestAdditions,
      genreDistribution,
      decadeDistribution,
      conditionDistribution,
      topLabels,
      topArtists,
      discographyStatus: discographyStatus.slice(0, 10),
      rarestVinyl,
      rarityDistribution,
      releaseYearTimeline,
      estimatedWeight,
      estimatedLength,
      missingCoverArt,
      missingDescription,
      missingData,
      badges: {
        collector: { level: collectorLevel, name: collectorNames[collectorLevel] },
        treasureHunter: { level: treasureHunterLevel, name: treasureHunterNames[treasureHunterLevel] },
        timeTraveler,
        completionist: { level: completionistLevel, name: completionistNames[completionistLevel] },
      },
    };

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error("[dashboard] Error calculating stats:", error);
    return NextResponse.json(
      { error: "Failed to calculate dashboard statistics" },
      { status: 500 }
    );
  }
}

