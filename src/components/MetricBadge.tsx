import React from "react";
import { AccuracyLevel } from "../types";
import { getAccuracyBadgeStyles } from "../utils/formatting";
import { ShieldCheck, Sparkles, AlertCircle, Clock, HelpCircle } from "lucide-react";

interface MetricBadgeProps {
  accuracy: AccuracyLevel;
  className?: string;
}

export const MetricBadge: React.FC<MetricBadgeProps> = ({ accuracy, className = "" }) => {
  const styles = getAccuracyBadgeStyles(accuracy);

  const getIcon = () => {
    switch (accuracy) {
      case "Provider Verified":
        return <ShieldCheck className="w-3 h-3 text-emerald-400 mr-1 inline-block" />;
      case "Estimated":
        return <Sparkles className="w-3 h-3 text-electric-light mr-1 inline-block" />;
      case "Partial":
        return <AlertCircle className="w-3 h-3 text-amber-400 mr-1 inline-block" />;
      case "Stale":
        return <Clock className="w-3 h-3 text-silver mr-1 inline-block" />;
      case "Unavailable":
      default:
        return <HelpCircle className="w-3 h-3 text-muted mr-1 inline-block" />;
    }
  };

  return (
    <span
      className={`inline-flex items-center text-[11px] font-mono font-medium px-2 py-0.5 rounded-full border ${styles.bg} ${styles.text} ${styles.border} ${className}`}
      title={`Accuracy State: ${accuracy}`}
    >
      {getIcon()}
      {styles.label}
    </span>
  );
};

