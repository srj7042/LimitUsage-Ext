import { TokenizerAdapter, BPE_SPLIT_REGEX } from "./base";

/**
 * High-accuracy Google Gemini Tokenizer Adapter
 * Calibrated for SentencePiece with 256k vocabulary.
 */
export class GeminiTokenizer implements TokenizerAdapter {
  providerId = "gemini";
  name = "Google Gemini SentencePiece Adapter";

  countTokens(text: string): number {
    if (!text || text.length === 0) return 0;

    // Fast-path for single words
    if (text.length <= 5 && !text.includes(" ") && !text.includes("\n")) {
      return 1;
    }

    const matches = text.match(BPE_SPLIT_REGEX);
    if (!matches) {
      return Math.ceil(text.length / 4.0);
    }

    let tokenCount = 0;
    for (let i = 0; i < matches.length; i++) {
      const chunk = matches[i];
      const len = chunk.length;

      // Gemini's 256k vocab merges common words up to 5-6 characters into 1 token
      if (len <= 5) {
        tokenCount += 1;
        continue;
      }

      // Numbers: Gemini groups up to 4 digits
      if (/^\d+$/.test(chunk)) {
        tokenCount += Math.ceil(len / 3.5);
        continue;
      }

      // Whitespace
      if (/^\s+$/.test(chunk)) {
        tokenCount += Math.ceil(len / 4);
        continue;
      }

      if (len > 12) {
        tokenCount += Math.ceil(len / 3.4);
      } else {
        tokenCount += Math.ceil(len / 4.1);
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
      // Gemini role envelope metadata ~3 tokens
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

export const geminiTokenizer = new GeminiTokenizer();
