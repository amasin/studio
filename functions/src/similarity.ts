import {normalizeProductName} from "./normalize";

/**
 * Splits a string into an array of words.
 * @param {string} text The input string.
 * @return {string[]} An array of words.
 */
export function tokenize(text: string): string[] {
  return text.split(/\s+/);
}

/**
 * Calculates the Jaccard similarity between two arrays of strings.
 * @param {string[]} aTokens The first array of strings.
 * @param {string[]} bTokens The second array of strings.
 * @return {number} The Jaccard similarity score.
 */
export function jaccardSimilarity(
  aTokens: string[], bTokens: string[]
): number {
  const aSet = new Set(aTokens);
  const bSet = new Set(bTokens);
  const intersection = new Set([...aSet].filter((token) => bSet.has(token)));
  const union = new Set([...aSet, ...bSet]);
  if (union.size === 0) {
    return 1; // Both are empty strings
  }
  return intersection.size / union.size;
}

/**
 * Calculates the Levenshtein distance between two strings.
 * @param {string} a The first string.
 * @param {string} b The second string.
 * @return {number} The Levenshtein distance.
 */
export function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];

  // increment along the first column of each row
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  // increment each column in the first row
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Fill in the rest of the matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) == a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1, // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calculates a combined similarity score between two strings.
 * @param {string} a The first string.
 * @param {string} b The second string.
 * @return {number} The combined similarity score.
 */
export function combinedSimilarity(a: string, b: string): number {
  if (a === b) {
    return 1.0;
  }

  const normalizedA = normalizeProductName(a);
  const normalizedB = normalizeProductName(b);

  if (normalizedA === normalizedB) {
    return 1.0;
  }

  if (
    normalizedA.startsWith(normalizedB) ||
    normalizedB.startsWith(normalizedA)
  ) {
    const shorter = Math.min(normalizedA.length, normalizedB.length);
    const longer = Math.max(normalizedA.length, normalizedB.length);
    // Prefix similarity: high score, but not 1.0, depends on length diff
    return 0.9 + 0.1 * (shorter / longer);
  }

  const levenshtein = levenshteinDistance(normalizedA, normalizedB);
  const maxLen = Math.max(normalizedA.length, normalizedB.length);
  const normalizedLevenshtein = maxLen > 0 ? 1 - levenshtein / maxLen : 1.0;

  const tokensA = tokenize(normalizedA);
  const tokensB = tokenize(normalizedB);

  if (tokensA.length === 1 && tokensB.length === 1) {
    return normalizedLevenshtein;
  }

  const jaccard = jaccardSimilarity(tokensA, tokensB);

  // Weighted average
  return 0.6 * jaccard + 0.4 * normalizedLevenshtein;
}
