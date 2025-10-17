"use client";
import { useEffect, useState } from "react";
import { nanoid } from "nanoid";
import { useChat } from "@ai-sdk/react";
import { Textarea } from "./textarea";
import { useLocalStorage } from "@/lib/hooks/use-local-storage";
import { defaultModel, type modelID } from "@/ai/providers";
import { Messages } from "./messages";
import { ProjectOverview } from "./project-overview";
import { useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMemo } from "react";
import { useMCP } from "@/lib/context/mcp-context";
import { getUserId } from "@/lib/user-id";
import { useAuth } from "@/lib/msal-provider";

export default function Chat() {
  const [chatId, setChatId] = useState<string>("");
  const userId = getUserId();
  const [selectedModel, setSelectedModel] = useLocalStorage<modelID>("selectedModel", defaultModel);
  const router = useRouter();
  const params = useParams();
  const [initialMessages, setInitialMessages] = useState<any[]>([]);
  useEffect(() => {
    setChatId(nanoid());
  }, []);
  const effectiveChatId = (params as { id?: string })?.id || chatId;

  // Hydrate messages from server if chatId is present
  useEffect(() => {
    async function fetchInitialMessages() {
      if (params?.id) {
        try {
          const res = await fetch(`/api/chats/${params.id}`, {
            headers: { 'x-user-id': userId }
          });
          if (res.ok) {
            const chat = await res.json();
            if (chat && Array.isArray(chat.messages)) {
              // Lightweight client-side conversion
              setInitialMessages(chat.messages.map((message: any) => {
                let parts: any[] = [];
                try {
                  parts = JSON.parse(message.parts);
                } catch {}
                return {
                  id: message.id,
                  parts,
                  role: message.role,
                  content: parts.filter((p: any) => p.type === 'text' && p.text).map((p: any) => p.text).join('\n'),
                  createdAt: message.createdAt,
                };
              }));
            }
          }
        } catch (e) {
          // fail silently
        }
      }
    }
    fetchInitialMessages();
  }, [params?.id, userId]);

  const { mcpServersForApi: rawMcpServersForApi } = useMCP();
  const { accessToken } = useAuth();
  // Memoize mcpServersForApi so it only changes when its contents change
  const mcpServersForApi = useMemo(() => rawMcpServersForApi, [JSON.stringify(rawMcpServersForApi)]);

  const [inputValue, setInputValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingNewChat, setPendingNewChat] = useState(false);
  let useChatResult: ReturnType<typeof useChat> | null = null;
  const { messages, handleInputChange, handleSubmit, status, stop } = useChat({
    id: effectiveChatId,
    body: {
      chatId: effectiveChatId,
      userId: userId,
      selectedModel: selectedModel,
      mcpServers: mcpServersForApi,
      accessToken, // <-- send token to API
    },
    streamProtocol: "text",
    initialMessages: initialMessages,
    maxSteps: 20,
    experimental_throttle: 500,
    onFinish: (message) => {
      // Custom logic when a message finishes streaming
      setIsSubmitting(false);
      setInputValue("");
    },
  });
  const isLoading = status === "streaming" || status === "submitted";
  const validRoles = new Set(['system', 'user', 'assistant']);
  const mergedMessages = messages
    .filter(m => validRoles.has(m.role))
    .map(m => {
      if (!m.parts && typeof m.content === 'string') {
        return {
          ...m,
          parts: [{ type: 'text', text: m.content }]
        };
      }
      return m;
    });

  let handleFormSubmit: ((e: React.FormEvent<HTMLFormElement>) => void) | undefined;
  handleFormSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('[Chat Component] Form submit called', { chatId, inputValue, isSubmitting, pendingNewChat, ts: new Date().toISOString() });
    if (isSubmitting) return;
    // if (!inputValue.trim()) return;

    if (!params?.id) {
      // First message in a new chat session
      router.push(`/chat/${chatId}`);
      // return;
    }

    // if (pendingNewChat) {
    //   // Wait for URL update and remount before submitting
    //   return;
    // }

    setIsSubmitting(true);
    // For existing chat, proceed as usual
    handleSubmit(e);

    
  }, [chatId, inputValue, isSubmitting, router, useChatResult, pendingNewChat]);

  const MsalLoginButton = require("@/components/msal-login-button").MsalLoginButton;
  return (
    <div className="h-dvh flex flex-col justify-center w-full max-w-3xl mx-auto px-4 sm:px-6 md:py-4">
      {/* <div className="mb-4 flex justify-end">
        <MsalLoginButton />
      </div> */}
      {mergedMessages.length === 0 && (
        <div className="max-w-xl mx-auto w-full">
          <ProjectOverview />
        </div>
      )}
      {mergedMessages.length > 0 && (
        <div className="flex-1 overflow-y-auto min-h-0 pb-2">
          <Messages
            messages={mergedMessages.filter(m => m.role === "system" || m.role === "user" || m.role === "assistant") as any}
            isLoading={isLoading}
            status={status}
          />
        </div>
      )}
      <form
        onSubmit={handleFormSubmit}
        className={mergedMessages.length === 0 ? "mt-4 w-full mx-auto" : "mt-2 w-full mx-auto mb-4 sm:mb-auto"}
      >
        <Textarea
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          handleInputChange={(e) => {
            handleInputChange(e);
            setInputValue(e.target.value);
          }}
          input={inputValue}
          isLoading={isLoading}
          status={status}
          stop={stop}
        />
      </form>
    </div>
  );
}