
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, FileText, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout';
import NewProjectDialog from '@/components/NewProjectDialog';
import { useToast } from '@/hooks/use-toast';

interface Project {
  id: string;
  name: string;
  date: string;
  progress: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
}

const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Hotel Rural Sustentável',
    date: '2025-03-10',
    progress: 67,
    status: 'draft',
  },
  {
    id: '2',
    name: 'Restaurante Típico do Algarve',
    date: '2025-02-15',
    progress: 100,
    status: 'submitted',
  },
  {
    id: '3',
    name: 'Agência de Turismo de Aventura',
    date: '2025-01-22',
    progress: 35,
    status: 'draft',
  },
];

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'draft': return 'bg-amber-100 text-amber-800';
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: Project['status']) => {
    switch (status) {
      case 'draft': return 'Rascunho';
      case 'submitted': return 'Submetido';
      case 'approved': return 'Aprovado';
      case 'rejected': return 'Rejeitado';
      default: return status;
    }
  };

  const handleCreateProject = (projectData: { name: string }) => {
    const newProject: Project = {
      id: Date.now().toString(),
      name: projectData.name,
      date: new Date().toISOString().slice(0, 10),
      progress: 0,
      status: 'draft',
    };
    
    setProjects([newProject, ...projects]);
    
    toast({
      title: 'Projeto criado',
      description: `O projeto "${projectData.name}" foi criado com sucesso.`
    });
  };

  return (
    <Layout>
      <div className="pt-container pt-section">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-pt-blue">Olá, {user?.name || 'Utilizador'}</h1>
            <p className="text-gray-600 mt-1">Bem-vindo ao seu painel de gestão de projetos PT2030</p>
          </div>
          <div className="mt-4 md:mt-0">
            <Button 
              className="bg-pt-green hover:bg-pt-green/90"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo Projeto
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Link to={`/projetos/${project.id}`} key={project.id} className="block">
              <Card className="h-full hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-xl text-pt-blue">{project.name}</CardTitle>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(project.status)}`}>
                      {getStatusText(project.status)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {new Date(project.date).toLocaleDateString('pt-PT')}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Progresso</span>
                        <span className="text-sm text-gray-500">{project.progress}%</span>
                      </div>
                      <Progress value={project.progress} className="h-2" />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <div className="w-full flex justify-between items-center">
                    <div className="flex items-center text-sm text-gray-600">
                      <FileText className="h-4 w-4 mr-1" />
                      <span>
                        {project.status === 'draft' ? 'Continuar edição' : 'Ver detalhes'}
                      </span>
                    </div>
                    <Button variant="ghost" size="sm" className="text-pt-blue hover:text-pt-green">
                      Abrir →
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <NewProjectDialog 
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreateProject={handleCreateProject}
      />
    </Layout>
  );
};

export default DashboardPage;
