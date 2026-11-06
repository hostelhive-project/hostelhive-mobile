import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setCredentials, setHydrated } from '../store/slices/authSlice';
import { secureStorage } from '../utils/secureStorage';
import { authApi } from '../services/authApi';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, isHydrated } = useAppSelector((state) => state.auth);
  const [triggerGetMe] = authApi.useLazyGetMeQuery();

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      try {
        const accessToken = await secureStorage.getAccessToken();
        const refreshToken = await secureStorage.getRefreshToken();
        const cachedUser = await secureStorage.getCachedUser();

        if (accessToken && cachedUser && isMounted) {
          // Immediately hydrate Redux state from secure storage
          dispatch(
            setCredentials({
              user: cachedUser,
              accessToken,
              refreshToken: refreshToken || undefined,
            })
          );

          // Background revalidation with backend GET /api/auth/me
          try {
            const meResult = await triggerGetMe().unwrap();
            if (meResult?.data && isMounted) {
              // /auth/me may have triggered an access-token refresh in baseApi.
              // Re-read persisted tokens so the cached user update cannot put
              // the expired token back into Redux.
              const currentAccessToken = await secureStorage.getAccessToken();
              const currentRefreshToken = await secureStorage.getRefreshToken();
              await secureStorage.saveCachedUser(meResult.data);
              dispatch(
                setCredentials({
                  user: meResult.data,
                  accessToken: currentAccessToken || accessToken,
                  refreshToken: currentRefreshToken || refreshToken || undefined,
                })
              );
            }
          } catch {
            // If network fails offline, cached credentials remain active
          }
        }
      } catch (err) {
        console.warn('[useAuth] Session restore error:', err);
      } finally {
        if (isMounted) {
          dispatch(setHydrated(true));
        }
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, [dispatch, triggerGetMe]);

  return {
    user,
    isAuthenticated,
    isHydrated,
  };
};

