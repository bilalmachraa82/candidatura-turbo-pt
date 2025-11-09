
import { Source } from './ai';
import { GenerationSource } from './api';

export interface UploadedFile {
  id: string;
  name: string;
  url: string;
  type: string;
  uploadDate: string;
  category?: string;
}

export interface ProjectSection {
  id: string;
  projectId: string;
  key: string;
  title: string;
  description: string;
  content: string;
  charLimit: number;
  qualityScore?: number;
  qualityData?: {
    overall: number;
    breakdown: {
      completeness: number;
      specificity: number;
      keywords: number;
      structure: number;
      compliance: number;
    };
    issues: Array<{
      severity: 'critical' | 'warning' | 'suggestion';
      category: string;
      message: string;
      suggestion: string;
    }>;
    strengths: string[];
    suggestions: string[];
  };
  lastScoredAt?: string;
}

export interface UploadFormProps {
  title: string;
  description: string;
  projectId: string;
  acceptedFileTypes?: string;
  onFileUploaded: (file: { name: string; url: string; type: string; category?: string }) => void;
}

// Updated IndexedFileResult interface with category support
export interface IndexedFileResult {
  id: string;
  name: string;
  type: string;
  url: string;
  chunks?: number;
  category?: string; // Added category property
}
