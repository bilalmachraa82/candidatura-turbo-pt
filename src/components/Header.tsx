
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Home, Contact } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import LogoPT2030 from './LogoPT2030';

type HeaderProps = {
  isLoggedIn?: boolean;
};

const Header: React.FC<HeaderProps> = ({ isLoggedIn = false }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <header className="border-b border-border bg-white py-4">
      <div className="pt-container flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <LogoPT2030 />
        </Link>
        
        {isLoggedIn ? (
          <nav className="flex items-center gap-6">
            <Link to="/" className="text-pt-blue hover:text-pt-green flex items-center gap-1 text-sm font-medium">
              <Home size={18} />
              <span className="hidden sm:inline">Início</span>
            </Link>
            <Link to="/contactos" className="text-pt-blue hover:text-pt-green flex items-center gap-1 text-sm font-medium">
              <Contact size={18} />
              <span className="hidden sm:inline">Contactos</span>
            </Link>
            <Button 
              variant="outline" 
              className="text-pt-red border-pt-red hover:bg-pt-red hover:text-white"
              size="sm"
              onClick={handleLogout}
            >
              <LogOut size={18} className="mr-1" />
              <span>Sair</span>
            </Button>
          </nav>
        ) : (
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="outline" size="sm">Entrar</Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="bg-pt-green text-white hover:bg-pt-green/90">Registar</Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
