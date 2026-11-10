/**
 * Core domain types for AI Usage Companion
 */

export type ProviderId =
  | "chatgpt"
  | "claude"
  | "gemini"
  | "perplexity"
  | "cursor"
  | "antigravity";

export type AccuracyLevel =
  | "Estimated"
  | "Provider Verified"
  | "Partial"
  | "Unavailable"
  | "Stale";

export type ContextHealth = "safe" | "warning" | "danger" | "unknown";

export interface MessageTurn {
  id: string; // unique hash or DOM selector id
  role: "user" | "assistant" | "system";
  content: string;
  inTokens: number;
  outTokens: number;
  totalTokens: number;
  timestamp: number;
}

export interface ConversationUsage {
  id: string; // unique conversation ID (e.g. chatgpt UUID, claude chat ID, or URL hash)
  provider: ProviderId;
  title: string;
  model: string;
  url: string;
  inTokens: number;
  outTokens: number;
  totalTokens: number;
  contextLimit: number;
  utilizationPct: number;
  messageCount: number;
  accuracy: AccuracyLevel;
  lastUpdated: number;
  isPartial: boolean;
}

export interface ProviderQuota {
  provider: ProviderId;
  planName: string; // e.g. "Free Tier", "Plus", "Pro"
  remaining: number | null; // e.g. 5 messages or null if not exposed
  limit: number | null; // e.g. 10 or null
  resetAt: number | null; // timestamp of reset
  verifiedStatus: AccuracyLevel; // usually "Provider Verified" if banner parsed, or "Unavailable"
  rateLimitMessage?: string;
  lastChecked: number;
}

export interface DailySummary {
  date: string; // YYYY-MM-DD
  provider: ProviderId;
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  conversationCount: number;
  messageCount: number;
}

export interface UserSettings {
  theme: "dark";
  alertThresholdPercent: number; // e.g. 80 (warn at 80% context)
  highAlertThresholdPercent: number; // e.g. 90
  floatingBarEnabled: boolean;
  floatingBarCollapsed: boolean;
  floatingBarPosition: {
    x: number;
    y: number;
  };
  siteOverrides: Record<string, { enabled: boolean }>;
  nativeCompanionToken: string;
  nativeCompanionEnabled: boolean;
  nativeCompanionStatus: "disconnected" | "connected" | "error";
  nativeCompanionLastPing: number | null;
}

export interface ModelMetadata {
  id: string;
  name: string;
  provider: ProviderId;
  contextWindow: number;
  isDefaultFree?: boolean;
}

export interface NativeCompanionPayload {
  action: "ping" | "sync_cursor" | "sync_antigravity";
  token: string;
}

export interface NativeCompanionResponse {
  success: boolean;
  provider?: "cursor" | "antigravity";
  data?: {
    conversations: ConversationUsage[];
    quota?: ProviderQuota;
  };
  error?: string;
}

