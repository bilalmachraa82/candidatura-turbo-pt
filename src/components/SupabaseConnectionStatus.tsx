
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

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
        
        // Try to make a simple operation on Supabase to verify the connection
        const { data, error } = await supabase.from('projects').select('count', { count: 'exact', head: true });
        
        const connected = !error;
        setIsConnected(connected);
        
        if (error) {
          console.error('Supabase Error:', error);
          // Check if it's a service unavailable error
          setServiceUnavailable(error.message?.includes('503') || error.code === '503');
        }
        
        if (onStatusChange) {
          onStatusChange(connected);
        }
        
        // Show toast only once when connection status changes
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
        console.error('Error checking Supabase connection:', err);
        setIsConnected(false);
        if (onStatusChange) {
          onStatusChange(false);
        }
      } finally {
        setIsChecking(false);
      }
    };

    // Initial check
    checkConnection();
    
    // Set up periodic check with larger interval (every 30 seconds)
    checkingIntervalRef.current = setInterval(() => {
      // Reset toast state to allow new notification only if state changes
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
        <span className="animate-pulse">A verificar ligação ao Supabase...</span>
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
    <div className={`flex items-center text-sm ${isConnected ? 'text-green-600' : 'text-red-500'}`}>
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
