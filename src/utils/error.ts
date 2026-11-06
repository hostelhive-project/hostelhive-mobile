/**
 * Formats backend error responses into actionable, user-friendly strings.
 */
export function extractErrorMessage(error: unknown, fallbackMessage = 'An unexpected error occurred'): string {
  if (!error) return fallbackMessage;

  // RTK Query error shape: { status: number, data: { message, errors, details } }
  if (typeof error === 'object' && error !== null) {
    const errObj = error as Record<string, any>;

    // Case 1: RTK Query FetchBaseQueryError with response data
    if (errObj.data && typeof errObj.data === 'object') {
      const data = errObj.data;
      if (typeof data.message === 'string' && data.message.trim()) {
        return data.message;
      }
      if (Array.isArray(data.details) && data.details.length > 0) {
        return data.details[0];
      }
      if (data.errors && typeof data.errors === 'object') {
        const firstKey = Object.keys(data.errors)[0];
        if (firstKey && typeof data.errors[firstKey] === 'string') {
          return data.errors[firstKey];
        }
      }
    }

    // Case 2: RTK Query network / connection error
    if (errObj.status === 'FETCH_ERROR') {
      return 'Unable to connect to HostelHive backend. Please ensure the server is running and reachable.';
    }

    if (errObj.status === 'TIMEOUT_ERROR') {
      return 'Request timed out. Please check your internet connection.';
    }

    // Case 3: Standard JS Error
    if (typeof errObj.message === 'string' && errObj.message.trim()) {
      return errObj.message;
    }
  }

  return fallbackMessage;
}

