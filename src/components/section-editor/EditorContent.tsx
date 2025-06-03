
import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import CharacterCounter from './CharacterCounter';
import { SaveStatus } from '@/hooks/use-auto-save';

interface EditorContentProps {
  text: string;
  onTextChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  charLimit: number;
  onSave: () => void;
  placeholder: string;
  saveStatus: SaveStatus;
  hasUnsavedChanges: boolean;
}

const EditorContent: React.FC<EditorContentProps> = ({
  text,
  onTextChange,
  charLimit,
  onSave,
  placeholder,
  saveStatus,
  hasUnsavedChanges
}) => {
  const isSaving = saveStatus === 'saving';
  const showSaveButton = hasUnsavedChanges || saveStatus === 'error';

  return (
    <div className="space-y-4">
      <Textarea
        value={text}
        onChange={onTextChange}
        placeholder={placeholder}
        className="min-h-[200px] resize-y"
        aria-label="Editor de conteúdo da secção"
      />
      
      <CharacterCounter currentCount={text.length} maxCount={charLimit} />
      
      <div className="flex justify-between items-center">
        <div className="text-xs text-gray-500">
          {saveStatus === 'saved' && !hasUnsavedChanges && (
            <span className="text-green-600">✓ Auto-guardado</span>
          )}
          {hasUnsavedChanges && saveStatus !== 'saving' && (
            <span className="text-yellow-600">○ Alterações por guardar</span>
          )}
          {saveStatus === 'saving' && (
            <span className="text-blue-600">⟳ A guardar automaticamente...</span>
          )}
          {saveStatus === 'error' && (
            <span className="text-red-600">⚠ Erro ao guardar - use botão manual</span>
          )}
        </div>
        
        {showSaveButton && (
          <Button
            variant="outline"
            size="sm"
            onClick={onSave}
            disabled={isSaving}
            aria-label="Guardar alterações desta secção manualmente"
          >
            {isSaving ? (
              <>
                <Spinner size="sm" className="mr-2" />
                A guardar...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Guardar agora
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default EditorContent;
