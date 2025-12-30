# Firebase Auth Integration Guide

## ✅ Firebase Configuration Updated

The Firebase configuration has been updated for **HelpingHandVI** project. The old "contacthub" configuration has been removed.

## Create New Firebase Project

### 1. Go to Firebase Console
Visit: https://console.firebase.google.com/

### 2. Create New Project
- Click "Create a project" or "Add project"
- Project name: `HelpingHandVI`
- Project ID: `helpinghandvi` (auto-generated)
- Enable Google Analytics: Optional

### 3. Add Web App
- Click the `</>` icon to add a web app
- App nickname: `HelpingHandVI Web`
- Firebase Hosting: Disable (we're using Vite)
- Click "Register app"

### 4. Copy Configuration
You'll get the Firebase config object. Update your `.env` file with these values:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "helpinghandvi.firebaseapp.com",
  projectId: "helpinghandvi",
  storageBucket: "helpinghandvi.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456",
  measurementId: "G-XXXXXXXXXX"
};
```

### 5. Enable Authentication
- Go to **Authentication** → **Sign-in method**
- Enable **Email/Password**
- Configure email templates (optional)

## Installation Required

```bash
# Install Firebase SDK
cd apps/web
npm install firebase
```

## Features Ready to Use

- ✅ **Email/password authentication**
- ✅ **Password reset emails**
- ✅ **User management**
- ✅ **Security rules**
- ✅ **Real-time auth state**

## Next Steps

1. **Create Firebase project** with name "HelpingHandVI"
2. **Copy config values** to `.env` file
3. **Install Firebase SDK**: `npm install firebase`
4. **Set `VITE_USE_FIREBASE_AUTH=true`** to enable Firebase auth
5. **Test authentication flow**

The integration is **ready** - you just need to create the Firebase project and add the real config values!