
import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import EnhancedSectionEditor from '@/components/enhanced/EnhancedSectionEditor';
import { ProjectSection } from '@/types/components';

interface ContentTabProps {
  projectId: string;
  sections: ProjectSection[];
  onTextChange: (sectionId: string, text: string) => void;
  onSourcesUpdate: (sectionId: string, sources: any[]) => void;
}

const ContentTab: React.FC<ContentTabProps> = ({
  projectId,
  sections,
  onTextChange,
  onSourcesUpdate
}) => {
  const getSectionCompletionStatus = (section: ProjectSection) => {
    const contentLength = section.content?.length || 0;
    const charLimit = section.charLimit || 2000;
    const completionPercentage = (contentLength / charLimit) * 100;
    
    if (completionPercentage === 0) return { status: 'empty', label: 'Vazio', color: 'bg-gray-500' };
    if (completionPercentage < 50) return { status: 'draft', label: 'Rascunho', color: 'bg-yellow-500' };
    if (completionPercentage < 90) return { status: 'progress', label: 'Em progresso', color: 'bg-blue-500' };
    if (completionPercentage <= 100) return { status: 'complete', label: 'Completo', color: 'bg-green-500' };
    return { status: 'overflow', label: 'Excesso', color: 'bg-red-500' };
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-pt-blue to-pt-green text-white p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-2">Conteúdo do Projeto</h2>
        <p className="text-blue-100">
          Desenvolva cada secção da sua candidatura PT2030 com apoio de IA baseada nos seus documentos
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="text-2xl font-bold text-pt-blue">
            {sections.filter(s => getSectionCompletionStatus(s).status === 'complete').length}
          </div>
          <div className="text-sm text-gray-600">Secções Completas</div>
        </div>
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="text-2xl font-bold text-yellow-600">
            {sections.filter(s => ['draft', 'progress'].includes(getSectionCompletionStatus(s).status)).length}
          </div>
          <div className="text-sm text-gray-600">Em Desenvolvimento</div>
        </div>
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="text-2xl font-bold text-gray-600">
            {sections.filter(s => getSectionCompletionStatus(s).status === 'empty').length}
          </div>
          <div className="text-sm text-gray-600">Por Iniciar</div>
        </div>
      </div>

      <Accordion type="single" collapsible className="space-y-4">
        {sections.map((section) => {
          const completion = getSectionCompletionStatus(section);
          
          return (
            <AccordionItem key={section.id} value={section.id} className="border rounded-lg">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${completion.color}`}></div>
                    <span className="font-medium text-left">{section.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {completion.label}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {section.content?.length || 0}/{section.charLimit} chars
                    </Badge>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <EnhancedSectionEditor
                  section={section}
                  projectId={projectId}
                  onTextChange={onTextChange}
                  onSourcesUpdate={onSourcesUpdate}
                />
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
};

export default ContentTab;
