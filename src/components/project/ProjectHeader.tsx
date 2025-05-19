
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';
import ExportModal from './ExportModal';

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
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const handleExportClick = () => {
    setIsExportModalOpen(true);
  };

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
      <div>
        <h1 className="text-2xl font-bold text-pt-blue">{projectName}</h1>
        <p className="text-gray-500 mt-1">ID: {projectId}</p>
      </div>
      
      <div className="flex gap-2">
        <Button
          onClick={handleExportClick}
          className="bg-pt-blue hover:bg-pt-blue/90"
          disabled={isExporting}
        >
          <FileDown className="mr-2 h-4 w-4" />
          Exportar Dossiê
        </Button>
      </div>
      
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        projectId={projectId}
      />
    </div>
  );
};

export default ProjectHeader;
