'use client';

import { useState, useRef, useEffect, use } from 'react';
import { Send } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AssistantConfig {
  name: string;
  welcomeMessage: string;
  themeColor: string;
  suggestedQuestions: string[];
}

export default function EmbedPage({
  params,
}: {
  params: Promise<{ publicKey: string }>;
}) {
  const { publicKey } = use(params);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<AssistantConfig | null>(null);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConfig();
  }, [publicKey]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function fetchConfig() {
    try {
      const res = await fetch(`/api/public/assistant?key=${publicKey}`);
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch {
      // Silent fail for embed
    }
  }

  async function sendMessage(content: string) {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: content.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/public/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          publicKey,
          conversationId,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to get response');
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      setMessages([...newMessages, { role: 'assistant', content: '' }]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('0:')) {
              try {
                const text = JSON.parse(line.slice(2));
                assistantContent += text;
                setMessages([
                  ...newMessages,
                  { role: 'assistant', content: assistantContent },
                ]);
              } catch {
                // Skip unparseable lines
              }
            }
          }
        }
      }
    } catch {
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  const themeColor = config?.themeColor || '#6366f1';

  return (
    <div className="flex flex-col h-screen bg-white font-sans">
      {/* Header */}
      <div
        className="px-4 py-3 text-white flex items-center gap-2"
        style={{ backgroundColor: themeColor }}
      >
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
          <span className="text-sm font-bold">AI</span>
        </div>
        <span className="font-medium text-sm">{config?.name || 'AI Assistant'}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Welcome message */}
        {config?.welcomeMessage && messages.length === 0 && (
          <div className="flex gap-2">
            <div
              className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center"
              style={{ backgroundColor: `${themeColor}20` }}
            >
              <span className="text-xs font-bold" style={{ color: themeColor }}>
                AI
              </span>
            </div>
            <div className="bg-gray-100 rounded-lg px-3 py-2 max-w-[80%]">
              <p className="text-sm text-gray-800">{config.welcomeMessage}</p>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}
          >
            {msg.role === 'assistant' && (
              <div
                className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center"
                style={{ backgroundColor: `${themeColor}20` }}
              >
                <span className="text-xs font-bold" style={{ color: themeColor }}>
                  AI
                </span>
              </div>
            )}
            <div
              className={`rounded-lg px-3 py-2 max-w-[80%] ${
                msg.role === 'user'
                  ? 'text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
              style={msg.role === 'user' ? { backgroundColor: themeColor } : {}}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="flex gap-2">
            <div
              className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center"
              style={{ backgroundColor: `${themeColor}20` }}
            >
              <span className="text-xs font-bold" style={{ color: themeColor }}>
                AI
              </span>
            </div>
            <div className="bg-gray-100 rounded-lg px-3 py-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.1s]" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested questions */}
      {messages.length === 0 &&
        config?.suggestedQuestions &&
        config.suggestedQuestions.length > 0 && (
          <div className="px-4 pb-2 flex flex-wrap gap-2">
            {config.suggestedQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => sendMessage(q)}
                className="text-xs border rounded-full px-3 py-1.5 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        )}

      {/* Input */}
      <div className="border-t px-4 py-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            className="flex-1 text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-offset-0"
            style={{ '--tw-ring-color': themeColor } as React.CSSProperties}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2 rounded-lg text-white disabled:opacity-50 transition-opacity"
            style={{ backgroundColor: themeColor }}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="text-[10px] text-gray-400 mt-1.5 text-center">
          Powered by PersonaAI
        </p>
      </div>
    </div>
  );
}
