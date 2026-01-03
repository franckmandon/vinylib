import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: "reCAPTCHA token is required" },
        { status: 400 }
      );
    }

    const secretKey = process.env.RECAPTCHA_SECRET_KEY;

    if (!secretKey) {
      console.error("[reCAPTCHA] RECAPTCHA_SECRET_KEY is not set");
      // In development, allow requests if secret key is not set
      if (process.env.NODE_ENV === "development") {
        console.warn("[reCAPTCHA] Development mode: skipping verification");
        return NextResponse.json({ success: true, score: 1.0 });
      }
      return NextResponse.json(
        { error: "reCAPTCHA configuration error" },
        { status: 500 }
      );
    }

    // Verify token with Google
    const verifyUrl = "https://www.google.com/recaptcha/api/siteverify";
    const response = await fetch(verifyUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `secret=${secretKey}&response=${token}`,
    });

    const data = await response.json();

    if (!data.success) {
      console.error("[reCAPTCHA] Verification failed:", data);
      return NextResponse.json(
        { error: "reCAPTCHA verification failed", details: data["error-codes"] },
        { status: 400 }
      );
    }

    // Check score (reCAPTCHA v3 returns a score from 0.0 to 1.0)
    // 1.0 is very likely a human, 0.0 is very likely a bot
    const score = data.score || 0;
    const threshold = parseFloat(process.env.RECAPTCHA_SCORE_THRESHOLD || "0.5");

    if (score < threshold) {
      console.warn(`[reCAPTCHA] Score ${score} is below threshold ${threshold}`);
      return NextResponse.json(
        { error: "reCAPTCHA verification failed: low score", score },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      score,
      action: data.action,
    });
  } catch (error: any) {
    console.error("[reCAPTCHA] Error verifying token:", error);
    return NextResponse.json(
      { error: "Failed to verify reCAPTCHA token" },
      { status: 500 }
    );
  }
}

