"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const aggregations_1 = require("../aggregations");
console.log("Running Aggregation logic tests...");
let passed = 0;
let failed = 0;
const norm = "apple";
const raw = "Apple 1kg";
const id1 = (0, aggregations_1.createExampleId)(norm, raw);
const id2 = (0, aggregations_1.createExampleId)(norm, raw);
if (id1 === id2) {
    passed++;
    console.log("  ✓ OK: stable exampleId for same input");
}
else {
    failed++;
    console.error("  ✗ FAIL: unstable exampleId");
}
if (id1.length === 10) {
    passed++;
    console.log("  ✓ OK: exampleId length is 10");
}
else {
    failed++;
    console.error(`  ✗ FAIL: incorrect exampleId length, got ${id1.length}`);
}
const raw2 = "Apples";
const id3 = (0, aggregations_1.createExampleId)(norm, raw2);
if (id1 !== id3) {
    passed++;
    console.log("  ✓ OK: different ids for different raw names");
}
else {
    failed++;
    console.error("  ✗ FAIL: same ids for different raw names");
}
console.log(`\nTests finished. Passed: ${passed}, Failed: ${failed}\n`);
if (failed > 0) {
    process.exit(1);
}
//# sourceMappingURL=aggregations.test.js.map