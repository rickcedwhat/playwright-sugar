/**
 * Levenshtein distance with case-insensitive weighting (case-only differences cost 0.1).
 */
export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = Array.from({ length: b.length + 1 }, (_, i) => [i]);
  for (let j = 0; j <= a.length; j++) matrix[0]![j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i - 1] === a[j - 1]) {
        matrix[i]![j] = matrix[i - 1]![j - 1]!;
      } else {
        const cost = b[i - 1]!.toLowerCase() === a[j - 1]!.toLowerCase() ? 0.1 : 1;
        matrix[i]![j] = Math.min(
          matrix[i - 1]![j - 1]! + cost,
          matrix[i]![j - 1]! + 1,
          matrix[i - 1]![j]! + 1,
        );
      }
    }
  }
  return matrix[b.length]![a.length]!;
}

/** Similarity score between 0 (different) and 1 (identical). */
export function stringSimilarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  return maxLen === 0 ? 1 : 1 - levenshteinDistance(a, b) / maxLen;
}

/**
 * Returns up to 3 entries from `available` most similar to `input`,
 * filtered to those with similarity >= `threshold` (default 0.5).
 */
export function findSimilar(
  input: string,
  available: string[],
  threshold = 0.5,
): Array<{ value: string; score: number }> {
  return available
    .map(value => ({ value, score: stringSimilarity(input, value) }))
    .filter(x => x.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}
