/**
 * Monitoring Module
 *
 * Lightweight abstraction over Sentry for error monitoring.
 * Sentry integration is temporarily disabled.
 * To re-enable, install @sentry/react and restore the original implementation.
 */

/**
 * Initialise monitoring. Call once at application startup.
 * (Sentry temporarily disabled)
 */
export async function initMonitoring(): Promise<void> {
  // no-op: Sentry disabled
}

/**
 * Capture an error. Falls back to console.error.
 * (Sentry temporarily disabled)
 */
export function captureError(
  error: Error | string,
  context?: Record<string, unknown>,
): void {
  const err = typeof error === 'string' ? new Error(error) : error;
  console.error('[monitoring]', err, context ?? '');
}

/**
 * Capture an informational / warning message.
 * (Sentry temporarily disabled)
 */
export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
): void {
  if (level === 'error') {
    console.error('[monitoring]', message);
  } else if (level === 'warning') {
    console.warn('[monitoring]', message);
  } else {
    console.log('[monitoring]', message);
  }
}
