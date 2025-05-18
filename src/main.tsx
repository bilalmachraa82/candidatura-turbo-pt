
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { checkEnvironmentVariables } from './utils/envDebugger.ts'

// Verificar variáveis de ambiente na inicialização, mas sem exibir mensagens repetidas
if (import.meta.env.DEV) {
  checkEnvironmentVariables();
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
