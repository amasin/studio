"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenize = tokenize;
exports.jaccardSimilarity = jaccardSimilarity;
exports.levenshteinDistance = levenshteinDistance;
exports.combinedSimilarity = combinedSimilarity;
const normalize_1 = require("./normalize");
function tokenize(text) {
    return text.split(/\s+/);
}
function jaccardSimilarity(aTokens, bTokens) {
    const aSet = new Set(aTokens);
    const bSet = new Set(bTokens);
    const intersection = new Set([...aSet].filter(token => bSet.has(token)));
    const union = new Set([...aSet, ...bSet]);
    if (union.size === 0) {
        return 1; // Both are empty strings
    }
    return intersection.size / union.size;
}
function levenshteinDistance(a, b) {
    if (a.length === 0)
        return b.length;
    if (b.length === 0)
        return a.length;
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
            }
            else {
                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, // substitution
                matrix[i][j - 1] + 1, // insertion
                matrix[i - 1][j] + 1 // deletion
                );
            }
        }
    }
    return matrix[b.length][a.length];
}
function combinedSimilarity(a, b) {
    if (a === b) {
        return 1.0;
    }
    const normalizedA = (0, normalize_1.normalizeProductName)(a);
    const normalizedB = (0, normalize_1.normalizeProductName)(b);
    if (normalizedA === normalizedB) {
        return 1.0;
    }
    if (normalizedA.startsWith(normalizedB) || normalizedB.startsWith(normalizedA)) {
        const shorter = Math.min(normalizedA.length, normalizedB.length);
        const longer = Math.max(normalizedA.length, normalizedB.length);
        // Prefix similarity: score is high, but not 1.0, and depends on the length difference
        return 0.9 + 0.1 * (shorter / longer);
    }
    const tokensA = tokenize(normalizedA);
    const tokensB = tokenize(normalizedB);
    const jaccard = jaccardSimilarity(tokensA, tokensB);
    const levenshtein = levenshteinDistance(normalizedA, normalizedB);
    const maxLen = Math.max(normalizedA.length, normalizedB.length);
    const normalizedLevenshtein = maxLen > 0 ? 1 - levenshtein / maxLen : 1.0;
    // Weighted average, giving more weight to Jaccard similarity
    return 0.7 * jaccard + 0.3 * normalizedLevenshtein;
}
//# sourceMappingURL=similarity.js.map