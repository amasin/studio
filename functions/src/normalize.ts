
/**
 * Deterministic normalization of product names.
 */
export function normalizeProductName(raw: string): string {
  if (!raw) return "";
  
  let normalized = raw.toLowerCase();

  const units = [
    "kg", "g", "gm", "grams", "l", "lt", "litre", "liter", "ml", "pcs",
    "piece", "pieces", "pkt", "pack"
  ];

  // Remove quantities like "1kg", "500g", "2 l"
  normalized = normalized.replace(new RegExp(`\\b\\d+(\\.\\d+)?\\s*(${units.join("|")})\\b`, "g"), " ");
  
  // Remove punctuation
  normalized = normalized.replace(/[^a-z0-9\s]/g, " ");
  
  // Remove standalone units
  const unitRegex = new RegExp(`\\b(${units.join("|")})\\b`, "g");
  normalized = normalized.replace(unitRegex, " ");
  
  // Normalize whitespace
  return normalized.replace(/\s+/g, " ").trim();
}
