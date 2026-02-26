"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const receiptParser_1 = require("../receiptParser");
const testCases = [
    {
        description: 'should parse a simple receipt',
        ocrText: `
      My Awesome Shop
      Apples 2.50
      Bananas 1.00
      Milk 3.25
    `,
        expectedShopName: 'My Awesome Shop',
        expectedItems: [
            { rawName: 'Apples', quantity: 1, unitPrice: 2.50, totalPrice: 2.50 },
            { rawName: 'Bananas', quantity: 1, unitPrice: 1.00, totalPrice: 1.00 },
            { rawName: 'Milk', quantity: 1, unitPrice: 3.25, totalPrice: 3.25 },
        ]
    }
];
let passed = 0;
let failed = 0;
console.log('Running receiptParser tests...');
testCases.forEach((tc) => {
    const result = (0, receiptParser_1.parseReceipt)(tc.ocrText);
    const shopOk = result.shopName === tc.expectedShopName;
    const itemsOk = JSON.stringify(result.items) === JSON.stringify(tc.expectedItems);
    if (shopOk && itemsOk) {
        passed++;
        console.log(`  ✓ OK: ${tc.description}`);
    }
    else {
        failed++;
        console.error(`  ✗ FAIL: ${tc.description}`);
        if (!shopOk)
            console.error(`    Shop name mismatch: expected "${tc.expectedShopName}", got "${result.shopName}"`);
        if (!itemsOk)
            console.error(`    Items mismatch: expected ${JSON.stringify(tc.expectedItems)}, got ${JSON.stringify(result.items)}`);
    }
});
console.log(`\nTests finished. Passed: ${passed}, Failed: ${failed}\n`);
if (failed > 0) {
    process.exit(1);
}
//# sourceMappingURL=receiptParser.test.js.map