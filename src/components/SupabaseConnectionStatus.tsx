
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SupabaseConnectionStatusProps {
  showToast?: boolean;
  onStatusChange?: (isConnected: boolean) => void;
}

const SupabaseConnectionStatus: React.FC<SupabaseConnectionStatusProps> = ({ 
  showToast = false,
  onStatusChange
}) => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const { toast } = useToast();
  const toastShownRef = useRef(false);
  const checkingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        setIsChecking(true);
        
        // Tenta fazer uma operação simples no Supabase para verificar a conexão
        const { data, error } = await supabase.from('projects').select('count', { count: 'exact', head: true });
        
        const connected = !error;
        setIsConnected(connected);
        
        if (error) {
          console.error('Erro Supabase:', error);
          // Check if it's a service unavailable error
          setServiceUnavailable(error.message?.includes('503') || error.code === '503');
        }
        
        if (onStatusChange) {
          onStatusChange(connected);
        }
        
        // Mostrar toast apenas uma vez ao alterar o estado da conexão
        if (showToast && !toastShownRef.current) {
          toastShownRef.current = true;
          
          if (connected) {
            toast({
              title: "Ligação ao Supabase estabelecida",
              description: "A aplicação está conectada ao Supabase com sucesso."
            });
          } else {
            const errorMessage = serviceUnavailable 
              ? "O serviço Supabase está temporariamente indisponível. Por favor, tente novamente mais tarde."
              : `${error?.message || 'Verifique as suas credenciais no .env'}`;
            
            toast({
              variant: "destructive",
              title: "Erro de ligação ao Supabase",
              description: errorMessage
            });
          }
        }
      } catch (err) {
        console.error('Erro ao verificar ligação Supabase:', err);
        setIsConnected(false);
        if (onStatusChange) {
          onStatusChange(false);
        }
      } finally {
        setIsChecking(false);
      }
    };

    // Verificação inicial
    checkConnection();
    
    // Configurar verificação periódica com intervalo maior (a cada 30 segundos)
    checkingIntervalRef.current = setInterval(() => {
      // Resetar o estado do toast para permitir nova notificação apenas se o estado mudar
      if (isConnected === false) {
        toastShownRef.current = false;
        checkConnection();
      }
    }, 30000);

    return () => {
      if (checkingIntervalRef.current) {
        clearInterval(checkingIntervalRef.current);
      }
    };
  }, [showToast, onStatusChange, toast, isConnected, serviceUnavailable]);

  if (isChecking) {
    return (
      <div className="flex items-center text-sm text-gray-500">
        <span className="animate-pulse">Verificando ligação ao Supabase...</span>
      </div>
    );
  }

  if (isConnected === null) {
    return null;
  }

  if (serviceUnavailable) {
    return (
      <div className="flex items-center text-sm text-amber-500">
        <AlertTriangle className="mr-1 h-4 w-4" />
        <span>Supabase serviço temporariamente indisponível</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center text-sm ${isConnected ? 'text-pt-green' : 'text-pt-red'}`}>
      {isConnected ? (
        <>
          <CheckCircle className="mr-1 h-4 w-4" />
          <span>Supabase conectado</span>
        </>
      ) : (
        <>
          <AlertCircle className="mr-1 h-4 w-4" />
          <span>Erro de ligação ao Supabase</span>
        </>
      )}
    </div>
  );
};

export default SupabaseConnectionStatus;
