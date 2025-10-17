"use server";

import { createAzure } from '@ai-sdk/azure';
import { customProvider, extractReasoningMiddleware, generateObject } from "ai";
import { z } from "zod";

// Optional middleware
const middleware = extractReasoningMiddleware({ tagName: 'think' });

// Azure config
const azureApiKey = process.env.AZURE_API_KEY;
const azureResourceName = process.env.AZURE_RESOURCE_NAME || 'azscaappllmsda1304023078';
const azureDeploymentName = process.env.AZURE_DEPLOYMENT_NAME || 'gpt-4o';
const azureApiVersion = process.env.AZURE_API_VERSION || '2024-04-01-preview';

// Azure client
const azureOpenAIClient = createAzure({
  apiKey: azureApiKey,
  resourceName: azureResourceName,
  apiVersion: azureApiVersion,
  useDeploymentBasedUrls: true,
});

// Define models
const languageModels = {
  "azure-gpt-4o": azureOpenAIClient(azureDeploymentName),
};

// ✅ Pick the specific language model (not the full provider)
const azureLanguageModel = languageModels["azure-gpt-4o"];

// Extract text helper
function getMessageText(message: any): string {
  if (message.parts && Array.isArray(message.parts)) {
    const textParts = message.parts.filter((p: any) => p.type === 'text' && p.text);
    if (textParts.length > 0) return textParts.map((p: any) => p.text).join('\n');
  }
  if (typeof message.content === 'string') return message.content;
  if (Array.isArray(message.content)) {
    const textItems = message.content.filter((item: any) =>
      typeof item === 'string' || (item.type === 'text' && item.text)
    );
    if (textItems.length > 0) return textItems.map((item: any) => typeof item === 'string' ? item : item.text).join('\n');
  }
  return '';
}

// Main function
export async function generateTitle(messages: any[]): Promise<string> {
  try {
    const userMessage = messages.find(m => m.role === 'user');
    if (!userMessage) return 'New Chat';

    const messageText = getMessageText(userMessage);
    if (!messageText.trim()) return 'New Chat';

    const { object: titleObject } = await generateObject({
      model: azureLanguageModel, // ✅ Pass the LanguageModel, not the Provider
      schema: z.object({
        title: z.string().describe("A short, descriptive title for the conversation"),
      }),
      prompt: `Generate a concise title (max 6 words) for a conversation that starts with: "${messageText.slice(0, 200)}"`,
      middleware, // optional
    });

    return titleObject.title || 'New Chat';
  } catch (error) {
    console.error('Error generating title:', error);
    return 'New Chat';
  }
}
