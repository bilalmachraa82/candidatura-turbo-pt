
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Spinner } from './ui/spinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAuth = true 
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Mostrar spinner durante o carregamento
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  // Se não requer autenticação, mostrar os children
  if (!requireAuth) {
    return <>{children}</>;
  }

  // Se requer autenticação e o usuário está autenticado, mostrar os children
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // Se requer autenticação e o usuário não está autenticado, redirecionar para o login
  return <Navigate to="/login" state={{ from: location }} replace />;
};

export default ProtectedRoute;
