import * as Sentry from "@sentry/react";

export function initSentry() {
  if (import.meta.env.PROD) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: false,
          blockAllMedia: false,
        }),
      ],
      tracesSampleRate: 1.0,
      tracePropagationTargets: ["localhost", /^https:\/\/.*\.supabase\.co/],
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      environment: import.meta.env.MODE,
      beforeSend(event, hint) {
        // Filter out expected errors
        if (event.exception) {
          const error = hint.originalException as Error | undefined;
          // Don't send auth errors
          if (error?.message?.includes('auth')) {
            return null;
          }
        }
        return event;
      },
    });
  }
}
