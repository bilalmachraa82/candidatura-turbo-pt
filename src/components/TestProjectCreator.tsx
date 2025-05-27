
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { PT2030_SECTIONS } from '@/data/pt2030_sections';
import { Loader2, TestTube } from 'lucide-react';

interface TestProjectCreatorProps {
  onProjectCreated: (projectId: string) => void;
}

const TestProjectCreator: React.FC<TestProjectCreatorProps> = ({ onProjectCreated }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [projectName, setProjectName] = useState('Hotel Algarve - Projecto de Teste');
  const [projectDescription, setProjectDescription] = useState('Projecto de teste para validação do sistema de candidaturas PT2030. Hotel boutique no Algarve com foco em turismo sustentável e experiências locais autênticas.');
  const { toast } = useToast();
  const { user } = useAuth();

  const handleCreateTestProject = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Erro de autenticação",
        description: "É necessário iniciar sessão para criar um projecto."
      });
      return;
    }

    setIsCreating(true);
    
    try {
      console.log("A criar projecto de teste com utilizador:", user.id);

      // Criar o projecto
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .insert({
          title: projectName,
          description: projectDescription,
          status: 'draft',
          user_id: user.id,
          region: 'Algarve',
          program: 'PT2030',
          organization: 'Hotel Algarve Lda',
          budget: 250000,
          contact_email: 'geral@hotelalgarve.pt',
          contact_phone: '+351 289 123 456'
        })
        .select()
        .single();

      if (projectError) throw projectError;

      console.log("Projecto criado:", projectData);

      // Criar as secções por defeito
      const defaultSections = PT2030_SECTIONS.map(section => ({
        project_id: projectData.id,
        key: section.code,
        title: section.title,
        description: section.description,
        content: '',
        char_limit: section.charLimit
      }));

      const { error: sectionsError } = await supabase
        .from('sections')
        .insert(defaultSections);

      if (sectionsError) {
        console.error('Erro ao criar secções:', sectionsError);
        // Não falhar se as secções já existirem
      }

      toast({
        title: "Projecto de teste criado",
        description: `${projectName} foi criado com sucesso com todas as secções PT2030.`
      });

      onProjectCreated(projectData.id);
      
    } catch (error: any) {
      console.error("Erro ao criar projecto de teste:", error);
      toast({
        variant: "destructive",
        title: "Erro ao criar projecto",
        description: error.message || "Ocorreu um erro ao criar o projecto de teste."
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center text-pt-blue">
          <TestTube className="mr-2 h-5 w-5" />
          Criar Projecto de Teste
        </CardTitle>
        <CardDescription>
          Crie um projecto de teste "Hotel Algarve" para validar todo o fluxo de geração PT2030
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label htmlFor="test-name" className="block text-sm font-medium mb-1">
            Nome do Projecto
          </label>
          <Input
            id="test-name"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Nome do projecto de teste"
          />
        </div>
        
        <div>
          <label htmlFor="test-description" className="block text-sm font-medium mb-1">
            Descrição
          </label>
          <Textarea
            id="test-description"
            value={projectDescription}
            onChange={(e) => setProjectDescription(e.target.value)}
            placeholder="Descrição do projecto de teste"
            rows={3}
          />
        </div>
        
        <Button 
          onClick={handleCreateTestProject}
          disabled={isCreating || !projectName.trim()}
          className="w-full bg-pt-green hover:bg-pt-green/90"
        >
          {isCreating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              A criar projecto...
            </>
          ) : (
            <>
              <TestTube className="mr-2 h-4 w-4" />
              Criar Projecto de Teste
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default TestProjectCreator;
