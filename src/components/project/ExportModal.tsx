
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, Download, FileText, Languages, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectTitle: string;
}

interface ExportStatus {
  ready: boolean;
  completedSections: string[];
  totalSections: number;
  completion: number;
}

const SECTION_LABELS: Record<string, string> = {
  'analise_mercado': 'Análise de Mercado',
  'proposta_valor': 'Proposta de Valor',
  'plano_financeiro': 'Plano Financeiro',
  'estrategia_comercial': 'Estratégia Comercial',
  'inovacao_tecnologica': 'Inovação e Tecnologia',
  'sustentabilidade': 'Sustentabilidade',
  'recursos_humanos': 'Recursos Humanos',
  'cronograma': 'Cronograma'
};

const ExportModal: React.FC<ExportModalProps> = ({ 
  isOpen, 
  onClose, 
  projectId, 
  projectTitle 
}) => {
  const [format, setFormat] = useState<'pdf' | 'docx'>('pdf');
  const [language, setLanguage] = useState<'pt' | 'en'>('pt');
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [exportStatus, setExportStatus] = useState<ExportStatus | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && projectId) {
      checkExportStatus();
    }
  }, [isOpen, projectId]);

  const checkExportStatus = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/export?projectId=${projectId}`);
      if (response.ok) {
        const status = await response.json();
        setExportStatus(status);
        setSelectedSections(status.completedSections || []);
      }
    } catch (error) {
      console.error('Error checking export status:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível verificar o estado do projeto"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSectionToggle = (sectionId: string, checked: boolean) => {
    if (checked) {
      setSelectedSections(prev => [...prev, sectionId]);
    } else {
      setSelectedSections(prev => prev.filter(id => id !== sectionId));
    }
  };

  const handleExport = async () => {
    if (selectedSections.length === 0) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Selecione pelo menos uma secção para exportar"
      });
      return;
    }

    setIsExporting(true);
    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          format,
          language,
          sections: selectedSections
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Simular download
        const link = document.createElement('a');
        link.href = result.downloadUrl;
        link.download = result.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
          title: "Exportação concluída",
          description: `Dossiê exportado com sucesso em ${format.toUpperCase()}`
        });
        
        onClose();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Erro na exportação');
      }
    } catch (error: any) {
      console.error('Export error:', error);
      toast({
        variant: "destructive",
        title: "Erro na exportação",
        description: error.message || "Não foi possível exportar o dossiê"
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-pt-green" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-pt-green" />
            Exportar Dossiê PT2030
          </DialogTitle>
          <DialogDescription>
            Exporte o dossiê "{projectTitle}" em PDF ou DOCX
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status do Projeto */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progresso do projeto</span>
              <Badge variant={exportStatus?.ready ? "default" : "secondary"}>
                {exportStatus?.completion || 0}% completo
              </Badge>
            </div>
            <Progress value={exportStatus?.completion || 0} className="h-2" />
            <p className="text-xs text-gray-600 mt-2">
              {exportStatus?.completedSections.length || 0} de {exportStatus?.totalSections || 0} secções com conteúdo
            </p>
          </div>

          {!exportStatus?.ready && (
            <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  Projeto com conteúdo limitado
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Adicione conteúdo às secções para uma exportação mais completa.
                </p>
              </div>
            </div>
          )}

          {/* Formato */}
          <div>
            <Label className="text-sm font-medium flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4" />
              Formato de exportação
            </Label>
            <RadioGroup value={format} onValueChange={(value: 'pdf' | 'docx') => setFormat(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label htmlFor="pdf">PDF (recomendado)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="docx" id="docx" />
                <Label htmlFor="docx">Word (DOCX)</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Idioma */}
          <div>
            <Label className="text-sm font-medium flex items-center gap-2 mb-3">
              <Languages className="h-4 w-4" />
              Idioma do documento
            </Label>
            <RadioGroup value={language} onValueChange={(value: 'pt' | 'en') => setLanguage(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pt" id="pt" />
                <Label htmlFor="pt">Português</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="en" id="en" />
                <Label htmlFor="en">English</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Secções */}
          <div>
            <Label className="text-sm font-medium mb-3 block">
              Secções a incluir
            </Label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {exportStatus?.completedSections.map((sectionId) => (
                <div key={sectionId} className="flex items-center space-x-2">
                  <Checkbox
                    id={sectionId}
                    checked={selectedSections.includes(sectionId)}
                    onCheckedChange={(checked) => handleSectionToggle(sectionId, !!checked)}
                  />
                  <Label htmlFor={sectionId} className="text-sm">
                    {SECTION_LABELS[sectionId] || sectionId}
                  </Label>
                </div>
              ))}
            </div>
            
            {exportStatus?.completedSections.length === 0 && (
              <p className="text-sm text-gray-500 italic">
                Nenhuma secção com conteúdo disponível para exportação.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            Cancelar
          </Button>
          <Button 
            onClick={handleExport} 
            disabled={isExporting || selectedSections.length === 0}
            className="bg-pt-green hover:bg-pt-green/90"
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                A exportar...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Exportar {format.toUpperCase()}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportModal;
