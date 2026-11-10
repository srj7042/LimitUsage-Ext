import React from "react";
import { ContextHealth } from "../types";

interface SegmentedProgressBarProps {
  percent: number;
  segments?: number;
  health: ContextHealth;
  className?: string;
  showContinuousTrack?: boolean;
}

export const SegmentedProgressBar: React.FC<SegmentedProgressBarProps> = ({
  percent,
  segments = 10,
  health,
  className = "",
  showContinuousTrack = true,
}) => {
  const safePercent = Math.min(100, Math.max(0, isNaN(percent) ? 0 : percent));
  const segSpan = 100 / segments;

  const getHealthFillColor = () => {
    if (health === "danger") return "bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]";
    if (health === "warning") return "bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]";
    return "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_6px_rgba(34,197,94,0.4)]";
  };

  const fillColor = getHealthFillColor();

  return (
    <div className={`space-y-1 w-full ${className}`}>
      {/* Segmented Bar with Fluid Fractional Fill per Segment */}
      <div className="flex items-center gap-1 w-full">
        {Array.from({ length: segments }).map((_, i) => {
          const segStart = i * segSpan;
          const segEnd = (i + 1) * segSpan;

          let fillPct = 0;
          if (safePercent >= segEnd) {
            fillPct = 100;
          } else if (safePercent > segStart) {
            // Fractional fill within this segment
            const rawRatio = (safePercent - segStart) / segSpan;
            // Ensure even tiny percentages (> 0) have visible active progress (minimum 12%)
            fillPct = Math.max(12, Math.min(100, rawRatio * 100));
          } else if (i === 0 && safePercent > 0) {
            // First segment minimum indicator for micro-usage
            fillPct = 12;
          }

          const isCurrentActive = safePercent > segStart && safePercent <= segEnd;

          return (
            <div
              key={i}
              className="relative h-2 flex-1 rounded-sm bg-white/[0.07] overflow-hidden border border-white/[0.04]"
              title={`Segment ${i + 1}: ${segStart.toFixed(0)}% - ${segEnd.toFixed(0)}%`}
            >
              <div
                className={`h-full rounded-sm transition-all duration-300 ease-out ${fillColor} ${
                  isCurrentActive ? "animate-pulse" : ""
                }`}
                style={{ width: `${fillPct}%` }}
              />
            </div>
          );
        })}
      </div>

      {/* High-Precision Continuous Micro-Track underneath for ultra-fine sub-percentage feedback */}
      {showContinuousTrack && (
        <div className="relative w-full h-[3px] rounded-full bg-white/[0.04] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ease-out ${fillColor}`}
            style={{
              width: `${safePercent > 0 ? Math.max(1.5, safePercent) : 0}%`,
            }}
          />
        </div>
      )}
    </div>
  );
};
