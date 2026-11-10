import { ModelMetadata, ProviderId } from "../types";

export const MODEL_REGISTRY: Record<string, ModelMetadata> = {
  // ChatGPT Models
  "gpt-4o": {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "chatgpt",
    contextWindow: 128000,
    isDefaultFree: true,
  },
  "gpt-4o-mini": {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "chatgpt",
    contextWindow: 128000,
  },
  "o1": {
    id: "o1",
    name: "o1",
    provider: "chatgpt",
    contextWindow: 200000,
  },
  "o3-mini": {
    id: "o3-mini",
    name: "o3-mini",
    provider: "chatgpt",
    contextWindow: 128000,
  },
  "gpt-4": {
    id: "gpt-4",
    name: "GPT-4",
    provider: "chatgpt",
    contextWindow: 32768,
  },
  "chatgpt-default": {
    id: "chatgpt-default",
    name: "ChatGPT (Default)",
    provider: "chatgpt",
    contextWindow: 128000,
    isDefaultFree: true,
  },

  // Claude Models
  "claude-3-5-sonnet": {
    id: "claude-3-5-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "claude",
    contextWindow: 200000,
    isDefaultFree: true,
  },
  "claude-3-opus": {
    id: "claude-3-opus",
    name: "Claude 3 Opus",
    provider: "claude",
    contextWindow: 200000,
  },
  "claude-3-5-haiku": {
    id: "claude-3-5-haiku",
    name: "Claude 3.5 Haiku",
    provider: "claude",
    contextWindow: 200000,
  },
  "claude-default": {
    id: "claude-default",
    name: "Claude (Default)",
    provider: "claude",
    contextWindow: 200000,
    isDefaultFree: true,
  },

  // Gemini Models
  "gemini-1-5-flash": {
    id: "gemini-1-5-flash",
    name: "Gemini 1.5 Flash",
    provider: "gemini",
    contextWindow: 1048576,
    isDefaultFree: true,
  },
  "gemini-1-5-pro": {
    id: "gemini-1-5-pro",
    name: "Gemini 1.5 Pro",
    provider: "gemini",
    contextWindow: 2097152,
  },
  "gemini-2-0-flash": {
    id: "gemini-2-0-flash",
    name: "Gemini 2.0 Flash",
    provider: "gemini",
    contextWindow: 1048576,
  },
  "gemini-default": {
    id: "gemini-default",
    name: "Gemini (Web Default)",
    provider: "gemini",
    contextWindow: 1048576,
    isDefaultFree: true,
  },

  // Perplexity Models
  "sonar": {
    id: "sonar",
    name: "Perplexity Sonar",
    provider: "perplexity",
    contextWindow: 32768,
    isDefaultFree: true,
  },
  "sonar-pro": {
    id: "sonar-pro",
    name: "Perplexity Sonar Pro",
    provider: "perplexity",
    contextWindow: 65536,
  },
  "perplexity-default": {
    id: "perplexity-default",
    name: "Perplexity (Default)",
    provider: "perplexity",
    contextWindow: 32768,
    isDefaultFree: true,
  },

  // Cursor Desktop Models
  "cursor-claude-3-5": {
    id: "cursor-claude-3-5",
    name: "Cursor (Sonnet 3.5)",
    provider: "cursor",
    contextWindow: 200000,
  },
  "cursor-gpt-4o": {
    id: "cursor-gpt-4o",
    name: "Cursor (GPT-4o)",
    provider: "cursor",
    contextWindow: 128000,
  },
  "cursor-default": {
    id: "cursor-default",
    name: "Cursor Editor",
    provider: "cursor",
    contextWindow: 128000,
    isDefaultFree: true,
  },

  // Antigravity Desktop Models
  "antigravity-flash": {
    id: "antigravity-flash",
    name: "Antigravity (Flash)",
    provider: "antigravity",
    contextWindow: 1048576,
  },
  "antigravity-pro": {
    id: "antigravity-pro",
    name: "Antigravity (Pro)",
    provider: "antigravity",
    contextWindow: 2097152,
  },
  "antigravity-default": {
    id: "antigravity-default",
    name: "Google Antigravity",
    provider: "antigravity",
    contextWindow: 1048576,
    isDefaultFree: true,
  },
};

export function getProviderDefaultModel(provider: ProviderId): ModelMetadata {
  const match = Object.values(MODEL_REGISTRY).find(
    (m) => m.provider === provider && m.isDefaultFree
  );
  if (match) return match;
  return {
    id: `${provider}-unknown`,
    name: `${provider.toUpperCase()} (Standard)`,
    provider,
    contextWindow: 128000,
  };
}

export function resolveModelByText(provider: ProviderId, rawText: string): ModelMetadata {
  const normalized = rawText.toLowerCase().trim();
  
  if (provider === "chatgpt") {
    if (normalized.includes("o3-mini")) return MODEL_REGISTRY["o3-mini"];
    if (normalized.includes("o1")) return MODEL_REGISTRY["o1"];
    if (normalized.includes("mini") || normalized.includes("4o mini")) return MODEL_REGISTRY["gpt-4o-mini"];
    if (normalized.includes("4o")) return MODEL_REGISTRY["gpt-4o"];
    if (normalized.includes("gpt-4")) return MODEL_REGISTRY["gpt-4"];
    return MODEL_REGISTRY["chatgpt-default"];
  }

  if (provider === "claude") {
    if (normalized.includes("haiku")) return MODEL_REGISTRY["claude-3-5-haiku"];
    if (normalized.includes("opus")) return MODEL_REGISTRY["claude-3-opus"];
    if (normalized.includes("sonnet")) return MODEL_REGISTRY["claude-3-5-sonnet"];
    return MODEL_REGISTRY["claude-default"];
  }

  if (provider === "gemini") {
    if (normalized.includes("2.0") || normalized.includes("2-0")) return MODEL_REGISTRY["gemini-2-0-flash"];
    if (normalized.includes("pro") || normalized.includes("advanced")) return MODEL_REGISTRY["gemini-1-5-pro"];
    if (normalized.includes("flash")) return MODEL_REGISTRY["gemini-1-5-flash"];
    return MODEL_REGISTRY["gemini-default"];
  }

  if (provider === "perplexity") {
    if (normalized.includes("pro") || normalized.includes("sonar-pro")) return MODEL_REGISTRY["sonar-pro"];
    if (normalized.includes("sonar")) return MODEL_REGISTRY["sonar"];
    return MODEL_REGISTRY["perplexity-default"];
  }

  if (provider === "cursor") {
    if (normalized.includes("sonnet") || normalized.includes("claude")) return MODEL_REGISTRY["cursor-claude-3-5"];
    if (normalized.includes("gpt")) return MODEL_REGISTRY["cursor-gpt-4o"];
    return MODEL_REGISTRY["cursor-default"];
  }

  if (provider === "antigravity") {
    if (normalized.includes("pro")) return MODEL_REGISTRY["antigravity-pro"];
    return MODEL_REGISTRY["antigravity-default"];
  }

  return getProviderDefaultModel(provider);
}

