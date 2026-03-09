#!/bin/bash

# Manual deployment script for ResumeBoost
echo "🚀 Starting manual deployment to Vercel..."

# Check if Vercel CLI is available
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Deploy to Vercel
echo "📦 Installing dependencies..."
npm ci

echo "🔨 Building application..."
npm run build

echo "🚀 Deploying to Vercel..."
npx vercel --prod

echo "✅ Deployment completed!"
echo "🌐 Site available at: https://resume-boost.vercel.app"
