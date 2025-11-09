import { supabase } from './supabase';
import { analytics } from './analytics';

interface BatchScoreProgress {
  total: number;
  completed: number;
  current: string | null;
  errors: Array<{ sectionId: string; error: string }>;
}

export type BatchScoreCallback = (progress: BatchScoreProgress) => void;

/**
 * Score all sections in a project
 *
 * @param projectId - The project ID
 * @param onProgress - Optional callback to track progress
 * @returns Promise with results
 */
export async function batchScoreProject(
  projectId: string,
  onProgress?: BatchScoreCallback
): Promise<{
  success: boolean;
  total: number;
  successful: number;
  failed: number;
  errors: Array<{ sectionId: string; error: string }>;
}> {
  try {
    // Fetch all sections with content for this project
    const { data: sections, error: fetchError } = await supabase
      .from('sections')
      .select('id, key, title, content')
      .eq('project_id', projectId)
      .gt('content', '')
      .gte('content.length', 100); // Only score sections with at least 100 chars

    if (fetchError) {
      throw fetchError;
    }

    if (!sections || sections.length === 0) {
      return {
        success: true,
        total: 0,
        successful: 0,
        failed: 0,
        errors: [],
      };
    }

    const total = sections.length;
    let successful = 0;
    let failed = 0;
    const errors: Array<{ sectionId: string; error: string }> = [];

    // Score each section sequentially to avoid rate limits
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];

      // Update progress
      if (onProgress) {
        onProgress({
          total,
          completed: i,
          current: section.title,
          errors,
        });
      }

      try {
        const { data, error: invokeError } = await supabase.functions.invoke('score-section', {
          body: { sectionId: section.id, content: section.content }
        });

        if (invokeError) {
          throw invokeError;
        }

        if (!data.success) {
          throw new Error(data.error || 'Erro ao calcular pontuação');
        }

        successful++;
      } catch (error: any) {
        console.error(`Error scoring section ${section.id}:`, error);
        failed++;
        errors.push({
          sectionId: section.id,
          error: error.message || 'Erro desconhecido',
        });
      }

      // Small delay to avoid rate limits
      if (i < sections.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Final progress update
    if (onProgress) {
      onProgress({
        total,
        completed: total,
        current: null,
        errors,
      });
    }

    // Track analytics
    analytics.featureUsed('batch_quality_scoring', {
      projectId,
      total,
      successful,
      failed,
    });

    return {
      success: true,
      total,
      successful,
      failed,
      errors,
    };
  } catch (error: any) {
    console.error('Error in batch scoring:', error);
    throw error;
  }
}

/**
 * Get quality score summary for a project
 *
 * @param projectId - The project ID
 * @returns Promise with score summary
 */
export async function getProjectQualitySummary(projectId: string): Promise<{
  totalSections: number;
  scoredSections: number;
  averageScore: number;
  scoreDistribution: {
    excellent: number; // >= 85
    good: number;      // 70-84
    needsWork: number; // 50-69
    poor: number;      // < 50
  };
}> {
  try {
    const { data: sections, error } = await supabase
      .from('sections')
      .select('quality_score')
      .eq('project_id', projectId);

    if (error) {
      throw error;
    }

    const totalSections = sections?.length || 0;
    const scoredSections = sections?.filter(s => s.quality_score !== null).length || 0;
    const scores = sections?.filter(s => s.quality_score !== null).map(s => s.quality_score) || [];

    const averageScore = scores.length > 0
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length
      : 0;

    const scoreDistribution = {
      excellent: scores.filter(s => s >= 85).length,
      good: scores.filter(s => s >= 70 && s < 85).length,
      needsWork: scores.filter(s => s >= 50 && s < 70).length,
      poor: scores.filter(s => s < 50).length,
    };

    return {
      totalSections,
      scoredSections,
      averageScore: Math.round(averageScore),
      scoreDistribution,
    };
  } catch (error: any) {
    console.error('Error getting project quality summary:', error);
    throw error;
  }
}
