
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { exportDocument } from '@/api/exportDocument';
import { useToast } from '@/hooks/use-toast';
import { Spinner } from '@/components/ui/spinner';

interface ExportDialogProps {
  projectId: string;
  projectName: string;
  isOpen: boolean;
  onClose: () => void;
}

const ExportDialog: React.FC<ExportDialogProps> = ({
  projectId,
  projectName,
  isOpen,
  onClose
}) => {
  const [format, setFormat] = useState<'pdf' | 'docx'>('pdf');
  const [language, setLanguage] = useState<'pt' | 'en'>('pt');
  const [includeAttachments, setIncludeAttachments] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    if (!projectId) return;
    
    setIsExporting(true);
    
    try {
      const result = await exportDocument(projectId, format, {
        includeAttachments,
        language
      });
      
      if (!result.url) {
        throw new Error('URL de exportação não disponível');
      }
      
      // Create a temporary anchor element to trigger download
      const link = document.createElement('a');
      link.href = result.url;
      link.download = `${projectName.replace(/\s+/g, '-').toLowerCase()}_${format}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Exportação concluída",
        description: `O dossiê foi exportado em formato ${format.toUpperCase()}.`
      });
      
      onClose();
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Exportar Dossiê</DialogTitle>
          <DialogDescription>
            Configure as opções de exportação para o seu dossiê.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="format" className="text-right">
              Formato
            </Label>
            <Select
              value={format}
              onValueChange={(val: 'pdf' | 'docx') => setFormat(val)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecionar formato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="docx">DOCX (Word)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="language" className="text-right">
              Idioma
            </Label>
            <Select
              value={language}
              onValueChange={(val: 'pt' | 'en') => setLanguage(val)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecionar idioma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pt">Português</SelectItem>
                <SelectItem value="en">Inglês</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <div className="col-span-4 flex items-center space-x-2">
              <Checkbox
                id="attachments"
                checked={includeAttachments}
                onCheckedChange={(checked) => setIncludeAttachments(checked === true)}
              />
              <Label htmlFor="attachments">
                Incluir anexos e documentos de suporte
              </Label>
            </div>
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
          >
            {isExporting ? (
              <>
                <Spinner size="sm" className="mr-2" />
                A exportar...
              </>
            ) : (
              `Exportar ${format.toUpperCase()}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDialog;
