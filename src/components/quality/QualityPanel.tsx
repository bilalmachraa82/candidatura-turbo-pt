import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  AlertTriangle,
  Lightbulb,
  CheckCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Loader2
} from 'lucide-react';
import { QualityScoreBadge } from './QualityScoreBadge';
import { QualityScore } from '@/hooks/useQualityScore';
import { analytics } from '@/lib/analytics';
import { cn } from '@/lib/utils';

interface QualityPanelProps {
  score: QualityScore | null;
  isScoring: boolean;
  error: string | null;
  onReScore: () => void;
  sectionId: string;
  className?: string;
}

const categoryLabels: Record<string, string> = {
  completeness: 'Completude',
  specificity: 'Especificidade',
  keywords: 'Palavras-chave',
  structure: 'Estrutura',
  compliance: 'Conformidade',
};

const severityIcons = {
  critical: <AlertCircle className="h-4 w-4 text-red-500" />,
  warning: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
  suggestion: <Lightbulb className="h-4 w-4 text-blue-500" />,
};

const severityLabels = {
  critical: 'Crítico',
  warning: 'Aviso',
  suggestion: 'Sugestão',
};

const severityColors = {
  critical: 'bg-red-50 border-red-200',
  warning: 'bg-yellow-50 border-yellow-200',
  suggestion: 'bg-blue-50 border-blue-200',
};

export function QualityPanel({
  score,
  isScoring,
  error,
  onReScore,
  sectionId,
  className,
}: QualityPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleIssueClick = (severity: string, category: string) => {
    analytics.qualityIssueClicked(severity, category, sectionId);
  };

  const handleReScore = () => {
    analytics.qualityReScored(sectionId);
    onReScore();
  };

  if (error) {
    return (
      <Card className={cn('border-red-200', className)}>
        <CardHeader>
          <CardTitle className="text-sm text-red-600 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Erro na Avaliação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600 mb-3">{error}</p>
          <Button variant="outline" size="sm" onClick={handleReScore}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isScoring) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-pt-blue mb-3" />
            <p className="text-sm text-muted-foreground">
              A avaliar qualidade do conteúdo...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!score) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Lightbulb className="h-8 w-8 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-2">
              Escreva pelo menos 100 caracteres para obter uma avaliação de qualidade.
            </p>
            <p className="text-xs text-muted-foreground">
              A avaliação é automática após 3 segundos de pausa.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group issues by severity
  const criticalIssues = score.issues.filter(i => i.severity === 'critical');
  const warningIssues = score.issues.filter(i => i.severity === 'warning');
  const suggestionIssues = score.issues.filter(i => i.severity === 'suggestion');

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            Avaliação de Qualidade
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-6 p-0"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReScore}
            className="h-8"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Re-avaliar
          </Button>
        </div>
        <div className="mt-3">
          <QualityScoreBadge score={score.overall} size="lg" />
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6">
          {/* Breakdown Scores */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Detalhes da Avaliação</h4>
            {Object.entries(score.breakdown).map(([key, value]) => (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    {categoryLabels[key] || key}
                  </span>
                  <span className="font-medium">{value}%</span>
                </div>
                <Progress value={value} className="h-1.5" />
              </div>
            ))}
          </div>

          {/* Issues */}
          {score.issues.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700">
                Problemas Identificados ({score.issues.length})
              </h4>

              <div className="space-y-2">
                {/* Critical Issues */}
                {criticalIssues.map((issue, index) => (
                  <div
                    key={`critical-${index}`}
                    className={cn(
                      'p-3 rounded-lg border cursor-pointer hover:shadow-sm transition-shadow',
                      severityColors[issue.severity]
                    )}
                    onClick={() => handleIssueClick(issue.severity, issue.category)}
                  >
                    <div className="flex items-start gap-2">
                      {severityIcons[issue.severity]}
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {severityLabels[issue.severity]}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {categoryLabels[issue.category] || issue.category}
                          </span>
                        </div>
                        <p className="text-sm font-medium">{issue.message}</p>
                        <p className="text-xs text-gray-600">→ {issue.suggestion}</p>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Warning Issues */}
                {warningIssues.map((issue, index) => (
                  <div
                    key={`warning-${index}`}
                    className={cn(
                      'p-3 rounded-lg border cursor-pointer hover:shadow-sm transition-shadow',
                      severityColors[issue.severity]
                    )}
                    onClick={() => handleIssueClick(issue.severity, issue.category)}
                  >
                    <div className="flex items-start gap-2">
                      {severityIcons[issue.severity]}
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {severityLabels[issue.severity]}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {categoryLabels[issue.category] || issue.category}
                          </span>
                        </div>
                        <p className="text-sm font-medium">{issue.message}</p>
                        <p className="text-xs text-gray-600">→ {issue.suggestion}</p>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Suggestion Issues */}
                {suggestionIssues.map((issue, index) => (
                  <div
                    key={`suggestion-${index}`}
                    className={cn(
                      'p-3 rounded-lg border cursor-pointer hover:shadow-sm transition-shadow',
                      severityColors[issue.severity]
                    )}
                    onClick={() => handleIssueClick(issue.severity, issue.category)}
                  >
                    <div className="flex items-start gap-2">
                      {severityIcons[issue.severity]}
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {severityLabels[issue.severity]}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {categoryLabels[issue.category] || issue.category}
                          </span>
                        </div>
                        <p className="text-sm font-medium">{issue.message}</p>
                        <p className="text-xs text-gray-600">→ {issue.suggestion}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strengths */}
          {score.strengths.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">
                Pontos Fortes ({score.strengths.length})
              </h4>
              <div className="space-y-1.5">
                {score.strengths.map((strength, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{strength}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {score.suggestions.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">
                Sugestões de Melhoria ({score.suggestions.length})
              </h4>
              <div className="space-y-1.5">
                {score.suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 text-sm p-2 rounded bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer"
                    onClick={() => analytics.qualitySuggestionApplied(sectionId, 'general')}
                  >
                    <Lightbulb className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{suggestion}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
