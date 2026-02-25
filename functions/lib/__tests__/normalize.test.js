"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const normalize_1 = require("../normalize");
const testCases = {
    'Apples 1kg': 'apples',
    '  Organic Bananas  (5 pieces) ': 'organic bananas',
    'MILK 2 L': 'milk',
    '1.5L Coke': 'coke',
    'Ground Beef 500g': 'ground beef',
    'SomeFancy-Product!@#$ Name': 'somefancy product name',
    'product with 200 ml inside': 'product with inside',
    'a 2-pack of items': 'a 2 pack of items',
    'A pkt of biscuits': 'a of biscuits',
    '  leading and trailing spaces  ': 'leading and trailing spaces',
    'item with g in middle': 'item with in middle',
    'item with grams unit': 'item with unit'
};
let passed = 0;
let failed = 0;
console.log('Running normalization tests...');
for (const input in testCases) {
    const expected = testCases[input];
    const actual = (0, normalize_1.normalizeProductName)(input);
    if (actual === expected) {
        passed++;
        console.log(`  ✓ OK: '${input}' -> '${actual}'`);
    }
    else {
        failed++;
        console.error(`  ✗ FAIL: '${input}' -> '${actual}' (expected: '${expected}')`);
    }
}
console.log(`\nTests finished. Passed: ${passed}, Failed: ${failed}\n`);
if (failed > 0) {
    process.exit(1); // Exit with error code if any test fails
}
//# sourceMappingURL=normalize.test.js.map