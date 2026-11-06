import { Platform } from 'react-native';

/**
 * HostelHive Mobile API Configuration
 * 
 * For Android Emulator: 10.0.2.2 maps to host machine's localhost:5000
 * For Physical Android Device: replace with your local Wi-Fi LAN IP (e.g., http://192.168.1.X:5000/api)
 * For Production: replace with production deployment URL
 */
const DEFAULT_LOCAL_IP = '10.0.2.2'; // Standard Android emulator loopback

export const API_BASE_URL = 
  process.env.EXPO_PUBLIC_API_URL || 
  (Platform.OS === 'android' ? `http://${DEFAULT_LOCAL_IP}:5000/api` : 'http://localhost:5000/api');

export const ENV = {
  isDev: __DEV__,
  apiBaseUrl: API_BASE_URL,
};

