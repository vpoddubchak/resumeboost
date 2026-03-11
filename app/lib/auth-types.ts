import { DefaultSession } from "next-auth";

export type UserRole = "job_seeker" | "hr_manager" | "admin";

declare module "next-auth" {
  interface Session {
    user: {
      userId: number;
      role: UserRole;
    } & DefaultSession["user"];
  }

  interface User {
    user_id: number;
    role: UserRole;
  }
}

// JWT type augmentation handled inline in auth.ts callbacks
// next-auth v5 re-exports JWT from @auth/core which makes module augmentation fragile
