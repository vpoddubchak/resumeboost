# Deployment Guide

## Overview

ResumeBoost is designed for deployment on modern cloud platforms with automated CI/CD pipelines.

## Prerequisites

### Environment Variables

Create `.env.production` file with the following variables:

```env
# Application
NODE_ENV=production
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-super-secret-key

# AI Services
NEXT_PUBLIC_CLAUDE_API_KEY=your-claude-api-key
AI_SERVICE_URL=https://api.anthropic.com

# Database
DATABASE_URL=postgresql://username:password@host:port/database
DATABASE_POOL_SIZE=20

# AWS Services
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=resumeboost-uploads
AWS_CLOUDFRONT_DOMAIN=your-cloudfront-domain.cloudfront.net

# Monitoring
SENTRY_DSN=your-sentry-dsn
LOG_LEVEL=info

# Analytics
GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
VERCEL_ANALYTICS_ID=your-vercel-id
```

### Database Setup

#### PostgreSQL Configuration
```sql
-- Create database
CREATE DATABASE resumeboost;

-- Create user
CREATE USER resumeboost_user WITH PASSWORD 'secure_password';

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE resumeboost TO resumeboost_user;

-- Run migrations
npm run db:migrate
```

#### Redis Configuration (for caching)
```bash
# Install Redis
brew install redis  # macOS
sudo apt-get install redis-server  # Ubuntu

# Start Redis
redis-server

# Configure in .env
REDIS_URL=redis://localhost:6379
```

## Deployment Platforms

### Vercel (Recommended)

#### Automatic Deployment
1. Connect GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

#### Manual Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

#### Vercel Configuration
```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "env": {
    "NEXTAUTH_URL": "@nextauth_url",
    "DATABASE_URL": "@database_url"
  },
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

### AWS

#### Infrastructure Setup
```bash
# Install AWS CLI
pip install awscli

# Configure credentials
aws configure
```

#### S3 Bucket Configuration
```bash
# Create S3 bucket
aws s3 mb s3://resumeboost-uploads

# Configure bucket policy
aws s3api put-bucket-policy --bucket resumeboost-uploads --policy file://bucket-policy.json

# Enable CORS
aws s3api put-bucket-cors --bucket resumeboost-uploads --cors-configuration file://cors-config.json
```

#### CloudFront Distribution
```bash
# Create CloudFront distribution
aws cloudfront create-distribution --distribution-config file://cloudfront-config.json
```

#### ECS Deployment
```bash
# Build Docker image
docker build -t resumeboost .

# Push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com
docker tag resumeboost:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/resumeboost:latest
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/resumeboost:latest

# Deploy to ECS
aws ecs update-service --cluster resumeboost --service resumeboost --task-definition resumeboost:latest
```

### Docker

#### Dockerfile
```dockerfile
# Multi-stage build
FROM node:18-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Build application
FROM base AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN npm run build

# Production image
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

#### Docker Compose
```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/resumeboost
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=resumeboost
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

## CI/CD Pipeline

### GitHub Actions

#### Production Workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build application
        run: npm run build
        env:
          NEXT_PUBLIC_CLAUDE_API_KEY: ${{ secrets.CLAUDE_API_KEY }}

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          working-directory: ./
```

#### Staging Workflow
```yaml
# .github/workflows/staging.yml
name: Deploy to Staging

on:
  push:
    branches: [develop]

jobs:
  deploy-staging:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build application
        run: npm run build

      - name: Deploy to staging
        run: |
          # Custom deployment script
          echo "Deploying to staging environment"
```

## Monitoring and Logging

### Application Monitoring

#### Sentry Integration
```typescript
// lib/monitoring.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

#### Custom Metrics
```typescript
// lib/metrics.ts
export class Metrics {
  static trackEvent(name: string, properties?: Record<string, any>) {
    // Send to analytics service
  }

  static trackPageView(path: string) {
    // Track page views
  }

  static trackError(error: Error, context?: Record<string, any>) {
    // Track errors
  }
}
```

### Health Checks

#### Health Endpoint
```typescript
// app/api/health/route.ts
export async function GET() {
  try {
    // Check database connection
    await db.query('SELECT 1');
    
    // Check Redis connection
    await redis.ping();
    
    return Response.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version,
    });
  } catch (error) {
    return Response.json(
      {
        status: 'unhealthy',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
```

## Performance Optimization

### Build Optimization

#### Next.js Configuration
```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['tailwindcss'],
  },
  images: {
    domains: ['your-cdn-domain.com'],
    formats: ['image/webp', 'image/avif'],
  },
  compress: true,
  poweredByHeader: false,
};

module.exports = nextConfig;
```

#### Bundle Analysis
```bash
# Analyze bundle size
npm run build
npx @next/bundle-analyzer

# Check for large dependencies
npx npm-bundle-size
```

### Caching Strategy

#### CDN Configuration
```javascript
// lib/cache.ts
export const cacheConfig = {
  // Static assets
  '/_next/static/*': {
    maxAge: 365 * 24 * 60 * 60, // 1 year
    immutable: true,
  },
  
  // API responses
  '/api/*': {
    maxAge: 5 * 60, // 5 minutes
    staleWhileRevalidate: 60 * 60, // 1 hour
  },
  
  // Images
  '/uploads/*': {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
};
```

## Security Considerations

### Environment Security
```bash
# Secure environment variables
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)" >> .env.production

# Restrict file permissions
chmod 600 .env.production
```

### HTTPS Configuration
```nginx
# nginx.conf
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
}
```

## Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clear Next.js cache
rm -rf .next

# Clear node_modules
rm -rf node_modules package-lock.json
npm install

# Check TypeScript errors
npx tsc --noEmit
```

#### Database Connection Issues
```bash
# Test database connection
psql $DATABASE_URL -c "SELECT 1;"

# Check connection pool
npm run db:status
```

#### Memory Issues
```bash
# Monitor memory usage
npm run build --memory-limit=4096

# Check Node.js heap size
node --inspect app.js
```

### Performance Debugging

#### Lighthouse CI
```bash
# Install Lighthouse CI
npm install -g @lhci/cli

# Run Lighthouse tests
lhci autorun
```

#### Bundle Analysis
```bash
# Webpack Bundle Analyzer
npx webpack-bundle-analyzer .next/static/chunks/

# Source map explorer
npx source-map-explorer .next/static/chunks/
```

## Rollback Procedures

### Quick Rollback
```bash
# Vercel rollback
vercel rollback --to <deployment-url>

# Git rollback
git revert HEAD
git push origin main
```

### Database Rollback
```bash
# Rollback migrations
npm run db:rollback --to=previous

# Restore backup
psql $DATABASE_URL < backup.sql
```

---

This deployment guide covers the essential aspects of deploying ResumeBoost to production.
