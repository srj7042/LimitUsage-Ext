import { ProviderAdapter } from "./types";
import { chatgptAdapter } from "./chatgptAdapter";
import { claudeAdapter } from "./claudeAdapter";
import { geminiAdapter } from "./geminiAdapter";
import { perplexityAdapter } from "./perplexityAdapter";
import { cursorAdapter } from "./cursorAdapter";
import { antigravityAdapter } from "./antigravityAdapter";
import { ProviderId } from "../types";

export const ALL_ADAPTERS: ProviderAdapter[] = [
  chatgptAdapter,
  claudeAdapter,
  geminiAdapter,
  perplexityAdapter,
  cursorAdapter,
  antigravityAdapter,
];

export function findAdapterForUrl(url: string): ProviderAdapter | null {
  return ALL_ADAPTERS.find((a) => a.matches(url)) || null;
}

export function getAdapterByProviderId(id: ProviderId): ProviderAdapter | undefined {
  return ALL_ADAPTERS.find((a) => a.providerId === id);
}

