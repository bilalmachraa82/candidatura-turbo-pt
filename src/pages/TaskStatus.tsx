
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Clock, AlertTriangle, X } from 'lucide-react';

const TaskStatus: React.FC = () => {
  const [tasks] = useState([
    // Infraestrutura Base - Supabase
    { id: 'supabase-client', name: 'Configuração do cliente Supabase', status: 'completed', category: 'infra' },
    { id: 'supabase-tables', name: 'Configuração básica das tabelas de dados', status: 'completed', category: 'infra' },
    { id: 'supabase-bucket', name: 'Bucket de armazenamento para documentos', status: 'completed', category: 'infra' },
    { id: 'supabase-rls', name: 'Políticas de acesso (RLS)', status: 'completed', category: 'infra' },
    
    // Autenticação
    { id: 'auth-basic', name: 'Configuração básica de autenticação', status: 'completed', category: 'auth' },
    { id: 'auth-flow', name: 'Fluxo de login/registro', status: 'in-progress', category: 'auth' },
    { id: 'auth-redirect', name: 'Redirecionamento para rotas protegidas', status: 'in-progress', category: 'auth' },
    { id: 'auth-errors', name: 'Manipulação de erros de autenticação', status: 'in-progress', category: 'auth' },
    
    // Upload e Indexação
    { id: 'upload-form', name: 'Formulário de upload', status: 'completed', category: 'upload' },
    { id: 'upload-api', name: 'API de indexação', status: 'completed', category: 'upload' },
    { id: 'upload-edge', name: 'Função Edge para processamento', status: 'completed', category: 'upload' },
    { id: 'upload-embeddings', name: 'Geração de embeddings', status: 'completed', category: 'upload' },
    { id: 'upload-pgvector', name: 'Configuração do pgvector', status: 'in-progress', category: 'upload' },
    
    // Geração de Texto
    { id: 'ai-flowise', name: 'Conexão com API do Flowise', status: 'completed', category: 'ai' },
    { id: 'ai-endpoint', name: 'Endpoint /api/generate', status: 'completed', category: 'ai' },
    { id: 'ai-editor', name: 'Integração com SectionEditor', status: 'in-progress', category: 'ai' },
    { id: 'ai-sources', name: 'Manipulação de fontes e citações', status: 'in-progress', category: 'ai' },
    
    // Exportação de Documentos
    { id: 'export-api', name: 'Rota /api/export', status: 'pending', category: 'export' },
    { id: 'export-edge', name: 'Função Edge para exportação', status: 'pending', category: 'export' },
    { id: 'export-formats', name: 'Escolha de formato e idioma', status: 'pending', category: 'export' },
    { id: 'export-consolidation', name: 'Consolidação de texto e anexos', status: 'pending', category: 'export' },
    
    // UI/UX
    { id: 'ui-responsive', name: 'Responsividade da interface', status: 'in-progress', category: 'ui' },
    { id: 'ui-feedback', name: 'Feedback visual durante operações', status: 'in-progress', category: 'ui' },
    { id: 'ui-progress', name: 'Indicadores de progresso', status: 'pending', category: 'ui' },
    { id: 'ui-optimization', name: 'Otimização de carregamento', status: 'pending', category: 'ui' },
    
    // Deploy
    { id: 'deploy-railway', name: 'Configuração do railway.toml', status: 'pending', category: 'deploy' },
    { id: 'deploy-env', name: 'Variáveis de ambiente', status: 'in-progress', category: 'deploy' },
    { id: 'deploy-ci', name: 'Workflow de CI/CD', status: 'pending', category: 'deploy' },
    { id: 'deploy-docs', name: 'Documentação de deploy', status: 'pending', category: 'deploy' },
  ]);

  const categories = [
    { id: 'infra', name: 'Infraestrutura Base', icon: '🏗️' },
    { id: 'auth', name: 'Autenticação', icon: '🔒' },
    { id: 'upload', name: 'Upload e Indexação', icon: '📤' },
    { id: 'ai', name: 'Geração de Texto', icon: '🤖' },
    { id: 'export', name: 'Exportação', icon: '📁' },
    { id: 'ui', name: 'UI/UX', icon: '🎨' },
    { id: 'deploy', name: 'Deploy', icon: '🚀' },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'in-progress':
        return <Clock className="h-4 w-4 text-amber-500" />;
      case 'pending':
        return <AlertTriangle className="h-4 w-4 text-gray-400" />;
      case 'failed':
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getProgressPercentage = (categoryId: string) => {
    const categoryTasks = tasks.filter(task => task.category === categoryId);
    const completedTasks = categoryTasks.filter(task => task.status === 'completed').length;
    return Math.round((completedTasks / categoryTasks.length) * 100);
  };

  const getTotalProgress = () => {
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    return Math.round((completedTasks / tasks.length) * 100);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold text-pt-blue mb-4">Estado das Tarefas</h1>
      
      <div className="mb-8">
        <div className="flex items-center mb-2">
          <span className="text-lg font-medium mr-2">Progresso Total:</span>
          <span className="text-lg font-bold">{getTotalProgress()}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div 
            className="bg-pt-green h-4 rounded-full" 
            style={{ width: `${getTotalProgress()}%` }}
          ></div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map(category => (
          <Card key={category.id} className="shadow">
            <CardHeader className="pb-2">
              <CardTitle className="flex justify-between items-center">
                <span>
                  {category.icon} {category.name}
                </span>
                <Badge variant={getProgressPercentage(category.id) === 100 ? "default" : "outline"}>
                  {getProgressPercentage(category.id)}%
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {tasks
                  .filter(task => task.category === category.id)
                  .map(task => (
                    <li 
                      key={task.id} 
                      className="flex items-center p-2 border rounded hover:bg-gray-50"
                    >
                      <div className="mr-2">
                        {getStatusIcon(task.status)}
                      </div>
                      <span className={task.status === 'completed' ? 'text-gray-600' : ''}>
                        {task.name}
                      </span>
                    </li>
                  ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TaskStatus;
