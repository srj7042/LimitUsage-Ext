# AI Usage Companion

> **Production-Ready, Privacy-First Browser Extension for Tracking AI Context & Token Utilization**  
> Built with **WXT**, **Manifest V3**, **React**, **TypeScript**, **Tailwind CSS**, and **IndexedDB**.

> [!WARNING]
> **Beta Release Status**: AI Usage Companion is currently in **Public Beta**. While core features, token estimation, and dashboards are fully functional, you may still encounter minor bugs or UI edge cases as third-party AI platforms (ChatGPT, Claude, Gemini, Perplexity) frequently update their web DOM layouts. If you find any bugs, errors, or unexpected behavior, please let us know at **[learnhowme987@gmail.com](mailto:learnhowme987@gmail.com)** or open an issue!

---

## ⚡ Key Highlights & Principles

1. **Dual Interface**:
   - **Live Floating Usage Bar**: Injected via Shadow DOM into AI websites (ChatGPT, Claude, Gemini, Perplexity). Draggable anywhere, collapsible into a sleek minimal pill, snap-to-edge, with per-site hide and custom warning thresholds.
   - **Unified AI Usage Dashboard**: Accessible via popup, full Chrome Side Panel (`chrome.sidePanel`), and full-screen Options page. Features overview KPIs, 6 provider tiles, daily/weekly charts, searchable history, CSV/JSON export, and local data wipe.

2. **Zero Fabrication & Strict Accuracy Labeling**:
   - Never hallucinates quotas, token numbers, or context window limits.
   - Every metric is explicitly classified with precision badges:
     - `Provider Verified`: Confirmed by official provider UI badges or intercepted banners (e.g. Claude remaining messages banner, Perplexity Pro counter).
     - `Estimated`: Computed via calibrated subword / BPE tokenizer adapters locally.
     - `Partial`: When older messages are virtualized/clipped by the host website's DOM.
     - `Unavailable`: When a provider does not expose reliable telemetry or companion is disconnected.
     - `Stale`: When tab has been idle / backgrounded for > 30 minutes.

3. **100% Offline & Privacy-First**:
   - **Zero telemetry**, **no cloud sync**, **no external analytics**.
   - Prompts are tokenized strictly within client browser memory.
   - Minimal permissions: only `storage`, `unlimitedStorage`, `sidePanel`, and `nativeMessaging`. No `<all_urls>` and no cookie access.

4. **Fintech / SaaS Dark Developer Aesthetic**:
   - Background `#090A0C`, Card Surfaces `#14161B` & `#181A20`, Active Surfaces `#222630`.
   - Accent Muted Neon Yellow (`#F3E960`), Electric Blue (`#3B82F6`), Emerald (`#22C55E`).
   - Monospace tabular numerals, Lucide outline icons, 12–16px card radii, and segmented progress bars.

---

## 🔌 Supported Providers Matrix

| Provider | Web DOM Adapter | Free-Tier Support | Quota / Context Telemetry | Desktop Companion |
| :--- | :--- | :--- | :--- | :--- |
| **ChatGPT** | `chatgpt.com`, `chat.openai.com` | ✅ Yes | 128k context (GPT-4o / mini); captures rate limit cap banners | N/A |
| **Claude** | `claude.ai` | ✅ Yes | 200k context (Sonnet 3.5); captures remaining free message banners | N/A |
| **Google Gemini** | `gemini.google.com` | ✅ Yes | 1M context (Flash 1.5); captures web rate notifications | N/A |
| **Perplexity** | `perplexity.ai` | ✅ Yes | 32k context (Sonar); parses visible Pro query counters (`x/5`) | N/A |
| **Cursor** | Web shell (`cursor.com`) | ✅ Yes | Marked `Unavailable` on web; pulls verified local logs via Native Host | ✅ Supported |
| **Google Antigravity**| Local Workspaces | ✅ Yes | Marked `Unavailable` on web; pulls local workspace logs via Native Host | ✅ Supported |

---

## 🚀 Installation Guide

Choose the method that fits your operating system and preference:

---

### Method 1: macOS & Linux (⚡ One-Command Auto Install)

Open Terminal, paste, and press Enter:

```bash
curl -fsSL https://raw.githubusercontent.com/srj7042/LimitUsage-Ext/main/install.sh | bash
```

* **What it does**: Downloads the pre-built extension to `~/Downloads/AI-Usage-Companion`, opens Chrome to `chrome://extensions`, and opens Finder right to the folder.
* **Final Step**: Turn on **Developer mode** (top-right) > Click **Load unpacked** > Select the opened **`dist`** folder.

---

### Method 2: Windows 10 / 11 (⚡ One-Command PowerShell)

Open **PowerShell**, paste, and press Enter:

```powershell
irm https://raw.githubusercontent.com/srj7042/LimitUsage-Ext/main/install.ps1 | iex
```

* **What it does**: Downloads the extension into your Downloads folder, launches Chrome/Edge at `chrome://extensions`, and opens File Explorer to the **`dist`** folder.
* **Final Step**: Turn on **Developer mode** (top-right) > Click **Load unpacked** > Select the **`dist`** folder.

---

### Method 3: Download & Load Manually (Zero Terminal — Works on Any OS)

1. Click the green **Code > Download ZIP** button at the top of this GitHub repository (or download from [Releases](https://github.com/srj7042/LimitUsage-Ext/releases)).
2. Unzip / Extract the downloaded ZIP file.
3. Open your browser:
   * Google Chrome: `chrome://extensions`
   * Microsoft Edge: `edge://extensions`
   * Brave: `brave://extensions`
4. Toggle ON **Developer mode** (top-right switch).
5. Click **Load unpacked** (top-left button) and select the **`dist`** folder inside the extracted folder.
6. Pin **AI Usage Companion** to your browser toolbar!

---

### Method 4: Build From Source (For Developers & Contributors)

*Only for developers who wish to modify the TypeScript/React source code:*

```bash
git clone https://github.com/srj7042/LimitUsage-Ext.git && cd LimitUsage-Ext && pnpm install && pnpm build
```

Once built, load the generated `.output/chrome-mv3` folder via **Load unpacked**.

---

## 🖥️ How to Use AI Usage Companion

The extension offers **4 distinct ways** to monitor your AI tokens and context limits:

### 1. Live Embedded Floating HUD (On Supported Websites)
* Visit **ChatGPT**, **Claude**, **Gemini**, or **Perplexity**.
* A sleek floating bar automatically appears on the website.
* **Draggable & Snappable**: Click and hold the grip icon to drag it anywhere on your screen.
* **Double-click or Chevron**: Minimizes the HUD into an ultra-compact glowing pill.
* **Live Token Flow**: Real-time Input vs. Output token breakdown and context memory gauge.
* **Settings Gear**: Hide on current website or jump directly to the full dashboard.

### 2. Chrome Native Side Panel (`chrome.sidePanel`)
* Right-click the extension icon in your toolbar and select **Open side panel** (or click the Side Panel icon in Chrome).
* Keep your complete usage dashboard open side-by-side while researching, coding, or chatting in any tab.

### 3. Toolbar Quick Popup
* Click the **AI Usage Companion icon** in your browser toolbar anytime.
* View instant overview KPIs (Today's Tokens, 7-Day Total, Active Provider, Health status) and quick access to individual provider stats.

### 4. Full Analytics Dashboard (`options.html`)
* Click **Full Dashboard** from any popup or side panel to open the full-screen view.
* Features:
  * **Interactive Analytics Chart**: Daily and weekly token burn graphs.
  * **Provider Cards**: Detailed context windows and verified quotas for all 6 providers.
  * **Conversation History Table**: Search, filter, and review all previous sessions with token counts.
  * **Data Export & Nuclear Wipe**: Download your data as structured JSON or CSV, or erase all local IndexedDB storage with one click.

### 5. (Optional) Desktop Companion for Cursor & Antigravity
* Run `bash "native-companion/install.sh"` to connect local desktop sessions from **Google Antigravity** and **Cursor** IDE directly into your unified dashboard.

---

## 📂 Project Architecture

```
Ai Limit/
├── .output/
│   ├── chrome-mv3/          # Unpacked Manifest V3 production extension
│   └── *.zip                # Distributable extension archive
├── native-companion/
│   ├── ai_usage_host.py     # Python Native Messaging host daemon
│   ├── install.sh           # Auto-installer for NativeMessagingHosts
│   └── *.json               # Native Host manifest
├── src/
│   ├── adapters/            # ChatGPT, Claude, Gemini, Perplexity, Cursor, Antigravity
│   ├── components/          # FloatingUsageBar, SegmentedProgressBar, UnifiedDashboard, etc.
│   ├── entrypoints/
│   │   ├── background.ts    # MV3 Service worker & database broker
│   │   ├── content.tsx      # Shadow DOM injection script
│   │   ├── popup/           # Extension toolbar popup
│   │   ├── sidepanel/       # Chrome side panel
│   │   └── options/         # Full dashboard page
│   ├── storage/             # IndexedDB schemas, migrations, CSV/JSON export
│   ├── tokenizers/          # Calibrated BPE & SentencePiece tokenizer engines
│   └── types/               # Strict TypeScript definitions
└── tests/                   # Tokenizer, Precision, Storage, Adapter, & Privacy tests
```

---

## 🔒 Known Limitations & Design Choices

- **Shadow DOM Isolation**: The floating token bar is rendered inside an open Shadow Root to prevent host CSS leaking into the extension and vice-versa.
- **SPA Page Transitions**: React DOM observers listen to both `childList` DOM mutations and `popstate` / URL changes to update token metrics automatically when you change conversations.
- **Honest Metrics**: When a user is logged into a free tier account and the provider does not publish an exact numerical quota counter in the HTML DOM, the extension honestly labels the quota as `Unavailable` instead of displaying invented numbers.

---

## 📜 Legal, Privacy & License

* **[Privacy Policy](PRIVACY.md)**: 100% offline, zero-telemetry, zero-cloud architecture.
* **[Terms & Conditions](TERMS.md)**: Open-source terms, accuracy disclosures, and disclaimers.
* **[Apache 2.0 License](LICENSE)**: Permissive open-source license with patent protection and clear contributor terms.

---

## 🐛 Beta Feedback, Bug Reports & Support

Because this extension is actively in **Beta**, your feedback is essential to keeping it robust across frequent provider layout changes:
* **Email Bugs Directly**: Send your screenshots, console errors, or bug details to **[learnhowme987@gmail.com](mailto:learnhowme987@gmail.com)**
* **GitHub Issues**: Open a GitHub Issue with your browser version and the AI provider where the issue occurred.
* All reports will be investigated and addressed in upcoming patches!


