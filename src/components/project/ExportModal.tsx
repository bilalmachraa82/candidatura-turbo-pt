
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { FileDown, Loader2 } from 'lucide-react';
import { useDocumentExport } from '@/hooks/use-document-export';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, projectId }) => {
  const [format, setFormat] = useState<'pdf' | 'docx'>('pdf');
  const [language, setLanguage] = useState<'pt' | 'en'>('pt');
  const { exportProjectDocument, isExporting } = useDocumentExport();

  const handleExport = async () => {
    await exportProjectDocument(projectId, format, language);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Exportar Dossiê</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="format" className="text-right">
              Formato
            </Label>
            <Select 
              value={format} 
              onValueChange={(value: 'pdf' | 'docx') => setFormat(value)}
              name="format"
            >
              <SelectTrigger className="col-span-3" aria-label="Seleccionar formato de exportação">
                <SelectValue placeholder="Seleccione o formato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="docx">Word (DOCX)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="language" className="text-right">
              Idioma
            </Label>
            <Select 
              value={language} 
              onValueChange={(value: 'pt' | 'en') => setLanguage(value)}
              name="language"
            >
              <SelectTrigger className="col-span-3" aria-label="Seleccionar idioma de exportação">
                <SelectValue placeholder="Seleccione o idioma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pt">Português</SelectItem>
                <SelectItem value="en">Inglês</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isExporting}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleExport}
            disabled={isExporting}
            className="gap-2"
            aria-label="Confirmar exportação do dossiê"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                A exportar...
              </>
            ) : (
              <>
                <FileDown className="h-4 w-4" />
                Exportar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportModal;
