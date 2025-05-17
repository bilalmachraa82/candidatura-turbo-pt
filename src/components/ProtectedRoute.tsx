
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isLoading } = useAuth();

  // Mostrar um indicador de carregamento enquanto verificamos o estado de autenticação
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-pt-blue" />
      </div>
    );
  }

  // Redirecionar para a página de login se o utilizador não estiver autenticado
  if (!user) {
    console.log("Utilizador não autenticado, redirecionando para login");
    return <Navigate to="/login" replace />;
  }

  // Renderizar os componentes filhos se o utilizador estiver autenticado
  return <>{children}</>;
};

export default ProtectedRoute;
