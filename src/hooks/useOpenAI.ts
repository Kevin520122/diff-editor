import { useState, useCallback, useMemo } from 'react';
import { ChatMessage, TextChange, OpenAIConfig } from '../types';
import { OpenAIService } from '../utils/openai';

export interface UseOpenAIReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (message: string, currentText: string) => Promise<TextChange[]>;
  clearMessages: () => void;
  clearError: () => void;
}

export function useOpenAI(config: OpenAIConfig): UseOpenAIReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openAIService = useMemo(() => new OpenAIService(config), [config]);

  const sendMessage = useCallback(async (message: string, currentText: string): Promise<TextChange[]> => {
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const suggestions = await openAIService.getTextSuggestions(currentText, message);
      
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: suggestions.length > 0 
          ? `I found ${suggestions.length} suggested change${suggestions.length === 1 ? '' : 's'} for your text.`
          : 'I don\'t see any changes needed for your request.',
        timestamp: new Date(),
        suggestions,
      };

      setMessages(prev => [...prev, assistantMessage]);
      return suggestions;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      
      const errorAssistantMessage: ChatMessage = {
        id: `assistant-error-${Date.now()}`,
        role: 'assistant',
        content: `Sorry, I encountered an error: ${errorMessage}`,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorAssistantMessage]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [openAIService]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    clearError,
  };
} 