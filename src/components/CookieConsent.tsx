import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { initPosthog, posthog } from '@/config/posthog';

const CONSENT_KEY = 'analytics_consent';

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem(CONSENT_KEY);
    if (consent === null) {
      setShowBanner(true);
    } else if (consent === 'accepted') {
      // User has accepted, initialize Posthog
      initPosthog();
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(CONSENT_KEY, 'accepted');
    setShowBanner(false);
    initPosthog();
  };

  const handleDecline = () => {
    localStorage.setItem(CONSENT_KEY, 'declined');
    setShowBanner(false);
    // Opt out of tracking
    if (posthog.__loaded) {
      posthog.opt_out_capturing();
    }
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Cookie Consent</CardTitle>
          <CardDescription>
            We use cookies and analytics to improve your experience and understand how you use our application.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            We use Posthog for product analytics and user behavior tracking. This helps us understand how you use the app
            and make improvements. All data is processed in compliance with GDPR regulations.
          </p>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button variant="outline" onClick={handleDecline}>
            Decline
          </Button>
          <Button onClick={handleAccept}>
            Accept
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
