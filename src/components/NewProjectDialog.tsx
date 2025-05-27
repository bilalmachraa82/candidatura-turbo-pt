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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { PT2030_SECTIONS } from '@/data/pt2030_sections';

interface NewProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateProject?: (projectData: { name: string; description?: string; type?: string; id: string }) => void;
}

const NewProjectDialog: React.FC<NewProjectDialogProps> = ({ 
  open, 
  onOpenChange,
  onCreateProject 
}) => {
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectType, setProjectType] = useState('Standard');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!projectName.trim()) {
      toast({
        title: "Erro",
        description: "O nome do projecto é obrigatório",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        variant: "destructive",
        title: "Erro de autenticação",
        description: "É necessário iniciar sessão para criar um projecto."
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log("A criar projecto com ID do utilizador:", user.id);

      const { data, error } = await supabase
        .from('projects')
        .insert({
          title: projectName,
          description: projectDescription,
          status: 'draft',
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Projecto criado com sucesso",
      });
      
      await createDefaultSections(data.id);
      
      if (onCreateProject) {
        onCreateProject({
          name: projectName,
          description: projectDescription,
          type: projectType,
          id: data.id
        });
      }
      
      navigate(`/projects/${data.id}`);
      
      resetForm();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Erro ao criar projecto:", error);
      toast({
        variant: "destructive",
        title: "Erro ao criar projecto",
        description: error.message || "Ocorreu um erro ao criar o projecto. Tente novamente."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const createDefaultSections = async (projectId: string) => {
    try {
      // Usar seções PT2030 em vez do array hard-coded
      const defaultSections = PT2030_SECTIONS.map(section => ({
        project_id: projectId,
        key: section.code,
        title: section.title,
        description: section.description,
        char_limit: section.charLimit
      }));

      const { error } = await supabase
        .from('sections')
        .insert(defaultSections);

      if (error) {
        console.error('Error creating default sections:', error);
      }
    } catch (err) {
      console.error('Error creating default sections:', err);
    }
  };

  const resetForm = () => {
    setProjectName('');
    setProjectDescription('');
    setProjectType('Standard');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-pt-blue">Criar Novo Projecto</DialogTitle>
          <DialogDescription>
            Introduza os detalhes do seu novo projecto PT2030.
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
                placeholder="Nome do projecto"
                autoFocus
                aria-label="Nome do projecto"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Descrição
              </Label>
              <Textarea
                id="description"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                className="col-span-3"
                placeholder="Descrição breve do projecto"
                rows={3}
                aria-label="Descrição do projecto"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Tipo
              </Label>
              <Input
                id="type"
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                className="col-span-3"
                placeholder="Tipo de projecto"
                disabled={isSubmitting}
                aria-label="Tipo de projecto"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-pt-green hover:bg-pt-green/90" disabled={isSubmitting}>
              {isSubmitting ? "A criar..." : "Criar Projecto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewProjectDialog;
