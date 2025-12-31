import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// Validate required environment variables
if (!process.env.NEXTAUTH_SECRET && !process.env.AUTH_SECRET) {
  console.error(
    "[NextAuth] Missing NEXTAUTH_SECRET or AUTH_SECRET environment variable"
  );
}

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

