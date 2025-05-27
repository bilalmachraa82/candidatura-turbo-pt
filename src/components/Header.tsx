
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import LogoPT2030 from './LogoPT2030';

const Header: React.FC = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="pt-container">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center">
              <LogoPT2030 />
            </Link>
            
            {user && (
              <nav className="hidden md:flex space-x-6">
                <Link 
                  to="/" 
                  className={`text-sm font-medium transition-colors hover:text-pt-green ${
                    isActive('/') ? 'text-pt-green' : 'text-gray-700'
                  }`}
                >
                  Projectos
                </Link>
                <Link 
                  to="/test" 
                  className={`text-sm font-medium transition-colors hover:text-pt-green ${
                    isActive('/test') ? 'text-pt-green' : 'text-gray-700'
                  }`}
                >
                  Testes
                </Link>
                <Link 
                  to="/contact" 
                  className={`text-sm font-medium transition-colors hover:text-pt-green ${
                    isActive('/contact') ? 'text-pt-green' : 'text-gray-700'
                  }`}
                >
                  Contacto
                </Link>
              </nav>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">
                  Bem-vindo, {user.email}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => signOut()}
                  className="text-pt-blue hover:bg-pt-blue hover:text-white"
                >
                  Terminar Sessão
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login">
                  <Button variant="outline" size="sm">
                    Iniciar Sessão
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" className="bg-pt-green hover:bg-pt-green/90">
                    Registar
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
