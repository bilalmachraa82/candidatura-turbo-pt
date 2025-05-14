
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { exportDocument } from '@/api/exportDocument';

export function useDocumentExport() {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const exportProjectDocument = async (
    projectId: string,
    format: 'pdf' | 'docx' = 'pdf',
    language: 'pt' | 'en' = 'pt'
  ) => {
    setIsExporting(true);
    
    try {
      await exportDocument(projectId, format, language);
      
      toast({
        title: "Exportação concluída",
        description: `O documento foi exportado com sucesso em formato ${format.toUpperCase()}.`,
      });
      
      return true;
    } catch (error: any) {
      console.error('Error in document export:', error);
      
      toast({
        variant: "destructive",
        title: "Erro na exportação",
        description: error.message || "Não foi possível exportar o documento.",
      });
      
      return false;
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportProjectDocument,
    isExporting
  };
}
