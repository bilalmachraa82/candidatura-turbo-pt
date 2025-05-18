
import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import UploadForm from '@/components/UploadForm';
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
  return (
    <div className="space-y-8">
      <UploadForm 
        title="Memória Descritiva"
        description="Carregue o documento de memória descritiva do projeto"
        projectId={projectId || ''}
        onFileUploaded={onFileUploaded}
      />
      
      <UploadForm 
        title="Estudo de Viabilidade Económico-Financeira (EVEF)"
        description="Carregue o EVEF em formato Excel (.xlsx)"
        projectId={projectId || ''}
        acceptedFileTypes="application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        onFileUploaded={onFileUploaded}
      />
      
      <UploadForm 
        title="Dossiê de Estratégia"
        description="Carregue documentação adicional relevante para o projeto"
        projectId={projectId || ''}
        onFileUploaded={onFileUploaded}
      />
      
      {files.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-medium text-pt-blue mb-4">Ficheiros Carregados</h3>
          <div className="bg-gray-50 rounded-lg border p-4">
            <ul className="divide-y">
              {files.map((file) => (
                <li key={file.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-pt-blue mr-3" />
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        Carregado em {new Date(file.uploadDate).toLocaleDateString('pt-PT')}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-pt-blue"
                    onClick={() => window.open(file.url, '_blank')}
                  >
                    Visualizar
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsTab;
