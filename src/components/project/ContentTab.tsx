
import React from 'react';
import SectionEditor from '@/components/section-editor';
import { ProjectSection } from '@/types/components';
import { GenerationSource } from '@/types/api';

interface ContentTabProps {
  projectId: string;
  sections: ProjectSection[];
  onTextChange: (sectionId: string, text: string) => void;
  onSourcesUpdate: (sectionId: string, sources: GenerationSource[]) => void;
}

const ContentTab: React.FC<ContentTabProps> = ({
  projectId,
  sections,
  onTextChange,
  onSourcesUpdate
}) => {
  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <SectionEditor
          key={section.id}
          title={section.title}
          description={section.description}
          sectionKey={section.key}
          projectId={projectId || ''}
          initialText={section.content}
          charLimit={section.charLimit}
          onTextChange={(text) => onTextChange(section.id, text)}
          onSourcesUpdate={(newSources) => onSourcesUpdate(section.id, newSources)}
        />
      ))}
    </div>
  );
};

export default ContentTab;
