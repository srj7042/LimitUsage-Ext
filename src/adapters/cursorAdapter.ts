import { ProviderAdapter, ProviderDOMSnapshot } from "./types";
import { ProviderQuota } from "../types";

export class CursorAdapter implements ProviderAdapter {
  providerId = "cursor" as const;
  name = "Cursor";
  supportedHosts = ["cursor.com", "cursor.sh"];

  matches(url: string): boolean {
    try {
      const parsed = new URL(url);
      return this.supportedHosts.some((h) => parsed.hostname === h || parsed.hostname.endsWith(`.${h}`));
    } catch {
      return false;
    }
  }

  parseSnapshot(doc: Document, url: string): ProviderDOMSnapshot | null {
    // Web interface for Cursor
    const isWeb = this.matches(url);
    if (!isWeb) return null;

    return {
      conversationId: "cursor-web-session",
      title: doc.title || "Cursor Web",
      rawModelText: "Claude 3.5 Sonnet (Cursor)",
      messages: [],
      isDomVirtualized: false,
      quota: {
        provider: "cursor",
        planName: "Cursor Free / Pro",
        remaining: null,
        limit: null,
        resetAt: null,
        verifiedStatus: "Unavailable",
        rateLimitMessage: "Web usage data unavailable. Connect Desktop Native Companion for local workspace token monitoring.",
        lastChecked: Date.now(),
      },
    };
  }

  observeChanges(
    doc: Document,
    onChange: (snapshot: ProviderDOMSnapshot) => void
  ): () => void {
    const notify = () => {
      const currentUrl = typeof window !== "undefined" ? window.location.href : "";
      const snap = this.parseSnapshot(doc, currentUrl);
      if (snap) onChange(snap);
    };
    notify();
    return () => { };
  }
}

export const cursorAdapter = new CursorAdapter();

