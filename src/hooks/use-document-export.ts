
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ExportOptions {
  projectId: string;
  format: 'pdf' | 'docx';
  language: 'pt' | 'en';
  sections?: string[];
}

interface ExportResult {
  success: boolean;
  downloadUrl?: string;
  filename?: string;
  error?: string;
}

export const useDocumentExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const { toast } = useToast();

  const exportDocument = async (options: ExportOptions): Promise<ExportResult> => {
    setIsExporting(true);
    setExportProgress(0);

    try {
      // Simular progresso
      const progressInterval = setInterval(() => {
        setExportProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      });

      clearInterval(progressInterval);
      setExportProgress(100);

      if (response.ok) {
        const result = await response.json();
        
        toast({
          title: "Exportação concluída",
          description: `Documento exportado com sucesso em ${options.format.toUpperCase()}`
        });

        return {
          success: true,
          downloadUrl: result.downloadUrl,
          filename: result.filename
        };
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Erro na exportação');
      }
    } catch (error: any) {
      console.error('Export error:', error);
      
      toast({
        variant: "destructive",
        title: "Erro na exportação",
        description: error.message || "Não foi possível exportar o documento"
      });

      return {
        success: false,
        error: error.message
      };
    } finally {
      setIsExporting(false);
      setTimeout(() => setExportProgress(0), 1000);
    }
  };

  const checkExportReadiness = async (projectId: string) => {
    try {
      const response = await fetch(`/api/export?projectId=${projectId}`);
      if (response.ok) {
        return await response.json();
      }
      throw new Error('Erro ao verificar estado do projeto');
    } catch (error) {
      console.error('Error checking export readiness:', error);
      return null;
    }
  };

  return {
    exportDocument,
    checkExportReadiness,
    isExporting,
    exportProgress
  };
};
