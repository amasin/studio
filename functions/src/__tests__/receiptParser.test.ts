import { parseReceipt } from '../receiptParser';

const testOcrText = `
BIG BAZAAR
Indiranagar, Bangalore
Apples 1kg 150.00
Milk 2L 60
Bread 45.50
Total: 255.50
`;

const result = parseReceipt(testOcrText);

console.log('Running receiptParser tests...');

let passed = 0;
let failed = 0;

if (result.shopName === 'BIG BAZAAR') {
    passed++;
    console.log('  ✓ OK: shopName extracted correctly');
} else {
    failed++;
    console.error(`  ✗ FAIL: shopName extracted incorrectly (got: ${result.shopName})`);
}

if (result.items.length === 3) {
    passed++;
    console.log('  ✓ OK: items length is correct');
} else {
    failed++;
    console.error(`  ✗ FAIL: items length is incorrect (got: ${result.items.length})`);
}

const apples = result.items.find(i => i.rawName.includes('Apples'));
if (apples && apples.unitPrice === 150.00) {
    passed++;
    console.log('  ✓ OK: item price parsed correctly');
} else {
    failed++;
    console.error(`  ✗ FAIL: item price parsed incorrectly`);
}

console.log(`\nTests finished. Passed: ${passed}, Failed: ${failed}\n`);

if (failed > 0) {
    process.exit(1);
}
