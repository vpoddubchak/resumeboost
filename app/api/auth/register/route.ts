import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/app/lib/prisma";
import { registerSchema, validateBody } from "@/app/lib/validations";
import { checkRateLimit, getClientIp, rateLimitResponse, RATE_LIMITS } from "@/app/lib/rate-limit";

const BCRYPT_COST_FACTOR = 12;

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(request);
    const rateLimitResult = checkRateLimit(`register:${ip}`, RATE_LIMITS.AUTH_REGISTER);
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    // Parse and validate body
    const body = await request.json();
    const validation = validateBody(registerSchema, body);
    if (!validation.success) {
      return Response.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const { email, password, first_name, last_name } = validation.data;

    // Check for existing user
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return Response.json(
        {
          success: false,
          error: {
            code: "USER_EXISTS",
            message: "An account with this email already exists",
          },
        },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, BCRYPT_COST_FACTOR);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password_hash: passwordHash,
        first_name: first_name ?? null,
        last_name: last_name ?? null,
        role: "job_seeker",
      },
    });

    return Response.json(
      {
        success: true,
        data: {
          user_id: user.user_id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          created_at: user.created_at,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return Response.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred during registration",
        },
      },
      { status: 500 }
    );
  }
}
