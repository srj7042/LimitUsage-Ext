import { describe, it, expect } from "vitest";
import { findAdapterForUrl } from "@/adapters/registry";
import { chatgptAdapter } from "@/adapters/chatgptAdapter";
import { claudeAdapter } from "@/adapters/claudeAdapter";
import { geminiAdapter } from "@/adapters/geminiAdapter";
import { perplexityAdapter } from "@/adapters/perplexityAdapter";

describe("Web Provider Adapters Suite", () => {
  it("matches host URLs correctly", () => {
    expect(findAdapterForUrl("https://chatgpt.com/c/123")?.providerId).toBe("chatgpt");
    expect(findAdapterForUrl("https://chat.openai.com/g/custom")?.providerId).toBe("chatgpt");
    expect(findAdapterForUrl("https://claude.ai/chat/abcd")?.providerId).toBe("claude");
    expect(findAdapterForUrl("https://gemini.google.com/app/123")?.providerId).toBe("gemini");
    expect(findAdapterForUrl("https://www.perplexity.ai/search/xyz")?.providerId).toBe("perplexity");
    expect(findAdapterForUrl("https://google.com")).toBeNull();
  });

  it("parses ChatGPT DOM snapshot accurately", () => {
    const doc = document.implementation.createHTMLDocument("Test Page - ChatGPT");
    doc.body.innerHTML = `
      <div data-testid="model-switcher-dropdown-button">ChatGPT 4o</div>
      <div data-message-author-role="user" data-message-id="m1">Explain async await in JS</div>
      <div data-message-author-role="assistant" data-message-id="m2">Async/await is syntactic sugar over Promises in JavaScript.</div>
    `;

    const snapshot = chatgptAdapter.parseSnapshot(doc, "https://chatgpt.com/c/test-chat-uuid");
    expect(snapshot).toBeDefined();
    expect(snapshot?.conversationId).toBe("chatgpt-test-chat-uuid");
    expect(snapshot?.rawModelText).toBe("ChatGPT 4o");
    expect(snapshot?.messages.length).toBe(2);
    expect(snapshot?.messages[0]?.role).toBe("user");
    expect(snapshot?.messages[1]?.role).toBe("assistant");
    expect(snapshot?.messages[0]?.content).toContain("Explain async await");
  });

  it("parses modern ChatGPT article layouts without data-message-author-role attributes", () => {
    const doc = document.implementation.createHTMLDocument("New Chat");
    doc.body.innerHTML = `
      <main>
        <article class="w-full text-token-text-primary">
          <h5 class="sr-only">You said:</h5>
          <div class="whitespace-pre-wrap">Write a rust function for binary search</div>
        </article>
        <article class="w-full text-token-text-primary">
          <h6 class="sr-only">ChatGPT said:</h6>
          <div class="markdown prose">
            <p>Here is binary search in Rust:</p>
            <pre><code>fn binary_search() {}</code></pre>
          </div>
        </article>
        <textarea id="prompt-textarea" placeholder="Message ChatGPT">What is its time complexity?</textarea>
      </main>
    `;

    const snapshot = chatgptAdapter.parseSnapshot(doc, "https://chatgpt.com/c/modern-chat-id");
    expect(snapshot).toBeDefined();
    expect(snapshot?.messages.length).toBe(3); // 2 conversation turns + 1 live draft prompt
    expect(snapshot?.messages[0]?.role).toBe("user");
    expect(snapshot?.messages[0]?.content).toContain("Write a rust function");
    expect(snapshot?.messages[1]?.role).toBe("assistant");
    expect(snapshot?.messages[1]?.content).toContain("Here is binary search in Rust");
    expect(snapshot?.messages[2]?.role).toBe("user");
    expect(snapshot?.messages[2]?.content).toBe("What is its time complexity?");
  });

  it("parses ChatGPT Free Tier layout with speech bubbles and contenteditable live typing", () => {
    const doc = document.implementation.createHTMLDocument("ChatGPT");
    doc.body.innerHTML = `
      <a href="/pricing">Upgrade plan</a>
      <main>
        <div data-testid="conversation-turn-2">
          <div class="whitespace-pre-wrap">Can you explain quantum computing in simple terms?</div>
        </div>
        <div data-testid="conversation-turn-3">
          <div class="markdown prose">Quantum computing uses qubits that can exist in superpositions of 0 and 1.</div>
        </div>
        <div id="prompt-textarea" contenteditable="true">
          <p>How does quantum superposition work?</p>
        </div>
      </main>
    `;

    const snapshot = chatgptAdapter.parseSnapshot(doc, "https://chatgpt.com/");
    expect(snapshot).toBeDefined();
    expect(snapshot?.conversationId).toBe("chatgpt-new-session");
    expect(snapshot?.quota?.planName).toBe("Free Tier");
    expect(snapshot?.quota?.verifiedStatus).toBe("Unavailable");
    expect(snapshot?.messages.length).toBe(3); // 2 turns + 1 live draft
    expect(snapshot?.messages[0]?.role).toBe("user");
    expect(snapshot?.messages[0]?.content).toContain("explain quantum computing");
    expect(snapshot?.messages[1]?.role).toBe("assistant");
    expect(snapshot?.messages[1]?.content).toContain("qubits that can exist");
    expect(snapshot?.messages[2]?.role).toBe("user");
    expect(snapshot?.messages[2]?.content).toBe("How does quantum superposition work?");
  });

  it("parses Claude DOM snapshot and captures free rate limits if present", () => {
    const doc = document.implementation.createHTMLDocument("Test Title - Claude");
    doc.body.innerHTML = `
      <div data-testid="model-selector">Claude 3.5 Sonnet</div>
      <div data-testid="user-message">Draft a python script for scraping</div>
      <div class="font-claude-message">Here is a python script using BeautifulSoup...</div>
      <div class="UsageLimitBanner">You have 4 messages remaining until 4 PM.</div>
    `;

    const snapshot = claudeAdapter.parseSnapshot(doc, "https://claude.ai/chat/claude-uuid-123");
    expect(snapshot).toBeDefined();
    expect(snapshot?.conversationId).toBe("claude-claude-uuid-123");
    expect(snapshot?.rawModelText).toBe("Claude 3.5 Sonnet");
    expect(snapshot?.messages.length).toBe(2);
    expect(snapshot?.quota?.verifiedStatus).toBe("Provider Verified");
    expect(snapshot?.quota?.remaining).toBe(4);
  });

  it("parses Gemini DOM turns", () => {
    const doc = document.implementation.createHTMLDocument("Google Gemini");
    doc.body.innerHTML = `
      <div class="model-pill">Gemini 1.5 Flash</div>
      <user-query>Summarize this article</user-query>
      <model-response>Here is the executive summary...</model-response>
    `;

    const snapshot = geminiAdapter.parseSnapshot(doc, "https://gemini.google.com/app/gem-session-1");
    expect(snapshot).toBeDefined();
    expect(snapshot?.conversationId).toBe("gemini-gem-session-1");
    expect(snapshot?.rawModelText).toBe("Gemini 1.5 Flash");
    expect(snapshot?.messages.length).toBe(2);
    expect(snapshot?.messages[0]?.role).toBe("user");
    expect(snapshot?.messages[1]?.role).toBe("assistant");
  });

  it("parses Perplexity Pro search queries and counters", () => {
    const doc = document.implementation.createHTMLDocument("Perplexity Search");
    doc.body.innerHTML = `
      <div class="pro-badge">Pro Search</div>
      <h1 class="query-text">Latest developments in quantum computing 2026</h1>
      <div class="prose">Researchers have demonstrated 1,000 logical qubits...</div>
      <div class="pro-counter">3 / 5 Pro queries remaining</div>
    `;

    const snapshot = perplexityAdapter.parseSnapshot(doc, "https://perplexity.ai/search/perplex-123");
    expect(snapshot).toBeDefined();
    expect(snapshot?.conversationId).toBe("perplexity-perplex-123");
    expect(snapshot?.messages.length).toBe(2);
    expect(snapshot?.quota?.verifiedStatus).toBe("Provider Verified");
    expect(snapshot?.quota?.remaining).toBe(3);
    expect(snapshot?.quota?.limit).toBe(5);
  });
});
