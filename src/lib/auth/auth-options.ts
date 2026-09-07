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
    CredentialsProvider({
      id: "credentials",
      name: "Reviewer & Demo Login",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "reviewer@wehearapp.online" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const email = credentials.email.toLowerCase().trim();
        const password = credentials.password;

        const isReviewer =
          (email === "reviewer@wehearapp.online" || email === "test@wehearapp.online") &&
          (password === "WeHearReview2026!" || password === "test1234");
        const isDev = process.env.NODE_ENV !== "production";

        if (!isReviewer && !isDev) {
          return null;
        }

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
                  nickname: "Reviewer (Demo)",
                  avatarSeed: "reviewer-seed",
                },
              },
              listenerProfile: {
                create: {
                  isAvailable: true,
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
          name: user.anonymousProfile?.nickname || "Reviewer (Demo)",
          anonymousId: user.anonymousProfile?.anonymousId,
          nickname: user.anonymousProfile?.nickname,
        };
      },
    }),
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
  secret: process.env.NEXTAUTH_SECRET || "b157fa2dac990dd1388df16e5fec3424f873f2370d31e5692fbc5b5737a5ee72",
};
