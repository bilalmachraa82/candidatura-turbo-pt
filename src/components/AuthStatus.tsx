
import React from 'react';
import { useAuth } from '@/context/AuthContext';

const AuthStatus: React.FC = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="text-sm text-gray-500">Verificando autenticação...</div>;
  }
  
  if (!user) {
    return (
      <div className="text-sm text-red-500 font-medium">
        Não autenticado
      </div>
    );
  }
  
  return (
    <div className="text-sm text-green-600 font-medium">
      Autenticado como {user.email}
    </div>
  );
};

export default AuthStatus;
