
export type AIModel = 'gpt-4o' | 'claude-3-opus' | 'gemini-pro';

export interface Source {
  id: string;
  name: string;
  reference: string;
  type: 'pdf' | 'excel' | 'document';
}

export interface GenerationResult {
  text: string;
  charsUsed: number;
  sources: Source[];
}
