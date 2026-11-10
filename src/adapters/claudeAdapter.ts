import { ProviderAdapter, ProviderDOMSnapshot, ParsedMessage } from "./types";
import { ProviderQuota } from "../types";
import { createSpaDomObserver } from "./observerUtils";

export class ClaudeAdapter implements ProviderAdapter {
  providerId = "claude" as const;
  name = "Claude";
  supportedHosts = ["claude.ai"];

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

    // 1. Conversation ID from URL
    let conversationId = "claude-active";
    try {
      const parsed = new URL(url);
      const match = parsed.pathname.match(/\/chat\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        conversationId = `claude-${match[1]}`;
      } else if (parsed.pathname === "/new" || parsed.pathname === "/") {
        conversationId = "claude-new-chat";
      }
    } catch {
      // fallback
    }

    // 2. Title
    let title = doc.title || "Claude Conversation";
    title = title.replace(/\s*[-–|]\s*Claude.*$/i, "").trim();
    if (!title || title === "Claude") {
      title = "Active Conversation";
    }

    // 3. Model selector
    let rawModelText = "Claude 3.5 Sonnet";
    const modelSelector = doc.querySelector(
      '[data-testid*="model-selector"], button[class*="model"], [class*="ModelSelector"]'
    );
    if (modelSelector && modelSelector.textContent) {
      rawModelText = modelSelector.textContent.trim();
    }

    // 4. Messages
    const messages: ParsedMessage[] = [];
    
    // Check user & claude message blocks
    const userNodes = doc.querySelectorAll('[data-testid="user-message"], div.font-user-message, div[class*="UserMessage"]');
    const claudeNodes = doc.querySelectorAll('div.font-claude-message, div[class*="ClaudeMessage"], div.standard-markdown');

    // If query by order
    const allMessageContainers = doc.querySelectorAll(
      '[data-testid="user-message"], div.font-user-message, div.font-claude-message, div[class*="Message_content"]'
    );

    if (allMessageContainers.length > 0) {
      allMessageContainers.forEach((el, idx) => {
        const isUser = el.matches('[data-testid="user-message"], div.font-user-message, [class*="UserMessage"]');
        const role = isUser ? "user" : "assistant";
        const content = el.textContent || "";
        messages.push({
          id: `${conversationId}-${idx}-${content.slice(0, 16)}`,
          role,
          content: content.trim(),
        });
      });
    } else {
      // Alternate fallback
      const turns = doc.querySelectorAll('div[class*="contents"] > div[class*="group"]');
      turns.forEach((turn, idx) => {
        const isUser = turn.querySelector('[data-testid="user-message"]') || turn.querySelector('[class*="user"]');
        const role = isUser ? "user" : "assistant";
        const content = turn.textContent || "";
        if (content.trim()) {
          messages.push({
            id: `${conversationId}-turn-${idx}`,
            role,
            content: content.trim(),
          });
        }
      });
    }

    // Live draft input capture
    const inputEl = doc.querySelector<HTMLDivElement | HTMLTextAreaElement>(
      'div.ProseMirror, [contenteditable="true"], fieldset textarea'
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

    // 5. Virtualization check
    const isDomVirtualized = !!doc.querySelector('button[aria-label*="earlier messages"], [class*="load-more"]');

    // 6. Quota / Free tier rate limit parsing
    let quota: ProviderQuota | undefined;
    const banner = doc.querySelector(
      '[class*="banner"], [role="alert"], [class*="UsageLimitBanner"], [class*="WarningBanner"]'
    );

    if (banner && banner.textContent) {
      const bannerText = banner.textContent;
      // Match patterns like "5 messages remaining until 3pm" or "limit reached"
      const remainingMatch = bannerText.match(/(\d+)\s+messages?\s+remaining/i);
      const isLimitReached = /limit reached|out of messages|try again/i.test(bannerText);

      quota = {
        provider: "claude",
        planName: "Free Tier",
        remaining: isLimitReached ? 0 : remainingMatch ? parseInt(remainingMatch[1], 10) : null,
        limit: null,
        resetAt: null,
        verifiedStatus: "Provider Verified",
        rateLimitMessage: bannerText.trim().slice(0, 150),
        lastChecked: Date.now(),
      };
    } else {
      quota = {
        provider: "claude",
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

export const claudeAdapter = new ClaudeAdapter();

