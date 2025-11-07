
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { supabase } from '@/integrations/supabase/client'
import { initSentry } from './config/sentry'
import * as Sentry from '@sentry/react'
import { ErrorBoundary } from './components/ErrorBoundary'
import { initPosthog, posthog } from '@/config/posthog'

// Initialize Sentry
initSentry()

// Initialize Posthog if user has already consented
const CONSENT_KEY = 'analytics_consent';
const consent = localStorage.getItem(CONSENT_KEY);
if (consent === 'accepted') {
  initPosthog();
}

// Debug para verificar a conexão do Supabase
console.log('Tentando conectar ao Supabase através da integração')

// Verificar a conexão ao carregar a aplicação
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth state changed:', event, !!session)

  // Set Sentry user context when logged in
  if (session?.user) {
    Sentry.setUser({
      id: session.user.id,
      email: session.user.email,
    })
    // Set Posthog user context
    if (posthog.__loaded) {
      posthog.identify(session.user.id, {
        email: session.user.email,
      })
    }
  } else {
    Sentry.setUser(null)
    // Reset Posthog on logout
    if (posthog.__loaded) {
      posthog.reset()
    }
  }
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
