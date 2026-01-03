import { NextRequest, NextResponse } from "next/server";
import { createUser } from "@/lib/data";
import { sendWelcomeEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { email, username, password, recaptchaToken } = await request.json();
    
    // Verify reCAPTCHA if token is provided
    if (recaptchaToken) {
      try {
        const verifyResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/recaptcha/verify`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token: recaptchaToken }),
        });

        if (!verifyResponse.ok) {
          const verifyData = await verifyResponse.json();
          console.error("[register] reCAPTCHA verification failed:", verifyData);
          return NextResponse.json(
            { error: "reCAPTCHA verification failed. Please try again." },
            { status: 400 }
          );
        }

        const verifyData = await verifyResponse.json();
        console.log("[register] reCAPTCHA verified successfully. Score:", verifyData.score);
      } catch (recaptchaError: any) {
        console.error("[register] Error verifying reCAPTCHA:", recaptchaError);
        // In development, allow requests even if reCAPTCHA verification fails
        if (process.env.NODE_ENV === "production") {
          return NextResponse.json(
            { error: "reCAPTCHA verification failed. Please try again." },
            { status: 400 }
          );
        }
      }
    } else if (process.env.NODE_ENV === "production") {
      // Require reCAPTCHA token in production
      return NextResponse.json(
        { error: "reCAPTCHA verification is required" },
        { status: 400 }
      );
    }
    
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
    sendWelcomeEmail(user.email, user.username).catch((error: any) => {
      console.error("[register] Failed to send welcome email:", error);
      console.error("[register] Error message:", error?.message);
      console.error("[register] Error details:", JSON.stringify(error, null, 2));
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

