import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserById } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const user = await getUserById(session.user.id);
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Return user info without password
    return NextResponse.json({
      id: user.id,
      email: user.email,
      username: user.username,
      createdAt: user.createdAt,
    });
  } catch (error: any) {
    console.error("Error fetching user info:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch user info" },
      { status: 500 }
    );
  }
}

