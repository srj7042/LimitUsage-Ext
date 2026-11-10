import { defineContentScript } from "wxt/utils/define-content-script";
import React from "react";
import ReactDOM from "react-dom/client";
import { findAdapterForUrl } from "@/adapters/registry";
import { NormalizedUsageEngine } from "@/tokenizers/normalizedEngine";
import { FloatingUsageBar } from "@/components/FloatingUsageBar";
import { ConversationUsage, ProviderQuota, UserSettings } from "@/types";
import styles from "@/style.css?inline";

export default defineContentScript({
  matches: [
    "https://chatgpt.com/*",
    "https://chat.openai.com/*",
    "https://claude.ai/*",
    "https://gemini.google.com/*",
    "https://www.perplexity.ai/*",
    "https://perplexity.ai/*",
  ],
  cssInjectionMode: "ui",
  async main(ctx: any) {
    const currentUrl = window.location.href;
    const adapter = findAdapterForUrl(currentUrl);

    if (!adapter) {
      return;
    }

    console.log(`[AI Usage Companion] Matched adapter: ${adapter.name} on ${currentUrl}`);

    // Create shadow host container
    const container = document.createElement("div");
    container.id = "ai-usage-companion-root";
    const shadowRoot = container.attachShadow({ mode: "open" });

    // Inject Tailwind styles inside shadow root
    const styleEl = document.createElement("style");
    styleEl.textContent = styles;
    shadowRoot.appendChild(styleEl);

    // Create React mount point inside shadow root
    const mountPoint = document.createElement("div");
    mountPoint.id = "ai-usage-companion-mount";
    shadowRoot.appendChild(mountPoint);

    document.body.appendChild(container);

    const reactRoot = ReactDOM.createRoot(mountPoint);

    let currentUsage: ConversationUsage | null = null;
    let currentQuota: ProviderQuota | null = null;
    let isHiddenBySite = false;
    let floatingBarEnabled = true;

    // Load initial settings from background
    try {
      chrome.runtime.sendMessage({ type: "GET_SETTINGS" }, (res) => {
        if (res && res.success && res.settings) {
          const s: UserSettings = res.settings;
          floatingBarEnabled = s.floatingBarEnabled;
          if (s.siteOverrides && s.siteOverrides[window.location.hostname]?.enabled === false) {
            isHiddenBySite = true;
          }
          render();
        }
      });
    } catch {
      // background not ready yet
    }

    function render() {
      if (!floatingBarEnabled || isHiddenBySite) {
        reactRoot.render(null);
        return;
      }

      reactRoot.render(
        <FloatingUsageBar
          usage={currentUsage}
          quota={currentQuota}
          onHide={() => {
            isHiddenBySite = true;
            render();
          }}
          onOpenDashboard={() => {
            chrome.runtime.sendMessage({ type: "OPEN_DASHBOARD" });
          }}
        />
      );
    }

    // Debounce database syncs
    let saveTimeout: any = null;

    // Start live DOM observer
    const disconnectObserver = adapter.observeChanges(document, (snapshot) => {
      // Process through normalized engine
      const { usage, turns } = NormalizedUsageEngine.processConversation({
        provider: adapter.providerId,
        conversationId: snapshot.conversationId,
        title: snapshot.title,
        url: window.location.href,
        rawModelText: snapshot.rawModelText,
        messages: snapshot.messages,
        isDomVirtualized: snapshot.isDomVirtualized,
        lastUpdated: Date.now(),
      });

      currentUsage = usage;
      if (snapshot.quota) {
        currentQuota = snapshot.quota;
      }

      render();

      // Persist to background worker & IndexedDB (debounced 1.5s to avoid excess writes during rapid typing)
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => {
        try {
          chrome.runtime.sendMessage({
            type: "SAVE_CONVERSATION",
            payload: { conversation: usage, turns },
          });

          if (snapshot.quota) {
            chrome.runtime.sendMessage({
              type: "SAVE_QUOTA",
              payload: { quota: snapshot.quota },
            });
          }
        } catch {
          // Extension context may have reloaded
        }
      }, 1500);
    });

    // Clean up when content script unloads
    ctx.onInvalidated(() => {
      disconnectObserver();
      clearTimeout(saveTimeout);
      reactRoot.unmount();
      container.remove();
    });
  },
});
