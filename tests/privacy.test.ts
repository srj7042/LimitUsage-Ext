import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Privacy & Security Architecture Audit", () => {
  it("verifies manifest permissions do not include invasive access", () => {
    const wxtConfigContent = fs.readFileSync(path.resolve(__dirname, "../wxt.config.ts"), "utf-8");

    // Must NOT have cookies or all_urls
    expect(wxtConfigContent).not.toContain('"cookies"');
    expect(wxtConfigContent).not.toContain('"webRequest"');
    expect(wxtConfigContent).not.toContain('"<all_urls>"');
    expect(wxtConfigContent).not.toContain('"http://*/*"');

    // Host permissions must be restricted to target AI domains
    expect(wxtConfigContent).toContain("https://chatgpt.com/*");
    expect(wxtConfigContent).toContain("https://claude.ai/*");
    expect(wxtConfigContent).toContain("https://gemini.google.com/*");
    expect(wxtConfigContent).toContain("https://perplexity.ai/*");
  });

  it("verifies zero telemetry, analytics, or remote logging trackers in src", () => {
    const srcDir = path.resolve(__dirname, "../src");
    
    function scanDir(dir: string): string[] {
      let files: string[] = [];
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          files = files.concat(scanDir(fullPath));
        } else if (/\.(ts|tsx|js)$/.test(entry.name)) {
          files.push(fullPath);
        }
      }
      return files;
    }

    const allCodeFiles = scanDir(srcDir);
    const bannedPatterns = [
      "google-analytics.com",
      "mixpanel.com",
      "amplitude.com",
      "segment.io",
      "sentry.io",
      "telemetry.post",
      "cloud-sync.api",
    ];

    for (const file of allCodeFiles) {
      const content = fs.readFileSync(file, "utf-8");
      for (const banned of bannedPatterns) {
        expect(content).not.toContain(banned);
      }
    }
  });

  it("verifies snapshot interfaces do not store cookies or passwords", () => {
    const typesContent = fs.readFileSync(path.resolve(__dirname, "../src/types/index.ts"), "utf-8");
    expect(typesContent).not.toContain("password");
    expect(typesContent).not.toContain("cookie");
    expect(typesContent).not.toContain("sessionToken");
  });
});

