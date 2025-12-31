import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { verifyUser } from "@/lib/data";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        emailOrUsername: { label: "Email or Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.emailOrUsername || !credentials?.password) {
            console.error("[NextAuth] Missing credentials");
            return null;
          }

          const user = await verifyUser(
            credentials.emailOrUsername,
            credentials.password
          );

          if (!user) {
            console.error("[NextAuth] User verification failed");
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            username: user.username,
          };
        } catch (error) {
          console.error("[NextAuth] Authorization error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = (user as any).username;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    signOut: "/",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

