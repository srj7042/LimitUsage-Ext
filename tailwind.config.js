/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./entrypoints/**/*.{html,ts,tsx}",
    "./src/**/*.{html,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#090A0C",
        surface: {
          DEFAULT: "#14161B",
          card: "#14161B",
          panel: "#181A20",
          active: "#222630",
          muted: "#121418",
        },
        border: {
          DEFAULT: "rgba(255, 255, 255, 0.08)",
          subtle: "rgba(255, 255, 255, 0.05)",
          focus: "rgba(255, 255, 255, 0.16)",
        },
        accent: {
          DEFAULT: "#F3E960",
          foreground: "#090A0C",
          hover: "#E8DC4D",
        },
        electric: {
          DEFAULT: "#3B82F6",
          light: "#60A5FA",
          dark: "#2563EB",
          glow: "rgba(59, 130, 246, 0.15)",
        },
        emerald: {
          DEFAULT: "#22C55E",
          subtle: "rgba(34, 197, 94, 0.12)",
        },
        amber: {
          DEFAULT: "#F59E0B",
          subtle: "rgba(245, 158, 11, 0.12)",
        },
        rose: {
          DEFAULT: "#EF4444",
          subtle: "rgba(239, 68, 68, 0.12)",
        },
        silver: "#9CA3AF",
        muted: "#64748B",
      },
      fontFamily: {
        sans: [
          "Geist",
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      boxShadow: {
        glow: "0 0 20px -5px rgba(59, 130, 246, 0.25)",
        subtle: "0 2px 10px rgba(0, 0, 0, 0.4)",
        card: "0 4px 20px -2px rgba(0, 0, 0, 0.5)",
      },
      borderRadius: {
        card: "14px",
      },
    },
  },
  plugins: [],
};

