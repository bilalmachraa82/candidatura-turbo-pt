
import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'

// Pages
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import DashboardPage from './pages/DashboardPage'
import ProjectPage from './pages/ProjectPage'
import NotFound from './pages/NotFound'
import ContactPage from './pages/ContactPage'

// Components
import { Toaster } from '@/components/ui/toaster'

// Contexts
import { AuthProvider } from '@/context/AuthContext'
import { AIProvider } from '@/context/AIContext'

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <AIProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/projects/:projectId" element={<ProjectPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/" element={<DashboardPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
          <Toaster />
        </AIProvider>
      </AuthProvider>
    </div>
  )
}

export default App
