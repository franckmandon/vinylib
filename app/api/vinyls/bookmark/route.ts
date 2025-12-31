import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createVinylForBookmark } from "@/lib/data";
import { VinylFormData } from "@/types/vinyl";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized: You must be logged in to create vinyls for bookmarks" },
        { status: 401 }
      );
    }
    
    const data: VinylFormData = await request.json();
    
    if (!data.artist || !data.album) {
      return NextResponse.json(
        { error: "Artist and album are required" },
        { status: 400 }
      );
    }

    // Create vinyl without owner (for bookmarks only)
    const newVinyl = await createVinylForBookmark({
      artist: data.artist,
      album: data.album,
      releaseDate: data.releaseDate,
      genre: data.genre,
      label: data.label,
      condition: data.condition,
      notes: data.notes,
      albumArt: data.albumArt,
      ean: data.ean,
      rating: data.rating,
      youtubeLink: data.youtubeLink,
    });

    return NextResponse.json(newVinyl, { status: 201 });
  } catch (error: any) {
    console.error("Error creating vinyl for bookmark:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create vinyl for bookmark" },
      { status: 500 }
    );
  }
}

