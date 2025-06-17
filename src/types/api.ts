
import { Source } from './ai';

// Unified GenerationSource interface supporting both legacy and new formats
export interface GenerationSource {
  // Legacy format support (optional for backward compatibility)
  id?: string;
  name?: string;
  reference?: string;
  
  // New format (required)
  type: 'document' | 'search' | 'context' | 'pdf' | 'excel';
  title: string;
  excerpt: string;
  confidence: number;
  metadata?: Record<string, any>;
}

// Complete GenerationResult interface with all used properties
export interface GenerationResult {
  success: boolean;
  text?: string;
  charsUsed?: number;
  sources?: GenerationSource[];
  message?: string;
  error?: string; // Added missing property
  provider?: string;
  model?: string;
}

// Complete IndexingResult interface with category support
export interface IndexingResult {
  success: boolean;
  documentId?: string;
  message?: string;
  file?: {
    id: string;
    name: string;
    type: string;
    url: string;
    chunks?: number;
    category?: string; // Added category property
  };
}

// Complete ExportResult interface with all used properties
export interface ExportResult {
  success: boolean;
  url?: string;
  message?: string;
  fileName?: string; // Added missing property
  format?: 'pdf' | 'docx';
  sections?: number;
  attachments?: number;
  metadata?: Record<string, any>;
}

// Utility function to adapt legacy sources to new format
export function adaptLegacySource(source: any): GenerationSource {
  return {
    id: source.id,
    name: source.name,
    reference: source.reference,
    type: source.type || 'document',
    title: source.name || source.title || 'Documento',
    excerpt: source.reference || source.excerpt || 'Referência do documento',
    confidence: source.confidence || 0.8,
    metadata: source.metadata || {}
  };
}
