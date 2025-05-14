
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseDocumentExportProps {
  projectId: string;
}

interface ExportOptions {
  format: 'pdf' | 'docx';
  language?: 'pt' | 'en';
}

export function useDocumentExport({ projectId }: UseDocumentExportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const exportDocument = async ({ format, language = 'pt' }: ExportOptions) => {
    if (!projectId) {
      toast({
        variant: "destructive",
        title: "Erro de exportação",
        description: "ID do projeto em falta."
      });
      return null;
    }

    setIsExporting(true);

    try {
      const response = await fetch(`/api/export?projectId=${projectId}&format=${format}&language=${language}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro na exportação do documento');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Erro na exportação do documento');
      }

      // Trigger download
      const link = document.createElement('a');
      link.href = data.url;
      link.download = data.fileName || `PT2030_Export_${new Date().toISOString().slice(0, 10)}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Documento exportado com sucesso",
        description: `O ficheiro foi exportado em formato ${format.toUpperCase()}.`
      });

      return data;
    } catch (error: any) {
      console.error("Export error:", error);
      toast({
        variant: "destructive",
        title: "Erro na exportação",
        description: error.message || "Não foi possível exportar o documento."
      });
      return null;
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportDocument,
    isExporting
  };
}
