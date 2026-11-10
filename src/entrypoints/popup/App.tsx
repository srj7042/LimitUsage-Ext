import React, { useState, useEffect } from "react";
import { ConversationUsage, ProviderId, UserSettings } from "@/types";
import { StorageService, DEFAULT_SETTINGS } from "@/storage/db";
import { findAdapterForUrl } from "@/adapters/registry";
import { MetricBadge } from "@/components/MetricBadge";
import { SegmentedProgressBar } from "@/components/SegmentedProgressBar";
import { formatTokenCount, formatPercent, getHealthColor } from "@/utils/formatting";
import {
  Zap,
  ExternalLink,
  PanelRight,
  Sliders,
  Eye,
  EyeOff,
  Layers,
  Sparkles,
  Bot,
  BrainCircuit,
  Search,
} from "lucide-react";

export default function PopupApp() {
  const [activeTabConv, setActiveTabConv] = useState<ConversationUsage | null>(null);
  const [activeProvider, setActiveProvider] = useState<ProviderId | null>(null);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [todayTokens, setTodayTokens] = useState<number>(0);
  const [allTokens, setAllTokens] = useState<number>(0);

  useEffect(() => {
    // 1. Detect current tab
    if (typeof chrome !== "undefined" && chrome.tabs && chrome.tabs.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
        const tab = tabs[0];
        if (tab && tab.url) {
          const adapter = findAdapterForUrl(tab.url);
          if (adapter) {
            setActiveProvider(adapter.providerId);
            // Retrieve recent conversation for this provider
            const convs = await StorageService.getConversationsByProvider(adapter.providerId);
            if (convs.length > 0) {
              convs.sort((a, b) => b.lastUpdated - a.lastUpdated);
              setActiveTabConv(convs[0] ?? null);
            }
          }
        }
      });
    }

    // 2. Load storage aggregates
    const loadStats = async () => {
      const allConvs = await StorageService.getAllConversations();
      const total = allConvs.reduce((acc, c) => acc + c.totalTokens, 0);
      setAllTokens(total);

      const now = Date.now();
      const today = allConvs
        .filter((c) => now - c.lastUpdated <= 24 * 3600 * 1000)
        .reduce((acc, c) => acc + c.totalTokens, 0);
      setTodayTokens(today);

      const s = await StorageService.getSettings();
      setSettings(s);
    };

    loadStats();
  }, []);

  const toggleFloatingBar = async () => {
    const updated = await StorageService.saveSettings({
      floatingBarEnabled: !settings.floatingBarEnabled,
    });
    setSettings(updated);
  };

  const openSidePanel = () => {
    if (typeof chrome !== "undefined" && (chrome as any).sidePanel && (chrome as any).sidePanel.open) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];
        if (tab?.id) {
          (chrome as any).sidePanel.open({ tabId: tab.id });
          window.close();
        }
      });
    } else {
      openFullDashboard();
    }
  };

  const openFullDashboard = () => {
    if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open("/entrypoints/options/index.html", "_blank");
    }
  };

  const health =
    activeTabConv && activeTabConv.utilizationPct >= 90
      ? "danger"
      : activeTabConv && activeTabConv.utilizationPct >= 70
      ? "warning"
      : "safe";
  const healthColors = getHealthColor(health);

  return (
    <div className="w-[360px] p-4 bg-background text-white font-sans space-y-4 select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-accent text-accent-foreground font-black">
            <Zap className="w-4 h-4 fill-current" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-wide">AI Usage Companion</h1>
            <div className="text-[10px] font-mono text-silver">Privacy-First Engine</div>
          </div>
        </div>

        <button
          onClick={toggleFloatingBar}
          className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-mono border transition-colors ${
            settings.floatingBarEnabled
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-surface-active border-white/10 text-muted"
          }`}
          title="Toggle floating on-page bar"
        >
          {settings.floatingBarEnabled ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          {settings.floatingBarEnabled ? "Bar On" : "Bar Off"}
        </button>
      </div>

      {/* Active Tab Card */}
      {activeProvider && activeTabConv ? (
        <div className="p-3.5 rounded-card bg-surface-card border border-white/[0.12] space-y-3 shadow-subtle">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-electric animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                {activeProvider}
              </span>
            </div>
            <MetricBadge accuracy={activeTabConv.accuracy} />
          </div>

          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-silver truncate max-w-[170px]" title={activeTabConv.title}>
              {activeTabConv.title}
            </span>
            <span className="text-[11px] text-muted">{activeTabConv.model}</span>
          </div>

          {/* Tokens & Progress */}
          <div className="grid grid-cols-2 gap-2 p-2 rounded-lg bg-surface-panel/70 border border-white/[0.04] text-center font-mono">
            <div>
              <div className="text-[9px] uppercase text-muted">Tokens</div>
              <div className="text-sm font-bold text-electric-light">
                {formatTokenCount(activeTabConv.totalTokens)}
              </div>
            </div>
            <div>
              <div className="text-[9px] uppercase text-muted">Context</div>
              <div className={`text-sm font-bold ${healthColors.text}`}>
                {formatPercent(activeTabConv.utilizationPct)}
              </div>
            </div>
          </div>

          <SegmentedProgressBar percent={activeTabConv.utilizationPct} health={health} />
        </div>
      ) : (
        <div className="p-4 rounded-card bg-surface-card border border-white/[0.06] text-center space-y-2">
          <Layers className="w-5 h-5 text-muted mx-auto" />
          <div className="text-xs font-semibold text-silver">No AI Chat Active on This Tab</div>
          <p className="text-[11px] text-muted leading-relaxed">
            Navigate to ChatGPT, Claude, Gemini, or Perplexity to see live token counts.
          </p>
        </div>
      )}

      {/* Global Quick Stats */}
      <div className="grid grid-cols-2 gap-2 text-center font-mono">
        <div className="p-2.5 rounded-lg bg-surface-panel border border-white/[0.06]">
          <div className="text-[10px] uppercase text-muted">Today</div>
          <div className="text-sm font-bold text-accent">{formatTokenCount(todayTokens)}</div>
        </div>
        <div className="p-2.5 rounded-lg bg-surface-panel border border-white/[0.06]">
          <div className="text-[10px] uppercase text-muted">All-Time</div>
          <div className="text-sm font-bold text-white">{formatTokenCount(allTokens)}</div>
        </div>
      </div>

      {/* Action Navigation */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/[0.08]">
        <button
          onClick={openSidePanel}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-surface-panel hover:bg-surface-active border border-white/10 text-xs font-mono text-silver hover:text-white transition-colors"
        >
          <PanelRight className="w-3.5 h-3.5 text-electric" /> Side Panel
        </button>

        <button
          onClick={openFullDashboard}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-accent text-accent-foreground font-mono font-bold text-xs hover:bg-accent-hover transition-colors shadow-sm"
        >
          Dashboard <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
