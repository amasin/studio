"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ocr_parser_1 = require("../ocr-parser");
const testCases = [
    {
        description: 'should parse a simple grocery list',
        input: 'Apples 2.50\nBananas 1.00\nMilk 3.25\n',
        expected: [
            { rawName: 'Apples', unitPrice: 2.50, quantity: 1, totalPrice: 2.50 },
            { rawName: 'Bananas', unitPrice: 1.00, quantity: 1, totalPrice: 1.00 },
            { rawName: 'Milk', unitPrice: 3.25, quantity: 1, totalPrice: 3.25 },
        ]
    },
    {
        description: 'should handle integer prices',
        input: 'Bread 2\nCheese 5\n',
        expected: [
            { rawName: 'Bread', unitPrice: 2, quantity: 1, totalPrice: 2 },
            { rawName: 'Cheese', unitPrice: 5, quantity: 1, totalPrice: 5 },
        ]
    },
    {
        description: 'should handle empty lines and extra spaces',
        input: '  Item A   10.00  \n\nItem B  5.50\n',
        expected: [
            { rawName: 'Item A', unitPrice: 10.00, quantity: 1, totalPrice: 10.00 },
            { rawName: 'Item B', unitPrice: 5.50, quantity: 1, totalPrice: 5.50 },
        ]
    },
    {
        description: 'should return a default item for unparsable text',
        input: 'this is some random text without prices',
        expected: [
            { rawName: 'unknown item', unitPrice: 0, quantity: 1, totalPrice: 0 },
        ]
    },
    {
        description: 'should handle items with no name',
        input: '12.99\n',
        expected: [
            { rawName: 'unknown item', unitPrice: 0, quantity: 1, totalPrice: 0 },
        ]
    }
];
let passed = 0;
let failed = 0;
console.log('Running OCR parsing tests...');
testCases.forEach(({ description, input, expected }) => {
    const result = (0, ocr_parser_1.parseOcrText)(input);
    const isPassing = JSON.stringify(result) === JSON.stringify(expected);
    if (isPassing) {
        passed++;
        console.log(`  ✓ OK: ${description}`);
    }
    else {
        failed++;
        console.error(`  ✗ FAIL: ${description}`);
        console.error(`    Expected: ${JSON.stringify(expected)}`);
        console.error(`    Got:      ${JSON.stringify(result)}`);
    }
});
console.log(`\nTests finished. Passed: ${passed}, Failed: ${failed}\n`);
if (failed > 0) {
    process.exit(1);
}
//# sourceMappingURL=ocr.test.js.map