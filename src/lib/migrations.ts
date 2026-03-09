// Database migration utilities for development without live database
import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// Migration directory
const MIGRATIONS_DIR = join(process.cwd(), 'prisma', 'migrations');

// Ensure migrations directory exists
if (!existsSync(MIGRATIONS_DIR)) {
  mkdirSync(MIGRATIONS_DIR, { recursive: true });
}

// Generate migration SQL without applying
export function generateMigrationSQL(name: string): string {
  try {
    // Generate migration SQL with updated command
    const result = execSync(`npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script`, {
      encoding: 'utf8'
    });

    return result;
  } catch (error) {
    console.error('Error generating migration SQL:', error);
    throw error;
  }
}

// Create migration file
export function createMigrationFile(name: string, sql: string): void {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const migrationDir = join(MIGRATIONS_DIR, `${timestamp}_${name}`);
  
  if (!existsSync(migrationDir)) {
    mkdirSync(migrationDir, { recursive: true });
  }

  const migrationFile = join(migrationDir, 'migration.sql');
  require('fs').writeFileSync(migrationFile, sql);

  console.log(`Migration file created: ${migrationFile}`);
}

// Initialize database schema
export function initializeDatabase(): void {
  try {
    const sql = generateMigrationSQL('init');
    createMigrationFile('init', sql);
    
    console.log('Database schema initialized successfully');
    console.log('Migration files created in:', MIGRATIONS_DIR);
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
}

// Reset database (development only)
export function resetDatabase(): void {
  try {
    console.log('Database reset command prepared');
    console.log('To reset database, run: npx prisma migrate reset --force');
  } catch (error) {
    console.error('Failed to reset database:', error);
  }
}
