import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isBookmarked } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ bookmarked: false });
    }
    
    const { searchParams } = new URL(request.url);
    const vinylId = searchParams.get("vinylId");
    
    if (!vinylId) {
      return NextResponse.json(
        { error: "Vinyl ID is required" },
        { status: 400 }
      );
    }
    
    const bookmarked = await isBookmarked(session.user.id, vinylId);
    return NextResponse.json({ bookmarked });
  } catch (error) {
    console.error("Error checking bookmark:", error);
    return NextResponse.json({ bookmarked: false });
  }
}

