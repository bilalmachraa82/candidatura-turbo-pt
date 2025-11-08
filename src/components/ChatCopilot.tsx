import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Plus, Trash2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useChatCopilot } from '@/hooks/useChatCopilot';
import { analytics } from '@/lib/analytics';
import { cn } from '@/lib/utils';

interface ChatCopilotProps {
  projectId?: string;
  currentSection?: string;
}

const SUGGESTED_PROMPTS = [
  { text: "Ajuda-me a preencher a secção atual", icon: "✏️", requiresSection: true },
  { text: "O que devo escrever sobre inovação?", icon: "💡", requiresSection: false },
  { text: "Como justifico o orçamento?", icon: "💰", requiresSection: false },
  { text: "Revê o meu conteúdo atual", icon: "✅", requiresSection: true },
  { text: "Que documentos preciso?", icon: "📄", requiresSection: false },
  { text: "Dá-me dicas para esta candidatura", icon: "🎯", requiresSection: false },
];

export function ChatCopilot({ projectId, currentSection }: ChatCopilotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showConversations, setShowConversations] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
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
  } = useChatCopilot({ projectId, currentSection });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, streamingMessage]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleOpen = () => {
    setIsOpen(true);
    analytics.featureUsed('chat_copilot_opened', {
      projectId,
      currentSection
    });
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!inputValue.trim() || isSending || !projectId) return;

    const message = inputValue.trim();
    setInputValue('');

    try {
      await sendMessage(message, { currentSection }, true);
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const handleSuggestedPrompt = (prompt: string) => {
    setInputValue(prompt);
    if (inputRef.current) {
      inputRef.current.focus();
    }

    analytics.featureUsed('chat_suggestion_used', {
      prompt,
      projectId,
      currentSection
    });
  };

  const handleNewConversation = async () => {
    if (!projectId) return;

    try {
      await createConversation('Nova conversa', projectId);
      setShowConversations(false);
    } catch (err) {
      console.error('Error creating conversation:', err);
    }
  };

  const handleLoadConversation = async (conversationId: string) => {
    try {
      await loadConversation(conversationId);
      setShowConversations(false);
    } catch (err) {
      console.error('Error loading conversation:', err);
    }
  };

  const handleDeleteConversation = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm('Tem a certeza que deseja eliminar esta conversa?')) return;

    try {
      await deleteConversation(conversationId);
    } catch (err) {
      console.error('Error deleting conversation:', err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!projectId) {
    return null;
  }

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <Button
          onClick={handleOpen}
          size="lg"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all z-50"
          title="Abrir Chat Copilot"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-[400px] h-[600px] shadow-2xl flex flex-col z-50 border-2">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              <div>
                <h3 className="font-semibold">Chat Copilot</h3>
                <p className="text-xs opacity-90">Assistente PT2030</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowConversations(!showConversations)}
                className="text-white hover:bg-white/20"
                title="Conversas"
              >
                <MessageCircle className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Conversation List Sidebar */}
          {showConversations && (
            <div className="p-4 border-b bg-muted">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-sm">Conversas</h4>
                <Button
                  size="sm"
                  onClick={handleNewConversation}
                  className="h-7"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Nova
                </Button>
              </div>
              <ScrollArea className="h-[150px]">
                {conversations.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Sem conversas
                  </p>
                ) : (
                  <div className="space-y-2">
                    {conversations.map((conv) => (
                      <div
                        key={conv.id}
                        onClick={() => handleLoadConversation(conv.id)}
                        className={cn(
                          "p-2 rounded-md cursor-pointer hover:bg-accent transition-colors group flex items-center justify-between",
                          currentConversation?.id === conv.id && "bg-accent"
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {conv.title || 'Sem título'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(conv.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDeleteConversation(conv.id, e)}
                          className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}

          {/* Context Badge */}
          {currentSection && (
            <div className="px-4 py-2 bg-muted/50 border-b">
              <Badge variant="secondary" className="text-xs">
                Secção: {currentSection}
              </Badge>
            </div>
          )}

          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4">
            {messages.length === 0 && !streamingMessage ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
                <h4 className="font-semibold mb-2">Como posso ajudar?</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Faça uma pergunta sobre a sua candidatura PT2030
                </p>

                {/* Suggested Prompts */}
                <div className="grid grid-cols-1 gap-2 w-full mt-4">
                  {SUGGESTED_PROMPTS.filter(
                    p => !p.requiresSection || currentSection
                  ).slice(0, 3).map((prompt, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      onClick={() => handleSuggestedPrompt(prompt.text)}
                      className="justify-start text-left h-auto py-2"
                    >
                      <span className="mr-2">{prompt.icon}</span>
                      <span className="text-xs">{prompt.text}</span>
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex",
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[80%] rounded-lg p-3 text-sm",
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      )}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}

                {/* Streaming Message */}
                {streamingMessage && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] rounded-lg p-3 text-sm bg-muted">
                      <p className="whitespace-pre-wrap">{streamingMessage}</p>
                      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>A escrever...</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Loading Indicator */}
                {isSending && !streamingMessage && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg p-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>A pensar...</span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-3 bg-destructive/10 border border-destructive rounded-lg">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
          </ScrollArea>

          <Separator />

          {/* Input Area */}
          <form onSubmit={handleSendMessage} className="p-4">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escreva a sua mensagem..."
                disabled={isSending}
                className="flex-1"
              />
              {isSending ? (
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={cancelStream}
                >
                  <X className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="icon"
                  disabled={!inputValue.trim() || isSending}
                >
                  <Send className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Enter para enviar • Esc para fechar
            </p>
          </form>
        </Card>
      )}
    </>
  );
}
