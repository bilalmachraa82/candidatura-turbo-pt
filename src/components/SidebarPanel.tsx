import React from 'react';
import { AlertCircle, CheckCircle, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import ModelSelector from './ModelSelector';
import { Source } from '@/types/ai';

interface SidebarPanelProps {
  projectId: string;
  charsUsed: number;
  charLimit: number;
  ragStatus: 'poor' | 'medium' | 'good';
  sources: Source[];
}

const SidebarPanel: React.FC<SidebarPanelProps> = ({
  projectId,
  charsUsed,
  charLimit,
  ragStatus,
  sources
}) => {
  const getRagStatusIcon = () => {
    switch(ragStatus) {
      case 'poor':
        return <AlertCircle className="h-4 w-4 text-pt-red" />;
      case 'medium':
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      case 'good':
        return <CheckCircle className="h-4 w-4 text-pt-green" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };
  
  const getRagStatusText = () => {
    switch(ragStatus) {
      case 'poor':
        return 'Fraco - Poucos dados relevantes encontrados';
      case 'medium':
        return 'Médio - Alguns dados relevantes encontrados';
      case 'good':
        return 'Bom - Dados relevantes encontrados';
      default:
        return 'Desconhecido';
    }
  };
  
  const getRagStatusClass = () => {
    switch(ragStatus) {
      case 'poor':
        return 'bg-red-100 text-pt-red';
      case 'medium':
        return 'bg-amber-100 text-amber-800';
      case 'good':
        return 'bg-green-100 text-pt-green';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getSourceIcon = (type: 'pdf' | 'excel' | 'document') => {
    return <FileText className="h-4 w-4 mr-2" />;
  };

  return (
    <div className="bg-gray-50 border rounded-lg p-4 h-full">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-pt-blue mb-2">Modelo de IA</h3>
        <ModelSelector />
      </div>
      
      <Separator className="my-4" />
      
      <div className="mb-6">
        <h3 className="text-lg font-medium text-pt-blue mb-2">Estatísticas</h3>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-600 mb-1">Caracteres Utilizados</p>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className={`h-2.5 rounded-full ${
                  charsUsed > charLimit ? 'bg-pt-red' : 'bg-pt-green'
                }`}
                style={{ width: `${Math.min(100, (charsUsed / charLimit) * 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-right mt-1">
              {charsUsed} / {charLimit}
            </p>
          </div>
          
          <div>
            <p className="text-sm text-gray-600 mb-1">Status RAG</p>
            <div className="flex items-center">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className={`flex items-center gap-1 ${getRagStatusClass()}`}>
                      {getRagStatusIcon()}
                      {ragStatus.charAt(0).toUpperCase() + ragStatus.slice(1)}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{getRagStatusText()}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </div>
      
      <Separator className="my-4" />
      
      <div>
        <h3 className="text-lg font-medium text-pt-blue mb-2">Fontes</h3>
        {sources.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhuma fonte disponível</p>
        ) : (
          <ul className="space-y-2">
            {sources.map((source) => (
              <li key={source.id} className="text-sm">
                <div className="flex items-start">
                  {getSourceIcon(source.type)}
                  <div>
                    <p className="font-medium">{source.name}</p>
                    <p className="text-xs text-gray-500">{source.reference}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default SidebarPanel;
