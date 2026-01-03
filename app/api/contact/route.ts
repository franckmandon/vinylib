import { NextRequest, NextResponse } from "next/server";
import { sendContactEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, companyName, country, message, recaptchaToken } = body;

    // Verify reCAPTCHA if token is provided
    if (recaptchaToken) {
      try {
        console.log("[contact] Verifying reCAPTCHA token...");
        
        // Verify reCAPTCHA directly (server-side)
        const secretKey = process.env.RECAPTCHA_SECRET_KEY;
        if (!secretKey) {
          console.error("[contact] RECAPTCHA_SECRET_KEY is not set");
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
            console.error("[contact] reCAPTCHA verification failed:", data);
            return NextResponse.json(
              { error: "reCAPTCHA verification failed. Please try again." },
              { status: 400 }
            );
          }

          // Check score
          const score = data.score || 0;
          const threshold = parseFloat(process.env.RECAPTCHA_SCORE_THRESHOLD || "0.5");

          if (score < threshold) {
            console.warn(`[contact] reCAPTCHA score ${score} is below threshold ${threshold}`);
            return NextResponse.json(
              { error: "reCAPTCHA verification failed. Please try again." },
              { status: 400 }
            );
          }

          console.log("[contact] reCAPTCHA verified successfully. Score:", score);
        }
      } catch (recaptchaError: any) {
        console.error("[contact] Error verifying reCAPTCHA:", recaptchaError);
        // In development, allow requests even if reCAPTCHA verification fails
        if (process.env.NODE_ENV === "production") {
          return NextResponse.json(
            { error: "reCAPTCHA verification failed. Please try again." },
            { status: 400 }
          );
        }
      }
    } else {
      console.error("[contact] No reCAPTCHA token provided");
      if (process.env.NODE_ENV === "production") {
        // Require reCAPTCHA token in production
        return NextResponse.json(
          { error: "reCAPTCHA verification is required" },
          { status: 400 }
        );
      } else {
        console.warn("[contact] Development mode: proceeding without reCAPTCHA token");
      }
    }

    // Validate required fields
    if (!firstName || !lastName || !email || !message) {
      return NextResponse.json(
        { error: "First name, last name, email, and message are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate message length
    if (message.trim().length < 10) {
      return NextResponse.json(
        { error: "Message must be at least 10 characters long" },
        { status: 400 }
      );
    }

    if (message.length > 5000) {
      return NextResponse.json(
        { error: "Message must be less than 5000 characters" },
        { status: 400 }
      );
    }

    // Send email
    console.log("[contact] Attempting to send contact email...");
    console.log("[contact] Data:", { firstName, lastName, email, companyName, country, messageLength: message.length });
    
    const emailResult = await sendContactEmail(firstName, lastName, email, companyName, country, message);
    
    console.log("[contact] Email sent successfully. Result:", JSON.stringify(emailResult, null, 2));

    return NextResponse.json(
      { message: "Your message has been sent successfully!" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[contact] Error sending contact email:", error);
    console.error("[contact] Error type:", typeof error);
    console.error("[contact] Error message:", error?.message);
    console.error("[contact] Error stack:", error?.stack);
    
    // Return more detailed error message in development
    const errorMessage = process.env.NODE_ENV === "development" 
      ? `Failed to send message: ${error?.message || "Unknown error"}` 
      : "Failed to send message. Please try again later.";
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

