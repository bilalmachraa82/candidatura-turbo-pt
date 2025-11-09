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

  // Quality Scoring
  qualityScoreCalculated: (sectionId: string, score: number, duration: number) => {
    if (posthog.__loaded) {
      posthog.capture('quality_score_calculated', { sectionId, score, duration });
    }
  },

  qualityIssueClicked: (severity: string, category: string, sectionId: string) => {
    if (posthog.__loaded) {
      posthog.capture('quality_issue_clicked', { severity, category, sectionId });
    }
  },

  qualitySuggestionApplied: (sectionId: string, suggestionType: string) => {
    if (posthog.__loaded) {
      posthog.capture('quality_suggestion_applied', { sectionId, suggestionType });
    }
  },

  qualityReScored: (sectionId: string) => {
    if (posthog.__loaded) {
      posthog.capture('quality_rescored', { sectionId });
    }
  },

  // Chat Copilot
  chatCopilotOpened: (projectId?: string, currentSection?: string) => {
    if (posthog.__loaded) {
      posthog.capture('chat_copilot_opened', { projectId, currentSection });
    }
  },

  chatConversationCreated: (projectId: string, hasSection: boolean) => {
    if (posthog.__loaded) {
      posthog.capture('chat_conversation_created', { projectId, hasSection });
    }
  },

  chatMessageSent: (metadata: {
    projectId: string;
    conversationId: string;
    hasSection: boolean;
    messageLength: number;
    stream: boolean;
  }) => {
    if (posthog.__loaded) {
      posthog.capture('chat_message_sent', metadata);
    }
  },

  chatSuggestionUsed: (prompt: string, projectId?: string, currentSection?: string) => {
    if (posthog.__loaded) {
      posthog.capture('chat_suggestion_used', { prompt, projectId, currentSection });
    }
  },

  // Version History
  versionHistoryOpened: (sectionId: string) => {
    if (posthog.__loaded) {
      posthog.capture('version_history_opened', { sectionId });
    }
  },

  versionViewed: (sectionId: string, versionId: string, timeAgo: string, isAiGenerated: boolean) => {
    if (posthog.__loaded) {
      posthog.capture('version_viewed', { sectionId, versionId, timeAgo, isAiGenerated });
    }
  },

  versionCompared: (sectionId: string, versionId: string) => {
    if (posthog.__loaded) {
      posthog.capture('version_compared', { sectionId, versionId });
    }
  },

  versionRestored: (sectionId: string, versionId: string, versionAge: string) => {
    if (posthog.__loaded) {
      posthog.capture('version_restored', { sectionId, versionId, versionAge });
    }
  },

  // RBAC and Team Collaboration
  projectShared: (role: string) => {
    if (posthog.__loaded) {
      posthog.capture('project_shared', { role });
    }
  },

  invitationSent: (role: string) => {
    if (posthog.__loaded) {
      posthog.capture('invitation_sent', { role });
    }
  },

  invitationAccepted: (role: string, projectId: string) => {
    if (posthog.__loaded) {
      posthog.capture('invitation_accepted', { role, projectId });
    }
  },

  invitationDeclined: (role: string) => {
    if (posthog.__loaded) {
      posthog.capture('invitation_declined', { role });
    }
  },

  memberRoleChanged: (oldRole: string, newRole: string) => {
    if (posthog.__loaded) {
      posthog.capture('member_role_changed', { oldRole, newRole });
    }
  },

  memberRemoved: (role: string) => {
    if (posthog.__loaded) {
      posthog.capture('member_removed', { role });
    }
  },

  memberLeft: (role: string) => {
    if (posthog.__loaded) {
      posthog.capture('member_left', { role });
    }
  },
};
