
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { exportDocument } from '@/api/exportDocument';
import { useToast } from '@/hooks/use-toast';

interface ProjectHeaderProps {
  projectName: string;
  projectId: string;
  isExporting: boolean;
  setIsExporting: (value: boolean) => void;
}

const ProjectHeader: React.FC<ProjectHeaderProps> = ({ 
  projectName, 
  projectId, 
  isExporting, 
  setIsExporting 
}) => {
  const { toast } = useToast();

  const handleExport = async (format: 'pdf' | 'docx') => {
    if (!projectId) return;
    
    setIsExporting(true);
    
    try {
      const result = await exportDocument(projectId, format);
      
      toast({
        title: "Exportação concluída",
        description: `O seu dossiê foi exportado em formato ${format.toUpperCase()}.`
      });
      
      // In a real implementation, this would trigger a download
      // window.open(result.url, '_blank');
    } catch (error: any) {
      console.error("Export error:", error);
      toast({
        variant: "destructive",
        title: "Erro na exportação",
        description: error.message || "Não foi possível exportar o dossiê. Por favor tente novamente."
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
      <div>
        <Link to="/" className="text-pt-blue hover:text-pt-green inline-flex items-center mb-2">
          <ArrowLeft className="h-4 w-4 mr-1" />
          <span>Voltar aos projetos</span>
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-pt-blue">{projectName}</h1>
      </div>
      <div className="mt-4 md:mt-0 flex gap-2">
        <Button 
          variant="outline" 
          className="border-pt-blue text-pt-blue hover:bg-pt-blue hover:text-white"
          onClick={() => handleExport('pdf')}
          disabled={isExporting}
        >
          <Download className="mr-2 h-4 w-4" />
          Exportar PDF
        </Button>
        <Button 
          variant="outline" 
          className="border-pt-blue text-pt-blue hover:bg-pt-blue hover:text-white"
          onClick={() => handleExport('docx')}
          disabled={isExporting}
        >
          <FileText className="mr-2 h-4 w-4" />
          Exportar DOCX
        </Button>
      </div>
    </div>
  );
};

export default ProjectHeader;
