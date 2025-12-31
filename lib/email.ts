import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendWelcomeEmail(email: string, username: string) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not configured, skipping email send");
    throw new Error("RESEND_API_KEY is not configured");
  }

  // Use verified domain or fallback to Resend's test domain
  // If you haven't verified vinyl.report domain, use: "onboarding@resend.dev"
  const fromEmail = process.env.RESEND_FROM_EMAIL || "Vinyl Report <onboarding@resend.dev>";
  
  console.log("[email] Sending welcome email to:", email);
  console.log("[email] From email:", fromEmail);

  try {
    const result = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: "Welcome to Vinyl Report! 🎵",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🎵 Welcome to Vinyl Report!</h1>
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
                   style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
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
    console.error("[email] Error details:", JSON.stringify(error, null, 2));
    if (error?.message) {
      console.error("[email] Error message:", error.message);
    }
    // Don't throw - email failure shouldn't block registration
    throw error;
  }
}

export async function sendPasswordResetEmail(email: string, username: string, resetUrl: string) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not configured, skipping email send");
    throw new Error("RESEND_API_KEY is not configured");
  }

  // Use verified domain or fallback to Resend's test domain
  // If you haven't verified vinyl.report domain, use: "onboarding@resend.dev"
  const fromEmail = process.env.RESEND_FROM_EMAIL || "Vinyl Report <onboarding@resend.dev>";
  
  console.log("[email] Sending password reset email to:", email);
  console.log("[email] From email:", fromEmail);

  try {
    const result = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: "Réinitialisation de votre mot de passe - Vinyl Report",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🔐 Réinitialisation du mot de passe</h1>
            </div>
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; margin-bottom: 20px;">
                Bonjour <strong>${username}</strong>,
              </p>
              <p style="font-size: 16px; margin-bottom: 20px;">
                Vous avez demandé à réinitialiser votre mot de passe pour votre compte Vinyl Report.
              </p>
              <p style="font-size: 16px; margin-bottom: 20px;">
                Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" 
                   style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                  Réinitialiser mon mot de passe
                </a>
              </div>
              <p style="font-size: 14px; color: #666; margin-bottom: 20px;">
                Ou copiez-collez ce lien dans votre navigateur :<br>
                <a href="${resetUrl}" style="color: #667eea; word-break: break-all;">${resetUrl}</a>
              </p>
              <p style="font-size: 14px; color: #666; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
                Ce lien est valide pendant 1 heure.<br>
                Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.<br><br>
                L'équipe Vinyl Report
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
    console.error("[email] Error details:", JSON.stringify(error, null, 2));
    if (error?.message) {
      console.error("[email] Error message:", error.message);
    }
    throw error;
  }
}

