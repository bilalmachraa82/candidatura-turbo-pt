import React, { useState } from 'react';
import { UploadCloud, X, FileText, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { indexDocument } from '@/api/indexDocuments';

interface UploadFormProps {
  projectId: string;
  title?: string;
  description?: string;
  acceptedFileTypes?: string;
  onUploadComplete?: (filename: string) => void;
  onFileUploaded?: (file: { name: string; url: string; type: string }) => void;
}

const UploadForm: React.FC<UploadFormProps> = ({ 
  projectId, 
  title = "Carregar Documentos", 
  description = "Carregue documentos PDF ou Excel para análise e indexação.", 
  acceptedFileTypes,
  onUploadComplete,
  onFileUploaded
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Check file type
      const acceptedTypes = acceptedFileTypes ? 
        acceptedFileTypes.split(',') : 
        ['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
      
      if (!acceptedTypes.includes(selectedFile.type)) {
        toast({
          variant: "destructive",
          title: "Tipo de ficheiro não suportado",
          description: "Por favor, carregue apenas ficheiros PDF ou Excel."
        });
        return;
      }
      
      // Check file size (10MB max)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "Ficheiro muito grande",
          description: "O tamanho máximo do ficheiro é 10MB."
        });
        return;
      }
      
      setFile(selectedFile);
    }
  };
  
  const handleUpload = async () => {
    if (!file || !projectId) return;
    
    setIsUploading(true);
    setProgress(0);
    
    // Simulated progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return 95;
        }
        return prev + 5;
      });
    }, 300);
    
    try {
      // Use our indexDocument API
      const result = await indexDocument(projectId, file);
      
      setProgress(100);
      
      toast({
        title: "Ficheiro carregado com sucesso",
        description: `${file.name} foi indexado e está pronto para uso.`
      });
      
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
      
      // Reset form
      setFile(null);
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        variant: "destructive",
        title: "Erro no upload",
        description: error.message || "Não foi possível carregar o ficheiro."
      });
    } finally {
      clearInterval(progressInterval);
      setIsUploading(false);
      setProgress(0);
    }
  };

  const getFileIcon = () => {
    if (!file) return null;
    
    if (file.type.includes('pdf')) {
      return <FileText className="h-8 w-8 text-pt-red" />;
    } else if (file.type.includes('spreadsheet') || file.type.includes('excel')) {
      return <FileSpreadsheet className="h-8 w-8 text-pt-green" />;
    }
    
    return <FileText className="h-8 w-8 text-gray-500" />;
  };
  
  const resetForm = () => {
    setFile(null);
    setProgress(0);
  };

  return (
    <div className="border rounded-lg p-4 bg-white">
      <h3 className="text-lg font-medium text-pt-blue mb-2">{title}</h3>
      <p className="text-sm text-gray-600 mb-4">
        {description}
      </p>
      
      {!file ? (
        <div 
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-pt-blue transition-colors cursor-pointer"
          onClick={() => document.getElementById('fileInput')?.click()}
        >
          <input
            id="fileInput"
            type="file"
            className="hidden"
            accept={acceptedFileTypes || ".pdf,.xlsx,.xls"}
            onChange={handleFileChange}
          />
          <UploadCloud className="h-12 w-12 mx-auto text-gray-400" />
          <p className="mt-2 text-sm font-medium text-gray-600">
            Clique ou arraste ficheiros para esta área
          </p>
          <p className="mt-1 text-xs text-gray-500">
            PDF ou Excel até 10MB
          </p>
        </div>
      ) : (
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              {getFileIcon()}
              <div>
                <p className="font-medium text-gray-800 text-sm">{file.name}</p>
                <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={resetForm}
              disabled={isUploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {isUploading && (
            <div className="mt-2">
              <Progress value={progress} className="h-1" />
              <p className="mt-1 text-xs text-gray-500 text-right">{progress}%</p>
            </div>
          )}
          
          <div className="mt-3 flex justify-end">
            <Button 
              onClick={handleUpload} 
              disabled={isUploading}
              className="bg-pt-blue hover:bg-pt-blue/90"
              size="sm"
            >
              {isUploading ? "A carregar..." : "Carregar e Indexar"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadForm;
