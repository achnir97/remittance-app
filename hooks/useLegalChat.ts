import { useState, useCallback } from 'react';
import { legalApi } from '../services/legal';
import { LegalChatMessage, LegalDomain } from '../types';
import { useAppStore } from '../store/useAppStore';

type ChatStatus = 'idle' | 'loading' | 'error';

export function useLegalChat(domain: LegalDomain) {
  const language = useAppStore((s) => s.language);
  const [messages, setMessages] = useState<LegalChatMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(async (question: string) => {
    if (!question.trim()) return;

    const userMsg: LegalChatMessage = {
      id: `${Date.now()}-user`,
      role: 'user',
      content: question.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setStatus('loading');
    setError(null);

    // Build history for context (last 6 messages)
    const history = messages.slice(-6).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const result = await legalApi.chat({
        question: question.trim(),
        language,
        domain,
        history,
      });

      const aiMsg: LegalChatMessage = {
        id: `${Date.now()}-ai`,
        role: 'assistant',
        content: result.response.summary,
        response: result.response,
        emergency: result.emergency,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, aiMsg]);
      setStatus('idle');
    } catch (err) {
      console.warn('[useLegalChat] Request failed:', err);
      setError('Could not connect. Please try again.');
      setStatus('error');
    }
  }, [messages, language, domain]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    setStatus('idle');
  }, []);

  return { messages, status, error, send, clearMessages };
}
