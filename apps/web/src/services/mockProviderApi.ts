import { API_BASE } from '../constants';
import { Provider, Insights } from './providerApi';
import { firebaseAuth } from './firebaseAuth';

// Use Firebase Auth or custom backend
const USE_FIREBASE_AUTH = import.meta.env.VITE_USE_FIREBASE_AUTH === 'true';

const MOCK_INSIGHTS: Insights = {
  calls: 15,
  sms: 8,
};

class MockProviderApi {
  async login(email: string, password: string): Promise<{ token: string }> {
    // Check if using Firebase auth
    if (USE_FIREBASE_AUTH) {
      const firebaseUser = await firebaseAuth.signIn(email, password);
      return { token: firebaseUser.idToken };
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
    const token = localStorage.getItem('provider_token');
    if (!token) {
      throw new Error('No token found');
    }
    
    const response = await fetch(`${API_BASE}/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch provider data');
    }
    
    return response.json();
  }

  async updateStatus(status: Provider['status']): Promise<Provider> {
    const token = localStorage.getItem('provider_token');
    if (!token) {
      throw new Error('No token found');
    }
    
    const response = await fetch(`${API_BASE}/me/status`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    });
    
    if (!response.ok) {
      throw new Error('Failed to update status');
    }
    
    return response.json();
  }

  async updateProfile(profile: Partial<Pick<Provider, 'phone' | 'description' | 'categories' | 'areas'>>): Promise<Provider> {
    const token = localStorage.getItem('provider_token');
    if (!token) {
      throw new Error('No token found');
    }
    
    const response = await fetch(`${API_BASE}/me/profile`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(profile)
    });
    
    if (!response.ok) {
      throw new Error('Failed to update profile');
    }
    
    return response.json();
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