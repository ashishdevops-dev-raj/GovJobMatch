export function tokensFromQuery(q: string): string[] {
  return q
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s+]/gu, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 2);
}
