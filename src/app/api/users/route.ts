import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

// GET /api/users - List all users
export async function GET(request: NextRequest) {
  try {
    const users = await prisma.user.findMany({
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
      data: users,
      meta: {
        timestamp: new Date().toISOString(),
        count: users.length
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to fetch users'
      }
    }, { status: 500 });
  }
}

// POST /api/users - Create new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password_hash, first_name, last_name } = body;

    // Validate required fields
    if (!email || !password_hash) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email and password are required'
        }
      }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: 'User with this email already exists'
        }
      }, { status: 409 });
    }

    // Create new user
    const user = await prisma.user.create({
      data: {
        email,
        password_hash,
        first_name,
        last_name
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
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to create user'
      }
    }, { status: 500 });
  }
}
