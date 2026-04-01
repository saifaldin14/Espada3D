/**
 * Monitoring Module
 *
 * Lightweight abstraction over Sentry for error monitoring.
 * Lazily loads @sentry/react only when REACT_APP_SENTRY_DSN is configured,
 * so there is zero build impact when Sentry is not in use.
 */

type SentryModule = typeof import('@sentry/react');

let sentryPromise: Promise<SentryModule> | null = null;
let sentryLoaded: SentryModule | null = null;

const SENTRY_DSN = process.env.REACT_APP_SENTRY_DSN;

function loadSentry(): Promise<SentryModule> | null {
  if (!SENTRY_DSN) return null;
  if (!sentryPromise) {
    sentryPromise = import('@sentry/react').catch((err) => {
      console.warn('[monitoring] @sentry/react is not installed – Sentry disabled.', err);
      return null as unknown as SentryModule;
    });
  }
  return sentryPromise;
}

/**
 * Initialise monitoring. Call once at application startup.
 */
export async function initMonitoring(): Promise<void> {
  const loader = loadSentry();
  if (!loader) return;

  const Sentry = await loader;
  if (!Sentry) return;

  sentryLoaded = Sentry;
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV ?? 'development',
    enabled: !!SENTRY_DSN,
  });
}

/**
 * Capture an error and forward it to Sentry (if configured).
 * Always falls back to console.error.
 */
export function captureError(
  error: Error | string,
  context?: Record<string, unknown>,
): void {
  const err = typeof error === 'string' ? new Error(error) : error;

  if (sentryLoaded) {
    sentryLoaded.captureException(err, { extra: context });
  } else {
    console.error('[monitoring]', err, context ?? '');
  }
}

/**
 * Capture an informational / warning message.
 */
export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
): void {
  if (sentryLoaded) {
    sentryLoaded.captureMessage(message, level);
  } else if (level === 'error') {
    console.error('[monitoring]', message);
  } else if (level === 'warning') {
    console.warn('[monitoring]', message);
  } else {
    console.log('[monitoring]', message);
  }
}
