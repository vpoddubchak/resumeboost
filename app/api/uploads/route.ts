import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Database connection singleton
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// GET /api/uploads - List all uploads
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');

    const where = user_id ? { user_id: parseInt(user_id) } : {};

    const uploads = await prisma.upload.findMany({
      where,
      select: {
        upload_id: true,
        user_id: true,
        file_name: true,
        file_size: true,
        mime_type: true,
        upload_status: true,
        created_at: true
      },
      orderBy: { created_at: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: uploads,
      meta: {
        timestamp: new Date().toISOString(),
        count: uploads.length
      }
    });
  } catch (error) {
    console.error('Error fetching uploads:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to fetch uploads'
      }
    }, { status: 500 });
  }
}

// POST /api/uploads - Create new upload
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, file_name, file_path, file_size, mime_type } = body;

    // Validate required fields
    if (!user_id || !file_name || !file_path || !file_size || !mime_type) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'All fields are required'
        }
      }, { status: 400 });
    }

    // Create new upload
    const upload = await prisma.upload.create({
      data: {
        user_id: parseInt(user_id),
        file_name,
        file_path,
        file_size: parseInt(file_size),
        mime_type,
        upload_status: 'uploaded'
      },
      select: {
        upload_id: true,
        user_id: true,
        file_name: true,
        file_size: true,
        mime_type: true,
        upload_status: true,
        created_at: true
      }
    });

    return NextResponse.json({
      success: true,
      data: upload,
      meta: {
        timestamp: new Date().toISOString()
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating upload:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to create upload'
      }
    }, { status: 500 });
  }
}
