import { defineBackground } from "wxt/utils/define-background";
import { StorageService } from "@/storage/db";
import { ConversationUsage, ProviderQuota } from "@/types";
import { NativeMessagingService } from "@/services/nativeService";

export default defineBackground(() => {
  console.log("[AI Usage Companion] Background service worker initialized.");

  // Configure Side Panel behavior on install
  chrome.runtime.onInstalled.addListener(() => {
    try {
      if (typeof chrome !== "undefined" && (chrome as any).sidePanel?.setPanelBehavior) {
        (chrome as any).sidePanel.setPanelBehavior({ openPanelOnActionClick: false }).catch(() => {});
      }
    } catch {
      // ignore
    }
  });

  // Handle messages from content scripts and popups
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message || !message.type) return;

    if (message.type === "SAVE_CONVERSATION") {
      const conv: ConversationUsage = message.payload?.conversation;
      const turns = message.payload?.turns;
      if (conv) {
        StorageService.saveConversation(conv, turns)
          .then(() => sendResponse({ success: true }))
          .catch((err) => sendResponse({ success: false, error: err.message }));
        return true; // Keep message channel open for async response
      }
    }

    if (message.type === "SAVE_QUOTA") {
      const quota: ProviderQuota = message.payload?.quota;
      if (quota) {
        StorageService.saveProviderQuota(quota)
          .then(() => sendResponse({ success: true }))
          .catch((err) => sendResponse({ success: false, error: err.message }));
        return true;
      }
    }

    if (message.type === "GET_SETTINGS") {
      StorageService.getSettings()
        .then((settings) => sendResponse({ success: true, settings }))
        .catch((err) => sendResponse({ success: false, error: err.message }));
      return true;
    }

    if (message.type === "OPEN_DASHBOARD") {
      chrome.runtime.openOptionsPage();
      sendResponse({ success: true });
      return;
    }

    if (message.type === "PING_NATIVE") {
      NativeMessagingService.pingHost()
        .then((res) => sendResponse(res))
        .catch((err) => sendResponse({ connected: false, error: err.message }));
      return true;
    }

    if (message.type === "SYNC_DESKTOP") {
      const provider = message.payload?.provider;
      const token = message.payload?.token || "";
      NativeMessagingService.syncDesktopProvider(provider, token)
        .then((res) => sendResponse(res))
        .catch((err) => sendResponse({ success: false, error: err.message }));
      return true;
    }
  });
});
