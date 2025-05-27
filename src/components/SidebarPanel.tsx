
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, AlertTriangle, CheckCircle } from 'lucide-react';
import { Source } from '@/types/ai';

interface SidebarPanelProps {
  projectId: string;
  charsUsed: number;
  charLimit: number;
  ragStatus?: 'low' | 'medium' | 'high';
  sources: Source[];
}

const SidebarPanel: React.FC<SidebarPanelProps> = ({
  projectId,
  charsUsed = 0,
  charLimit = 5000,
  ragStatus = 'medium',
  sources = []
}) => {
  const usagePercentage = Math.round((charsUsed / charLimit) * 100);
  
  // Configurar cor da barra de progresso baseada no uso
  let progressColor = "bg-green-500";
  if (usagePercentage > 100) {
    progressColor = "bg-red-500";
  } else if (usagePercentage > 90) {
    progressColor = "bg-yellow-500";
  }
  
  // Informações do estado da base de conhecimento
  const ragStatusInfo = {
    low: {
      label: 'Poucos documentos',
      color: 'bg-red-500',
      icon: <AlertTriangle className="h-4 w-4 text-red-500" />,
      message: 'Carregue mais documentos para melhorar os resultados da IA'
    },
    medium: {
      label: 'Base de conhecimento adequada',
      color: 'bg-yellow-500',
      icon: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
      message: 'Considere adicionar mais documentos para melhores resultados'
    },
    high: {
      label: 'Base de conhecimento completa',
      color: 'bg-green-500',
      icon: <CheckCircle className="h-4 w-4 text-green-500" />,
      message: 'Documentação robusta para geração assistida por IA'
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Estatísticas do Projecto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Estatísticas de uso de caracteres */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium">Uso de caracteres</span>
              <span>{usagePercentage}%</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${progressColor} transition-all`}
                style={{ width: `${Math.min(100, usagePercentage)}%` }}
                aria-label={`${usagePercentage}% de caracteres utilizados`}
                role="progressbar"
                aria-valuenow={usagePercentage}
                aria-valuemin={0}
                aria-valuemax={100}
              ></div>
            </div>
            <p className="text-xs text-gray-500">
              {charsUsed.toLocaleString('pt-PT')} de {charLimit.toLocaleString('pt-PT')} caracteres utilizados
            </p>
          </div>
          
          {/* Estado da base de conhecimento */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">Base de Conhecimento</span>
              <Badge className={`bg-opacity-20 text-gray-800 ${ragStatusInfo[ragStatus].color.replace('bg-', 'bg-opacity-20 text-')}`}>
                {ragStatusInfo[ragStatus].label}
              </Badge>
            </div>
            <div className="flex items-start space-x-2 text-xs text-gray-600">
              {ragStatusInfo[ragStatus].icon}
              <span>{ragStatusInfo[ragStatus].message}</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Fontes utilizadas na geração */}
      {sources.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Fontes Utilizadas</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3" aria-label="Lista de fontes utilizadas na geração de conteúdo">
              {sources.map((source) => (
                <li key={source.id} className="flex items-start space-x-2">
                  <FileText className="h-4 w-4 text-pt-blue mt-0.5 flex-shrink-0" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{source.name}</p>
                    <p className="text-xs text-gray-500 break-words">{source.reference}</p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SidebarPanel;
