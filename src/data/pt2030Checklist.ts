
/**
 * PT2030 Checklist Categories and Descriptions
 *
 * This file contains the definitions for checklist categories
 * and additional context for the progress tracking system.
 */

export interface ChecklistCategory {
  id: 'content' | 'documents' | 'budget' | 'validation' | 'submission';
  label: string;
  description: string;
  icon: string;
}

export const CHECKLIST_CATEGORIES: ChecklistCategory[] = [
  {
    id: 'content',
    label: 'Conteúdo',
    description: 'Preenchimento de todas as secções da candidatura',
    icon: 'FileText'
  },
  {
    id: 'documents',
    label: 'Documentos',
    description: 'Upload de documentos comprovativos e de suporte',
    icon: 'Upload'
  },
  {
    id: 'budget',
    label: 'Orçamento',
    description: 'Validação e detalhe do orçamento do projeto',
    icon: 'Euro'
  },
  {
    id: 'validation',
    label: 'Validação',
    description: 'Verificações finais antes da submissão',
    icon: 'CheckCircle'
  },
  {
    id: 'submission',
    label: 'Submissão',
    description: 'Preparação e submissão da candidatura',
    icon: 'Send'
  }
];

/**
 * Required document categories for PT2030
 */
export const REQUIRED_DOCUMENT_CATEGORIES = [
  {
    category: 'cv',
    label: 'CV da Equipa Técnica',
    description: 'Currículos dos membros da equipa técnica do projeto',
    required: true
  },
  {
    category: 'budget',
    label: 'Orçamentos',
    description: 'Orçamentos detalhados (mínimo 3 por item de investimento)',
    required: true,
    minFiles: 3
  },
  {
    category: 'financial',
    label: 'Documentos Financeiros',
    description: 'Declarações IRS/IRC, demonstrações financeiras',
    required: true
  },
  {
    category: 'company',
    label: 'Documentos da Empresa',
    description: 'Certidão permanente, estatutos, NIB',
    required: true
  },
  {
    category: 'technical',
    label: 'Documentação Técnica',
    description: 'Especificações técnicas, projetos, estudos',
    required: false
  },
  {
    category: 'legal',
    label: 'Documentos Legais',
    description: 'Licenças, autorizações, contratos',
    required: false
  }
];

/**
 * Minimum completeness thresholds
 */
export const PROGRESS_THRESHOLDS = {
  EXPORT_ENABLED: 80,     // Minimum progress to enable export
  READY_TO_SUBMIT: 95,    // Recommended progress before submission
  SECTION_MINIMUM: 50,    // Minimum section completeness
  VALIDATION_SCORE: 70    // Minimum validation score for "complete" status
};

/**
 * Get category progress percentage
 */
export function getCategoryProgress(
  categoryId: string,
  checklistItems: any[]
): number {
  const categoryItems = checklistItems.filter(item => item.category === categoryId);
  if (categoryItems.length === 0) return 0;

  const checkedItems = categoryItems.filter(item => item.checked).length;
  return Math.round((checkedItems / categoryItems.length) * 100);
}
