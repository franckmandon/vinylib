import { NextRequest, NextResponse } from "next/server";
import { createUser } from "@/lib/data";
import { sendWelcomeEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { email, username, password } = await request.json();
    
    if (!email || !username || !password) {
      return NextResponse.json(
        { error: "Email, username, and password are required" },
        { status: 400 }
      );
    }
    
    // Basic validation
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }
    
    if (username.length < 3) {
      return NextResponse.json(
        { error: "Username must be at least 3 characters" },
        { status: 400 }
      );
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }
    
    const user = await createUser(email, username, password);
    
    // Send welcome email (don't wait for it to complete)
    sendWelcomeEmail(user.email, user.username).catch((error) => {
      console.error("Failed to send welcome email:", error);
      // Don't fail registration if email fails
    });
    
    // Don't return password
    const { password: _, ...userPublic } = user;
    
    return NextResponse.json(
      { 
        message: "User created successfully",
        user: userPublic 
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create user" },
      { status: 400 }
    );
  }
}

