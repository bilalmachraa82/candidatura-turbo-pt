
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
}

export interface UploadFormProps {
  title: string;
  description: string;
  projectId: string;
  acceptedFileTypes?: string;
  onFileUploaded: (file: { name: string; url: string; type: string; category?: string }) => void;
}

export interface IndexedFileResult {
  id: string;
  name: string;
  type: string;
  url: string;
  chunks?: number;
  category?: string;
}
