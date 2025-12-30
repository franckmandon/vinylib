import { NextRequest, NextResponse } from "next/server";
import { getVinyls, addVinyl, updateVinyl, deleteVinyl } from "@/lib/data";
import { VinylFormData } from "@/types/vinyl";

export const runtime = "nodejs";

export async function GET() {
  try {
    const vinyls = getVinyls();
    return NextResponse.json(vinyls);
  } catch (error) {
    console.error("Error fetching vinyls:", error);
    return NextResponse.json(
      { error: "Failed to fetch vinyls" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data: VinylFormData = await request.json();
    
    if (!data.artist || !data.album) {
      return NextResponse.json(
        { error: "Artist and album are required" },
        { status: 400 }
      );
    }

    const newVinyl = addVinyl({
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
  } catch (error) {
    console.error("Error creating vinyl:", error);
    return NextResponse.json(
      { error: "Failed to create vinyl" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, ...updates } = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: "ID is required" },
        { status: 400 }
      );
    }

    const updatedVinyl = updateVinyl(id, updates);
    
    if (!updatedVinyl) {
      return NextResponse.json(
        { error: "Vinyl not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedVinyl);
  } catch (error) {
    console.error("Error updating vinyl:", error);
    return NextResponse.json(
      { error: "Failed to update vinyl" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json(
        { error: "ID is required" },
        { status: 400 }
      );
    }

    const deleted = deleteVinyl(id);
    
    if (!deleted) {
      return NextResponse.json(
        { error: "Vinyl not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting vinyl:", error);
    return NextResponse.json(
      { error: "Failed to delete vinyl" },
      { status: 500 }
    );
  }
}


