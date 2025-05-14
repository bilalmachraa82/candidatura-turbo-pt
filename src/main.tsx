
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { checkEnvironmentVariables } from './utils/envDebugger.ts'

// Verificar variáveis de ambiente na inicialização
if (import.meta.env.DEV) {
  const envStatus = checkEnvironmentVariables();
  
  if (envStatus.supabaseConfigured) {
    console.info('🔑 Supabase configurado com sucesso!');
  } else {
    console.error('⚠️ Configuração do Supabase incompleta ou inválida!');
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
