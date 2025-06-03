
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Eye, Brain, Cloud, Shield } from 'lucide-react';
import StorageUploadForm from '@/components/enhanced/StorageUploadForm';
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

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-pt-green to-pt-blue text-white p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-2">Documentos do Projeto</h2>
        <p className="text-green-100 mb-3">
          Carregue os seus documentos para alimentar a IA com contexto específico do projeto
        </p>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Brain className="h-4 w-4" />
            <span>Vector RAG & pgvector</span>
          </div>
          <div className="flex items-center gap-1">
            <Cloud className="h-4 w-4" />
            <span>Supabase Storage</span>
          </div>
          <div className="flex items-center gap-1">
            <Shield className="h-4 w-4" />
            <span>Storage Seguro</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <StorageUploadForm 
            title="Memória Descritiva"
            description="Documento principal com a descrição detalhada do projeto"
            projectId={projectId || ''}
            onFileUploaded={onFileUploaded}
          />
          
          <StorageUploadForm 
            title="Estudo de Viabilidade Económico-Financeira (EVEF)"
            description="Análise financeira e económica em formato Excel"
            projectId={projectId || ''}
            acceptedFileTypes=".xls,.xlsx"
            onFileUploaded={onFileUploaded}
          />
        </div>

        <div className="space-y-6">
          <StorageUploadForm 
            title="Dossiê de Estratégia"
            description="Documentação estratégica e planos complementares"
            projectId={projectId || ''}
            onFileUploaded={onFileUploaded}
          />
          
          <StorageUploadForm 
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
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Brain className="h-3 w-3 mr-1" />
                RAG Ativo
              </Badge>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                <Cloud className="h-3 w-3 mr-1" />
                Storage Seguro
              </Badge>
            </div>
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
                          <Brain className="h-3 w-3 mr-1" />
                          Indexado
                        </Badge>
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                          <Cloud className="h-3 w-3 mr-1" />
                          Storage
                        </Badge>
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

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <div className="flex items-center gap-2 text-blue-600">
                <Brain className="h-5 w-5" />
                <Cloud className="h-5 w-5" />
              </div>
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-2">Sistema RAG + Storage Seguro Ativo</p>
                <ul className="space-y-1 text-xs">
                  <li>• Documentos armazenados de forma segura no Supabase Storage</li>
                  <li>• Processamento automático e indexação com embeddings</li>
                  <li>• Busca semântica ativa para geração de conteúdo contextual</li>
                  <li>• Referências automáticas às fontes nos textos gerados</li>
                  <li>• Controlo de acesso baseado em autenticação</li>
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
