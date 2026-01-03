import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserById, getUserByUsername, getUsers, saveUsers } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const { newUsername } = await request.json();
    
    if (!newUsername) {
      return NextResponse.json(
        { error: "New username is required" },
        { status: 400 }
      );
    }
    
    if (newUsername.length < 3) {
      return NextResponse.json(
        { error: "Username must be at least 3 characters" },
        { status: 400 }
      );
    }
    
    if (newUsername.length > 20) {
      return NextResponse.json(
        { error: "Username must be at most 20 characters" },
        { status: 400 }
      );
    }
    
    // Check if username is already taken
    const existingUser = await getUserByUsername(newUsername);
    if (existingUser && existingUser.id !== session.user.id) {
      return NextResponse.json(
        { error: "Username is already taken" },
        { status: 400 }
      );
    }
    
    const user = await getUserById(session.user.id);
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Update username
    const users = await getUsers();
    const userIndex = users.findIndex(u => u.id === user.id);
    
    if (userIndex === -1) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    users[userIndex].username = newUsername;
    users[userIndex].updatedAt = new Date().toISOString();
    await saveUsers(users);
    
    return NextResponse.json({ 
      success: true, 
      message: "Username changed successfully",
      username: newUsername 
    });
  } catch (error: any) {
    console.error("Error changing username:", error);
    return NextResponse.json(
      { error: error.message || "Failed to change username" },
      { status: 500 }
    );
  }
}

