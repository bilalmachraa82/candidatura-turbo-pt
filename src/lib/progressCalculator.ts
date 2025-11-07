
import { ProjectSection } from '@/types/components';
import { Database } from '@/integrations/supabase/types';

type Project = Database['public']['Tables']['projects']['Row'];
type IndexedFile = Database['public']['Tables']['indexed_files']['Row'];

export type SectionStatus = 'empty' | 'draft' | 'needs_review' | 'complete';

export interface SectionProgress {
  sectionKey: string;
  sectionTitle: string;
  status: SectionStatus;
  completeness: number;  // 0-100%
  charsUsed: number;
  charLimit: number;
  validationScore?: number;
  lastEdited?: Date;
}

export interface ChecklistItem {
  id: string;
  category: 'content' | 'documents' | 'budget' | 'validation' | 'submission';
  task: string;
  checked: boolean;
  autoCheck: boolean;  // true if automatically checked, false if manual
  link?: string;  // Optional link to action
}

export interface ProjectProgress {
  overall: number;  // 0-100%
  sections: SectionProgress[];
  documents: {
    total: number;
    uploaded: number;
  };
  checklist: ChecklistItem[];
  actionItems: string[];  // Things that need attention
}

/**
 * Determines the status of a section based on content and validation
 */
export function calculateSectionStatus(
  charsUsed: number,
  charLimit: number,
  validationScore?: number
): SectionStatus {
  if (charsUsed === 0) {
    return 'empty';
  }

  const percentageFilled = (charsUsed / charLimit) * 100;

  if (percentageFilled < 50) {
    return 'draft';
  }

  if (!validationScore || validationScore < 70) {
    return 'needs_review';
  }

  return 'complete';
}

/**
 * Calculate completeness percentage for a section
 */
export function calculateSectionCompleteness(
  charsUsed: number,
  charLimit: number,
  validationScore?: number
): number {
  const fillPercentage = Math.min((charsUsed / charLimit) * 100, 100);

  // If no validation score, completeness is based on fill percentage only
  if (!validationScore) {
    return Math.round(fillPercentage * 0.7); // Max 70% without validation
  }

  // Weighted average: 70% fill, 30% validation score
  return Math.round(fillPercentage * 0.7 + validationScore * 0.3);
}

/**
 * Check if a file category exists in the uploaded files
 */
export function hasFileCategory(files: IndexedFile[], category: string): boolean {
  return files.some(file => file.category === category);
}

/**
 * Count files by category
 */
export function countFilesByCategory(files: IndexedFile[], category: string): number {
  return files.filter(file => file.category === category).length;
}

/**
 * Calculate overall project progress
 */
export function calculateOverallProgress(sections: SectionProgress[]): number {
  if (sections.length === 0) return 0;

  const totalCompleteness = sections.reduce((sum, section) => sum + section.completeness, 0);
  return Math.round(totalCompleteness / sections.length);
}

/**
 * Generate action items based on current project state
 */
export function generateActionItems(
  sections: SectionProgress[],
  files: IndexedFile[]
): string[] {
  const actions: string[] = [];

  // Check for empty sections
  const emptySections = sections.filter(s => s.status === 'empty');
  if (emptySections.length > 0) {
    actions.push(`Preencher ${emptySections.length} secções vazias`);
  }

  // Check for draft sections
  const draftSections = sections.filter(s => s.status === 'draft');
  if (draftSections.length > 0) {
    actions.push(`Completar ${draftSections.length} secções em rascunho (< 50% do limite)`);
  }

  // Check for sections needing review
  const reviewSections = sections.filter(s => s.status === 'needs_review');
  if (reviewSections.length > 0) {
    actions.push(`Rever ${reviewSections.length} secções que precisam de validação`);
  }

  // Check for essential documents
  const hasCV = hasFileCategory(files, 'cv');
  if (!hasCV) {
    actions.push('Fazer upload do CV da equipa técnica');
  }

  const hasBudget = hasFileCategory(files, 'budget');
  if (!hasBudget) {
    actions.push('Fazer upload de orçamentos detalhados');
  }

  return actions;
}

/**
 * Main function to calculate project progress
 */
export function calculateProgress(
  project: Project | null,
  sections: ProjectSection[],
  files: IndexedFile[],
  checklistOverrides: Record<string, boolean> = {}
): ProjectProgress {
  if (!project) {
    return {
      overall: 0,
      sections: [],
      documents: { total: 0, uploaded: 0 },
      checklist: [],
      actionItems: ['Criar um projeto primeiro']
    };
  }

  // Calculate section progress
  const sectionProgress: SectionProgress[] = sections.map(section => {
    const charsUsed = section.content?.length || 0;
    const charLimit = section.charLimit || 2000;

    // TODO: In future, validation scores could be stored in database
    const validationScore = undefined;

    const status = calculateSectionStatus(charsUsed, charLimit, validationScore);
    const completeness = calculateSectionCompleteness(charsUsed, charLimit, validationScore);

    return {
      sectionKey: section.key,
      sectionTitle: section.title,
      status,
      completeness,
      charsUsed,
      charLimit,
      validationScore,
      lastEdited: undefined  // TODO: Could be pulled from database updated_at
    };
  });

  // Calculate overall progress
  const overall = calculateOverallProgress(sectionProgress);

  // Document stats
  const documents = {
    total: 10,  // Expected number of document categories
    uploaded: files.length
  };

  // Generate checklist
  const checklist: ChecklistItem[] = [
    // Content category
    {
      id: 'content-basic',
      category: 'content',
      task: 'Preencher todas as secções obrigatórias',
      checked: sections.filter(s => (s.content?.length || 0) > 0).length >= sections.length * 0.8,
      autoCheck: true
    },
    {
      id: 'content-complete',
      category: 'content',
      task: 'Completar todas as secções a pelo menos 50%',
      checked: sectionProgress.filter(s => s.completeness >= 50).length >= sections.length,
      autoCheck: true
    },
    // Documents category
    {
      id: 'docs-cv',
      category: 'documents',
      task: 'Upload CV da equipa técnica',
      checked: hasFileCategory(files, 'cv'),
      autoCheck: true,
      link: 'documents'
    },
    {
      id: 'docs-budget',
      category: 'documents',
      task: 'Upload de orçamentos detalhados (mínimo 3 por item)',
      checked: countFilesByCategory(files, 'budget') >= 3,
      autoCheck: true,
      link: 'documents'
    },
    {
      id: 'docs-financial',
      category: 'documents',
      task: 'Documentos financeiros (declarações IRS/IRC)',
      checked: hasFileCategory(files, 'financial'),
      autoCheck: true,
      link: 'documents'
    },
    {
      id: 'docs-company',
      category: 'documents',
      task: 'Certidões e documentos da empresa',
      checked: hasFileCategory(files, 'company'),
      autoCheck: true,
      link: 'documents'
    },
    // Budget category
    {
      id: 'budget-detailed',
      category: 'budget',
      task: 'Orçamento detalhado com 3 orçamentos por item',
      checked: checklistOverrides['budget-detailed'] || false,
      autoCheck: false
    },
    {
      id: 'budget-justified',
      category: 'budget',
      task: 'Todos os custos devidamente justificados',
      checked: checklistOverrides['budget-justified'] || false,
      autoCheck: false
    },
    // Validation category
    {
      id: 'validation-eligibility',
      category: 'validation',
      task: 'Verificar elegibilidade do projeto',
      checked: checklistOverrides['validation-eligibility'] || false,
      autoCheck: false
    },
    {
      id: 'validation-dates',
      category: 'validation',
      task: 'Confirmar prazos de execução',
      checked: checklistOverrides['validation-dates'] || false,
      autoCheck: false
    },
    {
      id: 'validation-review',
      category: 'validation',
      task: 'Revisão final de todos os conteúdos',
      checked: checklistOverrides['validation-review'] || false,
      autoCheck: false
    },
    // Submission category
    {
      id: 'submission-export',
      category: 'submission',
      task: 'Exportar candidatura em formato final',
      checked: overall >= 80,  // Only enabled when 80%+ complete
      autoCheck: true,
      link: 'export'
    },
    {
      id: 'submission-signatures',
      category: 'submission',
      task: 'Recolher assinaturas necessárias',
      checked: checklistOverrides['submission-signatures'] || false,
      autoCheck: false
    },
    {
      id: 'submission-submit',
      category: 'submission',
      task: 'Submeter candidatura na plataforma PT2030',
      checked: checklistOverrides['submission-submit'] || false,
      autoCheck: false
    }
  ];

  // Generate action items
  const actionItems = generateActionItems(sectionProgress, files);

  return {
    overall,
    sections: sectionProgress,
    documents,
    checklist,
    actionItems
  };
}

/**
 * Get status color for UI display
 */
export function getStatusColor(status: SectionStatus): string {
  switch (status) {
    case 'empty': return 'text-gray-400';
    case 'draft': return 'text-yellow-600';
    case 'needs_review': return 'text-orange-600';
    case 'complete': return 'text-green-600';
  }
}

/**
 * Get status label in Portuguese
 */
export function getStatusLabel(status: SectionStatus): string {
  switch (status) {
    case 'empty': return 'Vazio';
    case 'draft': return 'Rascunho';
    case 'needs_review': return 'Rever';
    case 'complete': return 'Completo';
  }
}
