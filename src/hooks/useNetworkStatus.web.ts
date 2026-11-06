import { useEffect, useState } from 'react';

function readIsOffline() {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

// Browser connectivity events avoid NetInfo's web fetch/abort reachability probe.
// An online browser can still have an unavailable API; request errors handle that.
export function useNetworkStatus() {
  const [isOffline, setIsOffline] = useState(readIsOffline);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateConnection = () => setIsOffline(readIsOffline());
    updateConnection();
    window.addEventListener('online', updateConnection);
    window.addEventListener('offline', updateConnection);

    return () => {
      window.removeEventListener('online', updateConnection);
      window.removeEventListener('offline', updateConnection);
    };
  }, []);

  return { isOffline };
}
