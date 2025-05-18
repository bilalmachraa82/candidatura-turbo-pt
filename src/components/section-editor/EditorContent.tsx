
import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import CharacterCounter from './CharacterCounter';

interface EditorContentProps {
  text: string;
  onTextChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  charLimit: number;
  isSaving: boolean;
  onSave: () => void;
  placeholder: string;
}

const EditorContent: React.FC<EditorContentProps> = ({
  text,
  onTextChange,
  charLimit,
  isSaving,
  onSave,
  placeholder
}) => {
  return (
    <div className="space-y-4">
      <Textarea
        value={text}
        onChange={onTextChange}
        placeholder={placeholder}
        className="min-h-[200px] resize-y"
      />
      
      <CharacterCounter currentCount={text.length} maxCount={charLimit} />
      
      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={onSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Spinner size="sm" className="mr-2" />
              A salvar...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Salvar
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default EditorContent;
