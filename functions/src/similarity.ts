
import { normalizeProductName } from "./normalize";

export function levenshteinDistance(a: string, b: string): number {
  const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i - 1] === a[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

export function combinedSimilarity(a: string, b: string): number {
  if (a === b) return 1.0;
  const normA = normalizeProductName(a);
  const normB = normalizeProductName(b);
  if (normA === normB) return 1.0;

  // Prefix boost
  if (normA.startsWith(normB) || normB.startsWith(normA)) {
    return 0.9;
  }

  const dist = levenshteinDistance(normA, normB);
  const maxLen = Math.max(normA.length, normB.length);
  return maxLen > 0 ? 1 - dist / maxLen : 1.0;
}
