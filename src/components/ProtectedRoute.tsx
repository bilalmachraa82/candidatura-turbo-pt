
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

// Contador para prevenir loops infinitos
let redirectCount = 0;
const MAX_REDIRECTS = 3;
const resetCounterAfter = 10000; // 10 segundos

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  
  useEffect(() => {
    // Resetar contador após um tempo
    const timer = setTimeout(() => {
      redirectCount = 0;
    }, resetCounterAfter);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Mostrar carregamento enquanto verifica estado de autenticação
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-pt-blue" />
        <span className="ml-2 text-pt-blue">A verificar autenticação...</span>
      </div>
    );
  }
  
  // Se não autenticado, redirecionar para login
  if (!user) {
    // Verificar se já redirecionamos muitas vezes para evitar loops infinitos
    redirectCount++;
    console.log(`Redirect count: ${redirectCount}`);
    
    if (redirectCount > MAX_REDIRECTS) {
      // Exibir página de erro em vez de redirecionar novamente
      return (
        <div className="flex h-screen w-full flex-col items-center justify-center">
          <h1 className="text-2xl font-bold text-red-600">Erro de redirecionamento</h1>
          <p className="mt-2 text-gray-600">Muitos redirecionamentos detectados. Por favor, tente novamente mais tarde.</p>
          <a href="/login" className="mt-4 rounded bg-pt-blue px-4 py-2 text-white">
            Tentar Novamente
          </a>
        </div>
      );
    }
    
    console.log("User not authenticated, redirecting to login from:", location.pathname);
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  
  // Usuário autenticado, renderizar filhos
  return <>{children}</>;
};

export default ProtectedRoute;
