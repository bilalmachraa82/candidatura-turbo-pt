import React from 'react';
import { cn } from '@/lib/utils';

interface QualityScoreBadgeProps {
  score: number;
  showLabel?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

function getScoreColor(score: number): string {
  if (score >= 85) return 'bg-green-500';
  if (score >= 70) return 'bg-yellow-500';
  if (score >= 50) return 'bg-orange-500';
  return 'bg-red-500';
}

function getScoreTextColor(score: number): string {
  if (score >= 85) return 'text-green-700';
  if (score >= 70) return 'text-yellow-700';
  if (score >= 50) return 'text-orange-700';
  return 'text-red-700';
}

function getScoreLabel(score: number): string {
  if (score >= 85) return 'Excelente';
  if (score >= 70) return 'Bom';
  if (score >= 50) return 'Precisa Melhorar';
  return 'Insuficiente';
}

export function QualityScoreBadge({
  score,
  showLabel = true,
  className,
  size = 'md',
}: QualityScoreBadgeProps) {
  const barWidth = size === 'sm' ? 'w-16' : size === 'lg' ? 'w-32' : 'w-24';
  const barHeight = size === 'sm' ? 'h-1.5' : size === 'lg' ? 'h-3' : 'h-2';
  const textSize = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm';

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn(barHeight, barWidth, 'bg-gray-200 rounded-full overflow-hidden')}>
        <div
          className={cn(getScoreColor(score), 'h-full transition-all duration-500 ease-out')}
          style={{ width: `${score}%` }}
        />
      </div>
      {showLabel && (
        <span className={cn(textSize, 'font-medium', getScoreTextColor(score))}>
          {score}% - {getScoreLabel(score)}
        </span>
      )}
    </div>
  );
}
