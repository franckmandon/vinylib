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
        console.log("[register] Verifying reCAPTCHA token...");
        
        // Verify reCAPTCHA directly (server-side)
        const secretKey = process.env.RECAPTCHA_SECRET_KEY;
        if (!secretKey) {
          console.error("[register] RECAPTCHA_SECRET_KEY is not set");
          if (process.env.NODE_ENV === "production") {
            return NextResponse.json(
              { error: "reCAPTCHA configuration error" },
              { status: 500 }
            );
          }
        } else {
          // Verify token with Google
          const verifyUrl = "https://www.google.com/recaptcha/api/siteverify";
          const response = await fetch(verifyUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: `secret=${secretKey}&response=${recaptchaToken}`,
          });

          const data = await response.json();

          if (!data.success) {
            console.error("[register] reCAPTCHA verification failed:", data);
            return NextResponse.json(
              { error: "reCAPTCHA verification failed. Please try again." },
              { status: 400 }
            );
          }

          // Check score
          const score = data.score || 0;
          const threshold = parseFloat(process.env.RECAPTCHA_SCORE_THRESHOLD || "0.5");

          if (score < threshold) {
            console.warn(`[register] reCAPTCHA score ${score} is below threshold ${threshold}`);
            return NextResponse.json(
              { error: "reCAPTCHA verification failed. Please try again." },
              { status: 400 }
            );
          }

          console.log("[register] reCAPTCHA verified successfully. Score:", score);
        }
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
    } else {
      console.error("[register] No reCAPTCHA token provided");
      if (process.env.NODE_ENV === "production") {
        // Require reCAPTCHA token in production
        return NextResponse.json(
          { error: "reCAPTCHA verification is required" },
          { status: 400 }
        );
      } else {
        console.warn("[register] Development mode: proceeding without reCAPTCHA token");
      }
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
    
    // Send welcome email (don't fail registration if email fails)
    try {
      console.log("[register] Attempting to send welcome email to:", user.email);
      await sendWelcomeEmail(user.email, user.username);
      console.log("[register] Welcome email sent successfully");
    } catch (error: any) {
      console.error("[register] Failed to send welcome email:", error);
      console.error("[register] Error message:", error?.message);
      console.error("[register] Error details:", JSON.stringify(error, null, 2));
      // Don't fail registration if email fails - user is already created
    }
    
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

