import * as Sentry from '@sentry/react';

/**
 * Track AI text generation performance
 * @param sectionKey - The section being generated (e.g., 'introduction', 'objectives')
 * @param model - The AI model being used (e.g., 'gpt-4', 'claude-3')
 * @param operation - The async operation to track
 * @returns The result of the operation
 */
export async function trackAIGeneration<T>(
  sectionKey: string,
  model: string,
  operation: () => Promise<T>
): Promise<T> {
  return await Sentry.startSpan(
    {
      name: 'ai_generation',
      op: 'ai.generation',
      attributes: {
        sectionKey,
        model,
      },
    },
    async (span) => {
      try {
        const result = await operation();
        span.setStatus({ code: 1, message: 'ok' }); // SpanStatusCode.OK
        return result;
      } catch (error) {
        span.setStatus({ code: 2, message: 'error' }); // SpanStatusCode.ERROR
        Sentry.captureException(error, {
          tags: {
            operation: 'ai_generation',
            sectionKey,
            model,
          },
        });
        throw error;
      }
    }
  );
}

/**
 * Track document upload and indexing performance
 * @param projectId - The project ID
 * @param documentCount - Number of documents being uploaded
 * @param operation - The async operation to track
 * @returns The result of the operation
 */
export async function trackDocumentIndexing<T>(
  projectId: string,
  documentCount: number,
  operation: () => Promise<T>
): Promise<T> {
  return await Sentry.startSpan(
    {
      name: 'document_indexing',
      op: 'document.index',
      attributes: {
        projectId,
        documentCount,
      },
    },
    async (span) => {
      try {
        const result = await operation();
        span.setStatus({ code: 1, message: 'ok' });
        return result;
      } catch (error) {
        span.setStatus({ code: 2, message: 'error' });
        Sentry.captureException(error, {
          tags: {
            operation: 'document_indexing',
            projectId,
          },
        });
        throw error;
      }
    }
  );
}

/**
 * Track PDF export performance
 * @param projectId - The project ID
 * @param pageCount - Number of pages in the PDF
 * @param operation - The async operation to track
 * @returns The result of the operation
 */
export async function trackDocumentExport<T>(
  projectId: string,
  pageCount: number,
  operation: () => Promise<T>
): Promise<T> {
  return await Sentry.startSpan(
    {
      name: 'document_export',
      op: 'document.export',
      attributes: {
        projectId,
        pageCount,
      },
    },
    async (span) => {
      try {
        const result = await operation();
        span.setStatus({ code: 1, message: 'ok' });
        return result;
      } catch (error) {
        span.setStatus({ code: 2, message: 'error' });
        Sentry.captureException(error, {
          tags: {
            operation: 'document_export',
            projectId,
          },
        });
        throw error;
      }
    }
  );
}

/**
 * Track file upload performance
 * @param fileSize - Size of the file in bytes
 * @param fileType - Type of the file (e.g., 'pdf', 'docx')
 * @param operation - The async operation to track
 * @returns The result of the operation
 */
export async function trackFileUpload<T>(
  fileSize: number,
  fileType: string,
  operation: () => Promise<T>
): Promise<T> {
  return await Sentry.startSpan(
    {
      name: 'file_upload',
      op: 'file.upload',
      attributes: {
        fileSize,
        fileType,
      },
    },
    async (span) => {
      try {
        const result = await operation();
        span.setStatus({ code: 1, message: 'ok' });
        return result;
      } catch (error) {
        span.setStatus({ code: 2, message: 'error' });
        Sentry.captureException(error, {
          tags: {
            operation: 'file_upload',
            fileType,
          },
        });
        throw error;
      }
    }
  );
}

/**
 * Track a custom event in Sentry
 * @param message - The event message
 * @param level - The severity level
 * @param context - Additional context data
 */
export function trackEvent(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context?: Record<string, any>
) {
  Sentry.captureMessage(message, {
    level,
    extra: context,
  });
}

/**
 * Track important user actions
 */
export const Events = {
  PROJECT_CREATED: 'project_created',
  PROJECT_COMPLETED: 'project_completed',
  CANDIDATURA_SUBMITTED: 'candidatura_submitted',
  AI_GENERATION_STARTED: 'ai_generation_started',
  AI_GENERATION_COMPLETED: 'ai_generation_completed',
  DOCUMENT_UPLOADED: 'document_uploaded',
  DOCUMENT_INDEXED: 'document_indexed',
  PDF_EXPORTED: 'pdf_exported',
} as const;
