
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';

const AuthStatus: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Badge variant="outline" className="bg-gray-100">
        Verificando autenticação...
      </Badge>
    );
  }

  if (user) {
    return (
      <Badge className="bg-green-500 text-white">
        Autenticado como {user.email}
      </Badge>
    );
  }

  return (
    <Badge variant="destructive">
      Não autenticado
    </Badge>
  );
};

export default AuthStatus;
