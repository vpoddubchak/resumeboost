import { PrismaClient } from '@prisma/client';

// Database connection health check
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const prisma = new PrismaClient();
    await prisma.$connect();
    await prisma.$disconnect();
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

// Database connection with retry logic
export async function getDatabaseConnection(maxRetries: number = 3): Promise<PrismaClient> {
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const prisma = new PrismaClient();
      await prisma.$connect();
      return prisma;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown database error');
      console.error(`Database connection attempt ${attempt} failed:`, lastError.message);
      
      if (attempt < maxRetries) {
        // Wait before retrying (exponential backoff)
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw new Error(`Failed to connect to database after ${maxRetries} attempts: ${lastError?.message}`);
}

export default { checkDatabaseHealth, getDatabaseConnection };
