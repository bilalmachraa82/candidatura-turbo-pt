import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { posthog } from '@/config/posthog';

export function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    // Only track if posthog is initialized and user has consented
    if (posthog.__loaded) {
      posthog.capture('$pageview', {
        path: location.pathname,
      });
    }
  }, [location]);
}
