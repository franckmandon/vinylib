import { NextRequest, NextResponse } from "next/server";
import { verifyUser } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { emailOrUsername, password, recaptchaToken } = await request.json();

    if (!emailOrUsername || !password) {
      return NextResponse.json(
        { error: "Email/username and password are required" },
        { status: 400 }
      );
    }

    // Verify reCAPTCHA if token is provided
    if (recaptchaToken) {
      try {
        console.log("[login] Verifying reCAPTCHA token...");
        
        // Verify reCAPTCHA directly (server-side)
        const secretKey = process.env.RECAPTCHA_SECRET_KEY;
        if (!secretKey) {
          console.error("[login] RECAPTCHA_SECRET_KEY is not set");
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
            console.error("[login] reCAPTCHA verification failed:", data);
            return NextResponse.json(
              { error: "reCAPTCHA verification failed. Please try again." },
              { status: 400 }
            );
          }

          // Check score
          const score = data.score || 0;
          const threshold = parseFloat(process.env.RECAPTCHA_SCORE_THRESHOLD || "0.5");

          if (score < threshold) {
            console.warn(`[login] reCAPTCHA score ${score} is below threshold ${threshold}`);
            return NextResponse.json(
              { error: "reCAPTCHA verification failed. Please try again." },
              { status: 400 }
            );
          }

          console.log("[login] reCAPTCHA verified successfully. Score:", score);
        }
      } catch (recaptchaError: any) {
        console.error("[login] Error verifying reCAPTCHA:", recaptchaError);
        // In development, allow requests even if reCAPTCHA verification fails
        if (process.env.NODE_ENV === "production") {
          return NextResponse.json(
            { error: "reCAPTCHA verification failed. Please try again." },
            { status: 400 }
          );
        }
      }
    } else {
      console.error("[login] No reCAPTCHA token provided");
      if (process.env.NODE_ENV === "production") {
        // Require reCAPTCHA token in production
        return NextResponse.json(
          { error: "reCAPTCHA verification is required" },
          { status: 400 }
        );
      } else {
        console.warn("[login] Development mode: proceeding without reCAPTCHA token");
      }
    }

    // Verify user credentials
    const user = await verifyUser(emailOrUsername, password);

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email/username or password" },
        { status: 401 }
      );
    }

    // Return success (actual authentication will be handled by NextAuth)
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
    });
  } catch (error: any) {
    console.error("[login] Error:", error);
    return NextResponse.json(
      { error: "An error occurred. Please try again." },
      { status: 500 }
    );
  }
}

