"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseOcrText = parseOcrText;
function parseOcrText(text) {
    const lines = text.split("\n");
    const items = [];
    const priceRegex = /(\d+\.\d{2})|(\d+)/;
    for (const line of lines) {
        const match = line.match(priceRegex);
        if (match) {
            const priceStr = match[0];
            const price = parseFloat(priceStr);
            const name = line.substring(0, match.index).trim();
            if (name) {
                items.push({
                    rawName: name,
                    unitPrice: price,
                    quantity: 1, // Default quantity
                    totalPrice: price,
                });
            }
        }
    }
    if (items.length === 0) {
        items.push({
            rawName: "unknown item",
            unitPrice: 0,
            quantity: 1,
            totalPrice: 0,
        });
    }
    return items;
}
//# sourceMappingURL=ocr-parser.js.map