
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, CheckCircle, AlertCircle, Brain } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { indexDocument } from '@/api/indexDocuments';

interface EnhancedUploadFormProps {
  title: string;
  description: string;
  projectId: string;
  acceptedFileTypes?: string;
  onFileUploaded: (file: {name: string, url: string, type: string}) => void;
}

const EnhancedUploadForm: React.FC<EnhancedUploadFormProps> = ({
  title,
  description,
  projectId,
  acceptedFileTypes = "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  onFileUploaded
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'indexing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<{name: string, size: number, type: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { toast } = useToast();

  const resetForm = () => {
    setUploadStatus('idle');
    setUploadProgress(0);
    setErrorMessage(null);
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeIcon = (type: string) => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
    if (type.includes('word') || type.includes('document')) return '📝';
    return '📎';
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadedFile({
      name: file.name,
      size: file.size,
      type: file.type
    });

    try {
      setIsUploading(true);
      setUploadStatus('uploading');
      setErrorMessage(null);
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 50) {
            clearInterval(progressInterval);
            setUploadStatus('indexing');
            return 50;
          }
          return prev + Math.random() * 10;
        });
      }, 200);
      
      // Call indexing function
      const result = await indexDocument(projectId, file);
      
      clearInterval(progressInterval);
      
      if (result.success) {
        // Simulate indexing progress
        let indexProgress = 50;
        const indexInterval = setInterval(() => {
          indexProgress += 10;
          setUploadProgress(indexProgress);
          if (indexProgress >= 100) {
            clearInterval(indexInterval);
            setUploadStatus('success');
          }
        }, 300);
        
        toast({
          title: "Documento processado com sucesso",
          description: `${file.name} foi carregado e indexado para RAG.`,
        });
        
        if (onFileUploaded && result.file) {
          onFileUploaded(result.file);
        }
        
        // Reset form after 5 seconds
        setTimeout(resetForm, 5000);
      } else {
        setUploadStatus('error');
        setErrorMessage(result.message);
        
        toast({
          variant: "destructive",
          title: "Erro no processamento",
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

  const getStatusMessage = () => {
    switch (uploadStatus) {
      case 'uploading':
        return 'A carregar ficheiro...';
      case 'indexing':
        return 'A indexar para RAG...';
      case 'success':
        return 'Processamento concluído!';
      case 'error':
        return 'Erro no processamento';
      default:
        return '';
    }
  };

  const getStatusColor = () => {
    switch (uploadStatus) {
      case 'uploading':
      case 'indexing':
        return 'text-blue-600';
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <Card className="shadow-sm border-l-4 border-l-pt-green">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-pt-blue">
          <FileText className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {uploadStatus === 'idle' && (
            <div className="space-y-4">
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-pt-green transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-700 mb-2">
                  Clique para selecionar ficheiro
                </p>
                <p className="text-sm text-gray-500">
                  Suporta PDF, Word e Excel
                </p>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                accept={acceptedFileTypes}
                className="hidden"
              />
            </div>
          )}
          
          {(uploadStatus === 'uploading' || uploadStatus === 'indexing') && uploadedFile && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                <span className="text-2xl">{getFileTypeIcon(uploadedFile.type)}</span>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{uploadedFile.name}</p>
                  <p className="text-sm text-gray-500">{formatFileSize(uploadedFile.size)}</p>
                </div>
                <Badge variant="outline" className={getStatusColor()}>
                  {uploadStatus === 'indexing' && <Brain className="h-3 w-3 mr-1" />}
                  {getStatusMessage()}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className={getStatusColor()}>{getStatusMessage()}</span>
                  <span className="font-medium">{Math.round(uploadProgress)}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
                
                {uploadStatus === 'indexing' && (
                  <div className="flex items-center gap-2 text-xs text-blue-600">
                    <Brain className="h-3 w-3 animate-pulse" />
                    <span>Processando documento para busca semântica...</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {uploadStatus === 'success' && uploadedFile && (
            <div className="p-4 flex items-center space-x-3 text-green-600 bg-green-50 rounded-lg">
              <CheckCircle className="h-6 w-6" />
              <div className="flex-1">
                <p className="font-medium">Ficheiro processado com sucesso</p>
                <p className="text-sm text-green-700">
                  {uploadedFile.name} está agora disponível para geração IA
                </p>
              </div>
            </div>
          )}
          
          {uploadStatus === 'error' && (
            <div className="p-4 flex flex-col space-y-3 text-red-600 bg-red-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">Erro no processamento</span>
              </div>
              {errorMessage && <p className="text-sm">{errorMessage}</p>}
              <Button 
                variant="outline" 
                size="sm"
                onClick={resetForm}
                className="self-end"
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

export default EnhancedUploadForm;
