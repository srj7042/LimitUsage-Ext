import { describe, it, expect } from "vitest";
import { NormalizedUsageEngine } from "@/tokenizers/normalizedEngine";

describe("Precision & Non-Fabrication Suite", () => {
  it("labels accuracy as Provider Verified when verified token count is provided", () => {
    const { usage } = NormalizedUsageEngine.processConversation({
      provider: "claude",
      conversationId: "conv-verified",
      title: "Claude Chat",
      url: "https://claude.ai/chat/123",
      messages: [{ role: "user", content: "Hello" }],
      providerVerifiedTokens: 520,
    });

    expect(usage.accuracy).toBe("Provider Verified");
    expect(usage.totalTokens).toBe(520);
  });

  it("labels accuracy as Partial when DOM is virtualized or truncated", () => {
    const { usage } = NormalizedUsageEngine.processConversation({
      provider: "chatgpt",
      conversationId: "conv-clipped",
      title: "Large Chat",
      url: "https://chatgpt.com/c/large",
      messages: [{ role: "user", content: "Test" }],
      isDomVirtualized: true,
    });

    expect(usage.accuracy).toBe("Partial");
    expect(usage.isPartial).toBe(true);
  });

  it("labels accuracy as Unavailable when no messages are found", () => {
    const { usage } = NormalizedUsageEngine.processConversation({
      provider: "gemini",
      conversationId: "empty-conv",
      title: "New Session",
      url: "https://gemini.google.com/app",
      messages: [],
    });

    expect(usage.accuracy).toBe("Unavailable");
    expect(usage.totalTokens).toBe(0);
  });

  it("labels accuracy as Stale when conversation has not been updated for > 30 minutes", () => {
    const pastTimestamp = Date.now() - 40 * 60 * 1000; // 40m ago
    const { usage } = NormalizedUsageEngine.processConversation({
      provider: "perplexity",
      conversationId: "stale-conv",
      title: "Old Search",
      url: "https://perplexity.ai/search/1",
      messages: [{ role: "user", content: "Query" }],
      lastUpdated: pastTimestamp,
    });

    expect(usage.accuracy).toBe("Stale");
  });

  it("escalates warning and danger health states accurately without hardcoding", () => {
    // 95% utilization should trigger danger
    const { health: dangerHealth } = NormalizedUsageEngine.processConversation({
      provider: "perplexity",
      conversationId: "danger-conv",
      title: "Big Query",
      url: "https://perplexity.ai/search/1",
      messages: [{ role: "user", content: "Hello" }],
      providerVerifiedTokens: 31500, // 31500 / 32768 = ~96%
    });
    expect(dangerHealth).toBe("danger");

    // 75% utilization should trigger warning
    const { health: warnHealth } = NormalizedUsageEngine.processConversation({
      provider: "perplexity",
      conversationId: "warn-conv",
      title: "Medium Query",
      url: "https://perplexity.ai/search/1",
      messages: [{ role: "user", content: "Hello" }],
      providerVerifiedTokens: 25000, // 25000 / 32768 = ~76%
    });
    expect(warnHealth).toBe("warning");
  });
});

