
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, Sparkles } from 'lucide-react';
import { generateSection } from '@/lib/generateSection';
import { Spinner } from '@/components/ui/spinner';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  model?: string;
  provider?: string;
}

interface ChatThreadProps {
  projectId: string;
  section: string;
  charLimit: number;
  model: { provider: string; id: string };
  onTextGenerated?: (text: string) => void;
}

const ChatThread: React.FC<ChatThreadProps> = ({
  projectId,
  section,
  charLimit,
  model,
  onTextGenerated
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || isGenerating) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsGenerating(true);

    try {
      // Generate refined response based on user input
      const refinedPrompt = `${section}: ${input.trim()}`;
      
      const result = await generateSection(
        projectId,
        refinedPrompt,
        charLimit,
        model.provider as 'openrouter' | 'flowise',
        model.id
      );

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: result.text,
        timestamp: new Date(),
        model: model.id,
        provider: model.provider
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Notify parent component of generated text
      if (onTextGenerated) {
        onTextGenerated(result.text);
      }

    } catch (error: any) {
      console.error('Error in chat generation:', error);
      
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: `Erro na geração: ${error.message}. Tenta novamente ou muda de modelo.`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleQuickRefine = async () => {
    setIsGenerating(true);
    
    try {
      const result = await generateSection(
        projectId,
        section,
        charLimit,
        model.provider as 'openrouter' | 'flowise',
        model.id
      );

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: result.text,
        timestamp: new Date(),
        model: model.id,
        provider: model.provider
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      if (onTextGenerated) {
        onTextGenerated(result.text);
      }

    } catch (error: any) {
      console.error('Error in quick refine:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Chat IA - Refinamento de Secção
          <Badge variant="outline" className="text-xs">
            {model.provider === 'openrouter' ? 'OpenRouter' : 'Flowise'}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Messages History */}
        {messages.length > 0 && (
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-50 border-l-4 border-blue-500'
                    : 'bg-green-50 border-l-4 border-green-500'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium">
                    {message.role === 'user' ? 'Tu' : 'IA'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {message.timestamp.toLocaleTimeString('pt-PT', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                {message.model && (
                  <Badge variant="secondary" className="text-xs mt-1">
                    {message.model}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div className="space-y-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Descreve como queres refinar esta secção..."
            className="min-h-[80px] resize-none"
            disabled={isGenerating}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                handleSend();
              }
            }}
          />
          
          <div className="flex gap-2">
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isGenerating}
              size="sm"
              className="flex-1"
            >
              {isGenerating ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  A gerar...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar (Ctrl+Enter)
                </>
              )}
            </Button>
            
            <Button
              onClick={handleQuickRefine}
              disabled={isGenerating}
              variant="outline"
              size="sm"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Gerar Rápido
            </Button>
          </div>
        </div>

        {messages.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-4">
            💡 Usa este chat para refinar e melhorar o conteúdo da secção com IA
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ChatThread;
