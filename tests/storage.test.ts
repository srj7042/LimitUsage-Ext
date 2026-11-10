import { describe, it, expect, beforeEach } from "vitest";
import { StorageService } from "@/storage/db";
import { ConversationUsage, ProviderQuota } from "@/types";

describe("Storage & IndexedDB Suite", () => {
  beforeEach(async () => {
    await StorageService.wipeAllData();
  });

  it("persists conversation and retrieves it accurately", async () => {
    const mockConv: ConversationUsage = {
      id: "chatgpt-123",
      provider: "chatgpt",
      title: "React Architecture Discussion",
      model: "GPT-4o",
      url: "https://chatgpt.com/c/123",
      inTokens: 250,
      outTokens: 750,
      totalTokens: 1000,
      contextLimit: 128000,
      utilizationPct: 0.8,
      messageCount: 4,
      accuracy: "Estimated",
      lastUpdated: Date.now(),
      isPartial: false,
    };

    await StorageService.saveConversation(mockConv);
    const retrieved = await StorageService.getConversation("chatgpt-123");

    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe("chatgpt-123");
    expect(retrieved?.totalTokens).toBe(1000);
    expect(retrieved?.provider).toBe("chatgpt");
  });

  it("aggregates daily summaries when conversations are saved", async () => {
    const mockConv: ConversationUsage = {
      id: "claude-456",
      provider: "claude",
      title: "Data Pipelines Analysis",
      model: "Claude 3.5 Sonnet",
      url: "https://claude.ai/chat/456",
      inTokens: 500,
      outTokens: 1500,
      totalTokens: 2000,
      contextLimit: 200000,
      utilizationPct: 1.0,
      messageCount: 2,
      accuracy: "Estimated",
      lastUpdated: Date.now(),
      isPartial: false,
    };

    await StorageService.saveConversation(mockConv);
    const summaries = await StorageService.getDailySummaries();

    expect(summaries.length).toBeGreaterThan(0);
    const claudeSummary = summaries.find((s) => s.provider === "claude");
    expect(claudeSummary).toBeDefined();
    expect(claudeSummary?.totalTokens).toBe(2000);
  });

  it("persists provider quotas and verifies them", async () => {
    const quota: ProviderQuota = {
      provider: "claude",
      planName: "Free Tier",
      remaining: 5,
      limit: 10,
      resetAt: Date.now() + 3600000,
      verifiedStatus: "Provider Verified",
      rateLimitMessage: "5 messages remaining until 3pm",
      lastChecked: Date.now(),
    };

    await StorageService.saveProviderQuota(quota);
    const saved = await StorageService.getProviderQuota("claude");

    expect(saved).toBeDefined();
    expect(saved?.remaining).toBe(5);
    expect(saved?.verifiedStatus).toBe("Provider Verified");
  });

  it("exports data to clean JSON and CSV formats", async () => {
    const mockConv: ConversationUsage = {
      id: "gemini-789",
      provider: "gemini",
      title: "Gemini 1.5 Code Test",
      model: "Gemini 1.5 Flash",
      url: "https://gemini.google.com/app/789",
      inTokens: 100,
      outTokens: 200,
      totalTokens: 300,
      contextLimit: 1048576,
      utilizationPct: 0.03,
      messageCount: 2,
      accuracy: "Estimated",
      lastUpdated: Date.now(),
      isPartial: false,
    };

    await StorageService.saveConversation(mockConv);

    const jsonExport = await StorageService.exportAllDataAsJson();
    const parsed = JSON.parse(jsonExport);
    expect(parsed.extension).toBe("AI Usage Companion");
    expect(parsed.conversations.length).toBe(1);

    const csvExport = await StorageService.exportAsCsv();
    expect(csvExport).toContain("gemini-789");
    expect(csvExport).toContain("Gemini 1.5 Flash");
    expect(csvExport).toContain("300");
  });

  it("supports nuclear wipe and provider-specific clearing", async () => {
    const c1: ConversationUsage = {
      id: "c1",
      provider: "chatgpt",
      title: "Chat 1",
      model: "GPT-4o",
      url: "https://chatgpt.com",
      inTokens: 10,
      outTokens: 20,
      totalTokens: 30,
      contextLimit: 128000,
      utilizationPct: 0.1,
      messageCount: 1,
      accuracy: "Estimated",
      lastUpdated: Date.now(),
      isPartial: false,
    };
    const c2: ConversationUsage = {
      id: "c2",
      provider: "claude",
      title: "Chat 2",
      model: "Claude 3.5 Sonnet",
      url: "https://claude.ai",
      inTokens: 10,
      outTokens: 20,
      totalTokens: 30,
      contextLimit: 200000,
      utilizationPct: 0.1,
      messageCount: 1,
      accuracy: "Estimated",
      lastUpdated: Date.now(),
      isPartial: false,
    };

    await StorageService.saveConversation(c1);
    await StorageService.saveConversation(c2);

    // Clear chatgpt only
    await StorageService.clearProviderData("chatgpt");
    expect(await StorageService.getConversation("c1")).toBeUndefined();
    expect(await StorageService.getConversation("c2")).toBeDefined();

    // Wipe all
    await StorageService.wipeAllData();
    expect(await StorageService.getConversation("c2")).toBeUndefined();
  });
});

