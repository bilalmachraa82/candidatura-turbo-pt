
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/context/AuthContext';
import { AIProvider } from '@/context/AIContext';
import ProtectedRoute from '@/components/ProtectedRoute';

// Pages
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import DashboardPage from '@/pages/DashboardPage';
import ProjectPage from '@/pages/ProjectPage';
import ContactPage from '@/pages/ContactPage';
import TestPage from '@/pages/TestPage';
import NotFound from '@/pages/NotFound';

import './App.css';

function App() {
  return (
    <AuthProvider>
      <AIProvider>
        <Router>
          <div className="App">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/test" element={<TestPage />} />
              
              {/* Protected Routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              } />
              
              <Route path="/projects/:projectId" element={
                <ProtectedRoute>
                  <ProjectPage />
                </ProtectedRoute>
              } />
              
              {/* Root redirect */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              
              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
          </div>
        </Router>
      </AIProvider>
    </AuthProvider>
  );
}

export default App;
