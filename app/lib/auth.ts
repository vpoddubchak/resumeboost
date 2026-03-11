import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import prisma from "./prisma";
import type { UserRole } from "./auth-types";
import type { Adapter } from "next-auth/adapters";

// Re-export the type augmentations
import "./auth-types";

/**
 * Custom Prisma adapter that maps our user_id PK to NextAuth's expected id field.
 * Only implements methods needed for JWT strategy + OAuth account linking.
 */
function CustomPrismaAdapter(): Adapter {
  // Using type assertion since our adapter maps custom user_id PK to NextAuth's id
  return ({
    async createUser(data: Record<string, unknown>) {
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
      return {
        id: String(user.user_id),
        user_id: user.user_id,
        email: user.email,
        emailVerified: user.email_verified,
        name: [user.first_name, user.last_name].filter(Boolean).join(" ") || null,
        image: user.image,
        role: user.role,
      };
    },
    async getUser(id: string) {
      const user = await prisma.user.findUnique({ where: { user_id: Number(id) } });
      if (!user) return null;
      return {
        id: String(user.user_id),
        user_id: user.user_id,
        email: user.email,
        emailVerified: user.email_verified,
        name: [user.first_name, user.last_name].filter(Boolean).join(" ") || null,
        image: user.image,
        role: user.role,
      };
    },
    async getUserByEmail(email: string) {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) return null;
      return {
        id: String(user.user_id),
        user_id: user.user_id,
        email: user.email,
        emailVerified: user.email_verified,
        name: [user.first_name, user.last_name].filter(Boolean).join(" ") || null,
        image: user.image,
        role: user.role,
      };
    },
    async getUserByAccount({ providerAccountId, provider }: { providerAccountId: string; provider: string }) {
      const account = await prisma.account.findUnique({
        where: { provider_provider_account_id: { provider, provider_account_id: providerAccountId } },
        include: { user: true },
      });
      if (!account?.user) return null;
      const user = account.user;
      return {
        id: String(user.user_id),
        user_id: user.user_id,
        email: user.email,
        emailVerified: user.email_verified,
        name: [user.first_name, user.last_name].filter(Boolean).join(" ") || null,
        image: user.image,
        role: user.role,
      };
    },
    async updateUser({ id, ...data }: Record<string, unknown> & { id: string }) {
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
      return {
        id: String(user.user_id),
        user_id: user.user_id,
        email: user.email,
        emailVerified: user.email_verified,
        name: [user.first_name, user.last_name].filter(Boolean).join(" ") || null,
        image: user.image,
        role: user.role,
      };
    },
    async deleteUser(id: string) {
      await prisma.user.delete({ where: { user_id: Number(id) } });
    },
    async linkAccount(data: Record<string, unknown>) {
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
    },
    async unlinkAccount({ providerAccountId, provider }: { providerAccountId: string; provider: string }) {
      await prisma.account.delete({
        where: { provider_provider_account_id: { provider, provider_account_id: providerAccountId } },
      });
    },
    async createVerificationToken(data: { identifier: string; token: string; expires: Date }) {
      const vt = await prisma.verificationToken.create({ data });
      return vt;
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
      if (!credentials?.email || !credentials?.password) {
        return null;
      }

      const email = credentials.email as string;
      const password = credentials.password as string;

      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user || !user.password_hash) {
        return null;
      }

      const isPasswordValid = await bcrypt.compare(password, user.password_hash);

      if (!isPasswordValid) {
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
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 }, // 30 days
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
