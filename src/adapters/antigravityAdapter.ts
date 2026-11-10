import { ProviderAdapter, ProviderDOMSnapshot } from "./types";
import { ProviderQuota } from "../types";

export class AntigravityAdapter implements ProviderAdapter {
  providerId = "antigravity" as const;
  name = "Google Antigravity";
  supportedHosts = ["antigravity.google.com", "antigravity.corp.google.com"];

  matches(url: string): boolean {
    try {
      const parsed = new URL(url);
      return this.supportedHosts.some((h) => parsed.hostname === h || parsed.hostname.endsWith(`.${h}`));
    } catch {
      return false;
    }
  }

  parseSnapshot(doc: Document, url: string): ProviderDOMSnapshot | null {
    const isWeb = this.matches(url);
    if (!isWeb) return null;

    return {
      conversationId: "antigravity-web-session",
      title: doc.title || "Antigravity Workspace",
      rawModelText: "Gemini 3.8 Flash (Antigravity)",
      messages: [],
      isDomVirtualized: false,
      quota: {
        provider: "antigravity",
        planName: "Antigravity Workspace",
        remaining: null,
        limit: null,
        resetAt: null,
        verifiedStatus: "Unavailable",
        rateLimitMessage: "Web telemetry unavailable. Connect Desktop Native Companion to read local transcript tokens.",
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
    return () => {};
  }
}

export const antigravityAdapter = new AntigravityAdapter();

