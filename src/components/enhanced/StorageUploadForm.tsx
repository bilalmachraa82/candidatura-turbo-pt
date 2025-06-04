
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Cloud } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { indexDocument } from '@/api/indexDocuments';
import { supabase } from '@/lib/supabase';

interface StorageUploadFormProps {
  title: string;
  description: string;
  projectId: string;
  category?: string;
  acceptedFileTypes?: string;
  onFileUploaded?: (file: { name: string; url: string; type: string; chunks?: number; category?: string }) => void;
}

interface UploadState {
  file: File | null;
  status: 'idle' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  message: string;
  result?: {
    file?: {
      id: string;
      name: string;
      type: string;
      url: string;
      chunks?: number;
    };
    message?: string;
  };
}

const StorageUploadForm: React.FC<StorageUploadFormProps> = ({
  title,
  description,
  projectId,
  category = 'general',
  acceptedFileTypes = ".pdf,.doc,.docx,.xls,.xlsx,.txt",
  onFileUploaded
}) => {
  const [uploadState, setUploadState] = useState<UploadState>({
    file: null,
    status: 'idle',
    progress: 0,
    message: ''
  });
  
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const { toast } = useToast();

  // Check authentication status
  React.useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    checkAuth();
  }, []);

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
    if (!uploadState.file || !isAuthenticated) return;

    try {
      setUploadState(prev => ({
        ...prev,
        status: 'uploading',
        progress: 10,
        message: 'A carregar para o storage seguro...'
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
          message: 'A processar e indexar com IA...'
        }));
      }, 1000);

      // Call indexing API with category
      const result = await indexDocument(projectId, uploadState.file, category);
      
      clearInterval(progressInterval);

      if (result.success) {
        setUploadState(prev => ({
          ...prev,
          status: 'completed',
          progress: 100,
          message: `✅ Documento indexado em "${title}"! ${result.file?.chunks || 0} segmentos criados para RAG.`,
          result
        }));

        toast({
          title: "🎉 Upload concluído!",
          description: `Documento carregado em "${title}" e processado com sucesso!`
        });

        if (onFileUploaded && result.file) {
          onFileUploaded({
            name: result.file.name,
            url: result.file.url,
            type: result.file.type,
            chunks: result.file.chunks,
            category: category
          });
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
        message: `❌ Erro: ${error.message}`
      }));

      toast({
        variant: "destructive",
        title: "Erro no carregamento",
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
        return <Cloud className="h-5 w-5 text-blue-600 animate-pulse" />;
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

  const getProgressColor = () => {
    switch (uploadState.status) {
      case 'uploading':
        return 'bg-blue-500';
      case 'processing':
        return 'bg-purple-500';
      case 'completed':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-300';
    }
  };

  if (!isAuthenticated) {
    return (
      <Card className="w-full border-yellow-200 bg-yellow-50">
        <CardContent className="pt-6">
          <div className="text-center text-yellow-800">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p className="font-medium">Autenticação necessária</p>
            <p className="text-sm">Faça login para carregar documentos.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>
          {description} • Storage seguro organizado por categoria
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* File Selection */}
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              accept={acceptedFileTypes}
              onChange={handleFileSelect}
              className="hidden"
              id={`file-upload-${category}-${projectId}`}
              disabled={uploadState.status === 'uploading' || uploadState.status === 'processing'}
            />
            <label
              htmlFor={`file-upload-${category}-${projectId}`}
              className="cursor-pointer flex flex-col items-center space-y-2"
            >
              <div className="text-4xl">☁️</div>
              <div className="text-sm text-gray-600">
                <span className="font-medium text-blue-600 hover:text-blue-500">
                  Clique para selecionar
                </span>
                {' '}ou arraste ficheiros aqui
              </div>
              <div className="text-xs text-gray-500">
                {title} • Storage seguro • PDF, Word, Excel, TXT (máx. 50MB)
              </div>
            </label>
          </div>

          {/* Selected File Info */}
          {uploadState.file && (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-center gap-3">
                {getStatusIcon()}
                <div>
                  <div className="font-medium text-sm">{uploadState.file.name}</div>
                  <div className="text-xs text-gray-500">
                    {(uploadState.file.size / 1024 / 1024).toFixed(2)} MB • Categoria: {title}
                  </div>
                </div>
              </div>
              
              <Badge variant={
                uploadState.status === 'completed' ? 'default' :
                uploadState.status === 'error' ? 'destructive' :
                uploadState.status === 'idle' ? 'secondary' : 'outline'
              }>
                {uploadState.status === 'idle' && '⏳ Pronto'}
                {uploadState.status === 'uploading' && '☁️ A carregar'}
                {uploadState.status === 'processing' && '🤖 A processar'}
                {uploadState.status === 'completed' && '✅ Concluído'}
                {uploadState.status === 'error' && '❌ Erro'}
              </Badge>
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
            <Progress value={uploadState.progress} className={`h-2 ${getProgressColor()}`} />
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
            <h4 className="font-medium text-green-800 mb-2">🎉 Indexação Concluída</h4>
            <div className="space-y-1 text-sm text-green-700">
              <div>📄 Nome: {uploadState.result.file?.name}</div>
              <div>📂 Categoria: {title}</div>
              <div>🔍 Segmentos RAG: {uploadState.result.file?.chunks || 0}</div>
              <div>☁️ Storage: Supabase (seguro e organizado)</div>
              <div>✅ Status: Pronto para geração IA contextual</div>
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
                <Cloud className="mr-2 h-4 w-4" />
                Carregar para {title}
              </>
            )}
          </Button>

          {(uploadState.status === 'completed' || uploadState.status === 'error') && (
            <Button variant="outline" onClick={resetUpload}>
              Novo Upload
            </Button>
          )}
        </div>

        {/* Security Info */}
        <div className="text-xs text-gray-500 space-y-1 bg-blue-50 p-3 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 text-blue-700 font-medium">
            <Cloud className="h-4 w-4" />
            Storage Seguro e Organizado
          </div>
          <ul className="space-y-1 text-blue-600 ml-6">
            <li>• Ficheiros organizados automaticamente por categoria</li>
            <li>• Armazenamento privado e seguro</li>
            <li>• Acesso controlado por autenticação</li>
            <li>• Indexação automática para busca contextual</li>
            <li>• Políticas de segurança ativas</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default StorageUploadForm;
