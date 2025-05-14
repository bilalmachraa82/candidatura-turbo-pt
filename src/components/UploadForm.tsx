
import React, { useState } from 'react';
import { UploadCloud, X, FileText, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { indexDocument } from '@/api/indexDocuments';
import { UploadedFile } from '@/types/api';

interface UploadFormProps {
  projectId: string;
  onUploadComplete?: (fileName: string) => void;
  onFileUploaded?: (file: UploadedFile) => void;
}

const UploadForm: React.FC<UploadFormProps> = ({ 
  projectId,
  onUploadComplete,
  onFileUploaded
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
  };

  const FileIcon = ({ type }: { type: string }) => {
    if (type.includes('pdf')) {
      return <FileText className="h-6 w-6 text-red-500" />;
    } else if (type.includes('excel') || type.includes('spreadsheet') || type.includes('xlsx')) {
      return <FileSpreadsheet className="h-6 w-6 text-green-600" />;
    } else {
      return <FileText className="h-6 w-6 text-gray-500" />;
    }
  };

  const handleUpload = async () => {
    if (!file || !projectId) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Por favor selecione um ficheiro para fazer upload.",
      });
      return;
    }

    setIsUploading(true);
    
    try {
      const result = await indexDocument(projectId, file);
      
      if (!result.success) {
        throw new Error(result.message);
      }
      
      toast({
        title: "Upload concluído",
        description: "Documento indexado com sucesso.",
      });
      
      // Reset the file state after successful upload
      setFile(null);
      
      // Call the completion handlers if provided
      if (onUploadComplete) {
        onUploadComplete(file.name);
      }
      
      if (onFileUploaded && result.file) {
        onFileUploaded({
          name: file.name,
          url: result.file.url || '',
          type: file.type
        });
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        variant: "destructive",
        title: "Erro no upload",
        description: error.message || "Ocorreu um erro ao fazer upload do ficheiro.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="mb-6 border-2 border-dashed border-gray-300 rounded-lg p-6">
      <div className="text-center mb-4">
        <h3 className="text-base font-semibold text-gray-700">
          Upload de Documentos
        </h3>
        <p className="text-sm text-gray-600">
          Adicione PDF ou Excel para servir como fonte de conhecimento na geração de texto
        </p>
      </div>
      
      {!file ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`cursor-pointer border-2 border-dashed rounded-md py-8 px-4 text-center ${
            isDragging ? 'bg-blue-50 border-blue-500' : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">Arraste ficheiros para aqui ou clique para selecionar</p>
          <p className="mt-1 text-xs text-gray-400">Suporte para PDF, Excel e Word (máx. 10MB)</p>
          <input
            type="file"
            id="fileInput"
            className="hidden"
            accept=".pdf,.xlsx,.xls,.doc,.docx,.txt"
            onChange={handleFileChange}
          />
          <Button
            onClick={() => document.getElementById('fileInput')?.click()}
            variant="outline"
            className="mt-4"
          >
            Selecionar Ficheiro
          </Button>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-md p-3 mt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileIcon type={file.type} />
              <div className="text-sm">
                <p className="font-medium text-gray-900">{file.name}</p>
                <p className="text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={handleRemoveFile}
                variant="ghost"
                size="sm"
                className="text-gray-500"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button
              onClick={handleUpload}
              disabled={isUploading}
              className="bg-pt-green hover:bg-pt-green/90"
            >
              {isUploading ? "A processar..." : "Fazer Upload"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadForm;
