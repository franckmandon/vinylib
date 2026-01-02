import { Resend } from "resend";

// Initialize Resend with API key
const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }
  return new Resend(apiKey);
};

export async function sendWelcomeEmail(email: string, username: string) {
  if (!process.env.RESEND_API_KEY) {
    console.error("[email] RESEND_API_KEY not configured");
    throw new Error("RESEND_API_KEY is not configured");
  }

  // Use verified domain or fallback to Resend's test domain
  // Format: "Name <email@domain.com>" or just "email@domain.com"
  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  
  console.log("[email] Sending welcome email to:", email);
  console.log("[email] From email:", fromEmail);
  console.log("[email] RESEND_API_KEY configured:", !!process.env.RESEND_API_KEY);

  try {
    const resend = getResendClient();
    const result = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: "Welcome to Vinyl Report!",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #0f172a; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <p style="color: rgba(255, 255, 255, 0.7); font-size: 12px; margin: 0 0 15px 0;">Vinyl Report - Your Vinyl Library Manager</p>
              <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Vinyl Report!</h1>
            </div>
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; margin-bottom: 20px;">
                Hi <strong>${username}</strong>,
              </p>
              <p style="font-size: 16px; margin-bottom: 20px;">
                Thank you for joining Vinyl Report! Your account has been successfully created.
              </p>
              <p style="font-size: 16px; margin-bottom: 20px;">
                You can now start building your vinyl collection by:
              </p>
              <ul style="font-size: 16px; margin-bottom: 20px; padding-left: 20px;">
                <li>Adding vinyls manually or by scanning barcodes</li>
                <li>Organizing your collection with ratings and notes</li>
                <li>Discovering new music from other collectors</li>
              </ul>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXTAUTH_URL || "https://vinyl.report"}" 
                   style="background: rgb(37, 99, 235); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                  Start Your Collection
                </a>
              </div>
              <p style="font-size: 14px; color: #666; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
                Happy collecting!<br>
                The Vinyl Report Team
              </p>
            </div>
          </body>
        </html>
      `,
    });
    
    console.log("[email] Welcome email sent successfully. Result:", result);
    return result;
  } catch (error: any) {
    console.error("[email] Error sending welcome email:", error);
    console.error("[email] Error type:", typeof error);
    console.error("[email] Error details:", JSON.stringify(error, null, 2));
    if (error?.message) {
      console.error("[email] Error message:", error.message);
    }
    if (error?.response) {
      console.error("[email] Error response:", JSON.stringify(error.response, null, 2));
    }
    // Re-throw to let the caller handle it
    throw error;
  }
}

export async function sendPasswordResetEmail(email: string, username: string, resetUrl: string) {
  if (!process.env.RESEND_API_KEY) {
    console.error("[email] RESEND_API_KEY not configured");
    throw new Error("RESEND_API_KEY is not configured");
  }

  // Use verified domain or fallback to Resend's test domain
  // Format: "Name <email@domain.com>" or just "email@domain.com"
  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  
  console.log("[email] Sending password reset email to:", email);
  console.log("[email] From email:", fromEmail);
  console.log("[email] RESEND_API_KEY configured:", !!process.env.RESEND_API_KEY);
  console.log("[email] Reset URL:", resetUrl);

  try {
    const resend = getResendClient();
    const result = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: "Password Reset - Vinyl Report",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #0f172a; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <p style="color: rgba(255, 255, 255, 0.7); font-size: 12px; margin: 0 0 15px 0;">Vinyl Report - Your Vinyl Library Manager</p>
              <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset</h1>
            </div>
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; margin-bottom: 20px;">
                Hello <strong>${username}</strong>,
              </p>
              <p style="font-size: 16px; margin-bottom: 20px;">
                You have requested to reset your password for your Vinyl Report account.
              </p>
              <p style="font-size: 16px; margin-bottom: 20px;">
                Click the button below to create a new password:
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" 
                   style="background: rgb(37, 99, 235); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                  Reset my password
                </a>
              </div>
              <p style="font-size: 14px; color: #666; margin-bottom: 20px;">
                Or copy and paste this link into your browser:<br>
                <a href="${resetUrl}" style="color: rgb(37, 99, 235); word-break: break-all;">${resetUrl}</a>
              </p>
              <p style="font-size: 14px; color: #666; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
                This link is valid for 1 hour.<br>
                If you did not request this reset, please ignore this email.<br><br>
                The Vinyl Report Team
              </p>
            </div>
          </body>
        </html>
      `,
    });
    
    console.log("[email] Password reset email sent successfully. Result:", result);
    return result;
  } catch (error: any) {
    console.error("[email] Error sending password reset email:", error);
    console.error("[email] Error type:", typeof error);
    console.error("[email] Error details:", JSON.stringify(error, null, 2));
    if (error?.message) {
      console.error("[email] Error message:", error.message);
    }
    if (error?.response) {
      console.error("[email] Error response:", JSON.stringify(error.response, null, 2));
    }
    // Re-throw to let the caller handle it
    throw error;
  }
}

