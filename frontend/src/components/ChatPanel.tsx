import { useCallback, useEffect, useRef, useState } from "react";
import {
  Send,
  Loader2,
  Bot,
  User,
  Sparkles,
  MessageSquare,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChatMessage } from "@/types";
import { sendChat } from "@/lib/api";
import { cn, generateId } from "@/lib/utils";
import SourceCard from "@/components/SourceCard";

export default function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
    }
  }, [input]);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      const question = input.trim();
      if (!question || isLoading) return;

      const userMsg: ChatMessage = {
        id: generateId(),
        role: "user",
        content: question,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsLoading(true);

      try {
        const history = messages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const response = await sendChat(question, history);

        const assistantMsg: ChatMessage = {
          id: generateId(),
          role: "assistant",
          content: response.answer,
          sources:
            response.sources.length > 0 ? response.sources : undefined,
          timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err) {
        const errorMsg: ChatMessage = {
          id: generateId(),
          role: "assistant",
          content: `Sorry, an error occurred: ${err instanceof Error ? err.message : "Unknown error"}. Please try again.`,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [input, isLoading, messages],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-6 space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-60">
            <div className="p-4 rounded-full bg-gray-900 border border-gray-800">
              <Sparkles className="h-8 w-8 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-300">
                DevOps Knowledge Assistant
              </h3>
              <p className="text-sm text-gray-500 mt-1 max-w-md">
                Ask questions about your DevOps documentation. I will search
                through uploaded documents and provide answers with source
                references.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 w-full max-w-lg">
              {[
                "How do I set up a CI/CD pipeline?",
                "What are our Kubernetes best practices?",
                "Explain our monitoring stack",
                "How to handle incident response?",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setInput(suggestion)}
                  className="text-left text-xs px-3 py-2.5 rounded-lg border border-gray-800 text-gray-400 hover:text-gray-200 hover:border-gray-700 hover:bg-gray-900/50 transition-colors"
                >
                  <MessageSquare className="h-3 w-3 inline mr-1.5 -mt-0.5" />
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex gap-3 max-w-3xl",
              msg.role === "user" ? "ml-auto flex-row-reverse" : "",
            )}
          >
            {/* Avatar */}
            <div
              className={cn(
                "shrink-0 h-8 w-8 rounded-lg flex items-center justify-center",
                msg.role === "user"
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-gray-800 text-gray-400",
              )}
            >
              {msg.role === "user" ? (
                <User className="h-4 w-4" />
              ) : (
                <Bot className="h-4 w-4" />
              )}
            </div>

            {/* Message content */}
            <div
              className={cn(
                "flex flex-col gap-2 min-w-0",
                msg.role === "user" ? "items-end" : "items-start",
              )}
            >
              <div
                className={cn(
                  "rounded-xl px-4 py-3 max-w-full",
                  msg.role === "user"
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-900 border border-gray-800 text-gray-200",
                )}
              >
                {msg.role === "assistant" ? (
                  <div className="prose-chat">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </p>
                )}
              </div>

              {/* Source citations */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="w-full space-y-1.5 mt-1">
                  <p className="text-xs text-gray-500 font-medium px-1">
                    Sources ({msg.sources.length})
                  </p>
                  {msg.sources.map((source, idx) => (
                    <SourceCard
                      key={`${msg.id}-source-${idx}`}
                      source={source}
                      index={idx}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex gap-3 max-w-3xl">
            <div className="shrink-0 h-8 w-8 rounded-lg flex items-center justify-center bg-gray-800 text-gray-400">
              <Bot className="h-4 w-4" />
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching knowledge base...
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="border-t border-gray-800 p-4">
        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="flex items-end gap-2 max-w-3xl mx-auto"
        >
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your DevOps documentation..."
              rows={1}
              className={cn(
                "w-full resize-none rounded-xl border border-gray-800 bg-gray-900 px-4 py-3 pr-12",
                "text-sm text-gray-100 placeholder:text-gray-500",
                "focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50",
                "transition-colors scrollbar-thin",
              )}
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className={cn(
              "shrink-0 h-11 w-11 rounded-xl flex items-center justify-center transition-colors",
              input.trim() && !isLoading
                ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                : "bg-gray-800 text-gray-500 cursor-not-allowed",
            )}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
