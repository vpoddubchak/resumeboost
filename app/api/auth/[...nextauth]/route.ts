import { handlers } from "@/app/lib/auth";
import { checkRateLimit, getClientIp, rateLimitResponse, RATE_LIMITS } from "@/app/lib/rate-limit";
import { NextRequest } from "next/server";

export const { GET } = handlers;

export async function POST(request: NextRequest) {
  // Apply rate limiting to login attempts (POST to NextAuth signin)
  const url = new URL(request.url);
  const isSignIn = url.pathname.includes("callback/credentials") || url.pathname.includes("signin");

  if (isSignIn) {
    const ip = getClientIp(request);
    const rateLimitResult = checkRateLimit(`login:${ip}`, RATE_LIMITS.AUTH_LOGIN);
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }
  }

  return handlers.POST(request);
}
