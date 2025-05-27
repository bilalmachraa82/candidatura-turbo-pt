
import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useSectionEditor } from '@/hooks/use-section-editor';
import SectionHeader from './SectionHeader';
import EditorContent from './EditorContent';
import ChatThread from '@/components/ChatThread';
import { GenerationSource } from '@/types/api';

interface SectionEditorProps {
  title: string;
  description?: string;
  sectionKey: string;
  projectId: string;
  initialText: string;
  charLimit: number;
  onTextChange: (text: string) => void;
  onSourcesUpdate: (sources: GenerationSource[]) => void;
}

const SectionEditor: React.FC<SectionEditorProps> = ({
  title,
  description,
  sectionKey,
  projectId,
  initialText = '',
  charLimit = 2000,
  onTextChange,
  onSourcesUpdate
}) => {
  const {
    text,
    setText,
    isSaving,
    isGenerating,
    selectedModel,
    setSelectedModel,
    handleTextChange,
    handleSave,
    handleGenerateText
  } = useSectionEditor({
    projectId,
    sectionKey,
    initialText,
    charLimit,
    onTextChange,
    onSourcesUpdate
  });

  useEffect(() => {
    // Sincronizar o texto com o estado inicial
    if (initialText !== text) {
      setText(initialText);
    }
  }, [initialText, setText, text]);

  const handleChatGenerated = (generatedText: string) => {
    setText(generatedText);
    onTextChange(generatedText);
  };

  return (
    <div className="space-y-4">
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <SectionHeader 
            title={title}
            description={description}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            isGenerating={isGenerating}
            onGenerateClick={handleGenerateText}
          />
        </CardHeader>
        
        <CardContent>
          <EditorContent 
            text={text}
            onTextChange={handleTextChange}
            charLimit={charLimit}
            isSaving={isSaving}
            onSave={handleSave}
            placeholder={`Escreva o conteúdo para ${title} aqui...`}
          />
        </CardContent>
      </Card>

      {/* Mini-chat for section refinement */}
      <ChatThread
        projectId={projectId}
        section={sectionKey}
        charLimit={charLimit}
        model={selectedModel}
        onTextGenerated={handleChatGenerated}
      />
    </div>
  );
};

export default SectionEditor;
