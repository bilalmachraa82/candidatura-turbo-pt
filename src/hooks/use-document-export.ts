
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ExportResult } from '@/types/api';

export function useDocumentExport() {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const exportProjectDocument = async (
    projectId: string,
    format: 'pdf' | 'docx' = 'pdf',
    language: 'pt' | 'en' = 'pt'
  ): Promise<ExportResult | null> => {
    setIsExporting(true);
    
    try {
      const response = await fetch(
        `/api/export?projectId=${projectId}&format=${format}&language=${language}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Export failed with status: ${response.status}`);
      }
      
      const exportResult: ExportResult = await response.json();
      
      // Trigger file download
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = exportResult.url;
      a.download = exportResult.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(exportResult.url);
      document.body.removeChild(a);
      
      toast({
        title: "Exportação concluída",
        description: `O documento foi exportado com sucesso em formato ${format.toUpperCase()}.`,
      });
      
      return exportResult;
    } catch (error: any) {
      console.error('Error in document export:', error);
      
      toast({
        variant: "destructive",
        title: "Erro na exportação",
        description: error.message || "Não foi possível exportar o documento.",
      });
      
      return null;
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportProjectDocument,
    isExporting
  };
}
