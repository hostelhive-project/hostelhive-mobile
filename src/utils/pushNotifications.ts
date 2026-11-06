import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

/**
 * Detect whether the application is currently executing inside the Expo Go client app.
 *
 * In Expo Go:
 * - Constants.appOwnership === 'expo'
 * - Constants.executionEnvironment === ExecutionEnvironment.StoreClient
 * - Constants.expoVersion is a defined version string (null in standalone / dev builds)
 *
 * Remote push notification functionality was removed from Expo Go in SDK 53+.
 * Standalone APKs and custom development builds (expo-dev-client) retain full push support.
 */
export function isExpoGoClient(): boolean {
  if (Platform.OS === 'web') return false;
  return (
    (Constants as any).appOwnership === 'expo' ||
    Boolean((Constants as any).expoVersion) ||
    (Constants.executionEnvironment === ExecutionEnvironment.StoreClient &&
      (Constants as any).appOwnership === 'expo')
  );
}

// Cached promise for the dynamically loaded expo-notifications module
let notificationsModulePromise: Promise<typeof import('expo-notifications') | null> | null = null;

/**
 * Safely load expo-notifications dynamically only when running outside Expo Go and Web.
 * Never executes top-level static imports of expo-notifications to prevent Expo Go runtime errors.
 */
async function getNotificationsModule(): Promise<typeof import('expo-notifications') | null> {
  if (Platform.OS === 'web' || isExpoGoClient()) {
    return null;
  }

  if (!notificationsModulePromise) {
    notificationsModulePromise = (async () => {
      try {
        const mod = await import('expo-notifications');
        // Configure global foreground notification presentation handler once
        mod.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowBanner: true,
            shouldShowList: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
          }),
        });
        return mod;
      } catch (err) {
        if (__DEV__) {
          console.warn('Failed to dynamically load expo-notifications:', err);
        }
        return null;
      }
    })();
  }

  return notificationsModulePromise;
}

export function subscribeToNotificationEvents(
  onResponse: (identifier: string, data: Record<string, unknown>) => void,
  onReceived: () => void
) {
  let active = true;
  const subscriptions: Array<{ remove: () => void }> = [];
  void getNotificationsModule().then(async (notifications) => {
    if (!active || !notifications) return;
    const handle = (response: import('expo-notifications').NotificationResponse) => {
      if (active) onResponse(response.notification.request.identifier, response.notification.request.content.data ?? {});
    };
    subscriptions.push(notifications.addNotificationResponseReceivedListener(handle));
    subscriptions.push(notifications.addNotificationReceivedListener(onReceived));
    const last = await notifications.getLastNotificationResponseAsync();
    if (last && active) handle(last);
  }).catch(() => undefined);
  return () => { active = false; subscriptions.forEach((subscription) => subscription.remove()); };
}

/**
 * Cross-platform push notification registration helper.
 *
 * - In Expo Go: Safely skipped without error. Logs diagnostic message in __DEV__.
 * - On Web: Safely skipped (returns null).
 * - In Standalone / Development builds: Requests permissions, sets up Android notification
 *   channel, and obtains the native FCM device push token via getDevicePushTokenAsync().
 */
export async function registerForPushNotificationsAsync(
  onTokenReady?: (token: string) => Promise<void> | void
): Promise<string | null> {
  // Push notifications not supported on Web environment
  if (Platform.OS === 'web') {
    return null;
  }

  // Native push notifications removed from Expo Go in SDK 53+
  if (isExpoGoClient()) {
    if (__DEV__) {
      console.log('Native push notifications skipped in Expo Go. Use a development build.');
    }
    return null;
  }

  try {
    const Notifications = await getNotificationsModule();
    if (!Notifications) {
      return null;
    }

    // 1. Create Android notification channel FIRST before checking permissions/token
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'HostelHive Notifications',
        importance: Notifications.AndroidImportance.HIGH,
      });
    }

    // 2. Permission verification & request
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return null;
    }

    // 3. Obtain native device push token (FCM registration token on Android, APNs on iOS)
    const tokenData = await Notifications.getDevicePushTokenAsync();
    const token = typeof tokenData?.data === 'string' ? tokenData.data : null;

    if (token && onTokenReady) {
      await onTokenReady(token);
    }

    return token;
  } catch (error) {
    if (__DEV__) {
      console.warn('Push notification registration failed:', error);
    }
    return null;
  }
}

/**
 * Safely subscribe to native push token rotation events while authenticated.
 * Returns an unsubscribe cleanup function.
 * Automatically no-ops on Web and Expo Go.
 */
export function subscribeToPushTokenRefresh(
  onTokenRefresh: (token: string) => void
): () => void {
  if (Platform.OS === 'web' || isExpoGoClient()) {
    return () => {};
  }

  let isMounted = true;
  let subscription: { remove: () => void } | null = null;

  getNotificationsModule().then((Notifications) => {
    if (!isMounted || !Notifications) return;
    try {
      subscription = Notifications.addPushTokenListener((tokenData) => {
        const token = typeof tokenData?.data === 'string' ? tokenData.data : null;
        if (token) {
          onTokenRefresh(token);
        }
      });
    } catch {
      // Non-blocking fallback
    }
  });

  return () => {
    isMounted = false;
    subscription?.remove();
  };
}
