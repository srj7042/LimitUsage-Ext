import React, { useState, useEffect } from "react";
import { ConversationUsage, DailySummary, ProviderId, ProviderQuota, UserSettings } from "../types";
import { StorageService, DEFAULT_SETTINGS } from "../storage/db";
import { OverviewKPIs } from "./OverviewKPIs";
import { ProviderCards } from "./ProviderCards";
import { UsageAnalyticsChart } from "./UsageAnalyticsChart";
import { UsageHistoryTable } from "./UsageHistoryTable";
import { SettingsAndPrivacyModal } from "./SettingsAndPrivacyModal";
import { Zap, RefreshCw, Sliders, Shield, Layers } from "lucide-react";

interface UnifiedDashboardProps {
  isCompact?: boolean; // true if rendering in side panel
}

export const UnifiedDashboard: React.FC<UnifiedDashboardProps> = ({ isCompact = false }) => {
  const [conversations, setConversations] = useState<ConversationUsage[]>([]);
  const [summaries, setSummaries] = useState<DailySummary[]>([]);
  const [quotas, setQuotas] = useState<Record<ProviderId, ProviderQuota | undefined>>({
    chatgpt: undefined,
    claude: undefined,
    gemini: undefined,
    perplexity: undefined,
    cursor: undefined,
    antigravity: undefined,
  });
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const convs = await StorageService.getAllConversations();
      // Sort newest first
      convs.sort((a, b) => b.lastUpdated - a.lastUpdated);
      setConversations(convs);

      const sums = await StorageService.getDailySummaries(30);
      setSummaries(sums);

      const allQuotas = await StorageService.getAllQuotas();
      const quotaMap: Record<ProviderId, ProviderQuota | undefined> = {
        chatgpt: undefined,
        claude: undefined,
        gemini: undefined,
        perplexity: undefined,
        cursor: undefined,
        antigravity: undefined,
      };
      allQuotas.forEach((q) => {
        quotaMap[q.provider] = q;
      });
      setQuotas(quotaMap);

      const s = await StorageService.getSettings();
      setSettings(s);
    } catch (e) {
      console.error("Failed to load dashboard data", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Poll updates every 5 seconds for live activity
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Group conversations by provider
  const convsByProvider: Record<ProviderId, ConversationUsage[]> = {
    chatgpt: [],
    claude: [],
    gemini: [],
    perplexity: [],
    cursor: [],
    antigravity: [],
  };
  conversations.forEach((c) => {
    if (convsByProvider[c.provider]) {
      convsByProvider[c.provider].push(c);
    }
  });

  const totalTokens = conversations.reduce((acc, c) => acc + c.totalTokens, 0);
  const now = Date.now();
  const tokens24h = conversations
    .filter((c) => now - c.lastUpdated <= 24 * 3600 * 1000)
    .reduce((acc, c) => acc + c.totalTokens, 0);

  const activeProvidersCount = Object.values(convsByProvider).filter((list) => list.length > 0).length;

  return (
    <div className="min-h-screen bg-background text-white p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto selection:bg-electric selection:text-white">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-accent text-accent-foreground font-black shadow-[0_0_20px_rgba(243,233,96,0.3)]">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">AI Usage Companion</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-accent text-accent-foreground">
                PROD v1.0
              </span>
            </div>
            <p className="text-xs font-mono text-silver">
              Unified cross-provider token engine & context tracking (100% Offline & Private)
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-card hover:bg-surface-active border border-white/10 text-xs font-mono text-silver hover:text-white transition-colors"
            title="Refresh metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-card hover:bg-surface-active border border-white/10 text-xs font-mono text-silver hover:text-white transition-colors"
          >
            <Sliders className="w-3.5 h-3.5 text-accent" />
            Settings
          </button>
        </div>
      </div>

      {/* KPI Overview */}
      <OverviewKPIs
        totalTokens={totalTokens}
        tokens24h={tokens24h}
        sessionCount={conversations.length}
        activeProviders={activeProvidersCount}
      />

      {/* Provider Matrix Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-muted">
            Supported AI Integrations (Free & Verified)
          </h2>
          <span className="text-[11px] font-mono text-silver">
            6 Normalized Adapters
          </span>
        </div>
        <ProviderCards
          conversationsByProvider={convsByProvider}
          quotasByProvider={quotas}
          onOpenCompanionSetup={() => setIsSettingsOpen(true)}
        />
      </div>

      {/* Analytics Chart */}
      <UsageAnalyticsChart summaries={summaries} />

      {/* Usage History Table */}
      <UsageHistoryTable conversations={conversations} />

      {/* Settings Modal */}
      <SettingsAndPrivacyModal
        settings={settings}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSettingsUpdated={(s) => setSettings(s)}
        onDataWiped={() => loadData()}
      />
    </div>
  );
};

