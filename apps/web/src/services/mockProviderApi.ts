import { Provider, Insights } from './providerApi';
import { firebaseAuth } from './firebaseAuth';

// Use Firebase Auth or custom backend
const USE_FIREBASE_AUTH = import.meta.env.VITE_USE_FIREBASE_AUTH === 'true';

const MOCK_PROVIDER: Provider = {
  id: 1,
  name: 'John Doe',
  island: 'STT',
  phone: '123-456-7890',
  description: 'Experienced handyman with 10 years of experience.',
  status: 'OPEN_NOW',
  last_active_at: new Date().toISOString(),
  categories: [{ id: 1, name: 'Handyman' }],
  areas: [{ id: 1, name: 'Charlotte Amalie' }],
  badges: [{ type: 'PREMIUM' }],
  updated_at: new Date().toISOString(),
  // Trust system and capabilities
  trust_tier: 2, // Verified
  lifecycle_status: 'ACTIVE',
  is_disputed: false,
  plan: 'PREMIUM',
  plan_source: 'TRIAL',
  trial_end_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
  is_premium_active: true,
  trial_days_left: 5,
  is_trial: true,
  emergency_boost_eligible: true,
};

const MOCK_INSIGHTS: Insights = {
  calls: 15,
  sms: 8,
};

class MockProviderApi {
  async login(email: string, password: string): Promise<{ token: string }> {
    // Check if using Firebase auth
    if (USE_FIREBASE_AUTH) {
      const firebaseUser = await firebaseAuth.signIn(email, password);
      return { token: `firebase_${firebaseUser.uid}` };
    }

    // Fallback to mock auth
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (email === 'provider@example.com' && password === 'password') {
          resolve({ token: 'mock_token' });
        } else {
          reject(new Error('Invalid credentials'));
        }
      }, 1000);
    });
  }

  async sendPasswordResetEmail(email: string): Promise<void> {
    if (USE_FIREBASE_AUTH) {
      return firebaseAuth.sendPasswordResetEmail(email);
    }

    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Mock: Password reset email sent to ${email}`);
        resolve();
      }, 1000);
    });
  }

  async getMe(): Promise<Provider> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const stored = localStorage.getItem('mock_provider');
        resolve(stored ? JSON.parse(stored) : MOCK_PROVIDER);
      }, 500);
    });
  }

  async updateStatus(status: Provider['status']): Promise<Provider> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const provider = { ...MOCK_PROVIDER, status, updated_at: new Date().toISOString() };
        localStorage.setItem('mock_provider', JSON.stringify(provider));
        resolve(provider);
      }, 500);
    });
  }

  async updateProfile(profile: Partial<Pick<Provider, 'phone' | 'description' | 'categories' | 'areas'>>): Promise<Provider> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const provider = { ...MOCK_PROVIDER, ...profile, updated_at: new Date().toISOString() };
        localStorage.setItem('mock_provider', JSON.stringify(provider));
        resolve(provider);
      }, 500);
    });
  }

  async heartbeat(): Promise<{ ok: boolean; last_active_at: string }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ ok: true, last_active_at: new Date().toISOString() });
      }, 200);
    });
  }

  async getInsights(_range: '7d' | '30d'): Promise<Insights> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(MOCK_INSIGHTS);
      }, 500);
    });
  }

  async logLogin(): Promise<void> {
    // Mock implementation - do nothing
    return Promise.resolve();
  }

  async logProfileView(): Promise<void> {
    // Mock implementation - do nothing
    return Promise.resolve();
  }

  async logCustomerInteraction(_type: 'call' | 'sms'): Promise<void> {
    // Mock implementation - do nothing
    return Promise.resolve();
  }
}

export const mockProviderApi = new MockProviderApi();