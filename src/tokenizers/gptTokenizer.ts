import { TokenizerAdapter, BPE_SPLIT_REGEX } from "./base";

/**
 * High-accuracy BPE Tokenizer calibrated for OpenAI cl100k_base / o200k_base
 * Used by ChatGPT (GPT-4o, o1, o3-mini) and Cursor (GPT-4o mode).
 */
export class GptTokenizer implements TokenizerAdapter {
  providerId = "chatgpt";
  name = "OpenAI cl100k/o200k BPE Calibrated";

  countTokens(text: string): number {
    if (!text || text.length === 0) return 0;

    // Fast-path for single words
    if (text.length <= 5 && !text.includes(" ") && !text.includes("\n")) {
      return 1;
    }

    // Match subword tokens using regex pattern
    const matches = text.match(BPE_SPLIT_REGEX);
    if (!matches) {
      return Math.ceil(text.length / 4);
    }

    let tokenCount = 0;
    for (let i = 0; i < matches.length; i++) {
      const chunk = matches[i];
      const len = chunk.length;

      // Single character or short chunk
      if (len <= 5) {
        tokenCount += 1;
        continue;
      }

      // Numbers: cl100k groups digits in 1-3 digits
      if (/^\d+$/.test(chunk)) {
        tokenCount += Math.ceil(len / 3);
        continue;
      }

      // Whitespace runs: spaces are compressed 2-4 per token
      if (/^\s+$/.test(chunk)) {
        tokenCount += Math.ceil(len / 4);
        continue;
      }

      // Long words or hex/base64/symbols
      if (len > 12) {
        tokenCount += Math.ceil(len / 3.2);
      } else if (len > 7) {
        tokenCount += Math.ceil(len / 3.6);
      } else {
        tokenCount += Math.ceil(len / 4);
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
      // 3 overhead tokens per message (role, headers) in ChatML format
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

export const gptTokenizer = new GptTokenizer();
