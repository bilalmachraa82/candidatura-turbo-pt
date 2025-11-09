import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Source } from '@/types/ai';

interface StreamingState {
  text: string;
  isStreaming: boolean;
  error: string | null;
  sources: Source[];
  charsUsed: number;
}

interface GenerateStreamParams {
  projectId: string;
  sectionKey: string;
  charLimit: number;
  model: string;
}

export function useStreamingGeneration() {
  const [state, setState] = useState<StreamingState>({
    text: '',
    isStreaming: false,
    error: null,
    sources: [],
    charsUsed: 0
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const generateStream = useCallback(async ({
    projectId,
    sectionKey,
    charLimit,
    model
  }: GenerateStreamParams) => {
    // Reset state
    setState({
      text: '',
      isStreaming: true,
      error: null,
      sources: [],
      charsUsed: 0
    });

    // Create abort controller for cleanup
    abortControllerRef.current = new AbortController();

    try {
      // Get the function URL
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Não autenticado');
      }

      const functionUrl = `${supabase.supabaseUrl}/functions/v1/generate-stream`;

      // Make the request
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'apikey': supabase.supabaseKey
        },
        body: JSON.stringify({
          projectId,
          section: sectionKey,
          charLimit,
          model
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Check if response is SSE
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('text/event-stream')) {
        throw new Error('Expected SSE response but got: ' + contentType);
      }

      // Read the stream
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedText = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        // Decode chunk and add to buffer
        buffer += decoder.decode(value, { stream: true });

        // Process complete lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);

            try {
              const data = JSON.parse(dataStr);

              if (data.error) {
                setState(prev => ({
                  ...prev,
                  isStreaming: false,
                  error: data.error
                }));
                return;
              }

              if (data.done) {
                // Stream completed
                setState(prev => ({
                  ...prev,
                  isStreaming: false,
                  sources: data.sources || prev.sources,
                  charsUsed: data.charsUsed || accumulatedText.length
                }));
                return;
              }

              if (data.token) {
                // Append token to accumulated text
                accumulatedText += data.token;
                setState(prev => ({
                  ...prev,
                  text: accumulatedText,
                  charsUsed: accumulatedText.length
                }));
              }
            } catch (e) {
              console.warn('Failed to parse SSE data:', e);
            }
          }
        }
      }

    } catch (error: any) {
      // Don't set error if request was aborted
      if (error.name === 'AbortError') {
        setState(prev => ({
          ...prev,
          isStreaming: false
        }));
        return;
      }

      console.error('Streaming generation error:', error);
      setState(prev => ({
        ...prev,
        isStreaming: false,
        error: error.message || 'Erro na geração de texto'
      }));
    }
  }, []);

  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setState(prev => ({
        ...prev,
        isStreaming: false
      }));
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      text: '',
      isStreaming: false,
      error: null,
      sources: [],
      charsUsed: 0
    });
  }, []);

  return {
    text: state.text,
    isStreaming: state.isStreaming,
    error: state.error,
    sources: state.sources,
    charsUsed: state.charsUsed,
    generateStream,
    cancelStream,
    reset
  };
}
