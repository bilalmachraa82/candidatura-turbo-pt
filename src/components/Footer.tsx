
import React from 'react';
import { Link } from 'react-router-dom';
import LogoPT2030 from './LogoPT2030';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-50 border-t py-8">
      <div className="pt-container">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <LogoPT2030 />
            <p className="mt-4 text-sm text-gray-600">
              Plataforma de gestão de candidaturas PT2030 para o Turismo de Portugal.
            </p>
          </div>
          
          <div>
            <h3 className="font-medium text-pt-blue mb-3">Contactos</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a 
                  href="mailto:apoio@turismo-portugal.pt"
                  className="text-gray-600 hover:text-pt-green"
                >
                  apoio@turismo-portugal.pt
                </a>
              </li>
              <li className="text-gray-600">
                +351 211 140 200
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-pt-blue mb-3">Links Úteis</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/termos" className="text-gray-600 hover:text-pt-green">
                  Termos e Condições
                </Link>
              </li>
              <li>
                <Link to="/acessibilidade" className="text-gray-600 hover:text-pt-green">
                  Acessibilidade
                </Link>
              </li>
              <li>
                <Link to="/privacidade" className="text-gray-600 hover:text-pt-green">
                  Política de Privacidade
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-xs text-gray-500">
              &copy; {new Date().getFullYear()} Turismo de Portugal. Todos os direitos reservados.
            </p>
            <div className="mt-4 md:mt-0 flex items-center">
              <p className="text-xs text-gray-500 flex items-center">
                <span className="mr-2">Cofinanciado pelo</span>
                <span className="font-medium">PRR/PT2030</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
