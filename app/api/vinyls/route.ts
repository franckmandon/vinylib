import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getVinyls, addVinyl, updateVinyl, deleteVinyl, getPublicVinyls, getUserVinyls } from "@/lib/data";
import { VinylFormData } from "@/types/vinyl";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode") || "public"; // "public" or "personal"
    
    // If mode is "personal", return user's vinyls (requires authentication)
    if (mode === "personal") {
      if (!session?.user?.id) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        );
      }
      const vinyls = await getUserVinyls(session.user.id);
      return NextResponse.json(vinyls);
    }
    
    // If mode is "public", return public vinyls (latest from all users)
    // This works for both logged in and non-logged in users
    const vinyls = await getPublicVinyls(50);
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
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized: You must be logged in to add vinyls" },
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

    const newVinyl = await addVinyl({
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
      userId: session.user.id,
    }, session.user.id);

    return NextResponse.json(newVinyl, { status: 201 });
  } catch (error: any) {
    console.error("Error creating vinyl:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create vinyl" },
      { status: error.message?.includes("Unauthorized") ? 403 : 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized: You must be logged in to update vinyls" },
        { status: 401 }
      );
    }
    
    const { id, ...updates } = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: "ID is required" },
        { status: 400 }
      );
    }

    // Verify ownership before updating
    const allVinyls = await getVinyls();
    const existingVinyl = allVinyls.find(v => v.id === id);
    if (!existingVinyl) {
      return NextResponse.json(
        { error: "Vinyl not found" },
        { status: 404 }
      );
    }
    
    // Check if user owns this vinyl
    const ownsVinyl = existingVinyl.userId === session.user.id ||
      existingVinyl.owners?.some(o => o.userId === session.user.id);
    
    if (!ownsVinyl) {
      return NextResponse.json(
        { error: "Unauthorized: You can only update your own vinyls" },
        { status: 403 }
      );
    }

    const updatedVinyl = await updateVinyl(id, updates);
    
    if (!updatedVinyl) {
      return NextResponse.json(
        { error: "Vinyl not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedVinyl);
  } catch (error: any) {
    console.error("Error updating vinyl:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update vinyl" },
      { status: error.message?.includes("Unauthorized") ? 403 : 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized: You must be logged in to delete vinyls" },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json(
        { error: "ID is required" },
        { status: 400 }
      );
    }

    // Verify ownership before deleting
    const allVinyls = await getVinyls();
    const existingVinyl = allVinyls.find(v => v.id === id);
    if (!existingVinyl) {
      return NextResponse.json(
        { error: "Vinyl not found" },
        { status: 404 }
      );
    }
    
    // Check if user owns this vinyl
    const ownsVinyl = existingVinyl.userId === session.user.id ||
      existingVinyl.owners?.some(o => o.userId === session.user.id);
    
    if (!ownsVinyl) {
      return NextResponse.json(
        { error: "Unauthorized: You can only delete your own vinyls" },
        { status: 403 }
      );
    }

    const deleted = await deleteVinyl(id);
    
    if (!deleted) {
      return NextResponse.json(
        { error: "Failed to delete vinyl" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting vinyl:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete vinyl" },
      { status: error.message?.includes("Unauthorized") ? 403 : 500 }
    );
  }
}


