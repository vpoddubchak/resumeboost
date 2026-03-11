import { NextRequest } from "next/server";
import { auth } from "@/app/lib/auth";
import prisma from "@/app/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;
    const userId = Number(id);

    if (!session?.user) {
      return Response.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }

    // Users can only export their own data; admins can export any
    if (session.user.userId !== userId && session.user.role !== "admin") {
      return Response.json(
        { success: false, error: { code: "FORBIDDEN", message: "You can only export your own data" } },
        { status: 403 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { user_id: userId },
      include: {
        uploads: true,
        analyses: true,
        consultations: true,
        analytics: true,
        accounts: {
          select: {
            provider: true,
            type: true,
          },
        },
      },
    });

    if (!user) {
      return Response.json(
        { success: false, error: { code: "NOT_FOUND", message: "User not found" } },
        { status: 404 }
      );
    }

    // Exclude sensitive fields
    const { password_hash, ...safeUser } = user;

    return Response.json({
      success: true,
      data: {
        export_date: new Date().toISOString(),
        user: safeUser,
      },
    });
  } catch (error) {
    console.error("Data export error:", error);
    return Response.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to export user data" } },
      { status: 500 }
    );
  }
}
