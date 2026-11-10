import React, { useState } from "react";
import { UserSettings, ProviderId } from "../types";
import { StorageService } from "../storage/db";
import { NativeMessagingService } from "../services/nativeService";
import {
  ShieldCheck,
  Download,
  Trash2,
  Terminal,
  RefreshCw,
  X,
  AlertTriangle,
  Sliders,
  CheckCircle,
} from "lucide-react";

interface SettingsAndPrivacyModalProps {
  settings: UserSettings;
  isOpen: boolean;
  onClose: () => void;
  onSettingsUpdated: (updated: UserSettings) => void;
  onDataWiped: () => void;
}

export const SettingsAndPrivacyModal: React.FC<SettingsAndPrivacyModalProps> = ({
  settings,
  isOpen,
  onClose,
  onSettingsUpdated,
  onDataWiped,
}) => {
  const [activeTab, setActiveTab] = useState<"general" | "desktop" | "privacy" | "data">("general");
  const [companionToken, setCompanionToken] = useState(
    settings.nativeCompanionToken || "a7caa4c989669456e4f54939055cf61b070e7fc8a03164cced7b62ab237b99e4"
  );
  const [companionStatus, setCompanionStatus] = useState<string>(settings.nativeCompanionStatus);
  const [companionMsg, setCompanionMsg] = useState<string>("");
  const [isTesting, setIsTesting] = useState(false);
  const [warningThreshold, setWarningThreshold] = useState(settings.alertThresholdPercent);
  const [highAlertThreshold, setHighAlertThreshold] = useState(settings.highAlertThresholdPercent);
  const [isWiping, setIsWiping] = useState(false);

  if (!isOpen) return null;

  const handleSavePreferences = async () => {
    const updated = await StorageService.saveSettings({
      alertThresholdPercent: warningThreshold,
      highAlertThresholdPercent: highAlertThreshold,
      nativeCompanionToken: companionToken,
    });
    onSettingsUpdated(updated);
  };

  const handleTestNativeCompanion = async () => {
    setIsTesting(true);
    setCompanionMsg("Pinging native host...");
    const activeToken = companionToken || "a7caa4c989669456e4f54939055cf61b070e7fc8a03164cced7b62ab237b99e4";
    try {
      // First try via background service worker
      let pingRes: any = await new Promise((res) => {
        try {
          chrome.runtime.sendMessage({ type: "PING_NATIVE" }, (resp) => {
            if (chrome.runtime.lastError || !resp) {
              res(null);
            } else {
              res(resp);
            }
          });
        } catch {
          res(null);
        }
      });

      if (!pingRes) {
        // Fallback to direct call
        pingRes = await NativeMessagingService.pingHost();
      }

      if (pingRes && pingRes.connected) {
        setCompanionStatus("connected");
        setCompanionMsg("Connected! Synchronizing local Antigravity & Cursor workspaces...");
        
        const tokenToUse = pingRes.authToken || activeToken;
        setCompanionToken(tokenToUse);

        // Update settings in storage
        const updated = await StorageService.saveSettings({
          nativeCompanionStatus: "connected",
          nativeCompanionToken: tokenToUse,
          nativeCompanionLastPing: Date.now(),
        });
        onSettingsUpdated(updated);

        // Sync Antigravity
        await new Promise((res) => {
          chrome.runtime.sendMessage({ type: "SYNC_DESKTOP", payload: { provider: "antigravity", token: tokenToUse } }, res);
        });

        // Sync Cursor
        await new Promise((res) => {
          chrome.runtime.sendMessage({ type: "SYNC_DESKTOP", payload: { provider: "cursor", token: tokenToUse } }, res);
        });

        setCompanionMsg("Connected! Synced Antigravity & Cursor sessions successfully.");
        onDataWiped(); // Triggers reload of conversations in Dashboard!
      } else {
        setCompanionStatus("disconnected");
        setCompanionMsg(
          `Connection failed: ${pingRes?.error || "Host not registered in Chrome"}. Run the one-command installer in terminal, then reload the extension.`
        );
      }
    } catch (e: any) {
      setCompanionStatus("error");
      setCompanionMsg(`Error: ${e.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  const handleExportJson = async () => {
    const jsonStr = await StorageService.exportAllDataAsJson();
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai-usage-companion-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = async () => {
    const csvStr = await StorageService.exportAsCsv();
    const blob = new Blob([csvStr], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai-usage-companion-history-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleNuclearWipe = async () => {
    if (!confirm("Are you sure you want to permanently erase all locally stored AI usage history? This cannot be undone.")) {
      return;
    }
    setIsWiping(true);
    await StorageService.wipeAllData();
    setIsWiping(false);
    onDataWiped();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[99999999] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-card bg-surface-card border border-white/[0.12] shadow-2xl overflow-hidden font-sans text-white">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08] bg-surface-panel/90">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-4 h-4 text-accent" />
            <h2 className="text-sm font-bold uppercase tracking-wider">
              AI Usage Companion Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-silver hover:text-white hover:bg-surface-active"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/[0.06] bg-surface-panel/40 px-5 gap-2 text-xs font-mono">
          {(["general", "desktop", "privacy", "data"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2.5 px-3 border-b-2 capitalize transition-colors ${
                activeTab === tab
                  ? "border-accent text-accent font-bold"
                  : "border-transparent text-silver hover:text-white"
              }`}
            >
              {tab === "desktop" ? "Desktop Companion" : tab}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {activeTab === "general" && (
            <div className="space-y-4 text-xs font-mono">
              <div className="space-y-2">
                <label className="text-silver block font-semibold">
                  Context Utilization Warning Threshold ({warningThreshold}%)
                </label>
                <input
                  type="range"
                  min="50"
                  max="89"
                  value={warningThreshold}
                  onChange={(e) => setWarningThreshold(parseInt(e.target.value, 10))}
                  className="w-full accent-amber-400"
                />
                <div className="text-[11px] text-muted">
                  Displays amber warning when a chat exceeds {warningThreshold}% of its context window.
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                <label className="text-silver block font-semibold">
                  Critical Context Alert Threshold ({highAlertThreshold}%)
                </label>
                <input
                  type="range"
                  min="85"
                  max="98"
                  value={highAlertThreshold}
                  onChange={(e) => setHighAlertThreshold(parseInt(e.target.value, 10))}
                  className="w-full accent-rose-500"
                />
                <div className="text-[11px] text-muted">
                  Displays high-alert red warning when a chat approaches exhaustion ({highAlertThreshold}%+).
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={handleSavePreferences}
                  className="px-4 py-2 rounded-lg bg-accent text-accent-foreground font-bold hover:bg-accent-hover transition-colors shadow-sm"
                >
                  Save Settings
                </button>
              </div>
            </div>
          )}

          {activeTab === "desktop" && (
            <div className="space-y-4 text-xs font-mono">
              <div className="p-3 rounded-lg bg-surface-panel border border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">Native Messaging Host</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      companionStatus === "connected"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-surface-active text-silver border border-white/10"
                    }`}
                  >
                    {companionStatus.toUpperCase()}
                  </span>
                </div>
                <p className="text-[11px] text-silver leading-relaxed">
                  The Native Companion connects to your local machine to safely scan Cursor workspace logs and Google Antigravity session transcripts.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-silver block font-semibold">Companion Auth Token</label>
                <input
                  type="password"
                  placeholder="Paste authentication token from config.json"
                  value={companionToken}
                  onChange={(e) => setCompanionToken(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-panel border border-white/[0.08] rounded-lg text-xs font-mono text-white focus:outline-none focus:border-white/20"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleTestNativeCompanion}
                  disabled={isTesting}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-electric hover:bg-electric-light text-white font-semibold transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? "animate-spin" : ""}`} />
                  Test Connection & Sync
                </button>
              </div>

              {companionMsg && (
                <div className="p-2.5 rounded bg-surface-panel text-[11px] text-silver border border-white/5">
                  {companionMsg}
                </div>
              )}

              <div className="p-3 rounded-lg bg-surface-panel/40 border border-white/[0.04] space-y-2">
                <div className="text-[11px] font-bold text-white flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-accent" /> One-Command Installation
                </div>
                <div className="p-2 rounded bg-background font-mono text-[10px] text-silver overflow-x-auto select-all">
                  bash /Users/surajjaiswal/Extensions/Ai\ Limit/native-companion/install.sh
                </div>
              </div>
            </div>
          )}

          {activeTab === "privacy" && (
            <div className="space-y-3 text-xs font-mono text-silver">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                <ShieldCheck className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-white">Strict Privacy Architecture</div>
                  <p className="text-[11px] leading-relaxed">
                    AI Usage Companion is 100% offline and client-side. It does not run analytics, telemetry, or external syncing.
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> No Credential Harvesting
                </div>
                <p className="text-[11px] text-muted pl-5">
                  Never intercepts passwords, session cookies, API tokens, or user accounts.
                </p>

                <div className="flex items-center gap-2 text-white font-semibold pt-1">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Local Token Counting
                </div>
                <p className="text-[11px] text-muted pl-5">
                  Prompts are tokenized right inside your browser memory using local subword adapters. Messages never leave your device.
                </p>

                <div className="flex items-center gap-2 text-white font-semibold pt-1">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Full User Control
                </div>
                <p className="text-[11px] text-muted pl-5">
                  All metrics reside strictly inside your browser's local IndexedDB sandbox. You can export or erase them at any time.
                </p>

                <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px]">
                  <span className="text-muted">Report Bugs & Errors:</span>
                  <a
                    href="mailto:learnhowme987@gmail.com"
                    className="text-accent hover:underline font-semibold"
                  >
                    learnhowme987@gmail.com
                  </a>
                </div>
              </div>
            </div>
          )}

          {activeTab === "data" && (
            <div className="space-y-4 text-xs font-mono">
              <div className="space-y-2">
                <div className="font-semibold text-white">Export Usage Data</div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportJson}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-panel hover:bg-surface-active border border-white/10 text-white font-medium transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-electric" /> Export Full JSON
                  </button>
                  <button
                    onClick={handleExportCsv}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-panel hover:bg-surface-active border border-white/10 text-white font-medium transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" /> Export CSV Spreadsheet
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-white/[0.08] space-y-2">
                <div className="font-semibold text-rose-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" /> Danger Zone: Local Data Deletion
                </div>
                <p className="text-[11px] text-muted">
                  Permanently erase all tracked conversation metrics, daily summaries, and quota logs from this browser's IndexedDB.
                </p>
                <button
                  onClick={handleNuclearWipe}
                  disabled={isWiping}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Wipe All Local Data
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

