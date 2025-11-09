import { useState, useEffect, useCallback } from 'react';
import { useDebounce } from './useDebounce';
import { supabase } from '@/lib/supabase';
import { analytics } from '@/lib/analytics';

export interface QualityScore {
  overall: number; // 0-100
  breakdown: {
    completeness: number;    // 0-100
    specificity: number;     // 0-100
    keywords: number;        // 0-100
    structure: number;       // 0-100
    compliance: number;      // 0-100
  };
  issues: Array<{
    severity: 'critical' | 'warning' | 'suggestion';
    category: string;
    message: string;
    suggestion: string;
  }>;
  strengths: string[];
  suggestions: string[];
}

interface UseQualityScoreProps {
  sectionId: string;
  content: string;
  enabled?: boolean;
  debounceDelay?: number;
}

export function useQualityScore({
  sectionId,
  content,
  enabled = true,
  debounceDelay = 3000,
}: UseQualityScoreProps) {
  const [score, setScore] = useState<QualityScore | null>(null);
  const [isScoring, setIsScoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debouncedContent = useDebounce(content, debounceDelay);

  const scoreContent = useCallback(async (contentToScore: string) => {
    if (!contentToScore || contentToScore.length < 100) {
      setScore(null);
      return;
    }

    if (!enabled) {
      return;
    }

    setIsScoring(true);
    setError(null);

    try {
      const startTime = Date.now();

      const { data, error: invokeError } = await supabase.functions.invoke('score-section', {
        body: { sectionId, content: contentToScore }
      });

      if (invokeError) {
        throw invokeError;
      }

      if (!data.success) {
        throw new Error(data.error || 'Erro ao calcular pontuação');
      }

      const duration = Date.now() - startTime;

      setScore(data.score);

      // Track analytics
      analytics.qualityScoreCalculated(sectionId, data.score.overall, duration);

    } catch (err: any) {
      console.error('Error scoring content:', err);
      setError(err.message || 'Erro ao avaliar conteúdo');
      setScore(null);
    } finally {
      setIsScoring(false);
    }
  }, [sectionId, enabled]);

  // Auto-score when debounced content changes
  useEffect(() => {
    if (enabled) {
      scoreContent(debouncedContent);
    }
  }, [debouncedContent, enabled, scoreContent]);

  // Manual re-score function
  const reScore = useCallback(() => {
    scoreContent(content);
  }, [content, scoreContent]);

  return {
    score,
    isScoring,
    error,
    reScore,
  };
}
