// Database performance optimization utilities
import prisma from './prisma';

// Query optimization strategies
export class QueryOptimizer {
  // Pagination helper
  static paginate(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    return {
      skip,
      take: limit
    };
  }

  // Common select patterns to avoid over-fetching
  static userSelect = {
    user_id: true,
    email: true,
    first_name: true,
    last_name: true,
    created_at: true,
    updated_at: true
  };

  static uploadSelect = {
    upload_id: true,
    user_id: true,
    file_name: true,
    file_size: true,
    mime_type: true,
    upload_status: true,
    created_at: true
  };

  static analysisSelect = {
    analysis_id: true,
    upload_id: true,
    user_id: true,
    score: true,
    created_at: true
  };

  // Optimized queries with proper indexing
  static async getUploadsWithPagination(page: number, limit: number, user_id?: number) {
    const { skip, take } = this.paginate(page, limit);
    
    return await prisma.upload.findMany({
      where: user_id ? { user_id } : {},
      select: this.uploadSelect,
      orderBy: { created_at: 'desc' },
      skip,
      take
    });
  }

  static async getAnalysesWithUploadInfo(page: number, limit: number, user_id?: number) {
    const { skip, take } = this.paginate(page, limit);
    
    return await prisma.analysis.findMany({
      where: user_id ? { user_id } : {},
      select: {
        ...this.analysisSelect,
        upload: {
          select: {
            file_name: true,
            file_size: true,
            mime_type: true
          }
        }
      },
      orderBy: { created_at: 'desc' },
      skip,
      take
    });
  }

  // Batch operations for better performance
  static async createMultipleAnalyses(analyses: any[]) {
    return await prisma.analysis.createMany({
      data: analyses,
      skipDuplicates: true
    });
  }

  // Count queries for pagination metadata
  static async getUploadCount(user_id?: number) {
    return await prisma.upload.count({
      where: user_id ? { user_id } : {}
    });
  }

  static async getAnalysisCount(user_id?: number) {
    return await prisma.analysis.count({
      where: user_id ? { user_id } : {}
    });
  }
}

// Database indexing recommendations
export const IndexingStrategy = {
  // Recommended indexes for performance
  recommendations: [
    'CREATE INDEX CONCURRENTLY idx_users_email ON users(email);',
    'CREATE INDEX CONCURRENTLY idx_uploads_user_id ON uploads(user_id);',
    'CREATE INDEX CONCURRENTLY idx_uploads_created_at ON uploads(created_at DESC);',
    'CREATE INDEX CONCURRENTLY idx_analyses_upload_id ON analyses(upload_id);',
    'CREATE INDEX CONCURRENTLY idx_analyses_user_id ON analyses(user_id);',
    'CREATE INDEX CONCURRENTLY idx_analyses_created_at ON analyses(created_at DESC);',
    'CREATE INDEX CONCURRENTLY idx_consultations_user_id ON consultations(user_id);',
    'CREATE INDEX CONCURRENTLY idx_consultations_date ON consultations(consultation_date DESC);',
    'CREATE INDEX CONCURRENTLY idx_analytics_user_id ON analytics(user_id);',
    'CREATE INDEX CONCURRENTLY idx_analytics_created_at ON analytics(created_at DESC);',
    'CREATE INDEX CONCURRENTLY idx_portfolio_content_type ON portfolio_content(content_type);',
    'CREATE INDEX CONCURRENTLY idx_portfolio_featured ON portfolio_content(is_featured) WHERE is_featured = true;'
  ]
};

// Connection pool monitoring
export class ConnectionPoolMonitor {
  static async getConnectionStats() {
    try {
      // This would typically query the database for connection stats
      // For now, return mock data
      return {
        activeConnections: 5,
        idleConnections: 5,
        totalConnections: 10,
        maxConnections: 10,
        utilizationRate: 0.5
      };
    } catch (error) {
      console.error('Error getting connection stats:', error);
      return null;
    }
  }

  static async optimizeConnectionPool() {
    const stats = await this.getConnectionStats();
    
    if (stats && stats.utilizationRate > 0.8) {
      console.warn('High connection pool utilization detected');
      return {
        status: 'warning',
        message: 'Consider increasing connection pool size',
        currentStats: stats
      };
    }
    
    return {
      status: 'healthy',
      message: 'Connection pool is operating normally',
      currentStats: stats
    };
  }
}

// Query performance monitoring
export class QueryPerformanceMonitor {
  static async measureQueryPerformance<T>(
    queryName: string,
    query: () => Promise<T>
  ): Promise<{ result: T; duration: number }> {
    const startTime = Date.now();
    
    try {
      const result = await query();
      const duration = Date.now() - startTime;
      
      // Log slow queries (> 1000ms)
      if (duration > 1000) {
        console.warn(`Slow query detected: ${queryName} took ${duration}ms`);
      }
      
      return { result, duration };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`Query failed: ${queryName} after ${duration}ms`, error);
      throw error;
    }
  }
}
