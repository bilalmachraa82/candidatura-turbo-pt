
import React from 'react';
import { Check, AlertCircle, Loader2, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SaveStatus as SaveStatusType } from '@/hooks/use-auto-save';

interface SaveStatusProps {
  status: SaveStatusType;
  hasUnsavedChanges: boolean;
}

const SaveStatus: React.FC<SaveStatusProps> = ({ status, hasUnsavedChanges }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'saving':
        return {
          icon: <Loader2 className="h-3 w-3 animate-spin" />,
          text: 'A guardar...',
          variant: 'secondary' as const,
          className: 'bg-blue-100 text-blue-700'
        };
      case 'saved':
        return {
          icon: <Check className="h-3 w-3" />,
          text: 'Guardado',
          variant: 'secondary' as const,
          className: 'bg-green-100 text-green-700'
        };
      case 'error':
        return {
          icon: <AlertCircle className="h-3 w-3" />,
          text: 'Erro ao guardar',
          variant: 'destructive' as const,
          className: 'bg-red-100 text-red-700'
        };
      default:
        if (hasUnsavedChanges) {
          return {
            icon: <Clock className="h-3 w-3" />,
            text: 'A aguardar...',
            variant: 'outline' as const,
            className: 'bg-yellow-50 text-yellow-700 border-yellow-200'
          };
        }
        return null;
    }
  };

  const config = getStatusConfig();
  
  if (!config) return null;

  return (
    <Badge 
      variant={config.variant} 
      className={`flex items-center gap-1 text-xs ${config.className}`}
    >
      {config.icon}
      {config.text}
    </Badge>
  );
};

export default SaveStatus;
