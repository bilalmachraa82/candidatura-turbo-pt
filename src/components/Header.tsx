
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut, LogIn, Menu, X } from 'lucide-react';
import LogoPT2030 from './LogoPT2030';
import { useAuth } from '@/context/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Verificar se estamos em uma rota pública onde o AuthProvider ainda não foi inicializado
  const isPublicRoute = ['/login', '/register', '/forgot-password'].includes(location.pathname);
  
  // Hook seguro que verifica se estamos em uma rota pública antes de usar useAuth
  // Isso evita o erro "useAuth must be used within an AuthProvider"
  const authContext = !isPublicRoute ? useAuth() : { user: null, signOut: () => Promise.resolve() };
  const { user, signOut } = authContext;

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = async () => {
    if (signOut) {
      await signOut();
      navigate('/login');
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex-shrink-0">
            <Link to="/">
              <LogoPT2030 />
            </Link>
          </div>
          
          {/* Mobile menu button */}
          {isMobile && (
            <button onClick={toggleMenu} className="text-gray-500">
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          )}
          
          {/* Desktop navigation */}
          {!isMobile && (
            <div className="hidden md:flex items-center">
              <nav className="ml-10 flex items-baseline space-x-4">
                <Link
                  to="/"
                  className="text-gray-700 hover:text-pt-green px-3 py-2 text-sm font-medium"
                >
                  Projetos
                </Link>
                <Link
                  to="/contactos"
                  className="text-gray-700 hover:text-pt-green px-3 py-2 text-sm font-medium"
                >
                  Contactos
                </Link>
                {user ? (
                  <Button
                    onClick={handleLogout}
                    variant="ghost"
                    size="sm"
                    className="ml-4"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </Button>
                ) : (
                  <Link to="/login">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-4"
                    >
                      <LogIn className="mr-2 h-4 w-4" />
                      Entrar
                    </Button>
                  </Link>
                )}
              </nav>
            </div>
          )}
        </div>
      </div>

      {/* Mobile navigation */}
      {isMobile && isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="pt-2 pb-3 space-y-1 px-2">
            <Link
              to="/"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
              onClick={toggleMenu}
            >
              Projetos
            </Link>
            <Link
              to="/contactos"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
              onClick={toggleMenu}
            >
              Contactos
            </Link>
            {user ? (
              <Button
                onClick={() => {
                  handleLogout();
                  toggleMenu();
                }}
                variant="ghost"
                size="sm"
                className="w-full justify-start"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </Button>
            ) : (
              <Link to="/login" className="w-full block" onClick={toggleMenu}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  Entrar
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
