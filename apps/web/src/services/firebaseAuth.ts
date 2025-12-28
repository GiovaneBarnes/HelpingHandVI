import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  confirmPasswordReset,
  User,
  onAuthStateChanged,
  AuthError
} from 'firebase/auth';
import { auth } from './firebase';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
}

export class FirebaseAuthService {
  // Convert Firebase User to our AuthUser interface
  private toAuthUser(user: User): AuthUser {
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      emailVerified: user.emailVerified,
    };
  }

  // Sign up with email and password
  async signUp(email: string, password: string): Promise<AuthUser> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      return this.toAuthUser(userCredential.user);
    } catch (error) {
      throw this.handleAuthError(error as AuthError);
    }
  }

  // Sign in with email and password
  async signIn(email: string, password: string): Promise<AuthUser> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return this.toAuthUser(userCredential.user);
    } catch (error) {
      throw this.handleAuthError(error as AuthError);
    }
  }

  // Sign out
  async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      throw this.handleAuthError(error as AuthError);
    }
  }

  // Send password reset email
  async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      throw this.handleAuthError(error as AuthError);
    }
  }

  // Confirm password reset with code and new password
  async confirmPasswordReset(code: string, newPassword: string): Promise<void> {
    try {
      await confirmPasswordReset(auth, code, newPassword);
    } catch (error) {
      throw this.handleAuthError(error as AuthError);
    }
  }

  // Get current user
  getCurrentUser(): AuthUser | null {
    const user = auth.currentUser;
    return user ? this.toAuthUser(user) : null;
  }

  // Listen to auth state changes
  onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void {
    return onAuthStateChanged(auth, (user) => {
      callback(user ? this.toAuthUser(user) : null);
    });
  }

  // Handle Firebase auth errors
  private handleAuthError(error: AuthError): Error {
    switch (error.code) {
      case 'auth/user-disabled':
        return new Error('This account has been disabled');
      case 'auth/user-not-found':
        return new Error('No account found with this email');
      case 'auth/wrong-password':
        return new Error('Incorrect password');
      case 'auth/email-already-in-use':
        return new Error('An account with this email already exists');
      case 'auth/weak-password':
        return new Error('Password is too weak');
      case 'auth/invalid-email':
        return new Error('Invalid email address');
      case 'auth/operation-not-allowed':
        return new Error('This operation is not allowed');
      case 'auth/expired-action-code':
        return new Error('This action code has expired');
      case 'auth/invalid-action-code':
        return new Error('Invalid action code');
      case 'auth/too-many-requests':
        return new Error('Too many requests. Please try again later');
      default:
        console.error('Firebase auth error:', error);
        return new Error('Authentication failed. Please try again.');
    }
  }
}

export const firebaseAuth = new FirebaseAuthService();