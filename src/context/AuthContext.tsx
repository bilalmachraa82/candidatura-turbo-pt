
import React, { createContext, useState, useContext, useEffect } from 'react';

type User = {
  id: string;
  email: string;
  name: string;
  role: string;
};

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock auth functionality (will be replaced with Supabase when integrated)
  const login = async (email: string, password: string) => {
    try {
      // Simulating API call
      setLoading(true);
      // Mock successful login
      setUser({
        id: '1',
        email,
        name: 'Utilizador PT2030',
        role: 'user',
      });
      localStorage.setItem('auth_token', 'mock_token');
      // After Supabase integration, this will be replaced with actual auth
    } catch (error) {
      console.error('Login failed:', error);
      throw new Error('Falha na autenticação. Por favor verifique as suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      setLoading(true);
      // Mock successful registration
      setUser({
        id: '1',
        email,
        name,
        role: 'user',
      });
      localStorage.setItem('auth_token', 'mock_token');
      // After Supabase integration, this will be replaced with actual registration
    } catch (error) {
      console.error('Registration failed:', error);
      throw new Error('Falha no registo. Por favor tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      // Clear auth state
      setUser(null);
      localStorage.removeItem('auth_token');
      // After Supabase integration, this will be replaced with actual logout
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check for existing session
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (token) {
          // Mock user for demonstration
          setUser({
            id: '1',
            email: 'demo@turismo-portugal.pt',
            name: 'Utilizador PT2030',
            role: 'user',
          });
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
