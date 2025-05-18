
import React from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const isPublicRoute = ['/login', '/register', '/forgot-password'].includes(location.pathname);

  return (
    <div className="flex flex-col min-h-screen">
      {!isPublicRoute && <Header />}
      <main className={`flex-grow ${isPublicRoute ? 'pt-0' : 'pt-4'}`}>
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
