export interface TokenizerAdapter {
  providerId: string;
  name: string;
  countTokens(text: string): number;
  estimateTurns(messages: Array<{ role: "user" | "assistant" | "system"; content: string }>): {
    inTokens: number;
    outTokens: number;
    totalTokens: number;
  };
}

/**
 * Universal Regex Patterns for BPE / Subword Tokenization approximation
 */
export const BPE_SPLIT_REGEX =
  /(?:[^\r\n\p{L}\p{N}]?[\p{L}]+|\p{N}{1,3}| ?[^\s\p{L}\p{N}]+[\r\n]*|\s*[\r\n]+|\s+(?!\S)|\s+)/gu;

