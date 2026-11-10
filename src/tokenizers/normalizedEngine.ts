import { AccuracyLevel, ContextHealth, ConversationUsage, MessageTurn, ProviderId } from "../types";
import { TokenizerAdapter } from "./base";
import { gptTokenizer } from "./gptTokenizer";
import { claudeTokenizer } from "./claudeTokenizer";
import { geminiTokenizer } from "./geminiTokenizer";
import { perplexityTokenizer } from "./perplexityTokenizer";
import { resolveModelByText } from "../utils/models";

export function getTokenizerForProvider(provider: ProviderId, modelName?: string): TokenizerAdapter {
  switch (provider) {
    case "chatgpt":
      return gptTokenizer;
    case "claude":
      return claudeTokenizer;
    case "gemini":
      return geminiTokenizer;
    case "perplexity":
      return perplexityTokenizer;
    case "cursor":
      if (modelName && (modelName.toLowerCase().includes("claude") || modelName.toLowerCase().includes("sonnet"))) {
        return claudeTokenizer;
      }
      return gptTokenizer;
    case "antigravity":
      return geminiTokenizer;
    default:
      return gptTokenizer;
  }
}

export interface EngineInput {
  provider: ProviderId;
  conversationId: string;
  title: string;
  url: string;
  rawModelText?: string;
  messages: Array<{
    id?: string;
    role: "user" | "assistant" | "system";
    content: string;
  }>;
  isDomVirtualized?: boolean;
  providerVerifiedTokens?: number;
  lastUpdated?: number;
}

export class NormalizedUsageEngine {
  /**
   * Calculate normalized conversation usage from parsed messages and provider details.
   */
  static processConversation(input: EngineInput): {
    usage: ConversationUsage;
    turns: MessageTurn[];
    health: ContextHealth;
  } {
    const {
      provider,
      conversationId,
      title,
      url,
      rawModelText = "",
      messages,
      isDomVirtualized = false,
      providerVerifiedTokens,
      lastUpdated = Date.now(),
    } = input;

    const modelMeta = resolveModelByText(provider, rawModelText);
    const tokenizer = getTokenizerForProvider(provider, modelMeta.id);

    const turns: MessageTurn[] = [];
    let inTokens = 0;
    let outTokens = 0;

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const count = tokenizer.countTokens(msg.content);
      const isInput = msg.role === "user" || msg.role === "system";
      
      const turnIn = isInput ? count + 3 : 0;
      const turnOut = isInput ? 0 : count + 3;

      inTokens += turnIn;
      outTokens += turnOut;

      turns.push({
        id: msg.id || `${conversationId}-msg-${i}`,
        role: msg.role,
        content: msg.content,
        inTokens: turnIn,
        outTokens: turnOut,
        totalTokens: turnIn + turnOut,
        timestamp: lastUpdated,
      });
    }

    // Determine total tokens
    const estimatedTotal = inTokens + outTokens;
    const finalTotal = typeof providerVerifiedTokens === "number" && providerVerifiedTokens > 0
      ? providerVerifiedTokens
      : estimatedTotal;

    // Determine Accuracy
    let accuracy: AccuracyLevel = "Estimated";
    if (typeof providerVerifiedTokens === "number" && providerVerifiedTokens > 0) {
      accuracy = "Provider Verified";
    } else if (isDomVirtualized) {
      accuracy = "Partial";
    } else if (messages.length === 0) {
      accuracy = "Unavailable";
    } else if (Date.now() - lastUpdated > 30 * 60 * 1000) {
      accuracy = "Stale";
    }

    // Calculate context utilization
    const contextLimit = modelMeta.contextWindow;
    const utilizationPct = contextLimit > 0
      ? Math.min(100, Math.round((finalTotal / contextLimit) * 1000) / 10)
      : 0;

    // Determine health
    let health: ContextHealth = "safe";
    if (utilizationPct >= 90) {
      health = "danger";
    } else if (utilizationPct >= 70) {
      health = "warning";
    }

    const usage: ConversationUsage = {
      id: conversationId,
      provider,
      title: title || `${modelMeta.name} Session`,
      model: modelMeta.name,
      url,
      inTokens,
      outTokens,
      totalTokens: finalTotal,
      contextLimit,
      utilizationPct,
      messageCount: messages.length,
      accuracy,
      lastUpdated,
      isPartial: isDomVirtualized,
    };

    return {
      usage,
      turns,
      health,
    };
  }
}

