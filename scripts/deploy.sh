#!/bin/bash

# Production Deployment Script for HelpingHand
# This script sets up and deploys the full application stack

set -e

echo "🚀 Starting HelpingHand Production Deployment"

# Check if required environment variables are set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is required"
    exit 1
fi

if [ -z "$PORT" ]; then
    export PORT=3000
fi

if [ -z "$NODE_ENV" ]; then
    export NODE_ENV=production
fi

echo "📦 Building applications..."

# Build the API
cd apps/api
npm run build
cd ../..

# Build the web app
cd apps/web
npm run build
cd ../..

echo "✅ Builds completed successfully"

echo "🗄️  Setting up database..."
cd apps/api
node ../../scripts/run-migrations.js
cd ../..

echo "🌐 Starting production servers..."

# Start API server in background
cd apps/api
NODE_ENV=production npm start &
API_PID=$!
cd ../..

# Start web server (serving static files)
cd apps/web
npx serve -s dist -l $PORT &
WEB_PID=$!
cd ../..

echo "🎉 Deployment complete!"
echo "📊 API Server: http://localhost:$PORT"
echo "🌐 Web App: http://localhost:$PORT"
echo ""
echo "To stop servers:"
echo "kill $API_PID $WEB_PID"

# Wait for servers
wait