
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  
  useEffect(() => {
    console.log("ProtectedRoute - isLoading:", isLoading, "user:", !!user);
  }, [isLoading, user]);

  // Show a loading indicator while we're checking authentication state
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-pt-blue" />
        <span className="ml-2 text-pt-blue">A verificar autenticação...</span>
      </div>
    );
  }

  // If not authenticated, redirect to login while preserving the intended destination
  if (!user) {
    console.log("Utilizador não autenticado, redirecionando para login");
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // User is authenticated, render the children
  return <>{children}</>;
};

export default ProtectedRoute;
