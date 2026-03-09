import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Database connection singleton
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// GET /api/users/[id] - Get specific user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user_id = parseInt(id);
    
    if (isNaN(user_id)) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid user ID'
        }
      }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { user_id },
      select: {
        user_id: true,
        email: true,
        first_name: true,
        last_name: true,
        created_at: true,
        updated_at: true
      }
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: user,
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to fetch user'
      }
    }, { status: 500 });
  }
}

// PUT /api/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user_id = parseInt(id);
    const body = await request.json();
    const { first_name, last_name } = body;

    if (isNaN(user_id)) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid user ID'
        }
      }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { user_id },
      data: {
        first_name,
        last_name,
        updated_at: new Date()
      },
      select: {
        user_id: true,
        email: true,
        first_name: true,
        last_name: true,
        created_at: true,
        updated_at: true
      }
    });

    return NextResponse.json({
      success: true,
      data: user,
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to update user'
      }
    }, { status: 500 });
  }
}

// DELETE /api/users/[id] - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user_id = parseInt(id);
    
    if (isNaN(user_id)) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid user ID'
        }
      }, { status: 400 });
    }

    await prisma.user.delete({
      where: { user_id }
    });

    return NextResponse.json({
      success: true,
      data: null,
      meta: {
        timestamp: new Date().toISOString(),
        message: 'User deleted successfully'
      }
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to delete user'
      }
    }, { status: 500 });
  }
}
