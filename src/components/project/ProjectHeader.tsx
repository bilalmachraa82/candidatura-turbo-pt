
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ExportDialog from '@/components/ExportDialog';

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
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'docx'>('pdf');

  const handleExportClick = (format: 'pdf' | 'docx') => {
    setExportFormat(format);
    setIsExportDialogOpen(true);
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
          onClick={() => handleExportClick('pdf')}
          disabled={isExporting}
        >
          <Download className="mr-2 h-4 w-4" />
          Exportar PDF
        </Button>
        <Button 
          variant="outline" 
          className="border-pt-blue text-pt-blue hover:bg-pt-blue hover:text-white"
          onClick={() => handleExportClick('docx')}
          disabled={isExporting}
        >
          <FileText className="mr-2 h-4 w-4" />
          Exportar DOCX
        </Button>
      </div>

      <ExportDialog 
        projectId={projectId}
        projectName={projectName}
        isOpen={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
      />
    </div>
  );
};

export default ProjectHeader;
