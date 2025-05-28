
import { Source } from './ai';

export interface GenerationSource {
  type: 'document' | 'search' | 'context';
  title: string;
  excerpt: string;
  confidence: number;
  metadata?: Record<string, any>;
}

export interface GenerationResult {
  success: boolean;
  text?: string;
  charsUsed?: number;
  sources?: GenerationSource[];
  message?: string;
}

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
  };
}

export interface ExportResult {
  success: boolean;
  url?: string;
  message?: string;
}
