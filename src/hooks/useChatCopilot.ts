import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { analytics } from '@/lib/analytics';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
  context?: any;
}

export interface ChatConversation {
  id: string;
  project_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface UseChatCopilotOptions {
  projectId?: string;
  currentSection?: string;
}

export function useChatCopilot({ projectId, currentSection }: UseChatCopilotOptions = {}) {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingMessage, setStreamingMessage] = useState<string>('');

  const abortControllerRef = useRef<AbortController | null>(null);

  // Load conversations for a project
  const loadConversations = useCallback(async (pid?: string) => {
    const targetProjectId = pid || projectId;
    if (!targetProjectId) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('project_id', targetProjectId)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      setConversations(data || []);
    } catch (err: any) {
      console.error('Error loading conversations:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  // Load messages for a conversation
  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data || []);
    } catch (err: any) {
      console.error('Error loading messages:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create a new conversation
  const createConversation = useCallback(async (title?: string, pid?: string) => {
    const targetProjectId = pid || projectId;
    if (!targetProjectId) {
      throw new Error('Project ID is required');
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('chat_conversations')
        .insert({
          project_id: targetProjectId,
          user_id: user.id,
          title: title || 'Nova conversa'
        })
        .select()
        .single();

      if (error) throw error;

      setCurrentConversation(data);
      setMessages([]);

      // Track analytics
      analytics.featureUsed('chat_conversation_created', {
        projectId: targetProjectId,
        hasSection: !!currentSection
      });

      return data;
    } catch (err: any) {
      console.error('Error creating conversation:', err);
      setError(err.message);
      throw err;
    }
  }, [projectId, currentSection]);

  // Load a conversation
  const loadConversation = useCallback(async (conversationId: string) => {
    try {
      setIsLoading(true);

      // Load conversation
      const { data: conv, error: convError } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (convError) throw convError;

      setCurrentConversation(conv);

      // Load messages
      await loadMessages(conversationId);

    } catch (err: any) {
      console.error('Error loading conversation:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [loadMessages]);

  // Send a message (non-streaming)
  const sendMessage = useCallback(async (
    message: string,
    context?: any,
    stream: boolean = false
  ) => {
    if (!projectId) {
      throw new Error('Project ID is required');
    }

    // Create conversation if needed
    let convId = currentConversation?.id;
    if (!convId) {
      const conv = await createConversation(message.substring(0, 100));
      convId = conv.id;
    }

    try {
      setIsSending(true);
      setError(null);
      setStreamingMessage('');

      // Get session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Não autenticado');
      }

      // Optimistically add user message
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: message,
        created_at: new Date().toISOString(),
        context
      };
      setMessages(prev => [...prev, userMessage]);

      const functionUrl = `${supabase.supabaseUrl}/functions/v1/chat-copilot`;

      // Track analytics
      analytics.featureUsed('chat_message_sent', {
        projectId,
        conversationId: convId,
        hasSection: !!currentSection,
        messageLength: message.length,
        stream
      });

      if (stream) {
        // Streaming request
        abortControllerRef.current = new AbortController();

        const response = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
            'apikey': supabase.supabaseKey
          },
          body: JSON.stringify({
            conversationId: convId,
            message,
            projectId,
            currentSection,
            stream: true
          }),
          signal: abortControllerRef.current.signal
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Read stream
        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let buffer = '';
        let accumulatedText = '';

        // Add assistant message placeholder
        const assistantMessageId = Date.now().toString();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6);
              try {
                const data = JSON.parse(dataStr);

                if (data.error) {
                  throw new Error(data.error);
                }

                if (data.done) {
                  // Reload messages to get the saved version
                  await loadMessages(convId!);
                  setStreamingMessage('');
                  return;
                }

                if (data.token) {
                  accumulatedText += data.token;
                  setStreamingMessage(accumulatedText);
                }
              } catch (e) {
                console.warn('Failed to parse SSE data:', e);
              }
            }
          }
        }

      } else {
        // Non-streaming request
        const response = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
            'apikey': supabase.supabaseKey
          },
          body: JSON.stringify({
            conversationId: convId,
            message,
            projectId,
            currentSection,
            stream: false
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Erro desconhecido');
        }

        // Reload messages to get the complete conversation
        await loadMessages(convId!);
      }

    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Request aborted');
        return;
      }

      console.error('Error sending message:', err);
      setError(err.message);

      // Track error
      analytics.errorOccurred('chat_error', err.message, {
        projectId,
        currentSection
      });

      throw err;
    } finally {
      setIsSending(false);
    }
  }, [projectId, currentSection, currentConversation, createConversation, loadMessages]);

  // Cancel streaming
  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsSending(false);
      setStreamingMessage('');
    }
  }, []);

  // Delete a conversation
  const deleteConversation = useCallback(async (conversationId: string) => {
    try {
      const { error } = await supabase
        .from('chat_conversations')
        .delete()
        .eq('id', conversationId);

      if (error) throw error;

      // Update local state
      setConversations(prev => prev.filter(c => c.id !== conversationId));

      if (currentConversation?.id === conversationId) {
        setCurrentConversation(null);
        setMessages([]);
      }
    } catch (err: any) {
      console.error('Error deleting conversation:', err);
      setError(err.message);
      throw err;
    }
  }, [currentConversation]);

  // Reset current conversation
  const resetConversation = useCallback(() => {
    setCurrentConversation(null);
    setMessages([]);
    setStreamingMessage('');
    setError(null);
  }, []);

  // Load conversations on mount if projectId is provided
  useEffect(() => {
    if (projectId) {
      loadConversations(projectId);
    }
  }, [projectId, loadConversations]);

  return {
    conversations,
    currentConversation,
    messages,
    streamingMessage,
    isLoading,
    isSending,
    error,
    loadConversations,
    loadConversation,
    createConversation,
    sendMessage,
    deleteConversation,
    resetConversation,
    cancelStream,
  };
}
