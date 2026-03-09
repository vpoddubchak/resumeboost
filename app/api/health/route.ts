import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Database connection singleton
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'ResumeBoost API',
    environment: 'production',
    version: '1.0.0'
  });
}
