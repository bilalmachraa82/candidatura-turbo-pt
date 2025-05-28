
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Eye, Brain } from 'lucide-react';
import EnhancedUploadForm from '@/components/enhanced/EnhancedUploadForm';
import { UploadedFile } from '@/types/components';

interface DocumentsTabProps {
  projectId: string;
  files: UploadedFile[];
  onFileUploaded: (file: {name: string, url: string, type: string}) => void;
}

const DocumentsTab: React.FC<DocumentsTabProps> = ({ 
  projectId, 
  files, 
  onFileUploaded 
}) => {
  const getFileTypeIcon = (type: string) => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
    if (type.includes('word') || type.includes('document')) return '📝';
    return '📎';
  };

  const formatFileSize = (size: number) => {
    if (size === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(size) / Math.log(k));
    return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-pt-green to-pt-blue text-white p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-2">Documentos do Projeto</h2>
        <p className="text-green-100">
          Carregue os seus documentos para alimentar a IA com contexto específico do projeto
        </p>
        <div className="flex items-center gap-2 mt-3">
          <Brain className="h-4 w-4" />
          <span className="text-sm">Powered by Vector RAG & pgvector</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <EnhancedUploadForm 
            title="Memória Descritiva"
            description="Documento principal com a descrição detalhada do projeto"
            projectId={projectId || ''}
            onFileUploaded={onFileUploaded}
          />
          
          <EnhancedUploadForm 
            title="Estudo de Viabilidade Económico-Financeira (EVEF)"
            description="Análise financeira e económica em formato Excel"
            projectId={projectId || ''}
            acceptedFileTypes="application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onFileUploaded={onFileUploaded}
          />
        </div>

        <div className="space-y-6">
          <EnhancedUploadForm 
            title="Dossiê de Estratégia"
            description="Documentação estratégica e planos complementares"
            projectId={projectId || ''}
            onFileUploaded={onFileUploaded}
          />
          
          <EnhancedUploadForm 
            title="Documentos Anexos"
            description="Certificações, autorizações e documentos de apoio"
            projectId={projectId || ''}
            onFileUploaded={onFileUploaded}
          />
        </div>
      </div>
      
      {files.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-pt-blue flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Ficheiros Indexados ({files.length})
            </h3>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <Brain className="h-3 w-3 mr-1" />
              RAG Ativo
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {files.map((file) => (
              <div key={file.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <span className="text-2xl">{getFileTypeIcon(file.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{file.name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Carregado em {new Date(file.uploadDate).toLocaleDateString('pt-PT')}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          Indexado
                        </Badge>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">
                          Disponível para IA
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-pt-blue hover:bg-pt-blue/10 flex items-center gap-1"
                    onClick={() => window.open(file.url, '_blank')}
                  >
                    <Eye className="h-3 w-3" />
                    Ver
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-3">
              <Brain className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-2">Sistema RAG Ativo</p>
                <ul className="space-y-1 text-xs">
                  <li>• Documentos processados e indexados com embeddings</li>
                  <li>• Busca semântica ativa para geração de conteúdo contextual</li>
                  <li>• Referências automáticas às fontes nos textos gerados</li>
                  <li>• Atualização em tempo real conforme carrega novos documentos</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsTab;
