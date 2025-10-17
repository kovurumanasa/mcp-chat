import { createAzure } from '@ai-sdk/azure';
import { customProvider, wrapLanguageModel, extractReasoningMiddleware } from "ai";

// Optional middleware for reasoning markup
const middleware = extractReasoningMiddleware({ tagName: 'think' });

export interface ModelInfo {
  provider: string;
  name: string;
  description: string;
  apiVersion: string;
  capabilities: string[];
}

// 🔑 Helper to retrieve API keys (env first, then localStorage)
const getApiKey = (key: string): string | undefined => {
  if (process.env[key]) return process.env[key];
  if (typeof window !== 'undefined') return window.localStorage.getItem(key) || undefined;
  return undefined;
};

// 🔧 Azure-specific settings from environment variables or fallback
const azureApiKey = getApiKey('AZURE_API_KEY');
const azureResourceName = process.env.AZURE_RESOURCE_NAME || 'azscaappllmsda1304023078'; // your Azure resource name
const azureDeploymentName = process.env.AZURE_DEPLOYMENT_NAME || 'gpt-4o'; // deployment name from Azure portal
const azureApiVersion = process.env.AZURE_API_VERSION || '2024-04-01-preview';

// ✅ Create Azure client
const azureOpenAIClient = createAzure({
  apiKey: azureApiKey,
  resourceName: azureResourceName,
  apiVersion: azureApiVersion,
  useDeploymentBasedUrls: true, 
});

// ✅ Define available models using deployment name
const languageModels = {
  "azure-gpt-4o": azureOpenAIClient('gpt-4o'),
};

// ✅ Metadata about the model
export const modelDetails: Record<keyof typeof languageModels, ModelInfo> = {
  "azure-gpt-4o": {
    provider: "Azure OpenAI",
    name: "GPT-4o",
    description: "Flagship multimodal model on Azure OpenAI combining text, vision, and audio capabilities, delivering state-of-the-art generative and conversational AI performance, with efficiency and broad language support.",
    apiVersion: azureApiVersion,
    capabilities: [
      "Multimodal",
      "Multilingual",
      "Vision",
      "Audio",
      "Advanced Reasoning",
      "Real-time Interaction",
      "Code Generation",
      "Large Context Window"
    ]
  },
};

// 🔁 Live-update if localStorage changes API key (runtime only)
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key?.includes('API_KEY')) {
      window.location.reload();
    }
  });
}

// ✅ Final exported model for app-wide use
export const model = customProvider({ languageModels });

export type modelID = keyof typeof languageModels;
export const MODELS = Object.keys(languageModels);
export const defaultModel: modelID = "azure-gpt-4o";
