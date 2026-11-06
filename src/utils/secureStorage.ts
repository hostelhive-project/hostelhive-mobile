import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import type { User } from '../types/api';

const KEY_ACCESS_TOKEN = 'hostelhive_access_token';
const KEY_REFRESH_TOKEN = 'hostelhive_refresh_token';
const KEY_CACHED_USER = 'hostelhive_user_cache';

const isWeb = Platform.OS === 'web';

/**
 * In-memory fallback if localStorage is unavailable
 * (e.g., SSR environment, node export runner, or restricted browser context).
 */
const memoryStorage = new Map<string, string>();

const webStorage = {
  getItem(key: string): string | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        return window.localStorage.getItem(key);
      } catch {
        return memoryStorage.get(key) || null;
      }
    }
    return memoryStorage.get(key) || null;
  },

  setItem(key: string, value: string): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(key, value);
        return;
      } catch {
        memoryStorage.set(key, value);
        return;
      }
    }
    memoryStorage.set(key, value);
  },

  removeItem(key: string): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem(key);
      } catch {
        memoryStorage.delete(key);
      }
    }
    memoryStorage.delete(key);
  },
};

/**
 * Platform-aware storage adapter:
 * - Native (iOS / Android): uses hardware-backed expo-secure-store (keychain / keystore).
 * - Web (Development & preview): uses browser localStorage with memory fallback.
 *
 * Centralizes all platform-specific storage handling to preserve a single, uniform API.
 */
export const secureStorage = {
  async saveTokens(accessToken: string, refreshToken?: string): Promise<void> {
    if (isWeb) {
      webStorage.setItem(KEY_ACCESS_TOKEN, accessToken);
      if (refreshToken) {
        webStorage.setItem(KEY_REFRESH_TOKEN, refreshToken);
      }
      return;
    }

    try {
      await SecureStore.setItemAsync(KEY_ACCESS_TOKEN, accessToken);
      if (refreshToken) {
        await SecureStore.setItemAsync(KEY_REFRESH_TOKEN, refreshToken);
      }
    } catch (err) {
      console.warn('[secureStorage] Failed to save tokens securely on native:', err);
    }
  },

  async getAccessToken(): Promise<string | null> {
    if (isWeb) {
      return webStorage.getItem(KEY_ACCESS_TOKEN);
    }

    try {
      return await SecureStore.getItemAsync(KEY_ACCESS_TOKEN);
    } catch {
      return null;
    }
  },

  async getRefreshToken(): Promise<string | null> {
    if (isWeb) {
      return webStorage.getItem(KEY_REFRESH_TOKEN);
    }

    try {
      return await SecureStore.getItemAsync(KEY_REFRESH_TOKEN);
    } catch {
      return null;
    }
  },

  async saveCachedUser(user: User): Promise<void> {
    const serialized = JSON.stringify(user);
    if (isWeb) {
      webStorage.setItem(KEY_CACHED_USER, serialized);
      return;
    }

    try {
      await SecureStore.setItemAsync(KEY_CACHED_USER, serialized);
    } catch (err) {
      console.warn('[secureStorage] Failed to cache user info on native:', err);
    }
  },

  async getCachedUser(): Promise<User | null> {
    let raw: string | null = null;
    if (isWeb) {
      raw = webStorage.getItem(KEY_CACHED_USER);
    } else {
      try {
        raw = await SecureStore.getItemAsync(KEY_CACHED_USER);
      } catch {
        return null;
      }
    }

    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  },

  async clearSession(): Promise<void> {
    if (isWeb) {
      webStorage.removeItem(KEY_ACCESS_TOKEN);
      webStorage.removeItem(KEY_REFRESH_TOKEN);
      webStorage.removeItem(KEY_CACHED_USER);
      return;
    }

    try {
      await SecureStore.deleteItemAsync(KEY_ACCESS_TOKEN);
      await SecureStore.deleteItemAsync(KEY_REFRESH_TOKEN);
      await SecureStore.deleteItemAsync(KEY_CACHED_USER);
    } catch (err) {
      console.warn('[secureStorage] Error clearing session on native:', err);
    }
  },

  // Direct convenience aliases
  async saveUser(user: User): Promise<void> {
    return this.saveCachedUser(user);
  },

  async getUser(): Promise<User | null> {
    return this.getCachedUser();
  },
};
