"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const similarity_1 = require("../similarity");
const testCases = [
    // Similar items
    { a: 'apple', b: 'apple', expectedMin: 1.0 },
    { a: 'apple inc', b: 'apple', expectedMin: 0.9 },
    { a: 'apple', b: 'apple inc', expectedMin: 0.9 },
    { a: 'bananas', b: 'banana', expectedMin: 0.9 },
    { a: 'grapes', b: 'grape', expectedMin: 0.9 },
    { a: 'test', b: 'toast', expectedMin: 0.5 },
    { a: 'My Test', b: 'My Toast', expectedMin: 0.5 },
    // Dissimilar items
    { a: 'cherry', b: 'strawberry', expectedMax: 0.5 },
];
let passed = 0;
let failed = 0;
console.log('Running similarity tests...');
testCases.forEach(({ a, b, expectedMin, expectedMax }) => {
    const similarity = (0, similarity_1.combinedSimilarity)(a, b);
    let success = false;
    let message = '';
    if (expectedMin !== undefined) {
        success = similarity >= expectedMin;
        message = `similarity('${a}', '${b}') = ${similarity.toFixed(2)} (>= ${expectedMin})`;
    }
    else if (expectedMax !== undefined) {
        success = similarity < expectedMax;
        message = `similarity('${a}', '${b}') = ${similarity.toFixed(2)} (< ${expectedMax})`;
    }
    if (success) {
        passed++;
        console.log(`  ✓ OK: ${message}`);
    }
    else {
        failed++;
        console.error(`  ✗ FAIL: ${message}`);
    }
});
console.log(`\nTests finished. Passed: ${passed}, Failed: ${failed}\n`);
if (failed > 0) {
    process.exit(1); // Exit with error code if any test fails
}
//# sourceMappingURL=similarity.test.js.map