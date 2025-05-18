
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
  // Desabilitar rastreamento Plausible para resolver o erro de conexão recusada
  if (typeof window !== 'undefined') {
    // @ts-ignore
    window.plausible = function() {}; // Função nula para evitar erros
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
