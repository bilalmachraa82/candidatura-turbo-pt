import { posthog } from '@/config/posthog';

export const analytics = {
  // Projects
  projectCreated: (template?: string) => {
    if (posthog.__loaded) {
      posthog.capture('project_created', { template });
    }
  },

  projectUpdated: (projectId: string) => {
    if (posthog.__loaded) {
      posthog.capture('project_updated', { projectId });
    }
  },

  projectDeleted: (projectId: string) => {
    if (posthog.__loaded) {
      posthog.capture('project_deleted', { projectId });
    }
  },

  // AI Generation
  aiGenerationStarted: (section: string, model: string) => {
    if (posthog.__loaded) {
      posthog.capture('ai_generation_started', { section, model });
    }
  },

  aiGenerationCompleted: (section: string, model: string, duration: number, charsGenerated: number) => {
    if (posthog.__loaded) {
      posthog.capture('ai_generation_completed', {
        section,
        model,
        duration,
        charsGenerated
      });
    }
  },

  aiGenerationFailed: (section: string, model: string, error: string) => {
    if (posthog.__loaded) {
      posthog.capture('ai_generation_failed', { section, model, error });
    }
  },

  // Documents
  documentUploaded: (fileType: string, fileSize: number) => {
    if (posthog.__loaded) {
      posthog.capture('document_uploaded', { fileType, fileSize });
    }
  },

  documentDeleted: (documentId: string) => {
    if (posthog.__loaded) {
      posthog.capture('document_deleted', { documentId });
    }
  },

  // Export
  pdfExported: (projectId: string, sections: number) => {
    if (posthog.__loaded) {
      posthog.capture('pdf_exported', { projectId, sections });
    }
  },

  // Validation
  validationRun: (section: string, score: number) => {
    if (posthog.__loaded) {
      posthog.capture('validation_run', { section, score });
    }
  },

  // Templates
  templateUsed: (templateId: string) => {
    if (posthog.__loaded) {
      posthog.capture('template_used', { templateId });
    }
  },

  // User actions
  userSignedUp: () => {
    if (posthog.__loaded) {
      posthog.capture('user_signed_up');
    }
  },

  userLoggedIn: () => {
    if (posthog.__loaded) {
      posthog.capture('user_logged_in');
    }
  },

  // Feature usage
  featureUsed: (featureName: string, metadata?: Record<string, any>) => {
    if (posthog.__loaded) {
      posthog.capture('feature_used', { featureName, ...metadata });
    }
  },

  // Errors
  errorOccurred: (errorType: string, errorMessage: string, context?: Record<string, any>) => {
    if (posthog.__loaded) {
      posthog.capture('error_occurred', { errorType, errorMessage, ...context });
    }
  },
};
