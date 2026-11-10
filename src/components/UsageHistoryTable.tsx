import React, { useState } from "react";
import { ConversationUsage, ProviderId } from "../types";
import { MetricBadge } from "./MetricBadge";
import { formatTokenCount, formatPercent, formatRelativeTime, getHealthColor } from "../utils/formatting";
import { Search, Filter, History, Trash2 } from "lucide-react";

interface UsageHistoryTableProps {
  conversations: ConversationUsage[];
  onClearProvider?: (provider: ProviderId) => void;
}

export const UsageHistoryTable: React.FC<UsageHistoryTableProps> = ({ conversations }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<string>("all");

  const filtered = conversations.filter((c) => {
    const matchesProvider = selectedProvider === "all" || c.provider === selectedProvider;
    const matchesSearch =
      searchTerm === "" ||
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.provider.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesProvider && matchesSearch;
  });

  return (
    <div className="p-4 rounded-card bg-surface-card border border-white/[0.08] shadow-subtle space-y-4">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-electric-light" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Conversation Sessions ({filtered.length})
          </h3>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search conversation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-surface-panel border border-white/[0.08] rounded-lg text-xs font-mono text-white placeholder-muted focus:outline-none focus:border-white/20"
            />
          </div>

          {/* Provider Filter */}
          <select
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
            className="px-2.5 py-1.5 bg-surface-panel border border-white/[0.08] rounded-lg text-xs font-mono text-silver focus:outline-none focus:border-white/20"
          >
            <option value="all">All Providers</option>
            <option value="chatgpt">ChatGPT</option>
            <option value="claude">Claude</option>
            <option value="gemini">Gemini</option>
            <option value="perplexity">Perplexity</option>
            <option value="cursor">Cursor</option>
            <option value="antigravity">Antigravity</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-white/[0.06] text-muted text-[11px] uppercase tracking-wider">
              <th className="pb-2 font-medium">Provider & Model</th>
              <th className="pb-2 font-medium">Conversation</th>
              <th className="pb-2 font-medium text-right">In / Out</th>
              <th className="pb-2 font-medium text-right">Total Tokens</th>
              <th className="pb-2 font-medium text-center">Context %</th>
              <th className="pb-2 font-medium text-center">Accuracy</th>
              <th className="pb-2 font-medium text-right">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-muted">
                  No conversation sessions recorded yet. Start chatting on supported AI providers to track tokens in real-time.
                </td>
              </tr>
            ) : (
              filtered.map((conv) => {
                const health =
                  conv.utilizationPct >= 90 ? "danger" : conv.utilizationPct >= 70 ? "warning" : "safe";
                const healthColors = getHealthColor(health);

                return (
                  <tr key={conv.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 pr-2">
                      <div className="font-bold text-white capitalize">{conv.provider}</div>
                      <div className="text-[10px] text-silver truncate max-w-[130px]">
                        {conv.model}
                      </div>
                    </td>

                    <td className="py-3 px-2">
                      <div className="text-white font-medium truncate max-w-[200px]" title={conv.title}>
                        {conv.title}
                      </div>
                      <div className="text-[10px] text-muted">{conv.messageCount} messages</div>
                    </td>

                    <td className="py-3 px-2 text-right text-silver">
                      <div>{formatTokenCount(conv.inTokens)}</div>
                      <div className="text-[10px] text-muted">{formatTokenCount(conv.outTokens)}</div>
                    </td>

                    <td className="py-3 px-2 text-right font-extrabold text-electric-light">
                      {formatTokenCount(conv.totalTokens)}
                    </td>

                    <td className="py-3 px-2 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${healthColors.badge}`}
                      >
                        {formatPercent(conv.utilizationPct)}
                      </span>
                    </td>

                    <td className="py-3 px-2 text-center">
                      <MetricBadge accuracy={conv.accuracy} />
                    </td>

                    <td className="py-3 pl-2 text-right text-muted whitespace-nowrap">
                      {formatRelativeTime(conv.lastUpdated)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

