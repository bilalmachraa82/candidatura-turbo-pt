
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/context/AuthContext';
import { AIProvider } from '@/context/AIContext';
import ProtectedRoute from '@/components/ProtectedRoute';
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
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/contactos" element={<ContactPage />} />
            
            {/* Protected routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } />
            <Route path="/projetos/:projectId" element={
              <ProtectedRoute>
                <ProjectPage />
              </ProtectedRoute>
            } />
            
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
