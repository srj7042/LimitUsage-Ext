#!/usr/bin/env bash
set -e

# AI Usage Companion - One-Command User Installer for macOS & Linux
TARGET_DIR="$HOME/Downloads/AI-Usage-Companion"

echo "=========================================="
echo "⚡ AI Usage Companion - Quick Installer"
echo "=========================================="
echo ""
echo "📦 Downloading pre-built extension to $TARGET_DIR..."

mkdir -p "$TARGET_DIR"
curl -sL https://github.com/srj7042/LimitUsage-Ext/archive/refs/heads/main.tar.gz | tar -xz -C "$TARGET_DIR" --strip-components=1

echo "✅ Download complete!"
echo ""
echo "🚀 Opening Google Chrome and Extension Folder..."

# Open Chrome Extensions page
if command -v open >/dev/null 2>&1; then
  open -a "Google Chrome" "chrome://extensions" 2>/dev/null || open "chrome://extensions" 2>/dev/null || true
  open "$TARGET_DIR/dist"
elif command -v xdg-open >/dev/null 2>&1; then
  xdg-open "chrome://extensions" 2>/dev/null || true
  xdg-open "$TARGET_DIR/dist" 2>/dev/null || true
fi

echo ""
echo "=========================================="
echo "🎉 Final 2 Steps to Activate in Chrome:"
echo "=========================================="
echo "1. On the Chrome Extensions tab, toggle ON 'Developer mode' (top-right)."
echo "2. Click 'Load unpacked' (top-left) and select the folder that just opened:"
echo "   👉 $TARGET_DIR/dist"
echo "=========================================="
echo "Visit ChatGPT, Claude, Gemini, or Perplexity to see your live token bar!"
echo ""
