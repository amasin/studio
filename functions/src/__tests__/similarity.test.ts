import { combinedSimilarity } from '../similarity';

const testCases: { a: string, b: string, expectedMin: number }[] = [
    { a: 'apple', b: 'apple', expectedMin: 1.0 },
    { a: 'apple inc', b: 'apple', expectedMin: 0.9 },
    { a: 'apple', b: 'apple inc', expectedMin: 0.9 },
    { a: 'bananas', b: 'banana', expectedMin: 0.9 },
    { a: 'cherry', b: 'strawberry', expectedMin: 0.2 },
    { a: 'grapes', b: 'grape', expectedMin: 0.9 },
    { a: 'test', b: 'toast', expectedMin: 0.5 },
    { a: 'My Test', b: 'My Toast', expectedMin: 0.5 }
];

let passed = 0;
let failed = 0;

console.log('Running similarity tests...');

testCases.forEach(({ a, b, expectedMin }) => {
    const similarity = combinedSimilarity(a, b);
    if (similarity >= expectedMin) {
        passed++;
        console.log(`  ✓ OK: similarity('${a}', '${b}') = ${similarity.toFixed(2)} (>= ${expectedMin})`);
    } else {
        failed++;
        console.error(`  ✗ FAIL: similarity('${a}', '${b}') = ${similarity.toFixed(2)} (< ${expectedMin})`);
    }
});

console.log(`\nTests finished. Passed: ${passed}, Failed: ${failed}\n`);

if (failed > 0) {
    process.exit(1); // Exit with error code if any test fails
}
