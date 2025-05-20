
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { supabase } from './lib/supabase'

// Debug para verificar a conexão do Supabase
console.log('Tentando conectar ao Supabase:', {
  url: import.meta.env.VITE_SUPABASE_URL || 'URL não definida',
  keyDefined: !!import.meta.env.VITE_SUPABASE_ANON_KEY
})

// Verificar a conexão ao carregar a aplicação
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth state changed:', event, !!session)
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
