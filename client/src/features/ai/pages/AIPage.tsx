import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type TextUIPart, type UIMessage } from 'ai';
import { useAuthStore, useOrgSlug } from '@/lib/stores/auth.store';
import { useUIStore } from '@/lib/stores/ui.store';
import { Send, Bot, Zap, Lightbulb, Copy, Square, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageHeader, Card, Badge, Button, Input, EmptyState } from '@/components/ui';

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
        <Input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            currentPlan !== 'pro'
              ? 'Upgrade to Pro to use AI Chat'
              : 'Ask me anything about your feedback...'
          }
          disabled={isBusy || currentPlan !== 'pro'}
        />
        {isStreaming ? (
          <Button size="lg" onClick={onStop} className="shrink-0">
            <Square className="w-5 h-5" />
            Stop
          </Button>
        ) : (
          <Button
            size="lg"
            type="submit"
            disabled={!input.trim() || isBusy || currentPlan !== 'pro'}
            className="shrink-0"
          >
            <Send className="w-5 h-5" />
            Send
          </Button>
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
      <EmptyState
        icon={Bot}
        title="No organization selected"
        description="Please select an organization to use AI Assistant"
      />
    );
  }

  const { currentPlan } = activeOrganization ?? {};

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Assistant"
        icon={Bot}
        description="Ask questions about your feedback data"
        actions={
          currentPlan !== 'pro' ? (
            <Badge size="md" variant="warning">
              <Zap className="w-4 h-4" />
              Pro plan required for AI Chat
            </Badge>
          ) : undefined
        }
      />

      {/* Suggestions */}
      {showSuggestions && messages.length === 0 && (
        <Card>
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-warning" />
            Try asking:
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => handleSuggestionClick(suggestion)}
                className="p-4 bg-secondary/50 border border-input rounded-lg text-left text-foreground hover:border-primary/50 hover:bg-secondary transition-all text-sm"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Chat Messages */}
      <Card padding="none" className="flex flex-col h-[500px] overflow-hidden">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6">
          {messages.length === 0 ? (
            <EmptyState
              icon={Bot}
              title="Ready to help"
              description="Ask me anything about your customer feedback"
              className="h-full flex flex-col items-center justify-center"
            />
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
      </Card>
    </div>
  );
}
