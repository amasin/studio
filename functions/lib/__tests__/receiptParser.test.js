"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const receiptParser_1 = require("../receiptParser");
describe('parseReceipt', () => {
    it('should parse a simple receipt', () => {
        const ocrText = `
      My Awesome Shop
      Apples 2.50
      Bananas 1.00
      Milk 3.25
    `;
        const result = (0, receiptParser_1.parseReceipt)(ocrText);
        expect(result.shopName).toBe('My Awesome Shop');
        expect(result.items).toEqual([
            { rawName: 'Apples', quantity: 1, unitPrice: 2.50, totalPrice: 2.50 },
            { rawName: 'Bananas', quantity: 1, unitPrice: 1.00, totalPrice: 1.00 },
            { rawName: 'Milk', quantity: 1, unitPrice: 3.25, totalPrice: 3.25 },
        ]);
    });
});
//# sourceMappingURL=receiptParser.test.js.map