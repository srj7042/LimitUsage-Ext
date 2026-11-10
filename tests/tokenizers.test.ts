import { describe, it, expect } from "vitest";
import { gptTokenizer } from "@/tokenizers/gptTokenizer";
import { claudeTokenizer } from "@/tokenizers/claudeTokenizer";
import { geminiTokenizer } from "@/tokenizers/geminiTokenizer";
import { perplexityTokenizer } from "@/tokenizers/perplexityTokenizer";
import { NormalizedUsageEngine } from "@/tokenizers/normalizedEngine";

describe("Tokenizer Adapters Suite", () => {
  it("counts empty text as 0 tokens", () => {
    expect(gptTokenizer.countTokens("")).toBe(0);
    expect(claudeTokenizer.countTokens("")).toBe(0);
    expect(geminiTokenizer.countTokens("")).toBe(0);
    expect(perplexityTokenizer.countTokens("")).toBe(0);
  });

  it("handles short single words accurately", () => {
    expect(gptTokenizer.countTokens("hello")).toBe(1);
    expect(claudeTokenizer.countTokens("apple")).toBe(1);
    expect(geminiTokenizer.countTokens("world")).toBe(1);
  });

  it("estimates multi-sentence text with subword splitting", () => {
    const text = "The quick brown fox jumps over the lazy dog. 1234567890! Special characters: @#$%^&*()";
    const gptTokens = gptTokenizer.countTokens(text);
    const claudeTokens = claudeTokenizer.countTokens(text);
    const geminiTokens = geminiTokenizer.countTokens(text);

    expect(gptTokens).toBeGreaterThan(10);
    expect(gptTokens).toBeLessThan(40);
    expect(claudeTokens).toBeGreaterThan(10);
    expect(geminiTokens).toBeGreaterThan(10);
  });

  it("estimates conversational turns with message metadata overhead", () => {
    const messages = [
      { role: "user" as const, content: "What is quantum computing?" },
      { role: "assistant" as const, content: "Quantum computing is a multidisciplinary field comprising aspects of computer science, physics, and mathematics." },
    ];

    const est = gptTokenizer.estimateTurns(messages);
    expect(est.inTokens).toBeGreaterThan(0);
    expect(est.outTokens).toBeGreaterThan(0);
    expect(est.totalTokens).toBe(est.inTokens + est.outTokens);
  });

  it("normalizes context utilization and health states", () => {
    const { usage, health } = NormalizedUsageEngine.processConversation({
      provider: "chatgpt",
      conversationId: "test-conv-1",
      title: "Test Chat",
      url: "https://chatgpt.com/c/123",
      rawModelText: "GPT-4o",
      messages: [
        { role: "user", content: "Hello world" },
        { role: "assistant", content: "Hi there! How can I help you today?" },
      ],
      isDomVirtualized: false,
    });

    expect(usage.id).toBe("test-conv-1");
    expect(usage.model).toBe("GPT-4o");
    expect(usage.contextLimit).toBe(128000);
    expect(usage.totalTokens).toBeGreaterThan(0);
    expect(usage.utilizationPct).toBeLessThan(1);
    expect(health).toBe("safe");
    expect(usage.accuracy).toBe("Estimated");
  });
});

