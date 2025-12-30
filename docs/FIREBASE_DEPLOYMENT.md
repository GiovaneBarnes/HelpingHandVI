# Firebase Deployment Guide for HelpingHand

## Architecture Overview
- **Frontend**: Firebase Hosting (static React app)
- **Backend**: Google Cloud Run (containerized Express.js API)
- **Database**: Cloud SQL PostgreSQL (managed PostgreSQL)
- **Auth**: Firebase Authentication (already configured)

## Prerequisites
1. Google Cloud Platform account
2. Firebase CLI installed: `npm install -g firebase-tools`
3. Docker installed (for Cloud Run deployment)
4. Google Cloud SDK installed

## Step 1: Firebase Project Setup

```bash
# Login to Firebase
firebase login

# Initialize Firebase project
firebase init hosting

# Select your project or create new one
# Choose "apps/web/dist" as public directory
# Configure as single-page app: Yes
```

## Step 2: Google Cloud Setup

```bash
# Login to Google Cloud
gcloud auth login

# Set project
gcloud config set project YOUR_PROJECT_ID

# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

## Step 3: Cloud SQL Database Setup

```bash
# Create PostgreSQL instance
gcloud sql instances create helpinghand-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1

# Create database
gcloud sql databases create virgin_islands_providers \
  --instance=helpinghand-db

# Create user (or use default postgres user)
gcloud sql users create helpinghand-user \
  --instance=helpinghand-db \
  --password=YOUR_SECURE_PASSWORD
```

## Step 4: Deploy Backend to Cloud Run

```bash
# Build and push Docker image
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/helpinghand-api .

# Deploy to Cloud Run
gcloud run deploy helpinghand-api \
  --image gcr.io/YOUR_PROJECT_ID/helpinghand-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production,DATABASE_URL=postgresql://helpinghand-user:YOUR_PASSWORD@YOUR_CLOUD_SQL_CONNECTION_NAME/virgin_islands_providers"
```

## Step 5: Configure Environment Variables

Create `.env.production` with:

```env
DATABASE_URL=postgresql://helpinghand-user:YOUR_PASSWORD@YOUR_CLOUD_SQL_IP/virgin_islands_providers
NODE_ENV=production
PORT=8080
FRONTEND_URL=https://your-project.web.app

# Firebase config (from Firebase console)
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
# ... other Firebase config
```

## Step 6: Database Migration

```bash
# Run migrations on Cloud SQL
gcloud sql connect helpinghand-db --user=helpinghand-user
# Then run the SQL files from database/migrations/ and database/seeds/
```

## Step 7: Deploy Frontend

```bash
# Build the web app
cd apps/web
npm run build
cd ..

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

## Step 8: Update Firebase Config

Update `firebase.json` with your Cloud Run service URL:

```json
{
  "hosting": {
    "public": "apps/web/dist",
    "rewrites": [
      {
        "source": "/api/**",
        "run": {
          "serviceId": "helpinghand-api",
          "region": "us-central1"
        }
      }
    ]
  }
}
```

## Alternative: Simplified Deployment

If you prefer simpler deployment:

### Option A: Firebase Functions (Limited)
Convert Express.js to Firebase Functions (requires code changes)

### Option B: App Engine Standard
Use Google App Engine for both frontend and backend

### Option C: Hybrid Approach
- Frontend: Firebase Hosting
- Backend: Railway/Render/Heroku
- Database: Cloud SQL or Supabase

## Cost Estimate (Free Tier Friendly)

- **Firebase Hosting**: Free for first 10GB
- **Cloud Run**: 2 million requests free/month
- **Cloud SQL**: ~$10-20/month for small instance
- **Firebase Auth**: Free for <50k users

## Monitoring & Maintenance

```bash
# View logs
gcloud logs read "resource.type=cloud_run_revision AND resource.labels.service_name=helpinghand-api"

# Update deployment
gcloud run deploy helpinghand-api --image gcr.io/YOUR_PROJECT_ID/helpinghand-api:latest
```

## Security Notes

1. Use Cloud SQL private IP for better security
2. Configure VPC if needed
3. Set up proper IAM permissions
4. Enable HTTPS (automatic with Firebase Hosting)
5. Configure CORS properly in Express.js