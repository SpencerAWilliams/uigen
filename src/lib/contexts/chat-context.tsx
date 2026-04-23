"use client";

import {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { useChat as useAIChat } from "@ai-sdk/react";
import { DefaultChatTransport, UIMessage } from "ai";
import { useFileSystem } from "./file-system-context";
import { setHasAnonWork } from "@/lib/anon-work-tracker";

interface ChatContextProps {
  projectId?: string;
  initialMessages?: UIMessage[];
}

interface ChatContextType {
  messages: UIMessage[];
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  status: string;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({
  children,
  projectId,
  initialMessages = [],
}: ChatContextProps & { children: ReactNode }) {
  const { fileSystem, handleToolCall } = useFileSystem();
  const [input, setInput] = useState("");
  const appliedToolCallIds = useRef(new Set<string>());

  const { sendMessage, messages, status } = useAIChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: () => ({
        files: fileSystem.serialize(),
        projectId,
      }),
    }),
    messages: initialMessages,
    onToolCall: ({ toolCall }) => {
      handleToolCall({ toolName: toolCall.toolName, args: (toolCall as any).input });
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    sendMessage({ text: trimmed });
    setInput("");
  };

  // Apply server-executed tool calls to the client file system as they stream in.
  // onToolCall only fires for client-side tools; server-side tools must be extracted from messages.
  useEffect(() => {
    for (const message of messages) {
      if (message.role !== "assistant") continue;
      for (const part of message.parts) {
        if (!part.type.startsWith("tool-")) continue;
        const toolPart = part as any;
        const callId: string | undefined = toolPart.toolCallId;
        if (!callId || appliedToolCallIds.current.has(callId)) continue;
        if (!toolPart.input) continue;
        appliedToolCallIds.current.add(callId);
        handleToolCall({ toolName: toolPart.toolName ?? part.type.slice(5), args: toolPart.input });
      }
    }
  }, [messages, handleToolCall]);

  useEffect(() => {
    if (!projectId && messages.length > 0) {
      setHasAnonWork(messages, fileSystem.serialize());
    }
  }, [messages, fileSystem, projectId]);

  return (
    <ChatContext.Provider
      value={{
        messages,
        input,
        handleInputChange,
        handleSubmit,
        status,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
