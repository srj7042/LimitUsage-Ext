import { ProviderDOMSnapshot } from "./types";

export interface ObserverOptions {
  doc: Document;
  parseSnapshot: (doc: Document, url: string) => ProviderDOMSnapshot | null;
  onChange: (snapshot: ProviderDOMSnapshot) => void;
  debounceMs?: number;
}

/**
 * Creates a robust, SPA-aware DOM observer that handles:
 * 1. Initial snapshot parsing
 * 2. MutationObserver with debouncing
 * 3. Browser navigation (popstate)
 * 4. SPA client-side routing (pushState / replaceState URL transitions)
 */
export function createSpaDomObserver(options: ObserverOptions): () => void {
  const { doc, parseSnapshot, onChange, debounceMs = 250 } = options;

  let debounceTimer: any = null;
  let lastHref = typeof window !== "undefined" ? window.location.href : "";
  let lastConversationId = "";

  const notify = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      try {
        const currentHref = typeof window !== "undefined" ? window.location.href : "";
        lastHref = currentHref;
        const snapshot = parseSnapshot(doc, currentHref);
        if (snapshot) {
          lastConversationId = snapshot.conversationId;
          onChange(snapshot);
        }
      } catch (err) {
        console.warn("[AI Usage Companion] Snapshot extraction error:", err);
      }
    }, debounceMs);
  };

  // Immediate first parse
  notify();

  // MutationObserver for DOM additions/edits
  const observer = new MutationObserver((mutations) => {
    // If URL changed in SPA navigation without page reload
    if (typeof window !== "undefined" && window.location.href !== lastHref) {
      notify();
      return;
    }

    let shouldUpdate = false;
    for (const m of mutations) {
      if (m.type === "childList" && m.addedNodes.length > 0) {
        shouldUpdate = true;
        break;
      }
      if (m.type === "characterData") {
        shouldUpdate = true;
        break;
      }
    }

    if (shouldUpdate) {
      notify();
    }
  });

  const rootTarget = doc.body || doc.documentElement;
  if (rootTarget) {
    observer.observe(rootTarget, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  // URL Change Polling for fast SPA link clicks and active streaming (checks every 500ms)
  const urlPollInterval = setInterval(() => {
    if (typeof window !== "undefined" && window.location.href !== lastHref) {
      notify();
    }
  }, 500);

  // Periodic fallback to guarantee live updates even if mutations are swallowed
  const livePollInterval = setInterval(() => {
    notify();
  }, 1200);

  // Live input tracking (captures typing in textarea / contenteditable)
  const onInput = () => notify();
  doc.addEventListener("input", onInput, { capture: true, passive: true });
  doc.addEventListener("keyup", onInput, { capture: true, passive: true });

  // Standard history popstate
  const onPopState = () => notify();
  if (typeof window !== "undefined") {
    window.addEventListener("popstate", onPopState);
  }

  return () => {
    clearTimeout(debounceTimer);
    clearInterval(urlPollInterval);
    clearInterval(livePollInterval);
    observer.disconnect();
    doc.removeEventListener("input", onInput, { capture: true });
    doc.removeEventListener("keyup", onInput, { capture: true });
    if (typeof window !== "undefined") {
      window.removeEventListener("popstate", onPopState);
    }
  };
}

