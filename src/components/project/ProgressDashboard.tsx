
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  RadialBarChart,
  RadialBar,
  Legend,
  PolarAngleAxis
} from 'recharts';
import {
  FileText,
  Upload,
  AlertCircle,
  CheckCircle2,
  Download,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';
import { ProjectProgress, getStatusColor, getStatusLabel } from '@/lib/progressCalculator';
import { PROGRESS_THRESHOLDS } from '@/data/pt2030Checklist';

interface ProgressDashboardProps {
  progress: ProjectProgress;
  onExport?: () => void;
  isExporting?: boolean;
}

const ProgressDashboard: React.FC<ProgressDashboardProps> = ({
  progress,
  onExport,
  isExporting = false
}) => {
  // Prepare data for radial chart
  const radialData = [
    {
      name: 'Progresso',
      value: progress.overall,
      fill: progress.overall >= PROGRESS_THRESHOLDS.READY_TO_SUBMIT
        ? '#22c55e'
        : progress.overall >= PROGRESS_THRESHOLDS.EXPORT_ENABLED
        ? '#eab308'
        : '#ef4444'
    }
  ];

  // Prepare data for bar chart (top 10 sections by completeness)
  const barChartData = progress.sections
    .sort((a, b) => a.completeness - b.completeness)
    .slice(0, 10)
    .map(section => ({
      name: section.sectionKey,
      completeness: section.completeness,
      title: section.sectionTitle.substring(0, 30) + '...'
    }));

  // Get color for bar based on completeness
  const getBarColor = (completeness: number) => {
    if (completeness >= 80) return '#22c55e';
    if (completeness >= 50) return '#eab308';
    return '#ef4444';
  };

  // Calculate section statistics
  const sectionStats = {
    empty: progress.sections.filter(s => s.status === 'empty').length,
    draft: progress.sections.filter(s => s.status === 'draft').length,
    review: progress.sections.filter(s => s.status === 'needs_review').length,
    complete: progress.sections.filter(s => s.status === 'complete').length
  };

  // Can export when progress >= threshold
  const canExport = progress.overall >= PROGRESS_THRESHOLDS.EXPORT_ENABLED;

  // Show empty state for projects just getting started
  if (progress.overall === 0 && progress.documents.uploaded === 0) {
    return (
      <EmptyState
        icon={BarChart3}
        title="Comece a preencher o projeto"
        description="O progresso será calculado automaticamente à medida que completa secções e carrega documentos."
        action={{
          label: 'Ver Checklist',
          onClick: () => {
            // Trigger tab navigation to checklist
            const event = new CustomEvent('navigate-to-tab', { detail: { tab: 'checklist' } });
            window.dispatchEvent(event);
          }
        }}
        secondaryText="Comece por preencher as secções principais ou carregar documentos para ativar a IA"
        minHeight="min-h-[400px]"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Progress Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Progresso Geral
          </CardTitle>
          <CardDescription>
            Visão geral do estado da candidatura
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Radial Progress Chart */}
            <div className="flex flex-col items-center justify-center">
              <ResponsiveContainer width="100%" height={200}>
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="60%"
                  outerRadius="100%"
                  data={radialData}
                  startAngle={90}
                  endAngle={-270}
                >
                  <PolarAngleAxis
                    type="number"
                    domain={[0, 100]}
                    angleAxisId={0}
                    tick={false}
                  />
                  <RadialBar
                    background
                    dataKey="value"
                    cornerRadius={10}
                  />
                  <text
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-3xl font-bold"
                  >
                    {progress.overall}%
                  </text>
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="mt-2 text-center">
                <div className="text-sm text-muted-foreground">
                  {progress.overall >= PROGRESS_THRESHOLDS.READY_TO_SUBMIT
                    ? 'Pronto para submeter'
                    : progress.overall >= PROGRESS_THRESHOLDS.EXPORT_ENABLED
                    ? 'Pode exportar'
                    : 'Em desenvolvimento'}
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Secções completas</span>
                  <span className="font-medium">
                    {sectionStats.complete} / {progress.sections.length}
                  </span>
                </div>
                <Progress
                  value={(sectionStats.complete / progress.sections.length) * 100}
                  className="h-2"
                />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Documentos</span>
                  <span className="font-medium">
                    {progress.documents.uploaded} / {progress.documents.total}
                  </span>
                </div>
                <Progress
                  value={(progress.documents.uploaded / progress.documents.total) * 100}
                  className="h-2"
                />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Checklist</span>
                  <span className="font-medium">
                    {progress.checklist.filter(c => c.checked).length} /{' '}
                    {progress.checklist.length}
                  </span>
                </div>
                <Progress
                  value={
                    (progress.checklist.filter(c => c.checked).length /
                      progress.checklist.length) *
                    100
                  }
                  className="h-2"
                />
              </div>

              {/* Export Button */}
              <Button
                className="w-full mt-4"
                onClick={onExport}
                disabled={!canExport || isExporting}
                data-command="export-pdf"
              >
                <Download className="h-4 w-4 mr-2" />
                {isExporting
                  ? 'Exportando...'
                  : canExport
                  ? 'Exportar Candidatura'
                  : `Exportar (mín. ${PROGRESS_THRESHOLDS.EXPORT_ENABLED}%)`}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Items */}
      {progress.actionItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              Ações Necessárias
            </CardTitle>
            <CardDescription>
              Itens que requerem atenção
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {progress.actionItems.map((action, idx) => (
                <Alert key={idx} className="border-l-4 border-l-orange-500">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{action}</AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Estado das Secções
          </CardTitle>
          <CardDescription>
            Distribuição das secções por estado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-gray-400">{sectionStats.empty}</div>
              <div className="text-sm text-muted-foreground">Vazias</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{sectionStats.draft}</div>
              <div className="text-sm text-muted-foreground">Rascunho</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{sectionStats.review}</div>
              <div className="text-sm text-muted-foreground">A rever</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">{sectionStats.complete}</div>
              <div className="text-sm text-muted-foreground">Completas</div>
            </div>
          </div>

          {/* Bar Chart of Section Completeness */}
          {barChartData.length > 0 && (
            <>
              <h4 className="text-sm font-medium mb-3">
                Secções com menor progresso (top 10)
              </h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barChartData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis dataKey="name" type="category" width={60} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white border rounded-lg p-3 shadow-lg">
                            <p className="font-medium text-sm">{payload[0].payload.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {payload[0].value}% completo
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="completeness" radius={[0, 4, 4, 0]}>
                    {barChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getBarColor(entry.completeness)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </>
          )}
        </CardContent>
      </Card>

      {/* Detailed Section List */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhes das Secções</CardTitle>
          <CardDescription>
            Estado detalhado de cada secção da candidatura
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {progress.sections.map(section => (
              <div
                key={section.sectionKey}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs">
                      {section.sectionKey}
                    </Badge>
                    <Badge
                      className={getStatusColor(section.status)}
                      variant="secondary"
                    >
                      {getStatusLabel(section.status)}
                    </Badge>
                  </div>
                  <div className="text-sm font-medium mt-1 truncate">
                    {section.sectionTitle}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {section.charsUsed.toLocaleString()} / {section.charLimit.toLocaleString()}{' '}
                    caracteres
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-medium">{section.completeness}%</div>
                    <Progress value={section.completeness} className="w-24 h-2" />
                  </div>
                  {section.status === 'complete' && (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProgressDashboard;
