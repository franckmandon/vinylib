import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserBookmarks, addBookmark, deleteBookmark, isBookmarked } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    const bookmarks = await getUserBookmarks(session.user.id);
    return NextResponse.json(bookmarks);
  } catch (error) {
    console.error("Error fetching bookmarks:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookmarks" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    const { vinylId } = await request.json();
    
    if (!vinylId) {
      return NextResponse.json(
        { error: "Vinyl ID is required" },
        { status: 400 }
      );
    }
    
    const bookmark = await addBookmark(session.user.id, vinylId);
    return NextResponse.json(bookmark, { status: 201 });
  } catch (error: any) {
    console.error("Error adding bookmark:", error);
    return NextResponse.json(
      { error: error.message || "Failed to add bookmark" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const vinylId = searchParams.get("vinylId");
    
    if (!vinylId) {
      return NextResponse.json(
        { error: "Vinyl ID is required" },
        { status: 400 }
      );
    }
    
    const deleted = await deleteBookmark(session.user.id, vinylId);
    
    if (!deleted) {
      return NextResponse.json(
        { error: "Bookmark not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting bookmark:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete bookmark" },
      { status: 500 }
    );
  }
}

