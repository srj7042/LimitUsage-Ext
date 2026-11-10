# Privacy Policy — AI Usage Companion

**Effective Date:** November 10, 2026  
**Last Updated:** November 10, 2026

AI Usage Companion is an open-source, privacy-first developer companion built with a strict **zero-telemetry, offline-first** architecture. Your conversations, prompts, tokens, and credentials belong to you and remain entirely on your local machine.

---

## 1. Core Privacy Commitments

* **Zero Cloud Uploads**: AI Usage Companion does **not** operate any backend servers, analytics endpoints, crash reporting services, or cloud synchronization.
* **Zero Telemetry & Tracking**: We do not collect identifiers, device fingerprints, usage metrics, IP addresses, or telemetry of any kind.
* **Zero Credential Scraping**: We never inspect, read, copy, or transmit account passwords, session cookies, auth tokens, or payment details.
* **100% Local Storage**: All conversation metadata, estimated token counts, and session metrics are stored strictly inside your browser's local **IndexedDB** (`ai_usage_companion_db`).

---

## 2. Information Handled Locally

When you use AI Usage Companion, the following data is processed **locally on your device**:

1. **Visible Conversation Text**:
   * Extracted strictly from active DOM tabs on supported AI web interfaces (`chatgpt.com`, `claude.ai`, `gemini.google.com`, `perplexity.ai`).
   * Used solely for real-time local token estimation using provider-matched tokenizers (e.g., TikToken, Claude BPE).
2. **Token & Context Metrics**:
   * Calculated input tokens, output tokens, total tokens, and context window saturation percentages.
3. **User Preferences**:
   * Floating bar position, per-site enable/disable toggles, alert thresholds, and theme settings.
4. **Desktop Logs (Optional Native Companion)**:
   * When enabled by the user, the Native Messaging Companion reads local workspace logs from Google Antigravity and Cursor to compute developer usage locally.
   * Authentication is enforced via a local 64-character SHA-256 token stored in `config.json`.

---

## 3. Permissions Justification

AI Usage Companion requests only the minimal browser permissions required for its functionality:

| Permission | Purpose |
| :--- | :--- |
| `storage` & `unlimitedStorage` | Saves token history and preferences locally in IndexedDB without data caps. |
| `sidePanel` | Displays the unified dashboard in Chrome's native side panel. |
| `nativeMessaging` | (Optional) Communicates with the local Python companion host for Antigravity & Cursor. |
| `host_permissions` | Restricted exclusively to the official domains of ChatGPT, Claude, Gemini, and Perplexity to inject the floating context bar. |

---

## 4. Third-Party Services

* AI Usage Companion makes **no network requests** to third parties.
* There are no embedded ads, external CDN scripts, Google Analytics, PostHog, Mixpanel, or third-party trackers.
* All CSS, icons, and tokenizer vocabularies are bundled directly into the extension package.

---

## 5. Data Control & Deletion

You maintain complete ownership of your data at all times:

* **Export Data**: Export your full history as structured JSON or CSV anytime via the Settings panel.
* **Nuclear Wipe**: Click **"Clear All Data"** in the extension settings to instantly erase all IndexedDB tables, stored conversations, and cached quotas.
* **Uninstall**: Uninstalling the extension immediately purges all local storage created by the extension.

---

## 6. Open Source Verification

AI Usage Companion is 100% open source under the Apache License 2.0. Anyone can inspect, audit, build, and verify the codebase to confirm that no data leaves your machine.

---

## 7. Contact & Support

For privacy inquiries, audit questions, or to report any bugs or errors, please contact:
* **Email:** [learnhowme987@gmail.com](mailto:learnhowme987@gmail.com)
* **GitHub Issues:** Open an issue or discussion on this repository.
