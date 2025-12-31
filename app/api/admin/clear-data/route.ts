import { NextRequest, NextResponse } from "next/server";
import { clearAllVinyls, clearAllUsers } from "@/lib/data";
import { createClient } from "redis";

export const runtime = "nodejs";

// WARNING: This endpoint clears ALL data (users and vinyls)
// In production, you should add authentication/authorization here
export async function POST(request: NextRequest) {
  try {
    // Optional: Add a confirmation token or password check here
    const { confirm } = await request.json();
    
    if (confirm !== "DELETE_ALL_DATA") {
      return NextResponse.json(
        { error: "Confirmation required. Send { confirm: 'DELETE_ALL_DATA' }" },
        { status: 400 }
      );
    }

    // Clear both vinyls and users
    await clearAllVinyls();
    await clearAllUsers();

    // Also try to clear Redis directly to be sure
    const redisUrl =
      process.env.REDIS_URL ||
      process.env.UPSTASH_REDIS_REDIS_URL ||
      process.env.STORAGE_URL ||
      process.env.UPSTASH_REDIS_URL;

    if (redisUrl) {
      try {
        const client = createClient({ url: redisUrl });
        await client.connect();
        await client.del("vinyls:collection");
        await client.del("users:collection");
        // Also try to delete any pattern matches
        const keys = await client.keys("*vinyls*");
        const userKeys = await client.keys("*users*");
        if (keys.length > 0) await client.del(keys);
        if (userKeys.length > 0) await client.del(userKeys);
        await client.quit();
      } catch (redisError) {
        console.error("Redis cleanup error (non-fatal):", redisError);
      }
    }
    
    return NextResponse.json(
      { message: "All data cleared successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error clearing data:", error);
    return NextResponse.json(
      { error: error.message || "Failed to clear data" },
      { status: 500 }
    );
  }
}

