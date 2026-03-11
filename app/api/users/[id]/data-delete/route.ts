import { NextRequest } from "next/server";
import { auth } from "@/app/lib/auth";
import prisma from "@/app/lib/prisma";

export async function DELETE(
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

    // Users can only delete their own data; admins can delete any
    if (session.user.userId !== userId && session.user.role !== "admin") {
      return Response.json(
        { success: false, error: { code: "FORBIDDEN", message: "You can only delete your own data" } },
        { status: 403 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { user_id: userId },
    });

    if (!user) {
      return Response.json(
        { success: false, error: { code: "NOT_FOUND", message: "User not found" } },
        { status: 404 }
      );
    }

    // Delete user and all related data (cascade configured in Prisma schema)
    await prisma.user.delete({
      where: { user_id: userId },
    });

    return Response.json({
      success: true,
      data: {
        message: "All user data has been permanently deleted",
        deleted_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Data deletion error:", error);
    return Response.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to delete user data" } },
      { status: 500 }
    );
  }
}
