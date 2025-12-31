import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getVinylById, setVinylRating } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized: You must be logged in to rate vinyls" },
        { status: 401 }
      );
    }
    
    const vinylId = params.id;
    const { rating } = await request.json();
    
    if (rating !== undefined && (rating < 0 || rating > 5)) {
      return NextResponse.json(
        { error: "Rating must be between 0 and 5" },
        { status: 400 }
      );
    }
    
    // Verify vinyl exists
    const vinyl = await getVinylById(vinylId);
    if (!vinyl) {
      return NextResponse.json(
        { error: "Vinyl not found" },
        { status: 404 }
      );
    }
    
    const updatedVinyl = await setVinylRating(vinylId, session.user.id, rating || 0);
    
    if (!updatedVinyl) {
      return NextResponse.json(
        { error: "Failed to update rating" },
        { status: 500 }
      );
    }
    
    return NextResponse.json(updatedVinyl, { status: 200 });
  } catch (error: any) {
    console.error("Error setting vinyl rating:", error);
    return NextResponse.json(
      { error: error.message || "Failed to set rating" },
      { status: 500 }
    );
  }
}

