import { NextRequest, NextResponse } from "next/server";
import { createResetToken, getUserByEmail } from "@/lib/data";
import { sendPasswordResetEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { email, recaptchaToken } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Verify reCAPTCHA if token is provided
    if (recaptchaToken) {
      try {
        console.log("[forgot-password] Verifying reCAPTCHA token...");
        
        // Verify reCAPTCHA directly (server-side)
        const secretKey = process.env.RECAPTCHA_SECRET_KEY;
        if (!secretKey) {
          console.error("[forgot-password] RECAPTCHA_SECRET_KEY is not set");
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
            console.error("[forgot-password] reCAPTCHA verification failed:", data);
            return NextResponse.json(
              { error: "reCAPTCHA verification failed. Please try again." },
              { status: 400 }
            );
          }

          // Check score
          const score = data.score || 0;
          const threshold = parseFloat(process.env.RECAPTCHA_SCORE_THRESHOLD || "0.5");

          if (score < threshold) {
            console.warn(`[forgot-password] reCAPTCHA score ${score} is below threshold ${threshold}`);
            return NextResponse.json(
              { error: "reCAPTCHA verification failed. Please try again." },
              { status: 400 }
            );
          }

          console.log("[forgot-password] reCAPTCHA verified successfully. Score:", score);
        }
      } catch (error) {
        console.error("[forgot-password] Error verifying reCAPTCHA:", error);
        if (process.env.NODE_ENV === "production") {
          return NextResponse.json(
            { error: "reCAPTCHA verification failed. Please try again." },
            { status: 400 }
          );
        }
      }
    } else if (process.env.NODE_ENV === "production") {
      console.error("[forgot-password] No reCAPTCHA token provided in production");
      return NextResponse.json(
        { error: "reCAPTCHA verification is required" },
        { status: 400 }
      );
    }
    
    console.log("[forgot-password] Processing request for email:", email);
    
    // Check if RESEND_API_KEY is configured
    if (!process.env.RESEND_API_KEY) {
      console.error("[forgot-password] RESEND_API_KEY is not configured");
      return NextResponse.json(
        { error: "Email service is not configured. Please contact support." },
        { status: 500 }
      );
    }
    
    // Check if user exists
    const user = await getUserByEmail(email);
    console.log("[forgot-password] User found:", !!user);
    
    // Always return success to prevent email enumeration
    // But only send email if user exists
    if (user) {
      const token = await createResetToken(email);
      console.log("[forgot-password] Reset token created:", !!token);
      
      if (token) {
        // Send reset email
        const resetUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/reset-password?token=${token}`;
        console.log("[forgot-password] Sending reset email to:", user.email);
        console.log("[forgot-password] Reset URL:", resetUrl);
        
        try {
          await sendPasswordResetEmail(user.email, user.username, resetUrl);
          console.log("[forgot-password] Password reset email sent successfully");
        } catch (error: any) {
          console.error("[forgot-password] Failed to send password reset email:", error);
          console.error("[forgot-password] Error details:", JSON.stringify(error, null, 2));
          // Return error so user knows something went wrong
          return NextResponse.json(
            { error: "Failed to send reset email. Please try again later or contact support." },
            { status: 500 }
          );
        }
      } else {
        console.error("[forgot-password] Failed to create reset token");
        return NextResponse.json(
          { error: "Failed to create reset token. Please try again." },
          { status: 500 }
        );
      }
    } else {
      console.log("[forgot-password] User not found, returning success message anyway");
    }
    
    // Always return success message
    return NextResponse.json(
      { message: "If an account exists with this email, a password reset link has been sent." },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[forgot-password] Error in forgot-password:", error);
    console.error("[forgot-password] Error stack:", error?.stack);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

