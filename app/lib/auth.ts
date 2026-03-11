import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import prisma from "./prisma";
import type { UserRole } from "./auth-types";
import type { Adapter } from "next-auth/adapters";

// Re-export the type augmentations
import "./auth-types";

// Validate required environment variables (checked lazily to avoid build-time errors)
function validateEnv() {
  if (!process.env.NEXTAUTH_SECRET && process.env.NODE_ENV === "production") {
    throw new Error("NEXTAUTH_SECRET environment variable is required in production");
  }
}

// Dummy hash for constant-time comparison when user not found (timing attack prevention)
const DUMMY_HASH = "$2a$12$dummyhashfortimingatttackpreventionxx";

/**
 * Custom Prisma adapter that maps our user_id PK to NextAuth's expected id field.
 * Only implements methods needed for JWT strategy + OAuth account linking.
 */
/** Helper to map Prisma user to NextAuth adapter user format */
function mapUser(user: { user_id: number; email: string; email_verified: Date | null; first_name: string | null; last_name: string | null; image: string | null; role: string }) {
  return {
    id: String(user.user_id),
    user_id: user.user_id,
    email: user.email,
    emailVerified: user.email_verified,
    name: [user.first_name, user.last_name].filter(Boolean).join(" ") || null,
    image: user.image,
    role: user.role,
  };
}

function CustomPrismaAdapter(): Adapter {
  return ({
    async createUser(data: Record<string, unknown>) {
      try {
        const user = await prisma.user.create({
          data: {
            email: data.email as string,
            first_name: typeof data.name === "string" ? data.name.split(" ")[0] : null,
            last_name: typeof data.name === "string" ? data.name.split(" ").slice(1).join(" ") || null : null,
            email_verified: data.emailVerified as Date | null ?? null,
            image: (data.image as string) ?? null,
            role: "job_seeker",
          },
        });
        return mapUser(user);
      } catch (error) {
        console.error("Adapter createUser error:", error);
        throw error;
      }
    },
    async getUser(id: string) {
      try {
        const user = await prisma.user.findUnique({ where: { user_id: Number(id) } });
        if (!user) return null;
        return mapUser(user);
      } catch (error) {
        console.error("Adapter getUser error:", error);
        return null;
      }
    },
    async getUserByEmail(email: string) {
      try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;
        return mapUser(user);
      } catch (error) {
        console.error("Adapter getUserByEmail error:", error);
        return null;
      }
    },
    async getUserByAccount({ providerAccountId, provider }: { providerAccountId: string; provider: string }) {
      try {
        const account = await prisma.account.findUnique({
          where: { provider_provider_account_id: { provider, provider_account_id: providerAccountId } },
          include: { user: true },
        });
        if (!account?.user) return null;
        return mapUser(account.user);
      } catch (error) {
        console.error("Adapter getUserByAccount error:", error);
        return null;
      }
    },
    async updateUser({ id, ...data }: Record<string, unknown> & { id: string }) {
      try {
        const updateData: Record<string, unknown> = {};
        if (data.email !== undefined) updateData.email = data.email;
        if (data.emailVerified !== undefined) updateData.email_verified = data.emailVerified;
        if (data.image !== undefined) updateData.image = data.image;
        if (data.name !== undefined) {
          const name = data.name as string;
          updateData.first_name = name?.split(" ")[0] ?? null;
          updateData.last_name = name?.split(" ").slice(1).join(" ") || null;
        }
        const user = await prisma.user.update({
          where: { user_id: Number(id) },
          data: updateData,
        });
        return mapUser(user);
      } catch (error) {
        console.error("Adapter updateUser error:", error);
        throw error;
      }
    },
    async deleteUser(id: string) {
      try {
        await prisma.user.delete({ where: { user_id: Number(id) } });
      } catch (error) {
        console.error("Adapter deleteUser error:", error);
        throw error;
      }
    },
    async linkAccount(data: Record<string, unknown>) {
      try {
        await prisma.account.create({
          data: {
            user_id: Number(data.userId),
            type: data.type as string,
            provider: data.provider as string,
            provider_account_id: data.providerAccountId as string,
            refresh_token: (data.refresh_token as string) ?? null,
            access_token: (data.access_token as string) ?? null,
            expires_at: (data.expires_at as number) ?? null,
            token_type: (data.token_type as string) ?? null,
            scope: (data.scope as string) ?? null,
            id_token: (data.id_token as string) ?? null,
            session_state: data.session_state ? String(data.session_state) : null,
          },
        });
      } catch (error) {
        console.error("Adapter linkAccount error:", error);
        throw error;
      }
    },
    async unlinkAccount({ providerAccountId, provider }: { providerAccountId: string; provider: string }) {
      try {
        await prisma.account.delete({
          where: { provider_provider_account_id: { provider, provider_account_id: providerAccountId } },
        });
      } catch (error) {
        console.error("Adapter unlinkAccount error:", error);
        throw error;
      }
    },
    async createVerificationToken(data: { identifier: string; token: string; expires: Date }) {
      try {
        const vt = await prisma.verificationToken.create({ data });
        return vt;
      } catch (error) {
        console.error("Adapter createVerificationToken error:", error);
        throw error;
      }
    },
    async useVerificationToken({ identifier, token }: { identifier: string; token: string }) {
      try {
        const vt = await prisma.verificationToken.delete({
          where: { identifier_token: { identifier, token } },
        });
        return vt;
      } catch {
        return null;
      }
    },
  }) as unknown as Adapter;
}

const providers = [
  Credentials({
    id: "credentials",
    name: "Email & Password",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    authorize: async (credentials) => {
      validateEnv();

      if (!credentials?.email || !credentials?.password) {
        return null;
      }

      const email = credentials.email as string;
      const password = credentials.password as string;

      const user = await prisma.user.findUnique({
        where: { email },
      });

      // Constant-time comparison: always run bcrypt.compare to prevent timing attacks
      const hashToCompare = user?.password_hash || DUMMY_HASH;
      const isPasswordValid = await bcrypt.compare(password, hashToCompare);

      if (!user || !user.password_hash || !isPasswordValid) {
        return null;
      }

      return {
        id: String(user.user_id),
        user_id: user.user_id,
        email: user.email,
        name: [user.first_name, user.last_name].filter(Boolean).join(" ") || null,
        role: (user.role as UserRole) || "job_seeker",
      };
    },
  }),
];

// Add Google OAuth provider if credentials are configured
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }) as any
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: CustomPrismaAdapter(),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // Refresh token every 24 hours
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers,
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.userId = (user as any).user_id ?? Number(user.id);
        token.role = (user as any).role ?? "job_seeker";
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.userId = token.userId as number;
        session.user.role = (token.role as UserRole) ?? "job_seeker";
      }
      return session;
    },
    authorized({ auth: sessionAuth, request }) {
      const { pathname } = request.nextUrl;
      const isAdmin = pathname.startsWith("/admin");
      const isProtected =
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/resume-analysis");

      if (isAdmin) {
        return sessionAuth?.user?.role === "admin";
      }
      if (isProtected) {
        return !!sessionAuth?.user;
      }
      return true;
    },
  },
});
