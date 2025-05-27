
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { supabase } from '@/integrations/supabase/client'

// Debug para verificar a conexão do Supabase
console.log('Tentando conectar ao Supabase através da integração')

// Verificar a conexão ao carregar a aplicação
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth state changed:', event, !!session)
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
