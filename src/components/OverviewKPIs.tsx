import React from "react";
import { formatTokenCount } from "../utils/formatting";
import { Zap, Clock, MessageSquare, Radio } from "lucide-react";

interface OverviewKPIsProps {
  totalTokens: number;
  tokens24h: number;
  sessionCount: number;
  activeProviders: number;
}

export const OverviewKPIs: React.FC<OverviewKPIsProps> = ({
  totalTokens,
  tokens24h,
  sessionCount,
  activeProviders,
}) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Total Tokens */}
      <div className="p-4 rounded-card bg-surface-card border border-white/[0.08] hover:border-white/[0.12] transition-colors shadow-subtle">
        <div className="flex items-center justify-between text-muted text-xs font-mono uppercase tracking-wider mb-2">
          <span>All-Time Tokens</span>
          <Zap className="w-4 h-4 text-electric" />
        </div>
        <div className="text-2xl font-mono font-extrabold text-white tracking-tight">
          {formatTokenCount(totalTokens)}
        </div>
        <div className="text-[11px] font-mono text-silver mt-1">
          Normalized BPE estimation
        </div>
      </div>

      {/* 24h Tokens */}
      <div className="p-4 rounded-card bg-surface-card border border-white/[0.08] hover:border-white/[0.12] transition-colors shadow-subtle">
        <div className="flex items-center justify-between text-muted text-xs font-mono uppercase tracking-wider mb-2">
          <span>Past 24 Hours</span>
          <Clock className="w-4 h-4 text-accent" />
        </div>
        <div className="text-2xl font-mono font-extrabold text-accent tracking-tight">
          {formatTokenCount(tokens24h)}
        </div>
        <div className="text-[11px] font-mono text-silver mt-1">
          Active daily sessions
        </div>
      </div>

      {/* Tracked Sessions */}
      <div className="p-4 rounded-card bg-surface-card border border-white/[0.08] hover:border-white/[0.12] transition-colors shadow-subtle">
        <div className="flex items-center justify-between text-muted text-xs font-mono uppercase tracking-wider mb-2">
          <span>Conversations</span>
          <MessageSquare className="w-4 h-4 text-emerald" />
        </div>
        <div className="text-2xl font-mono font-extrabold text-white tracking-tight">
          {sessionCount}
        </div>
        <div className="text-[11px] font-mono text-silver mt-1">
          Local conversation sessions
        </div>
      </div>

      {/* Active Providers */}
      <div className="p-4 rounded-card bg-surface-card border border-white/[0.08] hover:border-white/[0.12] transition-colors shadow-subtle">
        <div className="flex items-center justify-between text-muted text-xs font-mono uppercase tracking-wider mb-2">
          <span>Active Sources</span>
          <Radio className="w-4 h-4 text-electric-light" />
        </div>
        <div className="text-2xl font-mono font-extrabold text-white tracking-tight">
          {activeProviders} <span className="text-sm font-normal text-silver">/ 6</span>
        </div>
        <div className="text-[11px] font-mono text-silver mt-1">
          Web observers & companion
        </div>
      </div>
    </div>
  );
};

