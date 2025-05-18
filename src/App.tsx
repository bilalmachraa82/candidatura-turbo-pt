
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/context/AuthContext';
import { AIProvider } from '@/context/AIContext';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import DashboardPage from '@/pages/DashboardPage';
import ProjectPage from '@/pages/ProjectPage';
import ContactPage from '@/pages/ContactPage';
import NotFound from '@/pages/NotFound';

function App() {
  // Desabilitar Plausible tracking de uma forma segura
  if (typeof window !== 'undefined') {
    // Em vez de tentar redefinir 'plausible', apenas adicionamos uma
    // função stub se não existir ainda
    if (!('plausible' in window) || typeof window.plausible !== 'function') {
      window.plausible = function() {
        // Função vazia e silenciosa
        return;
      };
    }
  }
  
  return (
    <Router>
      <AuthProvider>
        <AIProvider>
          <Routes>
            {/* Public routes - temporarily all routes are public */}
            <Route path="/login" element={<DashboardPage />} /> {/* Redireciona login para dashboard */}
            <Route path="/register" element={<DashboardPage />} /> {/* Redireciona registro para dashboard */}
            <Route path="/forgot-password" element={<DashboardPage />} /> {/* Redireciona recuperação de senha para dashboard */}
            <Route path="/contactos" element={<ContactPage />} />
            <Route path="/" element={<DashboardPage />} />
            <Route path="/projetos/:projectId" element={<ProjectPage />} />
            
            {/* Fallback for unknown routes */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
        </AIProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
