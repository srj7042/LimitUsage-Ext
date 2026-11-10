import { defineConfig } from "wxt";

export default defineConfig({
  srcDir: "src",
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "AI Usage Companion",
    description: "Production-ready, privacy-first token and context usage companion for ChatGPT, Claude, Gemini, Perplexity, Cursor, and Antigravity.",
    version: "1.0.0",
    permissions: [
      "storage",
      "unlimitedStorage",
      "sidePanel",
      "nativeMessaging",
    ],
    host_permissions: [
      "https://chatgpt.com/*",
      "https://chat.openai.com/*",
      "https://claude.ai/*",
      "https://gemini.google.com/*",
      "https://www.perplexity.ai/*",
      "https://perplexity.ai/*",
    ],
    action: {
      default_title: "AI Usage Companion",
      default_popup: "entrypoints/popup/index.html",
    },
    side_panel: {
      default_path: "entrypoints/sidepanel/index.html",
    },
    options_ui: {
      page: "entrypoints/options/index.html",
      open_in_tab: true,
    },
    icons: {
      16: "/icon-16.png",
      32: "/icon-32.png",
      48: "/icon-48.png",
      128: "/icon-128.png",
    },
  },
});
