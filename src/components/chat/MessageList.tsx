"use client";

import { UIMessage } from "ai";
import { cn } from "@/lib/utils";
import { User, Bot, Loader2 } from "lucide-react";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { ToolInvocationBadge } from "./ToolInvocationBadge";

interface MessageListProps {
  messages: UIMessage[];
  isLoading?: boolean;
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-4 text-center">
        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-50 mb-4">
          <Bot className="h-6 w-6 text-blue-600" />
        </div>
        <p className="text-neutral-800 font-semibold text-base mb-1.5">Start a conversation to generate React components</p>
        <p className="text-neutral-400 text-sm max-w-xs">I can help you create buttons, forms, cards, and more</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto px-4 py-6 scroll-smooth">
      <div className="space-y-4 max-w-4xl mx-auto w-full">
        {messages.map((message) => {
          const messageKey = message.id || String(messages.indexOf(message));
          const isLastMessage = messages.indexOf(message) === messages.length - 1;
          const textParts = message.parts.filter((p) => p.type === "text");
          const hasText = textParts.length > 0;

          return (
            <div
              key={messageKey}
              className={cn(
                "flex items-end gap-3",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {message.role === "assistant" && (
                <div className="flex-shrink-0 mb-0.5">
                  <div className="w-8 h-8 rounded-full bg-white border border-neutral-200 shadow-sm flex items-center justify-center">
                    <Bot className="h-4 w-4 text-neutral-600" />
                  </div>
                </div>
              )}

              <div className={cn(
                "flex flex-col gap-1.5 max-w-[80%]",
                message.role === "user" ? "items-end" : "items-start"
              )}>
                <div className={cn(
                  "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                  message.role === "user"
                    ? "bg-blue-600 text-white rounded-br-sm"
                    : "bg-white text-neutral-900 border border-neutral-100 shadow-sm rounded-bl-sm"
                )}>
                  {hasText || message.parts.length > 0 ? (
                    <>
                      {message.parts.map((part, partIndex) => {
                        if (part.type === "text") {
                          return message.role === "user" ? (
                            <span key={partIndex} className="whitespace-pre-wrap">{part.text}</span>
                          ) : (
                            <MarkdownRenderer
                              key={partIndex}
                              content={part.text}
                              className="prose-sm"
                            />
                          );
                        }

                        if (part.type === "reasoning") {
                          return (
                            <div key={partIndex} className="mt-2 p-2.5 bg-neutral-50 rounded-lg border border-neutral-100">
                              <span className="text-xs font-medium text-neutral-500 block mb-1">Reasoning</span>
                              <span className="text-xs text-neutral-600">{part.text}</span>
                            </div>
                          );
                        }

                        if (part.type.startsWith("tool-")) {
                          const toolName = part.type.slice(5);
                          const toolPart = part as any;
                          const done = toolPart.state === "output-available";
                          return (
                            <ToolInvocationBadge
                              key={partIndex}
                              toolName={toolName}
                              input={toolPart.input}
                              done={done}
                            />
                          );
                        }

                        if (part.type === "step-start") {
                          return partIndex > 0 ? <hr key={partIndex} className="my-2 border-neutral-100" /> : null;
                        }

                        return null;
                      })}
                      {isLoading && message.role === "assistant" && isLastMessage && !hasText && (
                        <div className="flex items-center gap-1.5 text-neutral-400">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span className="text-xs">Generating...</span>
                        </div>
                      )}
                      {isLoading && message.role === "assistant" && isLastMessage && hasText && (
                        <div className="flex items-center gap-1.5 mt-2 text-neutral-400">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span className="text-xs">Generating...</span>
                        </div>
                      )}
                    </>
                  ) : isLoading && message.role === "assistant" && isLastMessage ? (
                    <div className="flex items-center gap-1.5 text-neutral-400">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span className="text-xs">Generating...</span>
                    </div>
                  ) : null}
                </div>
              </div>

              {message.role === "user" && (
                <div className="flex-shrink-0 mb-0.5">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
