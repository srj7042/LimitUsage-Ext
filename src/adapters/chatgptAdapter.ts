import { ProviderAdapter, ProviderDOMSnapshot, ParsedMessage } from "./types";
import { ProviderQuota } from "../types";
import { createSpaDomObserver } from "./observerUtils";

export class ChatGptAdapter implements ProviderAdapter {
  providerId = "chatgpt" as const;
  name = "ChatGPT";
  supportedHosts = ["chatgpt.com", "chat.openai.com"];

  matches(url: string): boolean {
    try {
      const parsed = new URL(url);
      return this.supportedHosts.some(
        (h) => parsed.hostname === h || parsed.hostname.endsWith(`.${h}`)
      );
    } catch {
      return false;
    }
  }

  parseSnapshot(doc: Document, url: string): ProviderDOMSnapshot | null {
    if (!this.matches(url)) return null;

    // 1. Conversation ID from URL or active session
    let conversationId = "chatgpt-active";
    try {
      const parsed = new URL(url);
      const match = parsed.pathname.match(/\/(?:c|share|g\/[^\/]+)\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        conversationId = `chatgpt-${match[1]}`;
      } else if (parsed.pathname === "/" || parsed.pathname === "") {
        conversationId = "chatgpt-new-session";
      }
    } catch {
      // fallback
    }

    // 2. Title
    let title = doc.title || "ChatGPT Conversation";
    title = title.replace(/\s*[-–|]\s*ChatGPT.*$/i, "").trim();
    if (!title || title === "ChatGPT") {
      title = "Active Chat";
    }

    // 3. Model & Plan Detection (Free vs Paid)
    let rawModelText = "GPT-4o";
    const modelBtn = doc.querySelector(
      '[data-testid="model-switcher-dropdown-button"], button[id*="model-switcher"], [aria-haspopup="menu"][class*="model"], [class*="model-switcher"]'
    );
    if (modelBtn && modelBtn.textContent) {
      rawModelText = modelBtn.textContent.trim();
    } else {
      const pill = doc.querySelector(
        '[class*="text-token-text-secondary"][class*="font-semibold"], [class*="model-name"], button[aria-label*="model"]'
      );
      if (pill && pill.textContent) {
        rawModelText = pill.textContent.trim();
      }
    }

    // Detect if on Free Tier (e.g. Upgrade button present, free rate limit message, or pricing link)
    const isFreeTier =
      !!doc.querySelector('a[href*="/pricing"], [data-testid="upgrade-button"], button [class*="sparkles"], [data-testid*="upgrade"]') ||
      /upgrade/i.test(doc.body?.textContent?.slice(0, 500) || "");

    // 4. Parse Messages with Multi-Tier Fallback
    const messages: ParsedMessage[] = [];

    // --- Strategy 1: Standard data-message-author-role attributes ---
    const roleNodes = doc.querySelectorAll("[data-message-author-role]");
    if (roleNodes.length > 0) {
      roleNodes.forEach((el, idx) => {
        const roleAttr = el.getAttribute("data-message-author-role");
        const role = roleAttr === "user" ? "user" : "assistant";
        const content = this.cleanMessageText(el.textContent || "", role);
        if (content.length > 0) {
          const id = el.getAttribute("data-message-id") || `${conversationId}-role-${idx}`;
          messages.push({ id, role, content });
        }
      });
    }

    // --- Strategy 2: Modern <article> turns ---
    if (messages.length === 0) {
      const articles = doc.querySelectorAll("main article, article");
      if (articles.length > 0) {
        articles.forEach((art, idx) => {
          const artText = art.textContent || "";
          if (!artText.trim()) return;

          const isUserExplicit =
            !!art.querySelector('[data-message-author-role="user"]') ||
            /you said/i.test(artText.slice(0, 100)) ||
            !!art.querySelector('h5, [class*="sr-only"]');

          const isAssistantExplicit =
            !!art.querySelector('[data-message-author-role="assistant"]') ||
            !!art.querySelector('.markdown, [class*="markdown"], .prose, [class*="prose"]') ||
            /chatgpt said/i.test(artText.slice(0, 100));

          let role: "user" | "assistant" = "assistant";
          if (isUserExplicit && !isAssistantExplicit) {
            role = "user";
          } else if (isAssistantExplicit && !isUserExplicit) {
            role = "assistant";
          } else {
            role = idx % 2 === 0 ? "user" : "assistant";
          }

          let content = "";
          if (role === "assistant") {
            const markdownEl = art.querySelector('.markdown, [class*="markdown"], .prose, [class*="prose"]');
            content = markdownEl ? markdownEl.textContent || "" : artText;
          } else {
            const userTextEl = art.querySelector('[class*="whitespace-pre-wrap"], div.font-user-message');
            content = userTextEl ? userTextEl.textContent || "" : artText;
          }

          content = this.cleanMessageText(content, role);
          if (content.length > 0) {
            messages.push({
              id: `${conversationId}-art-${idx}`,
              role,
              content,
            });
          }
        });
      }
    }

    // --- Strategy 3: Turn-based containers (Free tier / Guest layouts) ---
    if (messages.length === 0) {
      const turnNodes = doc.querySelectorAll(
        '[data-testid^="conversation-turn-"], [class*="conversation-turn"], [class*="agent-turn"]'
      );
      if (turnNodes.length > 0) {
        turnNodes.forEach((node, idx) => {
          const isUser =
            !!node.querySelector('[data-message-author-role="user"]') ||
            /you said/i.test(node.textContent?.slice(0, 80) || "") ||
            (!!node.querySelector('[class*="whitespace-pre-wrap"]') &&
              !node.querySelector('.markdown, [class*="markdown"], .prose'));

          const isAssistant =
            !!node.querySelector('[data-message-author-role="assistant"]') ||
            !!node.querySelector('.markdown, [class*="markdown"], .prose') ||
            /chatgpt said/i.test(node.textContent?.slice(0, 80) || "");

          const role: "user" | "assistant" =
            isUser && !isAssistant ? "user" : isAssistant ? "assistant" : idx % 2 === 0 ? "user" : "assistant";

          let content = "";
          if (role === "assistant") {
            const md = node.querySelector('.markdown, [class*="markdown"], .prose');
            content = md ? md.textContent || "" : node.textContent || "";
          } else {
            const ut = node.querySelector('[class*="whitespace-pre-wrap"], div.font-user-message');
            content = ut ? ut.textContent || "" : node.textContent || "";
          }

          content = this.cleanMessageText(content, role);
          if (content.length > 0) {
            messages.push({
              id: `${conversationId}-turn-${idx}`,
              role,
              content,
            });
          }
        });
      }
    }

    // --- Strategy 4: Universal Free Tier / Guest Speech Bubbles ---
    if (messages.length === 0) {
      const bubbleContainers = doc.querySelectorAll(
        'main [class*="whitespace-pre-wrap"], main .markdown, main [class*="markdown"], main .prose, [class*="whitespace-pre-wrap"], .markdown'
      );
      bubbleContainers.forEach((el, idx) => {
        // Skip prompt textarea if captured in bubbles
        if (
          el.closest("form") ||
          el.tagName === "TEXTAREA" ||
          el.id === "prompt-textarea" ||
          el.getAttribute("contenteditable") === "true"
        ) {
          return;
        }

        // Avoid duplicate nested elements: if el is inside another matched markdown, skip
        if (el.matches('[class*="whitespace-pre-wrap"]') && el.closest('.markdown, [class*="markdown"], .prose')) {
          return;
        }

        const isMarkdown =
          el.classList.contains("markdown") ||
          el.className.includes("markdown") ||
          el.classList.contains("prose") ||
          el.className.includes("prose");

        const role: "user" | "assistant" = isMarkdown ? "assistant" : "user";
        const content = this.cleanMessageText(el.textContent || "", role);
        if (content.length > 0) {
          messages.push({
            id: `${conversationId}-bubble-${idx}`,
            role,
            content,
          });
        }
      });
    }

    // --- Strategy 5: Live Input Box Draft (Live typing tracking) ---
    const inputEl = doc.querySelector<HTMLTextAreaElement | HTMLDivElement>(
      '#prompt-textarea, textarea[data-id="root"], [contenteditable="true"][id*="prompt"], [contenteditable="true"][data-placeholder], div[contenteditable="true"]'
    );
    if (inputEl) {
      let draftText = "";
      if ("value" in inputEl && typeof inputEl.value === "string") {
        draftText = inputEl.value;
      } else if (inputEl.textContent) {
        draftText = inputEl.textContent;
      }
      if (draftText.trim().length > 0) {
        messages.push({
          id: `${conversationId}-draft-live`,
          role: "user",
          content: draftText.trim(),
        });
      }
    }

    // 5. Virtualization check
    const hasMoreButton = !!doc.querySelector(
      'button[aria-label*="older"], button[class*="load-more"], [data-testid*="load-earlier"]'
    );
    const isDomVirtualized = hasMoreButton;

    // 6. Quota / Free Tier Rate Limit Detection
    let quota: ProviderQuota | undefined;
    const bannerEl = doc.querySelector(
      '[class*="text-token-text-error"], [role="alert"], [class*="rate-limit"], [data-testid*="rate-limit"], div[class*="banner"]'
    );

    let rateLimitText = "";
    if (bannerEl && bannerEl.textContent && /limit|cap|rate\s*limit|try again/i.test(bannerEl.textContent)) {
      rateLimitText = bannerEl.textContent.trim().slice(0, 150);
    } else {
      const alertEl = doc.querySelector('div[role="alert"], .text-token-text-error');
      if (alertEl && alertEl.textContent && /limit|cap|rate\s*limit|try again/i.test(alertEl.textContent)) {
        rateLimitText = alertEl.textContent.trim().slice(0, 150);
      }
    }

    if (rateLimitText) {
      if (/gpt-4o\s*mini/i.test(rateLimitText)) {
        rawModelText = "GPT-4o mini";
      }

      quota = {
        provider: "chatgpt",
        planName: isFreeTier ? "Free Tier" : "Plus / Team",
        remaining: 0,
        limit: null,
        resetAt: Date.now() + 3 * 3600 * 1000,
        verifiedStatus: "Provider Verified",
        rateLimitMessage: rateLimitText,
        lastChecked: Date.now(),
      };
    } else {
      quota = {
        provider: "chatgpt",
        planName: isFreeTier ? "Free Tier" : "Plus / Team",
        remaining: null,
        limit: null,
        resetAt: null,
        verifiedStatus: isFreeTier ? "Unavailable" : "Estimated",
        rateLimitMessage: isFreeTier
          ? "Free Tier Active (Dynamic quota not published by OpenAI)"
          : "Paid Plan Active (Live tokens tracked)",
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

  private cleanMessageText(raw: string, role: "user" | "assistant"): string {
    let cleaned = raw;
    if (role === "user") {
      cleaned = cleaned.replace(/^You said:\s*/i, "");
    } else {
      cleaned = cleaned.replace(/^ChatGPT said:\s*/i, "");
      cleaned = cleaned.replace(/Copy code|Copy|Read aloud|Good response|Bad response/gi, "");
    }
    return cleaned.trim();
  }

  observeChanges(
    doc: Document,
    onChange: (snapshot: ProviderDOMSnapshot) => void
  ): () => void {
    return createSpaDomObserver({
      doc,
      parseSnapshot: (d, url) => this.parseSnapshot(d, url),
      onChange,
      debounceMs: 150,
    });
  }
}

export const chatgptAdapter = new ChatGptAdapter();
