import { ProviderAdapter, ProviderDOMSnapshot, ParsedMessage } from "./types";
import { ProviderQuota } from "../types";
import { createSpaDomObserver } from "./observerUtils";

export class GeminiAdapter implements ProviderAdapter {
  providerId = "gemini" as const;
  name = "Google Gemini";
  supportedHosts = ["gemini.google.com"];

  matches(url: string): boolean {
    try {
      const parsed = new URL(url);
      return this.supportedHosts.some((h) => parsed.hostname === h || parsed.hostname.endsWith(`.${h}`));
    } catch {
      return false;
    }
  }

  parseSnapshot(doc: Document, url: string): ProviderDOMSnapshot | null {
    if (!this.matches(url)) return null;

    let conversationId = "gemini-active";
    try {
      const parsed = new URL(url);
      const match = parsed.pathname.match(/\/app\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        conversationId = `gemini-${match[1]}`;
      } else {
        conversationId = "gemini-current-chat";
      }
    } catch {
      // fallback
    }

    let title = doc.title || "Gemini Session";
    title = title.replace(/\s*[-–|]\s*Google\s*Gemini.*$/i, "").trim();
    if (!title || title.toLowerCase() === "gemini") {
      title = "Active Chat";
    }

    // Model Detection
    let rawModelText = "Gemini 1.5 Flash";
    const modelBadge = doc.querySelector(
      '[class*="model-pill"], [data-test-id*="model-picker"], button[aria-label*="Gemini"], [class*="spark-button"]'
    );
    if (modelBadge && modelBadge.textContent) {
      rawModelText = modelBadge.textContent.trim();
    }

    // Messages parsing
    const messages: ParsedMessage[] = [];
    
    // Check standard Gemini custom elements or containers
    const turnElements = doc.querySelectorAll(
      'user-query, model-response, div[class*="user-query"], div[class*="model-response"], div[class*="query-content"], div[class*="response-container"]'
    );

    if (turnElements.length > 0) {
      turnElements.forEach((el, idx) => {
        const tagName = el.tagName.toLowerCase();
        const isUser = tagName === "user-query" || el.className.includes("user-query");
        const role = isUser ? "user" : "assistant";
        const content = el.textContent || "";
        if (content.trim()) {
          messages.push({
            id: `${conversationId}-${idx}-${content.slice(0, 16)}`,
            role,
            content: content.trim(),
          });
        }
      });
    } else {
      // Fallback message bubbles
      const messageBlocks = doc.querySelectorAll('div[role="region"], div[class*="conversation-container"] > div');
      messageBlocks.forEach((block, idx) => {
        const content = block.textContent || "";
        if (content.trim().length > 5) {
          messages.push({
            id: `${conversationId}-block-${idx}`,
            role: idx % 2 === 0 ? "user" : "assistant",
            content: content.trim(),
          });
        }
      });
    }

    // Live draft prompt capture
    const inputEl = doc.querySelector<HTMLDivElement | HTMLTextAreaElement>(
      'rich-textarea [contenteditable="true"], textarea[aria-label*="prompt"], [contenteditable="true"]'
    );
    if (inputEl) {
      const draft = ("value" in inputEl ? inputEl.value : inputEl.textContent) || "";
      if (draft.trim().length > 0) {
        messages.push({
          id: `${conversationId}-draft-live`,
          role: "user",
          content: draft.trim(),
        });
      }
    }

    // Virtualization check
    const isDomVirtualized = !!doc.querySelector('[class*="load-history"], [class*="see-older"]');

    // Quota
    const quotaBanner = doc.querySelector('[role="alert"], [class*="error-message"], [class*="rate-limit"]');
    let quota: ProviderQuota;
    if (quotaBanner && quotaBanner.textContent && /limit|quota|try again/i.test(quotaBanner.textContent)) {
      quota = {
        provider: "gemini",
        planName: "Free Web Tier",
        remaining: 0,
        limit: null,
        resetAt: null,
        verifiedStatus: "Provider Verified",
        rateLimitMessage: quotaBanner.textContent.trim().slice(0, 150),
        lastChecked: Date.now(),
      };
    } else {
      quota = {
        provider: "gemini",
        planName: "Free Web Tier",
        remaining: null,
        limit: null,
        resetAt: null,
        verifiedStatus: "Unavailable",
        lastChecked: Date.now(),
      };
    }

    return {
      conversationId,
      title,
      rawModelText,
      messages,
      isDomVirtualized,
      quota,
    };
  }

  observeChanges(
    doc: Document,
    onChange: (snapshot: ProviderDOMSnapshot) => void
  ): () => void {
    return createSpaDomObserver({
      doc,
      parseSnapshot: (d, url) => this.parseSnapshot(d, url),
      onChange,
      debounceMs: 250,
    });
  }
}

export const geminiAdapter = new GeminiAdapter();

