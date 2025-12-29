#!/bin/bash

# Firebase Deployment Script for HelpingHand

set -e

echo "🔥 Starting Firebase Deployment"

# Check prerequisites
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Install with: npm install -g firebase-tools"
    exit 1
fi

if ! command -v gcloud &> /dev/null; then
    echo "❌ Google Cloud SDK not found. Install from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Build applications
echo "📦 Building applications..."
cd apps/web && npm run build && cd ../..
cd apps/api && npm run build && cd ../..

# Deploy to Firebase Hosting
echo "🌐 Deploying frontend to Firebase Hosting..."
firebase deploy --only hosting

# Build and deploy API to Cloud Run
echo "🚀 Building and deploying API to Cloud Run..."
cd apps/api && gcloud builds submit --tag gcr.io/$(gcloud config get-value project)/helpinghand-api . && cd ../..
gcloud run deploy helpinghand-api \
  --image gcr.io/$(gcloud config get-value project)/helpinghand-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated

echo "✅ Firebase deployment complete!"
echo "🌐 Frontend: https://$(firebase use | tail -1).web.app"
echo "🔗 API: Check Cloud Run console for URL"