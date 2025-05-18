
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileInput } from '@/components/ui/file-input';
import { Spinner } from '@/components/ui/spinner';
import { Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { indexDocument } from '@/api/indexDocuments';
import { UploadFormProps } from '@/types/components';

const UploadForm: React.FC<UploadFormProps> = ({ 
  title, 
  description, 
  projectId,
  acceptedFileTypes = "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  onFileUploaded
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { toast } = useToast();

  const resetForm = () => {
    setUploadStatus('idle');
    setUploadProgress(0);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setIsUploading(true);
      setUploadStatus('uploading');
      setErrorMessage(null);
      
      // Simulação de progresso durante o upload
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + Math.random() * 10;
          return newProgress > 90 ? 90 : newProgress;
        });
      }, 200);
      
      // Chamar a função de indexação
      const result = await indexDocument(projectId, file);
      
      clearInterval(progressInterval);
      
      if (result.success) {
        setUploadProgress(100);
        setUploadStatus('success');
        
        toast({
          title: "Upload concluído",
          description: "O documento foi carregado com sucesso e está sendo processado.",
        });
        
        if (onFileUploaded && result.file) {
          onFileUploaded(result.file);
        }
        
        // Reset do formulário após 3 segundos
        setTimeout(resetForm, 3000);
      } else {
        setUploadStatus('error');
        setErrorMessage(result.message);
        
        toast({
          variant: "destructive",
          title: "Erro no upload",
          description: result.message,
        });
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      setUploadStatus('error');
      setErrorMessage(error.message || "Erro desconhecido durante o upload");
      
      toast({
        variant: "destructive",
        title: "Erro no upload",
        description: error.message || "Ocorreu um erro durante o carregamento do arquivo",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-pt-blue">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {uploadStatus === 'idle' && (
            <FileInput
              ref={fileInputRef}
              onChange={handleFileChange}
              accept={acceptedFileTypes}
              disabled={isUploading}
              className="w-full"
              buttonLabel="Selecionar Ficheiro"
            />
          )}
          
          {uploadStatus === 'uploading' && (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span>A carregar o ficheiro...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-pt-green transition-all"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <div className="flex justify-center pt-2">
                <Spinner size="sm" color="pt-green" />
              </div>
            </div>
          )}
          
          {uploadStatus === 'success' && (
            <div className="p-4 flex items-center justify-center space-x-2 text-green-600 bg-green-50 rounded-md">
              <CheckCircle className="h-5 w-5" />
              <span>Ficheiro carregado com sucesso</span>
            </div>
          )}
          
          {uploadStatus === 'error' && (
            <div className="p-4 flex flex-col space-y-2 text-red-600 bg-red-50 rounded-md">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">Erro no carregamento</span>
              </div>
              {errorMessage && <p className="text-sm">{errorMessage}</p>}
              <Button 
                variant="outline" 
                size="sm"
                onClick={resetForm}
                className="self-end mt-2"
              >
                Tentar novamente
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UploadForm;
