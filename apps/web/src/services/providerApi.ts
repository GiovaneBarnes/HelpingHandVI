import { mockProviderApi } from './mockProviderApi';
import { firebaseAuth, AuthUser } from './firebaseAuth';

// Use Firebase Auth or custom backend
const USE_FIREBASE_AUTH = import.meta.env.VITE_USE_FIREBASE_AUTH === 'true';

export interface Provider {
  id: number;
  name: string;
  island: string;
  phone: string;
  description: string;
  status: 'OPEN_NOW' | 'BUSY_LIMITED' | 'NOT_TAKING_WORK';
  last_active_at: string;
  categories: { id: number; name: string }[];
  areas: { id: number; name: string }[];
  badges?: { type: 'PREMIUM' | 'TRIAL' | 'GOV_APPROVED' | 'VERIFIED' | 'EMERGENCY_READY' }[];
  updated_at: string;
  // Trust system and capabilities
  trust_tier: number; // 1 = None, 2 = Verified, 3 = Gov Approved
  lifecycle_status: 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'ARCHIVED';
  is_disputed: boolean;
  plan: 'FREE' | 'PREMIUM';
  plan_source: 'TRIAL' | 'PAID' | 'ADMIN';
  trial_end_at?: string;
  is_premium_active: boolean;
  trial_days_left: number;
  is_trial: boolean;
  emergency_boost_eligible: boolean;
  contact_preference?: 'PHONE' | 'EMAIL' | 'BOTH';
}

export interface Insights {
  calls: number;
  sms: number;
}

export interface ProviderApi {
  login(email: string, password: string): Promise<{ token: string; firebaseUser?: AuthUser }>;
  getMe(): Promise<Provider>;
  updateStatus(status: Provider['status']): Promise<Provider>;
  updateProfile(profile: Partial<Pick<Provider, 'phone' | 'description' | 'categories' | 'areas' | 'contact_preference'>>): Promise<Provider>;
  heartbeat(): Promise<{ ok: boolean; last_active_at: string }>;
  getInsights(range: '7d' | '30d'): Promise<Insights>;
  logLogin(): Promise<void>;
  logProfileView(): Promise<void>;
  logCustomerInteraction(type: 'call' | 'sms'): Promise<void>;
  sendPasswordResetEmail?(email: string): Promise<void>;
}

// Use mock API for now
export const providerApi: ProviderApi = USE_FIREBASE_AUTH
  ? Object.assign(mockProviderApi, { sendPasswordResetEmail: firebaseAuth.sendPasswordResetEmail.bind(firebaseAuth) })
  : mockProviderApi;