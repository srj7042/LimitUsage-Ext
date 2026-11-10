import React, { useState } from "react";
import { DailySummary } from "../types";
import { formatTokenCount } from "../utils/formatting";
import { BarChart3, Calendar } from "lucide-react";

interface UsageAnalyticsChartProps {
  summaries: DailySummary[];
}

export const UsageAnalyticsChart: React.FC<UsageAnalyticsChartProps> = ({ summaries }) => {
  const [rangeDays, setRangeDays] = useState<7 | 14 | 30>(7);

  // Group by date
  const dateMap: Record<string, { total: number; prompt: number; completion: number }> = {};

  // Populate last N days
  const now = new Date();
  for (let i = rangeDays - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    dateMap[dateStr] = { total: 0, prompt: 0, completion: 0 };
  }

  summaries.forEach((s) => {
    if (dateMap[s.date]) {
      dateMap[s.date].total += s.totalTokens;
      dateMap[s.date].prompt += s.promptTokens;
      dateMap[s.date].completion += s.completionTokens;
    }
  });

  const chartData = Object.entries(dateMap).map(([date, data]) => ({
    date,
    dayLabel: new Date(date).toLocaleDateString(undefined, { weekday: "short" }),
    ...data,
  }));

  const maxVal = Math.max(...chartData.map((d) => d.total), 1000);

  return (
    <div className="p-4 rounded-card bg-surface-card border border-white/[0.08] shadow-subtle space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-electric" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Token Consumption Analytics
          </h3>
        </div>

        {/* Range Selector */}
        <div className="flex items-center gap-1 bg-surface-panel p-1 rounded-lg border border-white/[0.06]">
          {([7, 14, 30] as const).map((days) => (
            <button
              key={days}
              onClick={() => setRangeDays(days)}
              className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                rangeDays === days
                  ? "bg-surface-active text-white font-bold shadow-sm"
                  : "text-silver hover:text-white"
              }`}
            >
              {days}D
            </button>
          ))}
        </div>
      </div>

      {/* Chart Bars */}
      <div className="h-48 flex items-end gap-2 pt-6 pb-2 px-1">
        {chartData.map((item, idx) => {
          const heightPct = Math.min(100, Math.max(4, Math.round((item.total / maxVal) * 100)));
          return (
            <div
              key={item.date}
              className="flex-1 flex flex-col items-center h-full justify-end group relative"
            >
              {/* Tooltip */}
              <div className="absolute -top-12 z-20 hidden group-hover:flex flex-col items-center bg-surface-active border border-white/20 rounded px-2 py-1 shadow-card pointer-events-none whitespace-nowrap text-[10px] font-mono text-white">
                <span>{item.date}</span>
                <span className="text-electric-light font-bold">
                  {formatTokenCount(item.total)} tokens
                </span>
              </div>

              {/* Bar Stack */}
              <div className="w-full max-w-[28px] bg-white/[0.03] rounded-t overflow-hidden flex flex-col justify-end h-full">
                <div
                  style={{ height: `${heightPct}%` }}
                  className="w-full bg-electric hover:bg-electric-light transition-all rounded-t group-hover:shadow-[0_0_12px_rgba(59,130,246,0.6)]"
                />
              </div>

              {/* Day Label */}
              <div className="text-[10px] font-mono text-muted group-hover:text-silver mt-1.5 truncate max-w-full">
                {rangeDays <= 14 ? item.dayLabel : item.date.slice(8)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between pt-2 border-t border-white/[0.04] text-[11px] font-mono text-muted">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-electric" />
            <span className="text-silver">Estimated Tokens</span>
          </div>
        </div>
        <div>Peak: {formatTokenCount(maxVal)}</div>
      </div>
    </div>
  );
};

