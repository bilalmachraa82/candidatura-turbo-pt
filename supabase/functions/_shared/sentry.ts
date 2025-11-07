import * as Sentry from "https://deno.land/x/sentry@7.114.0/index.mjs";

let initialized = false;

/**
 * Initialize Sentry for Edge Functions
 * Call this at the start of each edge function
 */
export function initSentry() {
  if (initialized) {
    return;
  }

  const sentryDsn = Deno.env.get('SENTRY_DSN');

  if (!sentryDsn) {
    console.warn('SENTRY_DSN not configured for edge functions');
    return;
  }

  Sentry.init({
    dsn: sentryDsn,
    environment: Deno.env.get('ENVIRONMENT') || 'edge-functions',
    tracesSampleRate: 1.0,
    // Don't send personal data
    beforeSend(event) {
      // Remove sensitive data
      if (event.request?.headers) {
        delete event.request.headers['Authorization'];
        delete event.request.headers['authorization'];
      }
      return event;
    },
  });

  initialized = true;
}

/**
 * Wrapper for edge function handlers with Sentry error tracking
 */
export function withSentry<T>(
  handler: (req: Request) => Promise<Response>
): (req: Request) => Promise<Response> {
  return async (req: Request) => {
    initSentry();

    try {
      return await handler(req);
    } catch (error) {
      // Capture the error in Sentry
      Sentry.captureException(error, {
        tags: {
          function: 'edge-function',
          method: req.method,
          url: req.url,
        },
      });

      // Re-throw the error
      throw error;
    }
  };
}

/**
 * Track a custom span in Sentry
 */
export async function trackSpan<T>(
  name: string,
  op: string,
  attributes: Record<string, any>,
  operation: () => Promise<T>
): Promise<T> {
  return await Sentry.startSpan(
    {
      name,
      op,
      attributes,
    },
    async () => {
      return await operation();
    }
  );
}

/**
 * Capture a message in Sentry
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  Sentry.captureMessage(message, level);
}

/**
 * Capture an exception in Sentry
 */
export function captureException(error: Error, tags?: Record<string, string>) {
  Sentry.captureException(error, { tags });
}
