# AI Usage Companion

> **Production-Ready, Privacy-First Browser Extension for Tracking AI Context & Token Utilization**  
> Built with **WXT**, **Manifest V3**, **React**, **TypeScript**, **Tailwind CSS**, and **IndexedDB**.

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

## 🚀 Installation & Local Setup

### 1. Load Extension in Google Chrome / Brave / Edge / Arc

1. Open your browser and navigate to:
   - Chrome / Brave: `chrome://extensions`
   - Edge: `edge://extensions`
   - Arc: Open Settings > Extensions
2. Enable **Developer mode** toggle in the top-right corner.
3. Click **Load unpacked**.
4. Select the `.output/chrome-mv3` folder located at:
   ```bash
   /Users/surajjaiswal/Extensions/Ai Limit/.output/chrome-mv3
   ```
5. Pin **AI Usage Companion** to your extension toolbar.

---

### 2. (Optional) Setup Desktop Native Messaging Companion

To monitor local token metrics from **Cursor** and **Google Antigravity**:

1. Run the one-command installer in your terminal:
   ```bash
   bash "/Users/surajjaiswal/Extensions/Ai Limit/native-companion/install.sh"
   ```
2. Open the AI Usage Companion Dashboard > **Settings** > **Desktop Companion**.
3. Click **Test Connection & Sync**.
4. The extension pairs with the local Python host via secure SHA-256 token exchange and synchronizes local workspace sessions.

---

## 🛠️ Development & Testing

```bash
# Install dependencies
pnpm install

# Run comprehensive test suite (Vitest)
pnpm test

# Run TypeScript strict typecheck
pnpm compile

# Build extension for Chrome MV3
pnpm build

# Build distributable zip
pnpm zip
```

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
* **[MIT License](LICENSE)**: Permissive open-source license.

---

## 🐛 Bug Reports & Support

Found an issue, website layout change, or bug?
* **Email Support & Bug Reports**: [learnhowme987@gmail.com](mailto:learnhowme987@gmail.com)
* **GitHub Issues**: Open an issue on this repository with your browser version and AI provider details.


