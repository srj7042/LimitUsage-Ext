import React, { useState, useEffect, useRef } from "react";
import { ConversationUsage, ContextHealth, ProviderQuota } from "../types";
import { SegmentedProgressBar } from "./SegmentedProgressBar";
import { MetricBadge } from "./MetricBadge";
import { formatTokenCount, formatPercent, formatRelativeTime, getHealthColor } from "../utils/formatting";
import {
  GripVertical,
  ChevronDown,
  ChevronUp,
  Settings,
  EyeOff,
  Cpu,
  Layers,
  Activity,
  X,
  ExternalLink,
  RotateCcw,
} from "lucide-react";

interface FloatingUsageBarProps {
  usage: ConversationUsage | null;
  quota?: ProviderQuota | null;
  onHide?: () => void;
  onOpenDashboard?: () => void;
}

export const FloatingUsageBar: React.FC<FloatingUsageBarProps> = ({
  usage,
  quota,
  onHide,
  onOpenDashboard,
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [position, setPosition] = useState<{ x: number; y: number }>({
    x: typeof window !== "undefined" ? Math.max(20, window.innerWidth - 350) : 20,
    y: 80,
  });

  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, startX: 0, startY: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Load saved position
  useEffect(() => {
    try {
      const saved = localStorage.getItem("ai_usage_companion_pos");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === "number" && typeof parsed.y === "number") {
          setPosition({
            x: Math.min(window.innerWidth - 80, Math.max(10, parsed.x)),
            y: Math.min(window.innerHeight - 60, Math.max(10, parsed.y)),
          });
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      startX: position.x,
      startY: position.y,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDragging.current) return;
      const dx = moveEvent.clientX - dragStart.current.x;
      const dy = moveEvent.clientY - dragStart.current.y;

      const newX = Math.max(10, Math.min(window.innerWidth - 340, dragStart.current.startX + dx));
      const newY = Math.max(10, Math.min(window.innerHeight - 100, dragStart.current.startY + dy));

      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      
      // Snap to edge if within 30px
      setPosition((prev) => {
        let snappedX = prev.x;
        if (typeof window !== "undefined") {
          if (prev.x > window.innerWidth - 380) {
            snappedX = window.innerWidth - 350;
          } else if (prev.x < 30) {
            snappedX = 15;
          }
        }
        const updated = { x: snappedX, y: prev.y };
        try {
          localStorage.setItem("ai_usage_companion_pos", JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleResetPosition = () => {
    const defaultPos = {
      x: typeof window !== "undefined" ? Math.max(20, window.innerWidth - 350) : 20,
      y: 80,
    };
    setPosition(defaultPos);
    try {
      localStorage.setItem("ai_usage_companion_pos", JSON.stringify(defaultPos));
    } catch {
      // ignore
    }
  };

  if (!usage) {
    return null;
  }

  const health: ContextHealth =
    usage.utilizationPct >= 90 ? "danger" : usage.utilizationPct >= 70 ? "warning" : "safe";
  const healthColors = getHealthColor(health);

  // Collapsed Minimal Pill
  if (isCollapsed) {
    return (
      <div
        ref={containerRef}
        style={{ left: `${position.x}px`, top: `${position.y}px` }}
        className="fixed z-[9999999] select-none font-sans"
      >
        <div
          onClick={() => setIsCollapsed(false)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-card/95 hover:bg-surface-active/95 border border-white/10 shadow-card backdrop-blur-md cursor-pointer transition-all duration-200 group"
          title="Click to expand AI Usage Companion"
        >
          <div
            onMouseDown={(e) => {
              e.stopPropagation();
              handleMouseDown(e);
            }}
            className="cursor-grab active:cursor-grabbing text-muted group-hover:text-silver"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </div>

          <div className="w-2 h-2 rounded-full bg-electric animate-pulse" />

          <span className="text-xs font-semibold text-white tracking-wide uppercase">
            {usage.provider}
          </span>

          <span className="text-xs font-mono font-medium text-electric-light">
            {formatTokenCount(usage.totalTokens)}
          </span>

          <span className={`text-[11px] font-mono font-semibold ${healthColors.text}`}>
            {formatPercent(usage.utilizationPct)}
          </span>

          {/* Micro Progress Bar in Collapsed Pill */}
          <div
            className="w-10 h-1.5 rounded-full bg-white/10 overflow-hidden"
            title={`Context: ${formatPercent(usage.utilizationPct)} (${formatTokenCount(usage.totalTokens)} / ${formatTokenCount(usage.contextLimit)})`}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
              style={{
                width: `${usage.totalTokens > 0 ? Math.max(10, Math.min(100, usage.utilizationPct)) : 0}%`,
              }}
            />
          </div>

          <ChevronDown className="w-3 h-3 text-silver group-hover:text-white" />
        </div>
      </div>
    );
  }

  // Expanded Full Bar
  return (
    <div
      ref={containerRef}
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      className="fixed z-[9999999] w-[330px] select-none font-sans"
    >
      <div className="rounded-card bg-surface-card/95 border border-white/[0.08] shadow-card backdrop-blur-md overflow-hidden text-white transition-all duration-200">
        {/* Header Bar */}
        <div
          onMouseDown={handleMouseDown}
          onDoubleClick={() => setIsCollapsed(true)}
          className="flex items-center justify-between px-3 py-2 bg-surface-panel/80 border-b border-white/[0.06] cursor-grab active:cursor-grabbing"
          title="Drag to move • Double-click to collapse"
        >
          <div className="flex items-center gap-2">
            <GripVertical className="w-3.5 h-3.5 text-muted hover:text-silver" />
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-electric shadow-[0_0_8px_#3B82F6]" />
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                {usage.provider}
              </span>
            </div>
            <span
              className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-active text-silver border border-white/5 truncate max-w-[110px]"
              title={usage.model}
            >
              {usage.model}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-1 rounded hover:bg-surface-active text-silver hover:text-white transition-colors"
              title="Settings & Info"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-1 rounded hover:bg-surface-active text-silver hover:text-white transition-colors"
              title="Minimize Bar"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Settings Popover */}
        {showSettings && (
          <div className="p-3 bg-surface-active/90 border-b border-white/10 text-xs space-y-2">
            <div className="flex items-center justify-between text-silver">
              <span>Website Overlay:</span>
              <button
                onClick={onHide}
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-surface hover:bg-surface-muted text-rose-300 border border-white/10"
              >
                <EyeOff className="w-3 h-3" /> Hide Bar
              </button>
            </div>
            {onOpenDashboard && (
              <div className="pt-1 border-t border-white/5 flex justify-end">
                <button
                  onClick={onOpenDashboard}
                  className="flex items-center gap-1 text-[11px] font-semibold text-accent hover:underline"
                >
                  Open Full Dashboard <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Main Metrics Content */}
        <div className="p-3 space-y-2.5">
          {/* Token Metrics Row */}
          <div className="bg-surface-panel/60 p-2.5 rounded-lg border border-white/[0.06] space-y-2">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-[10px] font-mono uppercase text-muted">Input</div>
                <div className="text-xs font-mono font-bold text-silver">
                  {formatTokenCount(usage.inTokens)}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase text-muted">Output</div>
                <div className="text-xs font-mono font-bold text-silver">
                  {formatTokenCount(usage.outTokens)}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase text-muted">Total</div>
                <div className="text-sm font-mono font-extrabold text-white">
                  {formatTokenCount(usage.totalTokens)}
                </div>
              </div>
            </div>

            {/* Live Conversation Token Ratio Bar: animates and grows forward as you chat */}
            {usage.totalTokens > 0 && (
              <div className="space-y-1 pt-1.5 border-t border-white/[0.04]">
                <div className="flex items-center justify-between text-[9px] font-mono text-muted">
                  <span className="flex items-center gap-1 text-electric-light">
                    <span className="w-1.5 h-1.5 rounded-full bg-electric inline-block" />
                    In: {(((usage.inTokens || 0) / usage.totalTokens) * 100).toFixed(0)}%
                  </span>
                  <span className="flex items-center gap-1 text-accent">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
                    Out: {(((usage.outTokens || 0) / usage.totalTokens) * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden flex gap-0.5">
                  <div
                    className="h-full bg-electric transition-all duration-300 ease-out rounded-l-full"
                    style={{
                      width: `${Math.max(
                        2,
                        (((usage.inTokens || 0) / usage.totalTokens) * 100)
                      )}%`,
                    }}
                    title={`Input: ${usage.inTokens?.toLocaleString()} tokens`}
                  />
                  <div
                    className="h-full bg-accent transition-all duration-300 ease-out rounded-r-full"
                    style={{
                      width: `${Math.max(
                        2,
                        (((usage.outTokens || 0) / usage.totalTokens) * 100)
                      )}%`,
                    }}
                    title={`Output: ${usage.outTokens?.toLocaleString()} tokens`}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Context Window Utilization */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-silver flex items-center gap-1">
                <Layers className="w-3 h-3 text-electric" /> Context Window
              </span>
              <span className={`font-bold ${healthColors.text}`}>
                {formatPercent(usage.utilizationPct)} ({formatTokenCount(usage.totalTokens)} / {formatTokenCount(usage.contextLimit)})
              </span>
            </div>
            <SegmentedProgressBar percent={usage.utilizationPct} health={health} />
          </div>

          {/* Verified Account Quota if available */}
          {quota && quota.verifiedStatus === "Provider Verified" && (
            <div className="p-1.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-mono text-emerald-300 flex items-center justify-between">
              <span>Verified Quota:</span>
              <span className="font-semibold">{quota.rateLimitMessage || `${quota.remaining ?? 0} queries remaining`}</span>
            </div>
          )}

          {/* Footer Status Row */}
          <div className="flex items-center justify-between pt-1 border-t border-white/[0.04] text-[10px] font-mono text-muted">
            <MetricBadge accuracy={usage.accuracy} />
            <div className="flex items-center gap-2">
              <span>{usage.messageCount} msgs</span>
              <span>•</span>
              <span>{formatRelativeTime(usage.lastUpdated)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

