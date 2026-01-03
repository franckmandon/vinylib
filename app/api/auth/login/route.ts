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
        const verifyResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/recaptcha/verify`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token: recaptchaToken }),
        });

        if (!verifyResponse.ok) {
          const verifyData = await verifyResponse.json();
          console.error("[login] reCAPTCHA verification failed:", verifyData);
          return NextResponse.json(
            { error: "reCAPTCHA verification failed. Please try again." },
            { status: 400 }
          );
        }

        const verifyData = await verifyResponse.json();
        console.log("[login] reCAPTCHA verified successfully. Score:", verifyData.score);
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
    } else if (process.env.NODE_ENV === "production") {
      // Require reCAPTCHA token in production
      return NextResponse.json(
        { error: "reCAPTCHA verification is required" },
        { status: 400 }
      );
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

