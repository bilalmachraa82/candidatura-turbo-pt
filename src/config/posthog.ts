import posthog from 'posthog-js';

export function initPosthog() {
  if (typeof window !== 'undefined' && import.meta.env.VITE_POSTHOG_KEY) {
    posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
      api_host: 'https://eu.posthog.com',  // EU host for GDPR compliance
      person_profiles: 'identified_only',
      capture_pageview: false,  // We'll handle pageviews manually
      capture_pageleave: true,
      autocapture: false,  // Manual events for better control
      disable_session_recording: false,
      session_recording: {
        maskAllInputs: true,  // GDPR-friendly - masks all input fields
        maskTextSelector: '.sensitive',  // Additional masking for sensitive content
      },
    });
  }
}

export { posthog };
