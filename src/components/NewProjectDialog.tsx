
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface NewProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateProject: (projectData: { name: string }) => void;
}

const NewProjectDialog: React.FC<NewProjectDialogProps> = ({ 
  open, 
  onOpenChange,
  onCreateProject 
}) => {
  const [projectName, setProjectName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!projectName.trim()) {
      toast({
        title: "Erro",
        description: "O nome do projeto é obrigatório",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    // Simular criação do projeto (substituir com integração Supabase no futuro)
    setTimeout(() => {
      const newProjectId = Date.now().toString();
      
      onCreateProject({ name: projectName });
      
      toast({
        title: "Sucesso!",
        description: "Projeto criado com sucesso",
      });
      
      // Redirecionar para a página do projeto
      navigate(`/projetos/${newProjectId}`);
      
      // Limpar e fechar modal
      setProjectName('');
      onOpenChange(false);
      setIsSubmitting(false);
    }, 800);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-pt-blue">Criar Novo Projeto</DialogTitle>
          <DialogDescription>
            Introduza os detalhes do seu novo projeto PT2030.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nome
              </Label>
              <Input
                id="name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="col-span-3"
                placeholder="Nome do projeto"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-pt-green hover:bg-pt-green/90" disabled={isSubmitting}>
              {isSubmitting ? "A criar..." : "Criar Projeto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewProjectDialog;
