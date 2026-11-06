import { useNetInfo } from '@react-native-community/netinfo';

export function useNetworkStatus() {
  const { isConnected, isInternetReachable } = useNetInfo();

  return { isOffline: isConnected === false || isInternetReachable === false };
}
