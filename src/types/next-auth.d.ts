import "next-auth";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      anonymousId?: string;
      nickname?: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    anonymousId?: string;
    nickname?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    anonymousId?: string;
    nickname?: string;
  }
}
