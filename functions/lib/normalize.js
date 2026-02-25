"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeProductName = normalizeProductName;
function normalizeProductName(raw) {
    if (!raw) {
        return "";
    }
    // lowercase
    let normalized = raw.toLowerCase();
    const units = ["kg", "g", "gm", "grams", "l", "lt", "litre", "liter", "ml", "pcs", "piece", "pieces", "pkt"];
    // remove common quantity patterns like "1kg", "500g", "2 l", "200 ml", "1.5L"
    // With space
    normalized = normalized.replace(new RegExp(`\\b\\d+(\\.\\d+)?\\s+(${units.join("|")})\\b`, "g"), " ");
    // Without space
    normalized = normalized.replace(new RegExp(`\\b\\d+(\\.\\d+)?(${units.join("|")})\\b`, "g"), " ");
    // remove punctuation/symbols (keep alphanumerics + spaces)
    normalized = normalized.replace(/[^a-z0-9\s]/g, " ");
    // remove unit descriptors at end or anywhere as tokens
    const regex = new RegExp(`\\b(${units.join("|")})\\b`, "g");
    normalized = normalized.replace(regex, " ");
    // normalize whitespace to single spaces and trim
    normalized = normalized.replace(/\s+/g, " ").trim();
    return normalized;
}
//# sourceMappingURL=normalize.js.map