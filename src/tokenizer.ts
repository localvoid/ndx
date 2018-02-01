const WHITESPACE_RE = /[\s]+/;

/**
 * The whitespace tokenizer breaks on whitespace - spaces, tabs, line feeds and assumes that contiguous nonwhitespace
 * characters form a single token.
 */
export function whitespaceTokenizer(text: string): string[] {
  return text.trim().split(WHITESPACE_RE);
}
