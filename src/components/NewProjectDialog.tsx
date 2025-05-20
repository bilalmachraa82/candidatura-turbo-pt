
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
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

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
  const { user } = useAuth(); // Get the current authenticated user

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!projectName.trim()) {
      toast({
        title: "Erro",
        description: "O nome do projeto é obrigatório",
        variant: "destructive"
      });
      return;
    }

    // Check if user is authenticated
    if (!user) {
      toast({
        variant: "destructive",
        title: "Erro de autenticação",
        description: "Necessita de iniciar sessão para criar um projeto."
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log("Creating project with user ID:", user.id);

      // Create the project in Supabase - explicitly setting user_id
      const { data, error } = await supabase
        .from('projects')
        .insert({
          title: projectName,
          description: projectDescription,
          status: 'draft',
          user_id: user.id // Explicitly set the user_id to match RLS policy
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Projeto criado com sucesso",
      });
      
      // Create default sections for the project
      await createDefaultSections(data.id);
      
      // Notify parent component
      if (onCreateProject) {
        onCreateProject({
          name: projectName,
          description: projectDescription,
          type: projectType, // Keep this for UI consistency
          id: data.id
        });
      }
      
      // Update: Fix route name to match App.tsx route configuration
      navigate(`/projects/${data.id}`);
      
      // Limpar e fechar modal
      resetForm();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error creating project:", error);
      toast({
        variant: "destructive",
        title: "Erro ao criar projeto",
        description: error.message || "Ocorreu um erro ao criar o projeto. Tente novamente."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const createDefaultSections = async (projectId: string) => {
    try {
      const defaultSections = [
        {
          project_id: projectId,
          key: 'analise_mercado',
          title: 'Análise de Mercado',
          description: 'Avaliação do mercado-alvo, tendências e oportunidades',
          char_limit: 2500
        },
        {
          project_id: projectId,
          key: 'proposta_valor',
          title: 'Proposta de Valor',
          description: 'Definição do valor único oferecido ao mercado',
          char_limit: 1500
        },
        {
          project_id: projectId,
          key: 'plano_financeiro',
          title: 'Plano Financeiro',
          description: 'Projeções financeiras e análise de viabilidade',
          char_limit: 3000
        }
      ];

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
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Descrição
              </Label>
              <Textarea
                id="description"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                className="col-span-3"
                placeholder="Descrição breve do projeto"
                rows={3}
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
                placeholder="Tipo de projeto"
                disabled={isSubmitting}
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
