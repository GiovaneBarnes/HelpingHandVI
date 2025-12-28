# 🚀 HelpingHandVI Firebase Setup Guide

## Step 1: Create New Firebase Project

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Click "Create a project"**
3. **Project Details**:
   - Project name: `HelpingHandVI`
   - Project ID: `helpinghandvi` (auto-generated)
   - Enable Google Analytics: ☐ (uncheck for now)

## Step 2: Add Web App

1. **Click the `</>` icon** (Add web app)
2. **App Details**:
   - App nickname: `HelpingHandVI Web`
   - Firebase Hosting: ☐ (uncheck - we're using Vite)
3. **Click "Register app"**

## Step 3: Copy Configuration

You'll see a code block like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "helpinghandvi.firebaseapp.com",
  projectId: "helpinghandvi",
  storageBucket: "helpinghandvi.firebasestorage.app",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456789",
  measurementId: "G-ABCDEFGHIJ"
};
```

## Step 4: Update Your .env File

Replace the placeholder values in your `.env` file:

```bash
# Replace these with your actual Firebase config values
VITE_FIREBASE_API_KEY=AIzaSyC...your_actual_key
VITE_FIREBASE_AUTH_DOMAIN=helpinghandvi.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=helpinghandvi
VITE_FIREBASE_STORAGE_BUCKET=helpinghandvi.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456789
VITE_FIREBASE_MEASUREMENT_ID=G-ABCDEFGHIJ
```

## Step 5: Enable Authentication

1. **Go to "Authentication"** in the left sidebar
2. **Click "Get started"**
3. **Go to "Sign-in method" tab**
4. **Enable "Email/Password"**
5. **Click "Save"**

## Step 6: Install Firebase SDK

```bash
cd apps/web
npm install firebase
```

## Step 7: Enable Firebase Auth

Update your `.env` file to enable Firebase authentication:

```bash
VITE_USE_FIREBASE_AUTH=true
```

## Step 8: Test the Integration

1. **Restart your dev server**: `npm run dev`
2. **Try logging in** with any email/password
3. **Firebase will create the user account automatically**

## 🎉 You're Done!

Your HelpingHandVI project now has:
- ✅ **Clean Firebase project** (no old "contacthub" references)
- ✅ **Professional authentication** with Firebase
- ✅ **Email/password login**
- ✅ **Automatic password reset emails**
- ✅ **Secure user management**

## Optional: Customize Email Templates

1. **Go to Authentication → Templates**
2. **Customize password reset emails** with your branding
3. **Add HelpingHandVI logo and colors**

---

**Need help?** The Firebase integration is fully implemented in the code - you just need to create the project and copy the config values!