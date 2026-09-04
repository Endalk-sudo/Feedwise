import { useState, type FormEvent } from 'react';
import { useAuthStore, useOrgSlug } from '@/lib/stores/auth.store';
import { useAIChat } from '@/features/feedback/hooks';
import type { AIChatResponse } from '@/features/feedback/types';
import { Send, Bot, Zap, Lightbulb, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

const suggestions = [
  'What are the top 3 issues customers are reporting?',
  'Show me sentiment trend for the last month',
  'Which category has the most negative feedback?',
  'What are customers saying about pricing?',
  'Give me 3 actionable improvements',
  'Summarize this week\'s feedback',
];

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
      <Bot className="w-16 h-16 text-slate-700 mb-4" />
      <h3 className="text-lg font-medium mb-2">Ready to help</h3>
      <p className="text-sm">Ask me anything about your customer feedback</p>
    </div>
  );
}

function MessageBubble({ message, onCopy }: { message: { role: 'user' | 'assistant'; content: string }; onCopy: (text: string) => void }) {
  return (
    <div className={cn('flex gap-3', message.role === 'user' ? 'justify-end' : 'justify-start')}>
      <div className={cn(
        'max-w-[80%] rounded-xl px-4 py-3',
        message.role === 'user'
          ? 'bg-primary text-primary-foreground rounded-tr-none'
          : 'bg-secondary text-foreground rounded-tl-none'
      )}>
        <p className="whitespace-pre-wrap">{message.content}</p>
        {message.role === 'assistant' && (
          <button
            onClick={() => onCopy(message.content)}
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
        <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}

function InputForm({ input, setInput, handleSubmit, isPending, currentPlan }: {
  input: string;
  setInput: (v: string) => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
  isPending: boolean;
  currentPlan: string | null | undefined;
}) {
  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-border">
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={currentPlan !== 'pro' ? 'Upgrade to Pro to use AI Chat' : 'Ask me anything about your feedback...'}
          disabled={isPending || currentPlan !== 'pro'}
          className="flex-1 px-4 py-3 bg-secondary border border-input rounded-lg text-foreground placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-all disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || isPending || currentPlan !== 'pro'}
          className="px-6 py-3 btn-brand"
        >
          <Send className="w-5 h-5" />
          Send
        </button>
      </div>
    </form>
  );
}

export function AIPage() {
  const { activeOrganization } = useAuthStore();
  const slug = useOrgSlug();
  const { mutate: sendMessage, isPending } = useAIChat(slug);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);

  const submitMessage = (userMessage: string) => {
    if (!userMessage.trim() || isPending) return;

    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setShowSuggestions(false);

    sendMessage(userMessage, {
      onSuccess: (reply: AIChatResponse) => {
        setMessages((prev) => [...prev, { role: 'assistant', content: reply.reply }]);
      },
      onError: () => {
        setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
      },
    });
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    submitMessage(input.trim());
  };

  const handleSuggestionClick = (suggestion: string) => {
    submitMessage(suggestion);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
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
            <Bot className="w-6 h-6 text-pink-400" />
            AI Assistant
          </h1>
          <p className="text-muted-foreground mt-1">Ask questions about your feedback data</p>
        </div>
        {currentPlan !== 'pro' && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 text-warning px-4 py-2 rounded-lg text-sm">
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
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {messages.length === 0 ? <EmptyState /> : (
            messages.map((message, i) => (
              <MessageBubble key={i} message={message} onCopy={copyToClipboard} />
            ))
          )}
        </div>

        {isPending && <TypingIndicator />}

        <InputForm
          input={input}
          setInput={setInput}
          handleSubmit={handleSubmit}
          isPending={isPending}
          currentPlan={currentPlan}
        />
      </div>
    </div>
  );
}