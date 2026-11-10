import React from "react";
import { ConversationUsage, ProviderId, ProviderQuota } from "../types";
import { MetricBadge } from "./MetricBadge";
import { SegmentedProgressBar } from "./SegmentedProgressBar";
import { formatTokenCount, formatPercent, getHealthColor } from "../utils/formatting";
import {
  Sparkles,
  Bot,
  BrainCircuit,
  Search,
  Code2,
  Terminal,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";

interface ProviderCardsProps {
  conversationsByProvider: Record<ProviderId, ConversationUsage[]>;
  quotasByProvider: Record<ProviderId, ProviderQuota | undefined>;
  onSelectProvider?: (provider: ProviderId) => void;
  onOpenCompanionSetup?: () => void;
}

interface ProviderMeta {
  id: ProviderId;
  name: string;
  icon: React.ReactNode;
  webUrl?: string;
  isDesktop?: boolean;
  defaultContext: string;
}

const PROVIDER_METAS: ProviderMeta[] = [
  {
    id: "chatgpt",
    name: "ChatGPT",
    icon: <Bot className="w-5 h-5 text-emerald-400" />,
    webUrl: "https://chatgpt.com",
    defaultContext: "128k (GPT-4o)",
  },
  {
    id: "claude",
    name: "Claude",
    icon: <Sparkles className="w-5 h-5 text-amber-400" />,
    webUrl: "https://claude.ai",
    defaultContext: "200k (Sonnet 3.5)",
  },
  {
    id: "gemini",
    name: "Google Gemini",
    icon: <BrainCircuit className="w-5 h-5 text-electric-light" />,
    webUrl: "https://gemini.google.com",
    defaultContext: "1M (Flash 1.5)",
  },
  {
    id: "perplexity",
    name: "Perplexity",
    icon: <Search className="w-5 h-5 text-cyan-400" />,
    webUrl: "https://perplexity.ai",
    defaultContext: "32k (Sonar)",
  },
  {
    id: "cursor",
    name: "Cursor Desktop",
    icon: <Code2 className="w-5 h-5 text-electric" />,
    isDesktop: true,
    defaultContext: "128k - 200k",
  },
  {
    id: "antigravity",
    name: "Google Antigravity",
    icon: <Terminal className="w-5 h-5 text-accent" />,
    isDesktop: true,
    defaultContext: "1M (Gemini 3.8)",
  },
];

export const ProviderCards: React.FC<ProviderCardsProps> = ({
  conversationsByProvider,
  quotasByProvider,
  onSelectProvider,
  onOpenCompanionSetup,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {PROVIDER_METAS.map((meta) => {
        const convs = conversationsByProvider[meta.id] || [];
        const quota = quotasByProvider[meta.id];
        const latestConv = convs[0]; // sorted by latest
        const totalTokens = convs.reduce((acc, c) => acc + c.totalTokens, 0);

        const health =
          latestConv && latestConv.utilizationPct >= 90
            ? "danger"
            : latestConv && latestConv.utilizationPct >= 70
            ? "warning"
            : "safe";
        const healthColors = getHealthColor(health);

        return (
          <div
            key={meta.id}
            className="flex flex-col justify-between p-4 rounded-card bg-surface-card border border-white/[0.08] hover:border-white/[0.16] transition-all shadow-subtle group"
          >
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-surface-panel border border-white/[0.06]">
                    {meta.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-electric-light transition-colors">
                      {meta.name}
                    </h3>
                    <div className="text-[11px] font-mono text-muted">
                      {meta.defaultContext}
                    </div>
                  </div>
                </div>

                {latestConv ? (
                  <MetricBadge accuracy={latestConv.accuracy} />
                ) : meta.isDesktop ? (
                  <MetricBadge accuracy="Unavailable" />
                ) : (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.04] text-muted border border-white/[0.06]">
                    No Activity
                  </span>
                )}
              </div>

              {/* Status & Stats */}
              <div className="py-3 space-y-3">
                {latestConv ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-silver">Latest Active:</span>
                      <span className="text-xs font-mono font-medium text-white truncate max-w-[150px]">
                        {latestConv.model}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 p-2 rounded-lg bg-surface-panel/70 border border-white/[0.04] text-center">
                      <div>
                        <div className="text-[10px] font-mono uppercase text-muted">Session Tokens</div>
                        <div className="text-sm font-mono font-bold text-electric-light">
                          {formatTokenCount(latestConv.totalTokens)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-mono uppercase text-muted">Context Used</div>
                        <div className={`text-sm font-mono font-bold ${healthColors.text}`}>
                          {formatPercent(latestConv.utilizationPct)}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] font-mono text-muted mb-1">
                        <span>Context Utilization</span>
                        <span>{latestConv.messageCount} messages</span>
                      </div>
                      <SegmentedProgressBar percent={latestConv.utilizationPct} health={health} />
                    </div>
                  </>
                ) : meta.isDesktop ? (
                  <div className="p-3 rounded-lg bg-surface-panel/50 border border-white/[0.04] text-xs space-y-2">
                    <p className="text-silver text-[11px] leading-relaxed">
                      Desktop workspace tokens require the Native Companion daemon.
                    </p>
                    <button
                      onClick={onOpenCompanionSetup}
                      className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-accent hover:underline"
                    >
                      Configure Native Companion →
                    </button>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-surface-panel/50 border border-white/[0.04] text-center text-xs text-muted">
                    Open {meta.name} web app to automatically track conversation tokens.
                  </div>
                )}

                {/* Quota Banner if verified */}
                {quota && quota.verifiedStatus === "Provider Verified" && (
                  <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-mono text-emerald-300 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Quota
                    </span>
                    <span className="font-semibold">{quota.rateLimitMessage || `${quota.remaining ?? 0} queries remaining`}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
              <span className="text-[11px] font-mono text-muted">
                {convs.length} {convs.length === 1 ? "session" : "sessions"} tracked
              </span>
              {meta.webUrl && (
                <a
                  href={meta.webUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-[11px] font-semibold text-silver hover:text-white transition-colors"
                >
                  Open Site <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

