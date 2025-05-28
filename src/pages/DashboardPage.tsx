
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Layout from '@/components/Layout';
import NewProjectDialog from '@/components/NewProjectDialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import SupabaseConnectionStatus from '@/components/SupabaseConnectionStatus';
import AuthStatus from '@/components/AuthStatus';

interface Project {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  status: string;
  user_id: string;
  budget: number | null;
  contact_email: string | null;
  contact_phone: string | null;
  region: string | null;
  program: string | null;
  organization: string | null;
  updated_at: string;
}

const DashboardPage: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchProjects();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const fetchProjects = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      console.log("Fetching projects for user ID:", user.id);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setProjects(data || []);
    } catch (error: any) {
      console.error('Error fetching projects:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os projetos."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProject = async (projectData: { name: string; description?: string; type?: string; id: string }) => {
    // Add the new project to the list to avoid another fetch
    const newProject: Project = {
      id: projectData.id,
      title: projectData.name,
      description: projectData.description || null,
      status: 'draft',
      user_id: user?.id || '',
      budget: null,
      contact_email: null,
      contact_phone: null,
      region: null,
      program: null,
      organization: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    setProjects((prev) => [newProject, ...prev]);
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return <Badge variant="outline" className="bg-gray-100">Rascunho</Badge>;
      case 'review':
        return <Badge className="bg-amber-500">Em Revisão</Badge>;
      case 'submitted':
        return <Badge className="bg-green-500">Submetido</Badge>;
      case 'approved':
        return <Badge className="bg-pt-green text-white">Aprovado</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Recusado</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  return (
    <Layout>
      <div className="pt-container pt-section">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-pt-blue">Meus Projetos</h1>
            <p className="text-gray-600 mt-2">Gerencie as suas candidaturas PT2030</p>
            <div className="mt-2 space-y-2">
              <SupabaseConnectionStatus showToast={true} />
              <AuthStatus />
            </div>
          </div>
          <Button 
            onClick={() => setIsDialogOpen(true)}
            className="mt-4 md:mt-0 bg-pt-green text-white hover:bg-pt-blue"
            disabled={!user}
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Projeto
          </Button>
        </div>

        {!user ? (
          <div className="text-center p-12 bg-gray-50 rounded-lg border border-dashed">
            <FileText className="h-12 w-12 mx-auto text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Autenticação necessária</h3>
            <p className="mt-1 text-sm text-gray-500">
              Precisa estar autenticado para ver e criar projetos.
            </p>
            <Link to="/login">
              <Button 
                className="mt-6 bg-pt-green text-white hover:bg-pt-blue"
              >
                Iniciar sessão
              </Button>
            </Link>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border rounded-lg h-48 animate-pulse bg-gray-100"></div>
            ))}
          </div>
        ) : projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card key={project.id} className="transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl text-pt-blue">{project.title}</CardTitle>
                    {getStatusBadge(project.status)}
                  </div>
                  <CardDescription className="line-clamp-2">
                    {project.description || 'Sem descrição'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="font-medium mr-2">Região:</span>
                    <span>{project.region || 'Não especificada'}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500 mt-2">
                    <span className="font-medium mr-2">Criado em:</span>
                    <span>{new Date(project.created_at).toLocaleDateString('pt-PT')}</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Link to={`/projects/${project.id}`} className="w-full">
                    <Button variant="outline" className="w-full border-pt-blue text-pt-blue hover:bg-pt-blue hover:text-white">
                      <FileText className="h-4 w-4 mr-2" />
                      Abrir Projeto
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center p-12 bg-gray-50 rounded-lg border border-dashed">
            <FileText className="h-12 w-12 mx-auto text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Sem Projetos</h3>
            <p className="mt-1 text-sm text-gray-500">
              Ainda não tem nenhum projeto. Comece por criar um novo projeto.
            </p>
            <Button 
              onClick={() => setIsDialogOpen(true)}
              className="mt-6 bg-pt-green text-white hover:bg-pt-blue"
            >
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeiro Projeto
            </Button>
          </div>
        )}

        <NewProjectDialog 
          open={isDialogOpen} 
          onOpenChange={setIsDialogOpen}
          onCreateProject={handleCreateProject}
        />
      </div>
    </Layout>
  );
};

export default DashboardPage;
