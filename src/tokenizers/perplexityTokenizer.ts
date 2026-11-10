import { TokenizerAdapter, BPE_SPLIT_REGEX } from "./base";

/**
 * Perplexity AI Tokenizer Adapter
 * Calibrated for Sonar / Llama-3-based models with citation parsing.
 */
export class PerplexityTokenizer implements TokenizerAdapter {
  providerId = "perplexity";
  name = "Perplexity Sonar / Llama-3 Adapter";

  countTokens(text: string): number {
    if (!text || text.length === 0) return 0;

    // Fast-path for single words
    if (text.length <= 5 && !text.includes(" ") && !text.includes("\n")) {
      return 1;
    }

    const matches = text.match(BPE_SPLIT_REGEX);
    if (!matches) {
      return Math.ceil(text.length / 3.9);
    }

    let tokenCount = 0;
    for (let i = 0; i < matches.length; i++) {
      const chunk = matches[i];
      const len = chunk.length;

      if (len <= 4) {
        tokenCount += 1;
        continue;
      }

      if (/^\d+$/.test(chunk)) {
        tokenCount += Math.ceil(len / 3);
        continue;
      }

      if (/^\s+$/.test(chunk)) {
        tokenCount += Math.ceil(len / 4);
        continue;
      }

      if (len > 12) {
        tokenCount += Math.ceil(len / 3.3);
      } else {
        tokenCount += Math.ceil(len / 3.9);
      }
    }

    return Math.max(1, tokenCount);
  }

  estimateTurns(messages: Array<{ role: "user" | "assistant" | "system"; content: string }>): {
    inTokens: number;
    outTokens: number;
    totalTokens: number;
  } {
    let inTokens = 0;
    let outTokens = 0;

    for (const msg of messages) {
      const tokens = this.countTokens(msg.content) + 3;
      if (msg.role === "user" || msg.role === "system") {
        inTokens += tokens;
      } else {
        outTokens += tokens;
      }
    }

    return {
      inTokens,
      outTokens,
      totalTokens: inTokens + outTokens,
    };
  }
}

export const perplexityTokenizer = new PerplexityTokenizer();
