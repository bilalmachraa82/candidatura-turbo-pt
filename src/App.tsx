
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/context/AuthContext';
import { AIProvider } from '@/context/AIContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardPage from '@/pages/DashboardPage';
import ProjectPage from '@/pages/ProjectPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import ContactPage from '@/pages/ContactPage';
import TestPage from '@/pages/TestPage';
import NotFound from '@/pages/NotFound';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AIProvider>
          <div className="min-h-screen bg-background">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route 
                path="/" 
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/projects/:projectId" 
                element={
                  <ProtectedRoute>
                    <ProjectPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/test" 
                element={
                  <ProtectedRoute>
                    <TestPage />
                  </ProtectedRoute>
                } 
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
          </div>
        </AIProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
