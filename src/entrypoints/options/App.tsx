import React from "react";
import { UnifiedDashboard } from "@/components/UnifiedDashboard";

export default function OptionsApp() {
  return (
    <div className="w-full min-h-screen bg-background">
      <UnifiedDashboard isCompact={false} />
    </div>
  );
}
