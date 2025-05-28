
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { indexDocument } from '@/api/indexDocuments';

interface EnhancedUploadFormProps {
  projectId: string;
  onFileIndexed?: (file: any) => void;
}

interface UploadState {
  file: File | null;
  status: 'idle' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  message: string;
  result?: any;
}

const EnhancedUploadForm: React.FC<EnhancedUploadFormProps> = ({
  projectId,
  onFileIndexed
}) => {
  const [uploadState, setUploadState] = useState<UploadState>({
    file: null,
    status: 'idle',
    progress: 0,
    message: ''
  });
  
  const { toast } = useToast();

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadState({
        file,
        status: 'idle',
        progress: 0,
        message: `Ficheiro selecionado: ${file.name}`
      });
    }
  }, []);

  const handleUpload = async () => {
    if (!uploadState.file) return;

    try {
      setUploadState(prev => ({
        ...prev,
        status: 'uploading',
        progress: 10,
        message: 'A carregar ficheiro...'
      }));

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadState(prev => {
          if (prev.progress < 40) {
            return { ...prev, progress: prev.progress + 5 };
          }
          return prev;
        });
      }, 100);

      setTimeout(() => {
        setUploadState(prev => ({
          ...prev,
          status: 'processing',
          progress: 50,
          message: 'A processar e indexar documento...'
        }));
      }, 1000);

      // Call indexing API
      const result = await indexDocument(projectId, uploadState.file);
      
      clearInterval(progressInterval);

      if (result.success) {
        setUploadState(prev => ({
          ...prev,
          status: 'completed',
          progress: 100,
          message: `Documento indexado com sucesso! ${result.file?.chunks || 0} segmentos processados.`,
          result
        }));

        toast({
          title: "Documento indexado",
          description: result.message || "O documento foi processado e está pronto para uso."
        });

        if (onFileIndexed && result.file) {
          onFileIndexed(result.file);
        }
      } else {
        throw new Error(result.message || 'Erro na indexação');
      }

    } catch (error: any) {
      console.error('Upload error:', error);
      
      setUploadState(prev => ({
        ...prev,
        status: 'error',
        progress: 0,
        message: `Erro: ${error.message}`
      }));

      toast({
        variant: "destructive",
        title: "Erro no upload",
        description: error.message || "Não foi possível processar o documento."
      });
    }
  };

  const resetUpload = () => {
    setUploadState({
      file: null,
      status: 'idle',
      progress: 0,
      message: ''
    });
  };

  const getStatusIcon = () => {
    switch (uploadState.status) {
      case 'uploading':
      case 'processing':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-600" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (uploadState.status) {
      case 'uploading':
      case 'processing':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-300';
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload de Documentos
        </CardTitle>
        <CardDescription>
          Carregue documentos PDF, Word ou Excel para indexação automática com IA
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* File Selection */}
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
              disabled={uploadState.status === 'uploading' || uploadState.status === 'processing'}
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center space-y-2"
            >
              <Upload className="h-8 w-8 text-gray-400" />
              <div className="text-sm text-gray-600">
                <span className="font-medium text-blue-600 hover:text-blue-500">
                  Clique para selecionar
                </span>
                {' '}ou arraste ficheiros aqui
              </div>
              <div className="text-xs text-gray-500">
                Suporta: PDF, Word, Excel, TXT (máx. 10MB)
              </div>
            </label>
          </div>

          {/* Selected File Info */}
          {uploadState.file && (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon()}
                <div>
                  <div className="font-medium text-sm">{uploadState.file.name}</div>
                  <div className="text-xs text-gray-500">
                    {(uploadState.file.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant={
                  uploadState.status === 'completed' ? 'default' :
                  uploadState.status === 'error' ? 'destructive' :
                  uploadState.status === 'idle' ? 'secondary' : 'outline'
                }>
                  {uploadState.status === 'idle' && 'Pronto'}
                  {uploadState.status === 'uploading' && 'A carregar'}
                  {uploadState.status === 'processing' && 'A processar'}
                  {uploadState.status === 'completed' && 'Concluído'}
                  {uploadState.status === 'error' && 'Erro'}
                </Badge>
              </div>
            </div>
          )}
        </div>

        {/* Progress */}
        {(uploadState.status === 'uploading' || uploadState.status === 'processing') && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{uploadState.message}</span>
              <span>{uploadState.progress}%</span>
            </div>
            <Progress value={uploadState.progress} className={`h-2 ${getStatusColor()}`} />
          </div>
        )}

        {/* Status Message */}
        {uploadState.message && uploadState.status !== 'uploading' && uploadState.status !== 'processing' && (
          <div className={`p-3 rounded-lg text-sm ${
            uploadState.status === 'completed' ? 'bg-green-50 text-green-800 border border-green-200' :
            uploadState.status === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
            'bg-blue-50 text-blue-800 border border-blue-200'
          }`}>
            {uploadState.message}
          </div>
        )}

        {/* Results */}
        {uploadState.status === 'completed' && uploadState.result && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-green-800 mb-2">Indexação Concluída</h4>
            <div className="space-y-1 text-sm text-green-700">
              <div>📄 Nome: {uploadState.result.file?.name}</div>
              <div>🔍 Segmentos: {uploadState.result.file?.chunks || 0}</div>
              <div>✅ Status: Pronto para geração IA</div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={handleUpload}
            disabled={!uploadState.file || uploadState.status === 'uploading' || uploadState.status === 'processing'}
            className="flex-1"
          >
            {uploadState.status === 'uploading' || uploadState.status === 'processing' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                A processar...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Carregar e Indexar
              </>
            )}
          </Button>

          {(uploadState.status === 'completed' || uploadState.status === 'error') && (
            <Button variant="outline" onClick={resetUpload}>
              Novo Upload
            </Button>
          )}
        </div>

        {/* Help Text */}
        <div className="text-xs text-gray-500 space-y-1">
          <div>💡 <strong>Dica:</strong> Documentos mais detalhados geram melhores resultados IA</div>
          <div>🔒 <strong>Segurança:</strong> Os documentos são processados de forma segura e privada</div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedUploadForm;
