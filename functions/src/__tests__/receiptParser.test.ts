import {parseReceipt} from "../receiptParser";

console.log("Running receiptParser tests...");

const ocrText = "My Awesome Shop\nApples 2.50\nBananas 1.00\nMilk 3.25";
const result = parseReceipt(ocrText);

let passed = 0;
let failed = 0;

if (result.shopName === "My Awesome Shop") {
  passed++;
  console.log("  ✓ OK: shopName matches");
} else {
  failed++;
  console.error(`  ✗ FAIL: shopName mismatch: expected "My Awesome Shop", got "${result.shopName}"`);
}

const expectedItems = [
  {rawName: "Apples", quantity: 1, unitPrice: 2.50, totalPrice: 2.50},
  {rawName: "Bananas", quantity: 1, unitPrice: 1.00, totalPrice: 1.00},
  {rawName: "Milk", quantity: 1, unitPrice: 3.25, totalPrice: 3.25},
];

if (JSON.stringify(result.items) === JSON.stringify(expectedItems)) {
  passed++;
  console.log("  ✓ OK: items match");
} else {
  failed++;
  console.error("  ✗ FAIL: items mismatch");
  console.error("    Expected:", JSON.stringify(expectedItems));
  console.error("    Got:     ", JSON.stringify(result.items));
}

console.log(`\nTests finished. Passed: ${passed}, Failed: ${failed}\n`);

if (failed > 0) {
  process.exit(1);
}
