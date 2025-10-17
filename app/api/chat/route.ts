import { model, type modelID } from "@/ai/providers";
import { smoothStream, streamText, type UIMessage } from "ai";
import { saveChat, saveMessages, convertToDBMessages } from '@/lib/chat-store';
import { nanoid } from 'nanoid';
import { db } from '@/lib/db';
import { chats } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { initializeMCPClients, type MCPServerConfig, buildAuthHeaders } from '@/lib/mcp-client';
import { generateTitle } from '@/app/actions';

import { checkBotId } from "botid/server";

function appendResponseMessages(original: UIMessage[], responseMessages: UIMessage[]) {
  // Simple concat keeps order: original messages first, then model/tool response messages.
  return [...original, ...responseMessages];
}

// Route handler for POST requests
export async function POST(req: Request) {
  const {
    messages,
    chatId,
    selectedModel,
    userId,
    mcpServers = [],
    accessToken,
  }: {
    messages: UIMessage[];
    chatId?: string;
    selectedModel: modelID;
    userId: string;
    mcpServers?: MCPServerConfig[];
    accessToken?: string;
  } = await req.json();

  const { isBot, isGoodBot } = await checkBotId();
  if (isBot && !isGoodBot) {
    return new Response(
      JSON.stringify({ error: "Bot is not allowed to access this endpoint" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!userId) {
    return new Response(
      JSON.stringify({ error: "User ID is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const id = chatId || nanoid();

  // Check if chat already exists for the given ID
  // If not, create it now
  let isNewChat = false;
  if (chatId) {
    try {
      const existingChat = await db.query.chats.findFirst({
        where: and(
          eq(chats.id, chatId),
          eq(chats.userId, userId)
        )
      });
      isNewChat = !existingChat;
    } catch (error) {
      console.error("Error checking for existing chat:", error);
      isNewChat = true;
    }
  } else {
    // No ID provided, definitely new
    isNewChat = true;
  }

  // If it's a new chat, save it immediately
  if (isNewChat && messages.length > 0) {
    try {
      // Generate a title based on first user message
      const userMessage = messages.find(m => m.role === 'user');
      let title = 'New Chat';

      if (userMessage) {
        try {
          title = await generateTitle([userMessage]);
        } catch (error) {
          console.error("Error generating title:", error);
        }
      }

      // Save the chat immediately so it appears in the sidebar
      await saveChat({
        id,
        userId,
        title,
        messages: [],
      });
    } catch (error) {
      console.error("Error saving new chat:", error);
    }
  }

  // Build extra headers from accessToken (if provided)
  const extraHeaders = buildAuthHeaders(accessToken);
  // Initialize MCP clients using the already running persistent HTTP/SSE servers
  const { tools, cleanup } = await initializeMCPClients(mcpServers, req.signal, extraHeaders);

  // console.log("messages", messages);
  // console.log("parts", messages.map(m => m.parts.map(p => p)));

  // Track if the response has completed
  let responseCompleted = false;

  const result = streamText({
    model: model.languageModel(selectedModel),
    system: `You are a helpful assistant with access to a variety of tools.

    Today's date is ${new Date().toISOString().split('T')[0]}.

    The tools are very powerful, and you can use them to answer the user's question.
    So choose the tool that is most relevant to the user's question.

    If tools are not available, say you don't know or if the user wants a tool they can add one from the server icon in bottom left corner in the sidebar.

    You can use multiple tools in a single response.
    Always respond after using the tools for better user experience.
    You can run multiple steps using all the tools!!!!
    Make sure to use the right tool to respond to the user's question.

    Multiple tools can be used in a single response and multiple steps can be used to answer the user's question.

    ## Response Format
    - Markdown is supported.
    - Respond according to tool's response.
    - Use the tools to answer the user's question.
    - If you don't know the answer, use the tools to find the answer or say you don't know.
    `,
    messages,
    tools,
    maxSteps: 20,
    providerOptions: {
      azure: { apiVersion: process.env.AZURE_API_VERSION || '2024-04-01-preview' },
    },
    stopWhen: (lastStep) => lastStep.type === 'tool-result' && lastStep.toolCall.toolName === 'final_tool',
    experimental_transform: smoothStream({
      delayInMs: 5, // optional: defaults to 10ms
      chunking: 'line', // optional: defaults to 'word'
    }),
    onError: (error) => {
      console.error(JSON.stringify(error, null, 2));
    },
    async onFinish({ response }) {
      responseCompleted = true;
      // Convert ResponseMessage[] to UIMessage[]
      const responseUIMessages: UIMessage[] = response.messages.map((msg, idx) => ({
        id: msg.id ?? nanoid(),
        role: msg.role,
        parts: msg.parts ?? [{ type: "text", content: msg.content ?? "" }],
        ...(msg as any)
      }));

      const allMessages = appendResponseMessages(
        messages,
        responseUIMessages,
      );

      await saveChat({
        id,
        userId,
        messages: allMessages,
      });

      const dbMessages = convertToDBMessages(allMessages, id);
      await saveMessages({ messages: dbMessages });

      // Clean up resources - now this just closes the client connections
      // not the actual servers which persist in the MCP context
      await cleanup();
    }
  });

  // Ensure cleanup happens if the request is terminated early
  req.signal.addEventListener('abort', async () => {
    if (!responseCompleted) {
      console.log("Request aborted, cleaning up resources");
      try {
        await cleanup();
      } catch (error) {
        console.error("Error during cleanup on abort:", error);
      }
    }
  });

  result.consumeStream()
  // Add chat ID to response headers so client can know which chat was created
  return result.toTextStreamResponse({
    headers: {
      'X-Chat-ID': id
    }
  });
}