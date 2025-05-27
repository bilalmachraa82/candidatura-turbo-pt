
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import TestProjectCreator from '@/components/TestProjectCreator';
import TestFlowValidator from '@/components/TestFlowValidator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, TestTube } from 'lucide-react';

const TestPage: React.FC = () => {
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleProjectCreated = (projectId: string) => {
    setCreatedProjectId(projectId);
  };

  const handleViewProject = () => {
    if (createdProjectId) {
      navigate(`/projects/${createdProjectId}`);
    }
  };

  return (
    <Layout>
      <div className="pt-container pt-section">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-pt-blue flex items-center">
            <TestTube className="mr-3 h-8 w-8" />
            Centro de Testes PT2030
          </h1>
          <p className="text-gray-600 mt-2">
            Ferramentas para criar projectos de teste e validar o fluxo completo de geração
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <TestProjectCreator onProjectCreated={handleProjectCreated} />
            
            {createdProjectId && (
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="text-green-800">Projecto Criado</CardTitle>
                  <CardDescription className="text-green-600">
                    O projecto de teste foi criado com sucesso
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={handleViewProject}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Ver Projecto Criado
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          <div>
            {createdProjectId ? (
              <TestFlowValidator projectId={createdProjectId} />
            ) : (
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-gray-500">Validador de Fluxo</CardTitle>
                  <CardDescription>
                    Crie primeiro um projecto de teste para activar o validador
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-400">
                    <TestTube className="mx-auto h-12 w-12 mb-4" />
                    <p>Aguardando criação de projecto...</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Passos de Validação</CardTitle>
              <CardDescription>
                O validador irá executar os seguintes testes automáticos:
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium text-pt-blue">1. Carregar Secções</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Verifica se todas as 15 secções PT2030 foram criadas correctamente
                  </p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium text-pt-blue">2. Geração IA</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Testa a geração automática de conteúdo para uma secção específica
                  </p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium text-pt-blue">3. Persistência</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Confirma que o conteúdo é guardado correctamente na base de dados
                  </p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium text-pt-blue">4. Contador Caracteres</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Valida a contagem de caracteres e respeitou o limite
                  </p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium text-pt-blue">5. Fontes RAG</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Verifica se as fontes são devolvidas pelo sistema RAG
                  </p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium text-pt-blue">6. Exportação</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Testa a geração de documentos DOCX/PDF com todas as secções
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default TestPage;
