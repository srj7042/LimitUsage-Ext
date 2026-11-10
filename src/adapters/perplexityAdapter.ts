import { ProviderAdapter, ProviderDOMSnapshot, ParsedMessage } from "./types";
import { ProviderQuota } from "../types";
import { createSpaDomObserver } from "./observerUtils";

export class PerplexityAdapter implements ProviderAdapter {
  providerId = "perplexity" as const;
  name = "Perplexity AI";
  supportedHosts = ["perplexity.ai", "www.perplexity.ai"];

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

    let conversationId = "perplexity-active";
    try {
      const parsed = new URL(url);
      const match = parsed.pathname.match(/\/search\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        conversationId = `perplexity-${match[1]}`;
      } else {
        conversationId = "perplexity-active-query";
      }
    } catch {
      // fallback
    }

    let title = doc.title || "Perplexity Search";
    title = title.replace(/\s*[-–|]\s*Perplexity.*$/i, "").trim();
    if (!title || title.toLowerCase() === "perplexity") {
      title = "Active Search";
    }

    // Model detection
    let rawModelText = "Sonar";
    const proBadge = doc.querySelector('[class*="pro-badge"], [data-testid="pro-toggle"], button[aria-label*="Pro"]');
    if (proBadge && proBadge.textContent) {
      rawModelText = proBadge.textContent.includes("Pro") ? "Sonar Pro" : "Sonar";
    }

    // Messages
    const messages: ParsedMessage[] = [];
    
    // Perplexity query and response sections
    const queryEl = doc.querySelector('h1, [class*="query-text"], [data-testid="query"]');
    if (queryEl && queryEl.textContent) {
      messages.push({
        id: `${conversationId}-q`,
        role: "user",
        content: queryEl.textContent.trim(),
      });
    }

    const answerEls = doc.querySelectorAll('div[class*="prose"], div[class*="answer-text"], [dir="auto"]');
    answerEls.forEach((ans, idx) => {
      // avoid small badges or headers
      const text = ans.textContent || "";
      if (text.trim().length > 20 && !ans.closest("h1")) {
        messages.push({
          id: `${conversationId}-ans-${idx}`,
          role: "assistant",
          content: text.trim(),
        });
      }
    });

    const isDomVirtualized = false;

    // Live draft query capture
    const inputEl = doc.querySelector<HTMLTextAreaElement>(
      'textarea[placeholder*="Ask"], textarea[placeholder*="search"], textarea'
    );
    if (inputEl && inputEl.value && inputEl.value.trim().length > 0) {
      messages.push({
        id: `${conversationId}-draft-live`,
        role: "user",
        content: inputEl.value.trim(),
      });
    }

    // Quota detection (e.g. "3/5 Pro searches left" or "Pro searches reset in...")
    let quota: ProviderQuota;
    const proCounterEl = doc.querySelector('[class*="pro-counter"], [class*="pro-queries"], [data-testid*="pro"]');
    if (proCounterEl && proCounterEl.textContent) {
      const match = proCounterEl.textContent.match(/(\d+)\s*\/\s*(\d+)/);
      if (match) {
        quota = {
          provider: "perplexity",
          planName: "Free Tier (Pro searches)",
          remaining: parseInt(match[1], 10),
          limit: parseInt(match[2], 10),
          resetAt: null,
          verifiedStatus: "Provider Verified",
          rateLimitMessage: proCounterEl.textContent.trim().slice(0, 100),
          lastChecked: Date.now(),
        };
      } else {
        quota = {
          provider: "perplexity",
          planName: "Free Tier",
          remaining: null,
          limit: null,
          resetAt: null,
          verifiedStatus: "Unavailable",
          lastChecked: Date.now(),
        };
      }
    } else {
      quota = {
        provider: "perplexity",
        planName: "Free Tier",
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

export const perplexityAdapter = new PerplexityAdapter();
