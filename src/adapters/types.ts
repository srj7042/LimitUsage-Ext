import { EngineInput } from "../tokenizers/normalizedEngine";
import { ProviderId, ProviderQuota } from "../types";

export interface ParsedMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ProviderDOMSnapshot {
  conversationId: string;
  title: string;
  rawModelText: string;
  messages: ParsedMessage[];
  isDomVirtualized: boolean;
  quota?: ProviderQuota;
}

export interface ProviderAdapter {
  providerId: ProviderId;
  name: string;
  supportedHosts: string[];
  matches(url: string): boolean;
  parseSnapshot(doc: Document, url: string): ProviderDOMSnapshot | null;
  observeChanges(
    doc: Document,
    onChange: (snapshot: ProviderDOMSnapshot) => void
  ): () => void;
}

