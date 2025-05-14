
// Project types
export interface Project {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

// Document types
export interface IndexedFile {
  id: string;
  project_id: string;
  file_name: string;
  file_type: string;
  file_url: string;
  created_at: string;
}

export interface DocumentChunk {
  id: string;
  project_id: string;
  file_id: string;
  chunk_index: number;
  content: string;
  metadata: {
    source?: string;
    page?: number;
    [key: string]: any;
  };
  embedding?: number[];
  created_at: string;
}

// Section types
export interface ProjectSection {
  id: string;
  project_id: string;
  key: string;
  title: string;
  description?: string;
  content?: string;
  char_limit?: number;
  created_at: string;
  updated_at: string;
}

// AI generation types
export interface GenerationSource {
  id: string;
  name: string;
  reference: string;
  type: 'pdf' | 'excel' | 'document';
}

export interface GenerationResult {
  text: string;
  charsUsed: number;
  sources: GenerationSource[];
}

// Export types
export interface ExportResult {
  success: boolean;
  url: string;
  fileName: string;
  format: 'pdf' | 'docx';
  sections: number;
  attachments: number;
  metadata?: {
    projectName: string;
    exportDate: string;
    pageCount: number;
    language: string;
  };
}

// Upload types
export interface UploadedFile {
  name: string;
  type: string;
  url: string;
}

export interface IndexingResult {
  success: boolean;
  documentId?: string; // Add this missing property
  message: string;
  file?: {
    id: string;
    name: string;
    type: string;
    url: string;
  };
}
