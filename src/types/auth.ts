import { User } from './api';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponseData extends AuthTokens {
  user: User;
  userId?: string;
}

export interface RegistrationPendingData {
  email: string;
  requiresEmailVerification: true;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterStudentPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
  termsAccepted: true;
}

export interface RefreshTokenPayload {
  refreshToken: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
}

