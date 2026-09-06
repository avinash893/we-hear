import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import { generateAnonymousId, generateAnonymousNickname } from "@/lib/identity/nickname";

export const authOptions: NextAuthOptions = {
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    // Dev sandbox provider for local testing (strictly disabled in production)
    ...(process.env.NODE_ENV !== "production"
      ? [
          CredentialsProvider({
            id: "dev-sandbox",
            name: "Development Sandbox Login",
            credentials: {
              email: { label: "Dev Email (for simulation)", type: "email", placeholder: "speaker@test.local" },
              role: { label: "Role Preset", type: "text", placeholder: "speaker or listener" },
            },
            async authorize(credentials) {
              if (process.env.NODE_ENV === "production") return null;
              if (!credentials?.email) return null;
        
        const email = credentials.email.toLowerCase().trim();
        
        // Find or create user
        let user = await prisma.user.findUnique({
          where: { email },
          include: { anonymousProfile: true, listenerProfile: true },
        });

        if (!user) {
          user = await prisma.user.create({
            data: {
              email,
              ageConfirmed: true,
              anonymousProfile: {
                create: {
                  anonymousId: generateAnonymousId(),
                  nickname: generateAnonymousNickname(),
                  avatarSeed: Math.random().toString(36).substring(2, 9),
                },
              },
              listenerProfile: {
                create: {
                  isAvailable: credentials.role === "listener",
                },
              },
            },
            include: { anonymousProfile: true, listenerProfile: true },
          });
        }

        if (user.isDestroyed) {
          throw new Error("This account identity has been permanently destroyed.");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.anonymousProfile?.nickname || "Anonymous Peer",
          anonymousId: user.anonymousProfile?.anonymousId,
          nickname: user.anonymousProfile?.nickname,
        };
      },
    }),
  ] : []),
],
session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const email = user.email?.toLowerCase();
        if (!email) return false;

        let dbUser = await prisma.user.findUnique({
          where: { email },
          include: { anonymousProfile: true, listenerProfile: true },
        });

        if (!dbUser) {
          // Provision new user with strictly separated anonymous identity
          dbUser = await prisma.user.create({
            data: {
              email,
              googleId: account.providerAccountId,
              ageConfirmed: true,
              anonymousProfile: {
                create: {
                  anonymousId: generateAnonymousId(),
                  nickname: generateAnonymousNickname(),
                  avatarSeed: Math.random().toString(36).substring(2, 9),
                },
              },
              listenerProfile: {
                create: {
                  isAvailable: false,
                },
              },
            },
            include: { anonymousProfile: true, listenerProfile: true },
          });
        } else if (dbUser.isDestroyed) {
          return false;
        }

        user.id = dbUser.id;
      }
      return true;
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        token.userId = user.id;
      }
      
      // Refresh profile data if needed
      if (token.userId) {
        const dbProfile = await prisma.anonymousProfile.findUnique({
          where: { userId: token.userId as string },
        });
        if (dbProfile) {
          token.anonymousId = dbProfile.anonymousId;
          token.nickname = dbProfile.nickname;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.userId) {
        // Strict Privacy Rule: Strip real Google email/name from client session object
        session.user = {
          id: token.userId as string,
          anonymousId: (token.anonymousId as string) || "usr_anon",
          nickname: (token.nickname as string) || "Anonymous Peer",
        } as any;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  secret: (() => {
    if (process.env.NODE_ENV === "production" && !process.env.NEXTAUTH_SECRET) {
      throw new Error("CRITICAL SECURITY ERROR: NEXTAUTH_SECRET must be configured in production.");
    }
    return process.env.NEXTAUTH_SECRET || "fallback-secret-for-dev-only";
  })(),
};
