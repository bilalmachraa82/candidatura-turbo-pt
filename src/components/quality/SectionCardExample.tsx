/**
 * Example: Section Card with Quality Score Badge
 *
 * This is a reference implementation showing how to display
 * quality scores in section lists or project dashboards.
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { QualityScoreBadge } from './QualityScoreBadge';
import { ProjectSection } from '@/types/components';
import { FileText, CheckCircle, AlertCircle } from 'lucide-react';

interface SectionCardExampleProps {
  section: ProjectSection;
  onClick?: () => void;
}

export function SectionCardExample({ section, onClick }: SectionCardExampleProps) {
  const charCount = section.content.length;
  const charLimit = section.charLimit;
  const hasContent = charCount > 0;
  const isComplete = charCount >= charLimit * 0.7; // At least 70% filled

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-base flex items-center gap-2">
              {hasContent ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <FileText className="h-4 w-4 text-muted-foreground" />
              )}
              {section.title}
            </CardTitle>
          </div>

          <div className="flex flex-col items-end gap-2">
            {/* Quality Score Badge */}
            {section.qualityScore !== undefined && section.qualityScore !== null && (
              <QualityScoreBadge
                score={section.qualityScore}
                size="sm"
                showLabel={false}
              />
            )}

            {/* Character Count */}
            <Badge variant={charCount > charLimit ? 'destructive' : 'secondary'} className="text-xs">
              {charCount} / {charLimit}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {hasContent ? (
              isComplete ? 'Completo' : 'Em progresso'
            ) : (
              'Não iniciado'
            )}
          </span>

          {section.qualityScore !== undefined && section.qualityScore !== null && (
            <span className="text-xs text-muted-foreground">
              Qualidade: {section.qualityScore}%
            </span>
          )}
        </div>

        {/* Show critical issues count if available */}
        {section.qualityData?.issues && (
          <div className="mt-2 flex items-center gap-2 text-xs">
            {section.qualityData.issues.filter(i => i.severity === 'critical').length > 0 && (
              <Badge variant="destructive" className="text-xs">
                <AlertCircle className="h-3 w-3 mr-1" />
                {section.qualityData.issues.filter(i => i.severity === 'critical').length} críticos
              </Badge>
            )}
            {section.qualityData.issues.filter(i => i.severity === 'warning').length > 0 && (
              <Badge variant="outline" className="text-xs">
                {section.qualityData.issues.filter(i => i.severity === 'warning').length} avisos
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
