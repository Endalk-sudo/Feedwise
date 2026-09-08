import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type TextUIPart, type UIMessage } from 'ai';
import { useAuthStore, useOrgSlug } from '@/lib/stores/auth.store';
import { useUIStore } from '@/lib/stores/ui.store';
import { Send, Bot, Zap, Lightbulb, Copy, Square, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

const suggestions = [
  'What are the top 3 issues customers are reporting?',
  'Show me sentiment trend for the last month',
  'Which category has the most negative feedback?',
  'What are customers saying about pricing?',
  'Give me 3 actionable improvements',
  "Summarize this week's feedback",
];

function messageText(message: UIMessage): string {
  return (message.parts ?? [])
    .filter((part): part is TextUIPart => part.type === 'text')
    .map((part) => part.text)
    .join('');
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
      <Bot className="w-16 h-16 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium mb-2">Ready to help</h3>
      <p className="text-sm">Ask me anything about your customer feedback</p>
    </div>
  );
}

function MessageBubble({
  message,
  onCopy,
}: {
  message: UIMessage;
  onCopy: (text: string) => void;
}) {
  const text = messageText(message);
  if (!text) return null;
  return (
    <div className={cn('flex gap-3', message.role === 'user' ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[80%] rounded-xl px-4 py-3',
          message.role === 'user'
            ? 'bg-primary text-primary-foreground rounded-tr-none'
            : 'bg-secondary text-foreground rounded-tl-none',
        )}
      >
        <p className="whitespace-pre-wrap">{text}</p>
        {message.role === 'assistant' && (
          <button
            onClick={() => onCopy(text)}
            className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Copy className="w-3 h-3" />
            Copy
          </button>
        )}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="px-4 pb-4 flex justify-start">
      <div className="bg-secondary rounded-xl rounded-tl-none px-4 py-3 flex items-center gap-1">
        <span
          className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"
          style={{ animationDelay: '0ms' }}
        />
        <span
          className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"
          style={{ animationDelay: '150ms' }}
        />
        <span
          className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"
          style={{ animationDelay: '300ms' }}
        />
      </div>
    </div>
  );
}

function InputForm({
  input,
  setInput,
  handleSubmit,
  isBusy,
  isStreaming,
  onStop,
  currentPlan,
}: {
  input: string;
  setInput: (v: string) => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
  isBusy: boolean;
  isStreaming: boolean;
  onStop: () => void;
  currentPlan: string | null | undefined;
}) {
  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-border">
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            currentPlan !== 'pro'
              ? 'Upgrade to Pro to use AI Chat'
              : 'Ask me anything about your feedback...'
          }
          disabled={isBusy || currentPlan !== 'pro'}
          className="flex-1 px-4 py-3 bg-secondary border border-input rounded-lg text-foreground placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-all disabled:opacity-50"
        />
        {isStreaming ? (
          <button type="button" onClick={onStop} className="px-6 py-3 btn-brand">
            <Square className="w-5 h-5" />
            Stop
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim() || isBusy || currentPlan !== 'pro'}
            className="px-6 py-3 btn-brand"
          >
            <Send className="w-5 h-5" />
            Send
          </button>
        )}
      </div>
    </form>
  );
}

export function AIPage() {
  const { activeOrganization } = useAuthStore();
  const { addToast } = useUIStore();
  const slug = useOrgSlug();
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: `${
          import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api'
        }/ai/${slug}/chat/stream`,
        credentials: 'include',
      }),
    [slug],
  );

  const { messages, sendMessage, status, stop, regenerate, error, clearError } = useChat({
    id: `ai-chat-${slug}`,
    transport,
    onError: (err) => {
      addToast({
        message: err instanceof Error ? err.message : 'Failed to send message',
        type: 'error',
      });
    },
  });

  const isBusy = status === 'submitted' || status === 'streaming';
  const isStreaming = status === 'streaming';

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const submitMessage = (userMessage: string) => {
    if (!userMessage.trim() || isBusy || !slug) return;
    clearError();
    setInput('');
    setShowSuggestions(false);
    void sendMessage({ text: userMessage });
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    submitMessage(input.trim());
  };

  const handleSuggestionClick = (suggestion: string) => {
    submitMessage(suggestion);
  };

  const copyToClipboard = (text: string) => {
    void navigator.clipboard.writeText(text);
  };

  if (!slug) {
    return (
      <div className="text-center py-12">
        <Bot className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">No organization selected</h2>
        <p className="text-muted-foreground">Please select an organization to use AI Assistant</p>
      </div>
    );
  }

  const { currentPlan } = activeOrganization ?? {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="w-6 h-6 text-primary" />
            AI Assistant
          </h1>
          <p className="text-muted-foreground mt-1">Ask questions about your feedback data</p>
        </div>
        {currentPlan !== 'pro' && (
          <div className="bg-warning/10 border border-warning/30 text-warning px-4 py-2 rounded-lg text-sm">
            <Zap className="w-4 h-4 inline mr-1" />
            Pro plan required for AI Chat
          </div>
        )}
      </div>

      {/* Suggestions */}
      {showSuggestions && messages.length === 0 && (
        <div className="bg-card/80 backdrop-blur-sm border border-border rounded-xl p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-warning" />
            Try asking:
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => handleSuggestionClick(suggestion)}
                className="p-4 bg-secondary/50 border border-input rounded-lg text-left text-foreground hover:border-blue-500/50 hover:bg-secondary transition-all text-sm"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <div className="bg-card/80 backdrop-blur-sm border border-border rounded-xl flex flex-col h-[500px] overflow-hidden">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6">
          {messages.length === 0 ? (
            <EmptyState />
          ) : (
            messages.map((message) => (
              <MessageBubble key={message.id} message={message} onCopy={copyToClipboard} />
            ))
          )}
        </div>

        {status === 'submitted' && <TypingIndicator />}

        {status === 'error' && (
          <div className="px-4 pb-2">
            <button
              onClick={() => regenerate()}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Retry — {error?.message ?? 'something went wrong'}
            </button>
          </div>
        )}

        <InputForm
          input={input}
          setInput={setInput}
          handleSubmit={handleSubmit}
          isBusy={isBusy}
          isStreaming={isStreaming}
          onStop={stop}
          currentPlan={currentPlan}
        />
      </div>
    </div>
  );
}
