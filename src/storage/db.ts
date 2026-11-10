import { openDB, IDBPDatabase } from "idb";
import {
  ConversationUsage,
  DailySummary,
  MessageTurn,
  ProviderId,
  ProviderQuota,
  UserSettings,
} from "../types";

const DB_NAME = "AIUsageCompanionDB";
const DB_VERSION = 1;

export const DEFAULT_SETTINGS: UserSettings = {
  theme: "dark",
  alertThresholdPercent: 80,
  highAlertThresholdPercent: 90,
  floatingBarEnabled: true,
  floatingBarCollapsed: false,
  floatingBarPosition: {
    x: typeof window !== "undefined" && window.innerWidth ? window.innerWidth - 350 : 20,
    y: 70,
  },
  siteOverrides: {},
  nativeCompanionToken: "",
  nativeCompanionEnabled: false,
  nativeCompanionStatus: "disconnected",
  nativeCompanionLastPing: null,
};

let dbPromise: Promise<IDBPDatabase> | null = null;

export function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Conversations store
        if (!db.objectStoreNames.contains("conversations")) {
          const convStore = db.createObjectStore("conversations", { keyPath: "id" });
          convStore.createIndex("by_provider", "provider", { unique: false });
          convStore.createIndex("by_lastUpdated", "lastUpdated", { unique: false });
        }

        // Message turns store
        if (!db.objectStoreNames.contains("turns")) {
          const turnStore = db.createObjectStore("turns", { keyPath: "id" });
          turnStore.createIndex("by_conversation", "conversationId", { unique: false });
          turnStore.createIndex("by_timestamp", "timestamp", { unique: false });
        }

        // Daily summaries store
        if (!db.objectStoreNames.contains("daily_summaries")) {
          const summaryStore = db.createObjectStore("daily_summaries", { keyPath: ["date", "provider"] });
          summaryStore.createIndex("by_date", "date", { unique: false });
          summaryStore.createIndex("by_provider", "provider", { unique: false });
        }

        // Provider quotas store
        if (!db.objectStoreNames.contains("provider_quotas")) {
          db.createObjectStore("provider_quotas", { keyPath: "provider" });
        }

        // Settings store
        if (!db.objectStoreNames.contains("settings")) {
          db.createObjectStore("settings");
        }
      },
    });
  }
  return dbPromise;
}

export class StorageService {
  /**
   * Save or update conversation and aggregate into daily summary.
   */
  static async saveConversation(conversation: ConversationUsage, turns?: MessageTurn[]): Promise<void> {
    const db = await getDb();
    const tx = db.transaction(["conversations", "turns", "daily_summaries"], "readwrite");

    await tx.objectStore("conversations").put(conversation);

    if (turns && turns.length > 0) {
      const turnStore = tx.objectStore("turns");
      for (const turn of turns) {
        await turnStore.put({ ...turn, conversationId: conversation.id });
      }
    }

    // Update Daily Summary
    const today = new Date(conversation.lastUpdated).toISOString().split("T")[0];
    const summaryKey = [today, conversation.provider];
    const existingSummary: DailySummary | undefined = await tx.objectStore("daily_summaries").get(summaryKey);

    const updatedSummary: DailySummary = existingSummary
      ? {
          date: today,
          provider: conversation.provider,
          totalTokens: existingSummary.totalTokens + (conversation.totalTokens - (existingSummary.totalTokens > 0 ? 0 : 0)), // update baseline
          promptTokens: existingSummary.promptTokens + conversation.inTokens,
          completionTokens: existingSummary.completionTokens + conversation.outTokens,
          conversationCount: existingSummary.conversationCount,
          messageCount: existingSummary.messageCount + conversation.messageCount,
        }
      : {
          date: today,
          provider: conversation.provider,
          totalTokens: conversation.totalTokens,
          promptTokens: conversation.inTokens,
          completionTokens: conversation.outTokens,
          conversationCount: 1,
          messageCount: conversation.messageCount,
        };

    await tx.objectStore("daily_summaries").put(updatedSummary);
    await tx.done;
  }

  static async getConversation(id: string): Promise<ConversationUsage | undefined> {
    const db = await getDb();
    return db.get("conversations", id);
  }

  static async getAllConversations(): Promise<ConversationUsage[]> {
    const db = await getDb();
    return db.getAllFromIndex("conversations", "by_lastUpdated");
  }

  static async getConversationsByProvider(provider: ProviderId): Promise<ConversationUsage[]> {
    const db = await getDb();
    return db.getAllFromIndex("conversations", "by_provider", provider);
  }

  static async getDailySummaries(limitDays = 30): Promise<DailySummary[]> {
    const db = await getDb();
    const summaries: DailySummary[] = await db.getAll("daily_summaries");
    summaries.sort((a, b) => a.date.localeCompare(b.date));
    return summaries.slice(-limitDays);
  }

  static async saveProviderQuota(quota: ProviderQuota): Promise<void> {
    const db = await getDb();
    await db.put("provider_quotas", quota);
  }

  static async getProviderQuota(provider: ProviderId): Promise<ProviderQuota | undefined> {
    const db = await getDb();
    return db.get("provider_quotas", provider);
  }

  static async getAllQuotas(): Promise<ProviderQuota[]> {
    const db = await getDb();
    return db.getAll("provider_quotas");
  }

  static async getSettings(): Promise<UserSettings> {
    const db = await getDb();
    const settings = await db.get("settings", "user_preferences");
    return { ...DEFAULT_SETTINGS, ...settings };
  }

  static async saveSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
    const db = await getDb();
    const current = await this.getSettings();
    const updated = { ...current, ...settings };
    await db.put("settings", updated, "user_preferences");
    return updated;
  }

  static async clearProviderData(provider: ProviderId): Promise<void> {
    const db = await getDb();
    const tx = db.transaction(["conversations", "daily_summaries", "provider_quotas"], "readwrite");

    // Remove conversations for provider
    const convStore = tx.objectStore("conversations");
    const convs: ConversationUsage[] = await convStore.index("by_provider").getAll(provider);
    for (const c of convs) {
      await convStore.delete(c.id);
    }

    // Remove summaries for provider
    const summaryStore = tx.objectStore("daily_summaries");
    const summaries: DailySummary[] = await summaryStore.index("by_provider").getAll(provider);
    for (const s of summaries) {
      await summaryStore.delete([s.date, s.provider]);
    }

    // Clear quota
    await tx.objectStore("provider_quotas").delete(provider);
    await tx.done;
  }

  static async wipeAllData(): Promise<void> {
    const db = await getDb();
    const tx = db.transaction(["conversations", "turns", "daily_summaries", "provider_quotas"], "readwrite");
    await tx.objectStore("conversations").clear();
    await tx.objectStore("turns").clear();
    await tx.objectStore("daily_summaries").clear();
    await tx.objectStore("provider_quotas").clear();
    await tx.done;
  }

  static async exportAllDataAsJson(): Promise<string> {
    const conversations = await this.getAllConversations();
    const summaries = await this.getDailySummaries(90);
    const quotas = await this.getAllQuotas();
    const settings = await this.getSettings();

    const dump = {
      exportTimestamp: new Date().toISOString(),
      extension: "AI Usage Companion",
      version: "1.0.0",
      settings,
      quotas,
      summaries,
      conversations,
    };

    return JSON.stringify(dump, null, 2);
  }

  static async exportAsCsv(): Promise<string> {
    const conversations = await this.getAllConversations();
    const headers = [
      "ID",
      "Provider",
      "Model",
      "Title",
      "Input Tokens",
      "Output Tokens",
      "Total Tokens",
      "Context Limit",
      "Utilization %",
      "Message Count",
      "Accuracy",
      "Last Updated",
    ];

    const rows = conversations.map((c) => [
      `"${c.id.replace(/"/g, '""')}"`,
      `"${c.provider}"`,
      `"${c.model}"`,
      `"${(c.title || "").replace(/"/g, '""')}"`,
      c.inTokens,
      c.outTokens,
      c.totalTokens,
      c.contextLimit,
      c.utilizationPct,
      c.messageCount,
      `"${c.accuracy}"`,
      `"${new Date(c.lastUpdated).toISOString()}"`,
    ]);

    return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  }
}

