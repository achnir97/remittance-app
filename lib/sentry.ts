import * as Sentry from '@sentry/react-native';

const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

export function initSentry() {
  if (!DSN) {
    // No DSN in dev — skip silently. Set EXPO_PUBLIC_SENTRY_DSN in production .env
    return;
  }

  Sentry.init({
    dsn: DSN,
    environment: __DEV__ ? 'development' : 'production',
    // Capture 100% of errors, 10% of performance transactions
    tracesSampleRate: __DEV__ ? 0 : 0.1,
    // Attach user context when available — call setUser() after login
    enableAutoSessionTracking: true,
    sessionTrackingIntervalMillis: 30000,
  });
}

export function captureError(error: unknown, context?: Record<string, unknown>) {
  if (error instanceof Error) {
    Sentry.captureException(error, context ? { extra: context } : undefined);
  } else {
    Sentry.captureMessage(String(error), 'error');
  }
  // Always log locally too
  console.error('[Bridge]', error, context ?? '');
}

export function setUserContext(id: string, email?: string) {
  Sentry.setUser({ id, email });
}

export function clearUserContext() {
  Sentry.setUser(null);
}

export { Sentry };
