import { NextRequest, NextResponse } from 'next/server';

// Mock users storage (temporary solution)
let users = [
  {
    user_id: 1,
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// GET /api/users - List all users
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    data: users,
    meta: {
      timestamp: new Date().toISOString(),
      count: users.length
    }
  });
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
    const existingUser = users.find(u => u.email === email);
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
    const newUser = {
      user_id: Math.max(...users.map(u => u.user_id)) + 1,
      email,
      first_name,
      last_name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    users.push(newUser);

    // Return user without password
    const userResponse = { ...newUser };

    return NextResponse.json({
      success: true,
      data: userResponse,
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
