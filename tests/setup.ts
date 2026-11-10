import "fake-indexeddb/auto";
import { vi } from "vitest";

// Global mock for chrome API in tests if needed
if (typeof globalThis.chrome === "undefined") {
  (globalThis as any).chrome = {
    runtime: {
      id: "ai-usage-companion-test-id",
      sendMessage: vi.fn(),
      onMessage: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
      },
      connectNative: vi.fn(),
      sendNativeMessage: vi.fn(),
    },
    storage: {
      local: {
        get: vi.fn().mockResolvedValue({}),
        set: vi.fn().mockResolvedValue(undefined),
        remove: vi.fn().mockResolvedValue(undefined),
      },
      sync: {
        get: vi.fn().mockResolvedValue({}),
        set: vi.fn().mockResolvedValue(undefined),
      },
    },
    tabs: {
      query: vi.fn().mockResolvedValue([]),
      sendMessage: vi.fn(),
    },
  };
}
