import { NativeCompanionPayload, NativeCompanionResponse } from "../types";
import { StorageService } from "../storage/db";

const NATIVE_HOST_NAME = "com.ai_usage_companion.host";

export class NativeMessagingService {
  /**
   * Ping the desktop native messaging host to check installation & get auth token.
   */
  static async pingHost(): Promise<{ connected: boolean; authToken?: string; error?: string }> {
    if (typeof chrome === "undefined" || !chrome.runtime || !chrome.runtime.sendNativeMessage) {
      return { connected: false, error: "Native messaging API not available in this browser environment." };
    }

    return new Promise((resolve) => {
      try {
        chrome.runtime.sendNativeMessage(
          NATIVE_HOST_NAME,
          { action: "ping", token: "" } as NativeCompanionPayload,
          (response: any) => {
            const lastErr = chrome.runtime.lastError;
            if (lastErr || !response || !response.success) {
              resolve({
                connected: false,
                error: lastErr ? lastErr.message : response?.error || "Host did not respond",
              });
            } else {
              resolve({
                connected: true,
                authToken: response.authToken,
              });
            }
          }
        );
      } catch (e: any) {
        resolve({ connected: false, error: e?.message || "Failed to call sendNativeMessage" });
      }
    });
  }

  /**
   * Sync desktop logs from Cursor or Antigravity via authenticated companion.
   */
  static async syncDesktopProvider(
    provider: "cursor" | "antigravity",
    token: string
  ): Promise<NativeCompanionResponse> {
    if (typeof chrome === "undefined" || !chrome.runtime || !chrome.runtime.sendNativeMessage) {
      return { success: false, error: "Native messaging unavailable" };
    }

    const action = provider === "cursor" ? "sync_cursor" : "sync_antigravity";

    return new Promise((resolve) => {
      try {
        chrome.runtime.sendNativeMessage(
          NATIVE_HOST_NAME,
          { action, token } as NativeCompanionPayload,
          async (response: NativeCompanionResponse) => {
            const lastErr = chrome.runtime.lastError;
            if (lastErr) {
              resolve({ success: false, error: lastErr.message });
              return;
            }

            if (response && response.success && response.data) {
              // Store synced conversations in local IndexedDB
              if (response.data.conversations) {
                for (const conv of response.data.conversations) {
                  await StorageService.saveConversation(conv);
                }
              }
              if (response.data.quota) {
                await StorageService.saveProviderQuota(response.data.quota);
              }
            }

            resolve(response || { success: false, error: "Empty native response" });
          }
        );
      } catch (err: any) {
        resolve({ success: false, error: err?.message || "Sync exception" });
      }
    });
  }
}

