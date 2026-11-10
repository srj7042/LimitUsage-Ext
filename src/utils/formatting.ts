import { AccuracyLevel, ContextHealth } from "../types";

export function formatTokenCount(num: number | null | undefined): string {
  if (num === null || num === undefined || isNaN(num)) return "—";
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(2).replace(/\.00$/, "") + "M";
  }
  if (num >= 10_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
  }
  return num.toLocaleString();
}

export function formatPercent(pct: number | null | undefined): string {
  if (pct === null || pct === undefined || isNaN(pct)) return "0%";
  return `${pct.toFixed(1)}%`;
}

export function formatRelativeTime(timestamp: number | null | undefined): string {
  if (!timestamp) return "Never";
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 10) return "Just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay}d ago`;
}

export function getAccuracyBadgeStyles(accuracy: AccuracyLevel): {
  bg: string;
  text: string;
  border: string;
  label: string;
} {
  switch (accuracy) {
    case "Provider Verified":
      return {
        bg: "bg-emerald-500/10",
        text: "text-emerald-400",
        border: "border-emerald-500/30",
        label: "Verified",
      };
    case "Estimated":
      return {
        bg: "bg-electric/10",
        text: "text-electric-light",
        border: "border-electric/30",
        label: "Estimated",
      };
    case "Partial":
      return {
        bg: "bg-amber-500/10",
        text: "text-amber-400",
        border: "border-amber-500/30",
        label: "Partial (Clipped)",
      };
    case "Stale":
      return {
        bg: "bg-surface-active",
        text: "text-silver",
        border: "border-white/10",
        label: "Stale",
      };
    case "Unavailable":
    default:
      return {
        bg: "bg-white/5",
        text: "text-muted",
        border: "border-white/10",
        label: "Unavailable",
      };
  }
}

export function getHealthColor(health: ContextHealth): {
  text: string;
  bar: string;
  badge: string;
} {
  switch (health) {
    case "danger":
      return {
        text: "text-rose-400",
        bar: "bg-rose-500",
        badge: "bg-rose-500/20 text-rose-300 border-rose-500/40",
      };
    case "warning":
      return {
        text: "text-amber-400",
        bar: "bg-amber-500",
        badge: "bg-amber-500/20 text-amber-300 border-amber-500/40",
      };
    case "safe":
    default:
      return {
        text: "text-emerald-400",
        bar: "bg-emerald-500",
        badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
      };
  }
}

