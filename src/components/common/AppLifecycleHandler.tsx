import React, { useEffect, useRef } from 'react';
import { AppState, Platform, type AppStateStatus } from 'react-native';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { baseApi } from '../../services/baseApi';
import {
  registerForPushNotificationsAsync,
  subscribeToPushTokenRefresh,
} from '../../utils/pushNotifications';
import { useUpdateDeviceTokenMutation } from '../../services/notificationApi';

/**
 * Headless AppState and auth lifecycle listener mounted once at the root level.
 * 1. When the app transitions from background/inactive to active,
 *    it automatically triggers an invalidation of cache tags
 *    to re-synchronize state with server truth.
 * 2. When the user logs in, it safely attempts push notification registration
 *    and links the device token to the user record (non-blocking).
 * 3. Listens for native token rotation events while authenticated and syncs to backend.
 */
export const AppLifecycleHandler: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const [updateDeviceToken] = useUpdateDeviceTokenMutation();
  const activeUserId = useRef<string | null>(null);
  const appState = useRef<AppStateStatus>((AppState.currentState ?? 'active') as AppStateStatus);
  const lastRefreshTime = useRef<number>(Date.now());
  const pushRegisteredForUser = useRef<string | null>(null);
  const isRegistering = useRef<boolean>(false);
  activeUserId.current = isAuthenticated && user?._id ? user._id : null;

  // Safe push notification registration lifecycle
  useEffect(() => {
    if (
      isAuthenticated &&
      user?._id &&
      pushRegisteredForUser.current !== user._id &&
      !isRegistering.current
    ) {
      isRegistering.current = true;
      const registeringUserId = user._id;
      registerForPushNotificationsAsync(async (token) => {
        if (activeUserId.current !== registeringUserId) return;
        try {
          await updateDeviceToken({ userId: registeringUserId, deviceToken: token }).unwrap();
          if (activeUserId.current !== registeringUserId) {
            await updateDeviceToken({ userId: registeringUserId, deviceToken: null }).unwrap();
            return;
          }
          // User is considered successfully registered only AFTER token is obtained & mutation succeeds
          pushRegisteredForUser.current = registeringUserId;
        } catch {
          // Non-blocking: push token registration failure does not affect app runtime
        }
      })
        .catch(() => {
          // Non-blocking fallback
        })
        .finally(() => {
          isRegistering.current = false;
        });
    } else if (!isAuthenticated) {
      pushRegisteredForUser.current = null;
      isRegistering.current = false;
    }
  }, [isAuthenticated, user?._id, updateDeviceToken]);

  // Listen for native push token rotation while authenticated
  useEffect(() => {
    if (Platform.OS === 'web' || !isAuthenticated || !user?._id) {
      return;
    }

    const unsubscribe = subscribeToPushTokenRefresh((newToken) => {
      const registeringUserId = user._id;
      if (newToken && activeUserId.current === registeringUserId) {
        updateDeviceToken({ userId: registeringUserId, deviceToken: newToken })
          .unwrap()
          .then(() => {
            if (activeUserId.current === registeringUserId) {
              pushRegisteredForUser.current = registeringUserId;
            } else {
              return updateDeviceToken({ userId: registeringUserId, deviceToken: null }).unwrap();
            }
          })
          .catch(() => {
            // Non-blocking fallback
          });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isAuthenticated, user?._id, updateDeviceToken]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      // Transition from background/inactive to active (foreground)
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        const now = Date.now();
        // Controlled refetch: throttled to once every 3 seconds
        if (isAuthenticated && now - lastRefreshTime.current > 3000) {
          lastRefreshTime.current = now;
          dispatch(
            baseApi.util.invalidateTags([
              'Booking',
              'Invoice',
              'Payment',
              'Notification',
              'CleaningTask',
              'Review',
            ])
          );
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [dispatch, isAuthenticated]);

  return null;
};
